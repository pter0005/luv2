import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  categorizeRecipient,
  FX,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/recovery-queue
 *
 * Lista PIX gerados ainda NÃO pagos pra recovery via WhatsApp/email.
 * Retorna DADOS COMPLETOS (email + phone) — diferente dos outros endpoints
 * que mascaram. Justificativa LGPD: interesse legítimo do controlador
 * (Art. 7º IX) — comunicação com o próprio cliente que iniciou compra
 * mas não concluiu, com finalidade específica e proporcional (recovery
 * do mesmo carrinho que ele criou).
 *
 * Filtros:
 *   ?olderThan=5min|1h|24h    (default 5min)
 *   ?status=pending|abandoned (default pending)
 *
 * "pending"    = PIX criado, ainda não pago, dentro do TTL (30min)
 * "abandoned"  = PIX expirou, intent ainda waiting_payment >30min
 *
 * Janela: últimas 48h (mais que isso vira ruído — cliente já esqueceu).
 *
 * IMPORTANTE: Não retorna intents que JÁ foram pagos (status=completed)
 * nem que foram refundados (deletedByAdmin). Não retorna admins. Não
 * retorna gifts (isGift=true).
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const olderThanRaw = (url.searchParams.get('olderThan') || '5min').toLowerCase();
  const statusFilter = (url.searchParams.get('status') || 'pending').toLowerCase();

  // Parse olderThan → minutos
  let olderThanMin = 5;
  if (/^(\d+)min$/.test(olderThanRaw)) {
    olderThanMin = parseInt(olderThanRaw.replace('min', ''), 10);
  } else if (/^(\d+)h$/.test(olderThanRaw)) {
    olderThanMin = parseInt(olderThanRaw.replace('h', ''), 10) * 60;
  } else if (olderThanRaw === '24h') {
    olderThanMin = 24 * 60;
  }
  // Cap defensivo (sanidade)
  olderThanMin = Math.max(1, Math.min(olderThanMin, 48 * 60));

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    const now = Date.now();
    const cutoffOldest = new Date(now - 48 * 60 * 60 * 1000);   // 48h atrás (limite duro)
    const cutoffYoungest = new Date(now - olderThanMin * 60 * 1000);

    // Query: payment_intents com status=waiting_payment criados nos últimos 48h
    const q = db.collection('payment_intents')
      .where('status', '==', 'waiting_payment')
      .where('createdAt', '>=', cutoffOldest)
      .where('createdAt', '<=', cutoffYoungest)
      .orderBy('createdAt', 'desc');

    const snap = await q.get();

    type RecoveryEntry = {
      id: string;
      createdAt: string | null;
      pixCreatedAt: string | null;
      minutesSinceCreation: number;
      minutesSincePixGenerated: number | null;
      amount: number;
      amountBRL: number;
      currency: string;
      market: string;
      plan: string;
      title: string;
      recipientCategory: string;
      buyerName: string | null;
      buyerFirstName: string | null;
      buyerEmail: string;
      buyerPhone: string | null;
      checkoutUrl: string;
      couponCheckoutUrl: string | null;
      pixQrCode: string | null;
      utm: { source: string | null; medium: string | null; campaign: string | null } | null;
      status: 'pending' | 'abandoned';
    };

    const data: RecoveryEntry[] = [];

    for (const doc of snap.docs) {
      const d = doc.data();

      // Filtros: NÃO entra na fila
      if (d.deletedByAdmin) continue;        // admin já marcou refund
      if (d.isGift) continue;                // gift token, não é compra
      if (d.lovePageId) continue;            // já finalizou (paid)

      // Excluir admins
      const owner = userMap.get(d.userId);
      const ownerEmail = (owner?.email || '').toLowerCase();
      if (ownerEmail && ADMIN_EMAILS.includes(ownerEmail)) continue;

      const createdAtDate: Date | null = d.createdAt?.toDate ? d.createdAt.toDate() : null;
      const pixCreatedDate: Date | null = d.pixCreatedAt?.toDate ? d.pixCreatedAt.toDate() : null;
      if (!createdAtDate) continue;

      const minutesSinceCreation = Math.floor((now - createdAtDate.getTime()) / 60000);
      const minutesSincePix = pixCreatedDate
        ? Math.floor((now - pixCreatedDate.getTime()) / 60000)
        : null;

      // Status: pending se PIX ainda válido (<30min), abandoned se expirou
      // Sem pixCreatedAt → considera abandoned (PIX nem chegou a ser gerado
      // depois do intent — provavelmente desistiu antes de clicar).
      const isPixExpired = minutesSincePix === null || minutesSincePix > 30;
      const entryStatus: 'pending' | 'abandoned' = isPixExpired ? 'abandoned' : 'pending';

      // Aplica filtro de status
      if (statusFilter === 'pending' && entryStatus !== 'pending') continue;
      if (statusFilter === 'abandoned' && entryStatus !== 'abandoned') continue;

      const market = resolveMarket(d);
      const currency = currencyOfMarket(market);
      const amount = resolveAmount(d, market);
      const amountBRL = toBRL(amount, currency);

      // Email: prefere guest (mais atualizado pré-checkout), depois owner
      const email = (d.guestEmail || ownerEmail || d.ownerEmail || '').toLowerCase().trim();
      if (!email || !email.includes('@')) continue; // sem email não tem como contatar

      // Phone: aceita whatsappNumber, normaliza pra E.164 BR/PT/US
      const rawPhone = String(d.whatsappNumber || '').replace(/\D/g, '');
      let phoneE164: string | null = null;
      if (rawPhone.length >= 10) {
        // BR: 10-11 díg sem cód país → +55 prefix
        // PT: 9 díg → +351 prefix
        // US: 10 díg → +1 prefix
        if (rawPhone.length === 11 || rawPhone.length === 10) {
          if (market === 'PT') phoneE164 = `+351${rawPhone.slice(-9)}`;
          else if (market === 'US') phoneE164 = `+1${rawPhone.slice(-10)}`;
          else phoneE164 = `+55${rawPhone}`;
        } else if (rawPhone.length === 12 || rawPhone.length === 13) {
          // Já tem código país (5511..., 351..., 1...)
          phoneE164 = `+${rawPhone}`;
        } else if (rawPhone.length === 9 && market === 'PT') {
          phoneE164 = `+351${rawPhone}`;
        }
      }

      const userName = (d.userName as string) || null;
      const firstName = userName ? userName.split(' ')[0] : null;
      const title = (d.title as string) || '';

      const baseUrl = market === 'PT' ? 'https://mycupid.net' : 'https://mycupid.com.br';
      const checkoutUrl = `${baseUrl}/criar/fazer-eu-mesmo?intent=${doc.id}`;

      // Coupon URL: se tiver cupom de recovery configurado (env), retorna link
      // que abre o wizard JÁ com cupom aplicado (rota /desconto/CODE existente).
      const recoveryCoupon = process.env.RECOVERY_COUPON_CODE;
      const couponCheckoutUrl = recoveryCoupon
        ? `${baseUrl}/desconto/${recoveryCoupon.toUpperCase()}`
        : null;

      // UTMs: vem do attribution snapshot do intent (campo `attribution`).
      const attr = d.attribution || {};
      const utm = (attr.utm_source || attr.utm_medium || attr.utm_campaign) ? {
        source: attr.utm_source || null,
        medium: attr.utm_medium || null,
        campaign: attr.utm_campaign || null,
      } : null;

      data.push({
        id: doc.id,
        createdAt: createdAtDate.toISOString(),
        pixCreatedAt: pixCreatedDate?.toISOString() || null,
        minutesSinceCreation,
        minutesSincePixGenerated: minutesSincePix,
        amount: Number(amount.toFixed(2)),
        amountBRL: Number(amountBRL.toFixed(2)),
        currency,
        market,
        plan: (d.plan as string) || 'unknown',
        title,
        recipientCategory: categorizeRecipient(title),
        buyerName: userName,
        buyerFirstName: firstName,
        buyerEmail: email,
        buyerPhone: phoneE164,
        checkoutUrl,
        couponCheckoutUrl,
        pixQrCode: (d.pixQrCode as string) || null,
        utm,
        status: entryStatus,
      });
    }

    // Resumo
    const summary = {
      total: data.length,
      withPhone: data.filter(d => d.buyerPhone).length,
      withEmail: data.length, // sempre tem (filtramos sem email)
      byMarket: data.reduce((acc, d) => {
        acc[d.market] = (acc[d.market] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: data.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalLostBRL: Number(data.reduce((s, d) => s + d.amountBRL, 0).toFixed(2)),
    };

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        data,
        summary,
        filters: {
          olderThan: olderThanRaw,
          olderThanMin,
          status: statusFilter,
        },
        meta: {
          fxToBRL: FX,
          windowHours: 48,
          note: 'Dados completos (email/phone) — uso LIMITADO a recovery do próprio cliente. NÃO usar pra qualquer outra finalidade (LGPD Art. 7º IX).',
          recoveryCouponConfigured: !!process.env.RECOVERY_COUPON_CODE,
          phoneFormat: 'E.164 (+55..., +351..., +1...)',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/recovery-queue] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
