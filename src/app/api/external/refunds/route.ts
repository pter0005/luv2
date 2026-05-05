import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  maskEmail,
  FX,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/refunds
 *
 * Lista de vendas estornadas/deletadas. Lê de DUAS fontes:
 *   1. payment_intents.deletedByAdmin == true → admin marcou pra refund
 *   2. deleted_lovepages collection → pages que foram apagadas (audit trail
 *      do delete manual no /admin/pages)
 *
 * MER REAL = (faturamento - reembolsos) / spend. Sem isso, dashboard infla
 * receita 1-3% e tu compra ad caro achando que tá no lucro.
 *
 * Query: from, to (filtra refundedAt no range)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    type RefundEntry = {
      saleId: string | null;
      refundedAt: string | null;
      originalSaleDate: string | null;
      amount: number;
      amountBRL: number;
      currency: string;
      market: string;
      plan: string;
      reason: string;
      email: string;
      source: 'intent_deleted' | 'lovepage_deleted';
    };

    const refunds: RefundEntry[] = [];

    // ── Fonte 1: payment_intents.deletedByAdmin == true ──
    let q1: FirebaseFirestore.Query = db.collection('payment_intents').where('deletedByAdmin', '==', true);
    const intents = await q1.get();
    for (const doc of intents.docs) {
      const d = doc.data();
      const refundedAt: Date | null = d.deletedAt?.toDate ? d.deletedAt.toDate() : null;
      // Filtra por range se foi pedido
      if (refundedAt) {
        if (fromStr) {
          const f = new Date(fromStr);
          if (!isNaN(f.getTime()) && refundedAt < f) continue;
        }
        if (toStr) {
          const t = new Date(toStr);
          if (!isNaN(t.getTime()) && refundedAt > t) continue;
        }
      }
      const m = resolveMarket(d);
      const currency = currencyOfMarket(m);
      const amount = resolveAmount(d, m);
      const owner = userMap.get(d.userId);
      const emailRaw = (owner?.email || d.guestEmail || d.ownerEmail || '');
      // Não filtra admin aqui — admin pode legitimamente refundar vendas próprias

      refunds.push({
        saleId: d.lovePageId || null,
        refundedAt: refundedAt?.toISOString() || null,
        originalSaleDate: d.createdAt?.toDate?.()?.toISOString() || null,
        amount: Number(amount.toFixed(2)),
        amountBRL: Number((toBRL(amount, currency)).toFixed(2)),
        currency,
        market: m,
        plan: (d.plan as string) || 'unknown',
        reason: (d.deleteReason as string) || 'admin_deleted',
        email: maskEmail(emailRaw),
        source: 'intent_deleted',
      });
    }

    // ── Fonte 2: deleted_lovepages (mais detalhada) ──
    const deletedSnap = await db.collection('deleted_lovepages').get();
    for (const doc of deletedSnap.docs) {
      const d = doc.data();
      const refundedAt: Date | null = d._deletedAt?.toDate ? d._deletedAt.toDate() : null;
      if (refundedAt) {
        if (fromStr) {
          const f = new Date(fromStr);
          if (!isNaN(f.getTime()) && refundedAt < f) continue;
        }
        if (toStr) {
          const t = new Date(toStr);
          if (!isNaN(t.getTime()) && refundedAt > t) continue;
        }
      }
      const m = resolveMarket(d);
      const currency = currencyOfMarket(m);
      const amount = resolveAmount(d, m);
      const owner = userMap.get(d.userId);
      const emailRaw = (owner?.email || d.guestEmail || d.ownerEmail || '');

      // Dedup: se já tem entry com esse pageId via intent (acima), ignora
      const pageId = (d._originalPageId as string) || doc.id;
      const alreadyTracked = refunds.some(r => r.saleId === pageId);
      if (alreadyTracked) continue;

      refunds.push({
        saleId: pageId,
        refundedAt: refundedAt?.toISOString() || null,
        originalSaleDate: d.createdAt?.toDate?.()?.toISOString() || null,
        amount: Number(amount.toFixed(2)),
        amountBRL: Number((toBRL(amount, currency)).toFixed(2)),
        currency,
        market: m,
        plan: (d.plan as string) || 'unknown',
        reason: (d._deleteReason as string) || 'admin_deleted',
        email: maskEmail(emailRaw),
        source: 'lovepage_deleted',
      });
    }

    // Ordena por refundedAt desc
    refunds.sort((a, b) => {
      if (!a.refundedAt && !b.refundedAt) return 0;
      if (!a.refundedAt) return 1;
      if (!b.refundedAt) return -1;
      return a.refundedAt < b.refundedAt ? 1 : -1;
    });

    // Calcular taxa de refund: refunds no período / total vendas no período
    let totalSalesInPeriod = 0;
    if (fromStr || toStr) {
      let salesQ: FirebaseFirestore.Query = db.collection('lovepages');
      if (fromStr) {
        const f = new Date(fromStr);
        if (!isNaN(f.getTime())) salesQ = salesQ.where('createdAt', '>=', f);
      }
      if (toStr) {
        const t = new Date(toStr);
        if (!isNaN(t.getTime())) salesQ = salesQ.where('createdAt', '<=', t);
      }
      const salesSnap = await salesQ.get();
      salesSnap.docs.forEach(doc => {
        const d = doc.data();
        const owner = userMap.get(d.userId);
        if (owner && ADMIN_EMAILS.includes(owner.email)) return;
        if (!d.paymentId || d.isGift) return;
        totalSalesInPeriod++;
      });
    } else {
      // Sem range — todo o histórico
      const allSalesSnap = await db.collection('lovepages').count().get();
      totalSalesInPeriod = allSalesSnap.data().count;
    }

    const totalBRL = refunds.reduce((s, r) => s + r.amountBRL, 0);
    const refundRate = totalSalesInPeriod > 0
      ? Number(((refunds.length / totalSalesInPeriod) * 100).toFixed(2))
      : 0;

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        data: refunds,
        summary: {
          count: refunds.length,
          totalBRL: Number(totalBRL.toFixed(2)),
          totalSalesInPeriod,
          refundRate, // % de vendas que foram reembolsadas
        },
        filters: { from: fromStr, to: toStr },
        meta: {
          fxToBRL: FX,
          sources: [
            'payment_intents com deletedByAdmin=true (set via /admin/pages delete)',
            'deleted_lovepages collection (audit trail completo)',
          ],
          note: 'Reason possíveis: cliente pediu reembolso, fraude, conteúdo inadequado, duplicate, chargeback',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/refunds] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
