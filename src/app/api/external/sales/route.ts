import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FX_TO_BRL = { BRL: 1, EUR: 5.8, USD: 5.1 } as const;
type Currency = keyof typeof FX_TO_BRL;

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `**@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length < 4) return '***';
  return `***${d.slice(-4)}`;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason);

  const url = new URL(req.url);
  const params = url.searchParams;

  // Filtros
  const fromStr = params.get('from'); // ISO date 'YYYY-MM-DD' ou ISO completo
  const toStr = params.get('to');
  const market = params.get('market'); // BR | PT | US
  const limitRaw = parseInt(params.get('limit') || '100', 10);
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 100 : limitRaw, 1), 500);
  const cursor = params.get('cursor'); // pageId pra paginação keyset

  try {
    const db = getAdminFirestore();

    // Mapa de userId → email (pra excluir admins)
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    let query: FirebaseFirestore.Query = db.collection('lovepages').orderBy('createdAt', 'desc');

    if (fromStr) {
      const fromDate = new Date(fromStr);
      if (!isNaN(fromDate.getTime())) query = query.where('createdAt', '>=', fromDate);
    }
    if (toStr) {
      const toDate = new Date(toStr);
      if (!isNaN(toDate.getTime())) query = query.where('createdAt', '<=', toDate);
    }

    // Cursor — pega doc do pageId e startAfter
    if (cursor) {
      const cursorDoc = await db.collection('lovepages').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(limit + 1).get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;

    const sales = docs
      .filter(doc => {
        const d = doc.data();
        const owner = userMap.get(d.userId);
        // exclui admins
        if (owner && ADMIN_EMAILS.includes(owner.email)) return false;
        // só páginas pagas (tem paymentId) ou gifts explícitos
        if (!d.paymentId && !d.isGift) return false;
        return true;
      })
      .map(doc => {
        const d = doc.data();
        const owner = userMap.get(d.userId);

        // Resolve market via fields canônicos (persistidos desde i18n feat).
        // Fallback: paymentId não-numérico (Stripe session "cs_…") → US legacy.
        const docMarket = d.market || (d.currency === 'EUR' ? 'PT' : d.currency === 'USD' ? 'US' : null);
        const isStripeId = d.paymentId && isNaN(Number(d.paymentId));
        const m: 'BR' | 'PT' | 'US' = (docMarket as any) || (isStripeId ? 'US' : 'BR');
        const currency: Currency = m === 'PT' ? 'EUR' : m === 'US' ? 'USD' : 'BRL';

        const baseByMarket: Record<'BR' | 'PT' | 'US', Record<string, number>> = {
          BR: { vip: 34.99, avancado: 24.90, basico: 19.90 },
          PT: { vip: 17.99, avancado: 12.99, basico: 8.99 },
          US: { vip: 19.99, avancado: 14.99, basico: 9.99 },
        };
        const baseFallback = baseByMarket[m][d.plan] ?? baseByMarket[m]['basico'];
        const amount = typeof d.paidAmount === 'number' && d.paidAmount > 0 ? d.paidAmount : baseFallback;
        const amountBRL = Number((amount * FX_TO_BRL[currency]).toFixed(2));

        const createdAt: Date | null = d.createdAt?.toDate ? d.createdAt.toDate() : null;

        // Filtro market pós-aggregation (Firestore não indexa em tudo)
        if (market && m !== market.toUpperCase()) return null;

        return {
          id: doc.id,
          createdAt: createdAt ? createdAt.toISOString() : null,
          market: m,
          currency,
          amount: Number(amount.toFixed(2)),
          amountBRL,
          plan: d.plan || 'basico',
          isGift: !!d.isGift,
          utmSource: (d.utmSource || d.utm_source || 'direct') as string,
          utmCampaign: (d.utmCampaign || d.utm_campaign || null) as string | null,
          utmMedium: (d.utmMedium || d.utm_medium || null) as string | null,
          email: maskEmail(owner?.email || d.guestEmail || d.ownerEmail || ''),
          phone: maskPhone(d.whatsappNumber || ''),
          title: (d.title as string) || null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const summary = sales.reduce(
      (acc, s) => {
        acc.totalBRL += s.amountBRL;
        if (s.currency === 'EUR') acc.totalEUR += s.amount;
        else if (s.currency === 'USD') acc.totalUSD += s.amount;
        else acc.totalBRLNative += s.amount;
        acc.byMarket[s.market] = (acc.byMarket[s.market] || 0) + 1;
        return acc;
      },
      {
        count: sales.length,
        totalBRL: 0,
        totalBRLNative: 0,
        totalEUR: 0,
        totalUSD: 0,
        byMarket: {} as Record<string, number>,
      },
    );

    summary.totalBRL = Number(summary.totalBRL.toFixed(2));
    summary.totalBRLNative = Number(summary.totalBRLNative.toFixed(2));
    summary.totalEUR = Number(summary.totalEUR.toFixed(2));
    summary.totalUSD = Number(summary.totalUSD.toFixed(2));

    const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1].id : null;

    return NextResponse.json(
      {
        data: sales,
        pagination: {
          limit,
          count: sales.length,
          hasMore,
          nextCursor,
        },
        summary,
        filters: { from: fromStr, to: toStr, market: market || null },
        meta: {
          fxToBRL: FX_TO_BRL,
          fxNote: 'Cotação fixa — revisar quando flutuar > 5%',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/sales] error:', err?.message);
    return NextResponse.json(
      { error: 'internal_error', message: err?.message || 'unknown' },
      { status: 500 },
    );
  }
}
