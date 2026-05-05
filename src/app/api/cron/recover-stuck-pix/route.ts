import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import { logCriticalError } from '@/lib/log-critical-error';
import { notifyAdmins } from '@/lib/notify-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron PIX Stuck Recovery
 *
 * Disparado pelo Netlify Scheduled Functions a cada 1h. Busca payment_intents
 * que ainda estão em waiting_payment + sem paymentId + > 1h e <= 24h, e
 * pergunta pro Mercado Pago se aquele intent foi pago. Se sim, dispara
 * finalizeLovePage() (idempotente, mesma função que webhook chama).
 *
 * Por que existe: webhook do MP pode falhar (timeout, lentidão, retry esgotou
 * sem sucesso). Sem cron, cliente paga e nunca recebe a página → reembolso ou
 * Reclame Aqui. Cron resolve em <=1h sem intervenção humana.
 *
 * Idempotência: finalizeLovePage tem race guard (status==='completed' return).
 * Se webhook chegar concorrente ao cron, quem chega primeiro vence.
 *
 * Janela de busca:
 *  - >1h: PIX expira em 30min, +30min buffer pro retry natural do MP
 *  - <=24h: depois disso, cliente já desistiu / pediu reembolso. Não é seguro
 *    "surpreender" recriando página dia depois (risco de double charge se ele
 *    pagou 2x).
 */
