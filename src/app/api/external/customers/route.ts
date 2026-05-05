import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import { createHash } from 'crypto';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  maskEmail,
  maskPhone,
  FX,
  type Market,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/customers
 *
 * Lista clientes únicos com histórico de compras (LTV).
 * Identidade: email lowercased + trimmed (chave canônica).
 *
 * Query: from, to (opcional — filtra purchases no range mas LTV é histórico)
 *        limit, cursor (paginação keyset)
 *        minLTV (filtra customers com totalSpent >= X)
 *        market (BR | PT | US)
 *        returningOnly (true → só quem comprou 2+ vezes)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');
  const limitRaw = parseInt(url.searchParams.get('limit') || '100', 10);
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 100 : limitRaw, 1), 500);
  const cursor = url.searchParams.get('cursor'); // emailHash do último customer da página anterior
  const minLTV = parseFloat(url.searchParams.get('minLTV') || '0');
  const marketFilter = url.searchParams.get('market');
  const returningOnly = url.searchParams.get('returningOnly') === 'true';

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    let q: FirebaseFirestore.Query = db.collection('lovepages').orderBy('createdAt', 'desc');
    if (fromStr) {
      const f = new Date(fromStr);
      if (!isNaN(f.getTime())) q = q.where('createdAt', '>=', f);
    }
    if (toStr) {
      const t = new Date(toStr);
      if (!isNaN(t.getTime())) q = q.where('createdAt', '<=', t);
    }
    const snap = await q.get();

    type CustomerAgg = {
      emailHash: string;            // sha256 truncado pra cursor estável
      emailMasked: string;
      phoneMasked: string;
      firstPurchaseAt: Date | null;
      lastPurchaseAt: Date | null;
      totalPurchases: number;
      totalSpentBRL: number;
      planCounts: Record<string, number>;
      sourceCounts: Record<string, number>;
      marketCounts: Record<Market, number>;
      currencies: Set<string>;
    };

    const customers = new Map<string, CustomerAgg>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.paymentId || d.isGift) continue;
      // Exclui vendas deletadas pelo admin (refund)
      if (d.deletedByAdmin) continue;

      const emailRaw = (owner?.email || d.guestEmail || d.ownerEmail || '').toLowerCase().trim();
      if (!emailRaw || !emailRaw.includes('@')) continue;

      const m = resolveMarket(d);
      if (marketFilter && m !== marketFilter.toUpperCase()) continue;

      const currency = currencyOfMarket(m);
      const amountBRL = toBRL(resolveAmount(d, m), currency);
      const createdAt: Date | null = d.createdAt?.toDate ? d.createdAt.toDate() : null;

      const key = createHash('sha256').update(emailRaw).digest('hex').slice(0, 24);

      let agg = customers.get(key);
      if (!agg) {
        agg = {
          emailHash: key,
          emailMasked: maskEmail(emailRaw),
          phoneMasked: maskPhone(d.whatsappNumber || ''),
          firstPurchaseAt: null,
          lastPurchaseAt: null,
          totalPurchases: 0,
          totalSpentBRL: 0,
          planCounts: {},
          sourceCounts: {},
          marketCounts: { BR: 0, PT: 0, US: 0 },
          currencies: new Set<string>(),
        };
        customers.set(key, agg);
      }

      agg.totalPurchases++;
      agg.totalSpentBRL += amountBRL;
      if (createdAt) {
        if (!agg.firstPurchaseAt || createdAt < agg.firstPurchaseAt) agg.firstPurchaseAt = createdAt;
        if (!agg.lastPurchaseAt || createdAt > agg.lastPurchaseAt) agg.lastPurchaseAt = createdAt;
      }
      const plan = (d.plan as string) || 'basico';
      agg.planCounts[plan] = (agg.planCounts[plan] || 0) + 1;
      const src = ((d.utmSource || d.utm_source || 'direct') as string).toLowerCase().trim();
      agg.sourceCounts[src] = (agg.sourceCounts[src] || 0) + 1;
      agg.marketCounts[m]++;
      agg.currencies.add(currency);
    }

    // Filtros pós-agregação + ordenação por LTV desc
    let list = Array.from(customers.values()).filter(c => {
      if (c.totalSpentBRL < minLTV) return false;
      if (returningOnly && c.totalPurchases < 2) return false;
      return true;
    });

    list.sort((a, b) => b.totalSpentBRL - a.totalSpentBRL);

    // Paginação keyset por emailHash (cursor = último hash da página anterior)
    if (cursor) {
      const idx = list.findIndex(c => c.emailHash === cursor);
      if (idx >= 0) list = list.slice(idx + 1);
    }
    const paged = list.slice(0, limit);
    const hasMore = list.length > limit;
    const nextCursor = hasMore && paged.length > 0 ? paged[paged.length - 1].emailHash : null;

    // Summary global (calculado em TODOS os customers — não só na página)
    const allCustomers = Array.from(customers.values());
    const summary = {
      uniqueCustomers: allCustomers.length,
      returningCustomers: allCustomers.filter(c => c.totalPurchases >= 2).length,
      returningRate: allCustomers.length > 0
        ? Number(((allCustomers.filter(c => c.totalPurchases >= 2).length / allCustomers.length) * 100).toFixed(2))
        : 0,
      totalSpentBRL: Number(allCustomers.reduce((s, c) => s + c.totalSpentBRL, 0).toFixed(2)),
      avgLTV: allCustomers.length > 0
        ? Number((allCustomers.reduce((s, c) => s + c.totalSpentBRL, 0) / allCustomers.length).toFixed(2))
        : 0,
      avgPurchasesPerCustomer: allCustomers.length > 0
        ? Number((allCustomers.reduce((s, c) => s + c.totalPurchases, 0) / allCustomers.length).toFixed(2))
        : 0,
    };

    return NextResponse.json(
      {
        data: paged.map(c => {
          const favoritePlan = Object.entries(c.planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
          const primarySource = Object.entries(c.sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
          const primaryMarket = (Object.entries(c.marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'BR') as Market;
          return {
            id: `cust_${c.emailHash}`,
            emailMasked: c.emailMasked,
            phoneMasked: c.phoneMasked,
            firstPurchaseAt: c.firstPurchaseAt?.toISOString() || null,
            lastPurchaseAt: c.lastPurchaseAt?.toISOString() || null,
            daysAsCustomer: c.firstPurchaseAt && c.lastPurchaseAt
              ? Math.round((c.lastPurchaseAt.getTime() - c.firstPurchaseAt.getTime()) / (1000 * 60 * 60 * 24))
              : 0,
            totalPurchases: c.totalPurchases,
            totalSpentBRL: Number(c.totalSpentBRL.toFixed(2)),
            avgTicketBRL: Number((c.totalSpentBRL / c.totalPurchases).toFixed(2)),
            favoritePlan,
            primarySource,
            primaryMarket,
            isReturning: c.totalPurchases >= 2,
          };
        }),
        pagination: { limit, count: paged.length, hasMore, nextCursor },
        summary,
        filters: { from: fromStr, to: toStr, minLTV, market: marketFilter, returningOnly },
        meta: {
          fxToBRL: FX,
          identityKey: 'email lowercased + trimmed (sha256 hash truncado pra cursor estável)',
          note: 'LTV é histórico — filtros from/to filtram apenas as PURCHASES no range, não o customer.',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/customers] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