export async function GET(req: NextRequest) {
  // Auth — só Netlify cron pode disparar
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!mpToken) {
    return NextResponse.json({ error: 'MERCADO_PAGO_ACCESS_TOKEN missing' }, { status: 500 });
  }

  const db = getAdminFirestore();
  const mpClient = new MercadoPagoConfig({ accessToken: mpToken });
  const paymentClient = new Payment(mpClient);

  const now = Date.now();
  const oneHourAgo = Timestamp.fromMillis(now - 60 * 60 * 1000);
  const twentyFourHoursAgo = Timestamp.fromMillis(now - 24 * 60 * 60 * 1000);

  type ResultEntry = {
    intentId: string;
    action: 'recovered' | 'finalize_failed' | 'unpaid_skipped' | 'mp_query_failed' | 'gave_up';
    paymentId?: string;
    amount?: number;
    pageId?: string;
    error?: string;
  };
  const results: ResultEntry[] = [];

  let candidates: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  try {
    // Não dá pra usar 3 where com range em campos diferentes no Firestore.
    // Strategy: query por createdAt range, filtra status + paymentId em memória.
    // Cap em 50 pra ficar dentro do timeout de 60s do Lambda.
    const snap = await db.collection('payment_intents')
      .where('createdAt', '<=', oneHourAgo)
      .where('createdAt', '>=', twentyFourHoursAgo)
      .orderBy('createdAt', 'desc')
      .limit(150)
      .get();

    candidates = snap.docs.filter(doc => {
      const d = doc.data();
      // Só intents pendentes que ainda não foram finalizados
      if (d.status === 'completed') return false;
      if (d.paymentId) return false; // já tem pagamento confirmado
      if (d.deletedByAdmin) return false; // admin apagou manualmente
      // Skip se já desistimos depois de 3 tentativas falhadas
      if ((d.cronRecoverAttempts ?? 0) >= 3 && d.cronGiveUp) return false;
      return true;
    }).slice(0, 50);
  } catch (err: any) {
    console.error('[recover-stuck-pix] failed to fetch candidates:', err?.message);
    return NextResponse.json({ error: 'fetch_failed', message: err?.message }, { status: 500 });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, recovered: 0 });
  }

  // Processa cada candidato sequencialmente (não paraleliza pra não estourar
  // rate limit do MP e timeout do Lambda).
  for (const doc of candidates) {
    const intentId = doc.id;
    const intentData = doc.data();
    let attempts = (intentData.cronRecoverAttempts ?? 0) + 1;

    try {
      // 1. Pergunta ao MP se esse intent foi pago.
      // external_reference é setado em processPixPayment — é o link entre
      // nosso intentId e o paymentId do MP.
      const search = await paymentClient.search({
        options: { external_reference: intentId, limit: 10 },
      });

      const payments = (search?.results || []) as any[];
      // Procura pagamento approved + sem refund. Se tiver refund, MP devolveu —
      // não recriar página.
      const approved = payments.find((p: any) =>
        p.status === 'approved' &&
        p.status_detail === 'accredited' &&
        (!p.refunds || p.refunds.length === 0),
      );

      if (!approved) {
        // Não pagou (ou pagou e foi reembolsado). Pula.
        results.push({ intentId, action: 'unpaid_skipped' });
        // Atualiza contador de tentativas pra não buscar de novo amanhã se já
        // passou da janela. Não bloqueia retentativa em < 24h porque pode ter
        // sido só lentidão do MP.
        await doc.ref.update({
          cronRecoverAttempts: attempts,
          cronLastCheck: Timestamp.now(),
        }).catch(() => {});
        continue;
      }

      // 2. Achou pagamento approved. Persiste paidAmount no intent ANTES de
      // chamar finalize (mesma lógica do webhook).
      const txAmount = Number(approved.transaction_amount);
      if (isFinite(txAmount) && txAmount > 0) {
        await doc.ref.set({ paidAmount: txAmount }, { merge: true }).catch(() => {});
      }

      // 3. Chama finalizeLovePage (idempotente).
      const paymentId = String(approved.id);
      const finalizeResult = await finalizeLovePage(intentId, paymentId);

      if (finalizeResult.success) {
        results.push({
          intentId,
          action: 'recovered',
          paymentId,
          amount: txAmount,
          pageId: finalizeResult.pageId,
        });
        console.log(`[recover-stuck-pix] RECOVERED intent=${intentId} payment=${paymentId} pageId=${finalizeResult.pageId}`);
      } else {
        results.push({
          intentId,
          action: 'finalize_failed',
          paymentId,
          error: finalizeResult.error,
        });
        // Marca tentativa. Se passou de 3, dá give up pra parar de tentar
        // (precisa de intervenção manual via admin/recover-pix ou retry-finalize).
        const giveUp = attempts >= 3;
        await doc.ref.update({
          cronRecoverAttempts: attempts,
          cronLastCheck: Timestamp.now(),
          cronLastError: finalizeResult.error || 'unknown',
          cronGiveUp: giveUp,
        }).catch(() => {});

        if (giveUp) {
          await logCriticalError('payment', `Cron stuck-PIX: desistiu após 3 falhas (intent=${intentId})`, {
            intentId,
            paymentId,
            error: finalizeResult.error,
            attempts,
            source: 'cron_recover_stuck_pix',
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error(`[recover-stuck-pix] error on intent ${intentId}:`, err?.message);
      results.push({
        intentId,
        action: 'mp_query_failed',
        error: err?.message || 'unknown',
      });
      // Não incrementa attempts em erro de MP (rate limit, network). Tenta de novo
      // na próxima execução do cron sem queimar a quota.
    }
  }

  // Resumo
  const recovered = results.filter(r => r.action === 'recovered');
  const failed = results.filter(r => r.action === 'finalize_failed');
  const totalAmount = recovered.reduce((s, r) => s + (r.amount ?? 0), 0);

  // Notifica admin se recuperou alguma OU teve falhas críticas
  if (recovered.length > 0) {
    const pageIds = recovered.map(r => r.pageId).filter(Boolean).join(', ');
    await notifyAdmins(
      `🚨 ${recovered.length} venda${recovered.length > 1 ? 's' : ''} recuperada${recovered.length > 1 ? 's' : ''} pelo cron`,
      `Total R$${totalAmount.toFixed(2)}. Pages: ${pageIds.slice(0, 200)}`,
      '/admin',
    ).catch(() => {});
  }

  // Salva log estruturado pra dashboard mostrar histórico
  try {
    await db.collection('recovery_logs').add({
      ranAt: Timestamp.now(),
      candidatesCount: candidates.length,
      recoveredCount: recovered.length,
      finalizeFailed: failed.length,
      unpaid: results.filter(r => r.action === 'unpaid_skipped').length,
      mpErrors: results.filter(r => r.action === 'mp_query_failed').length,
      totalRecoveredAmount: totalAmount,
      results: results.slice(0, 50), // cap pra não estourar 1MB do Firestore
    });
  } catch { /* logging não-crítico */ }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    recovered: recovered.length,
    finalizeFailed: failed.length,
    totalRecoveredAmount: totalAmount,
    results,
  });
}
