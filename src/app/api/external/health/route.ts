import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/health
 *
 * Health check pra monitor automático. Retorna status dos serviços críticos
 * (Firestore, MP, Stripe) + métricas de erro recentes (últimas 24h).
 *
 * "healthy"  = tudo OK
 * "degraded" = algum serviço falhando ou error rate > 0.5%
 * "down"     = Firestore inacessível ou error rate > 5%
 *
 * Pode ser pingada a cada 1-5min sem load (faz queries leves).
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const startedAt = Date.now();
  const checks: Record<string, { status: 'ok' | 'fail' | 'n/a'; latencyMs?: number; error?: string }> = {};

  // ── Firestore check (read leve) ──
  let dbOk = true;
  try {
    const t0 = Date.now();
    const db = getAdminFirestore();
    // Tenta ler 1 doc qualquer (count() é mais barato que get())
    await db.collection('lovepages').count().get();
    checks.firestore = { status: 'ok', latencyMs: Date.now() - t0 };
  } catch (err: any) {
    dbOk = false;
    checks.firestore = { status: 'fail', error: err?.message?.slice(0, 200) };
  }

  // ── Mercado Pago: verifica que token tá configurado (não chama API real
  //    pra não gastar rate limit deles) ──
  if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    checks.mercadoPago = { status: 'ok' };
  } else {
    checks.mercadoPago = { status: 'fail', error: 'MERCADO_PAGO_ACCESS_TOKEN missing' };
  }

  // ── Stripe ──
  if (process.env.STRIPE_SECRET_KEY) {
    checks.stripe = { status: 'ok' };
  } else {
    checks.stripe = { status: 'n/a', error: 'STRIPE_SECRET_KEY not set (optional)' };
  }

  // ── Webhook secrets ──
  checks.mercadoPagoWebhook = process.env.MERCADO_PAGO_WEBHOOK_SECRET
    ? { status: 'ok' }
    : { status: 'fail', error: 'MERCADO_PAGO_WEBHOOK_SECRET missing' };
  checks.stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET
    ? { status: 'ok' }
    : { status: 'n/a', error: 'STRIPE_WEBHOOK_SECRET not set' };

  // ── Firebase Admin ──
  checks.firebaseAdmin = process.env.FIREBASE_PRIVATE_KEY
    ? { status: 'ok' }
    : { status: 'fail', error: 'FIREBASE_PRIVATE_KEY missing' };

  // ── Métricas de erro últimas 24h ──
  let errorCount24h = 0;
  let unresolvedErrors = 0;
  let salesCount24h = 0;
  let stuckPixCount = 0;
  let recentRecoveryCount = 0;
  let recentRecoveredAmount = 0;

  if (dbOk) {
    try {
      const db = getAdminFirestore();
      const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
      const oneHourAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);

      // Errors últimas 24h
      const errSnap = await db.collection('error_logs')
        .where('createdAt', '>=', oneDayAgo)
        .count()
        .get();
      errorCount24h = errSnap.data().count;

      const unresolvedSnap = await db.collection('error_logs')
        .where('resolved', '==', false)
        .count()
        .get();
      unresolvedErrors = unresolvedSnap.data().count;

      // Vendas últimas 24h
      const salesSnap = await db.collection('lovepages')
        .where('createdAt', '>=', oneDayAgo)
        .where('paymentId', '!=', null)
        .count()
        .get();
      salesCount24h = salesSnap.data().count;

      // PIX stuck (>1h sem completion)
      const stuckSnap = await db.collection('payment_intents')
        .where('status', '==', 'waiting_payment')
        .where('createdAt', '<=', oneHourAgo)
        .count()
        .get();
      stuckPixCount = stuckSnap.data().count;

      // Vendas recuperadas pelo cron últimas 24h
      try {
        const recoverySnap = await db.collection('recovery_logs')
          .where('ranAt', '>=', oneDayAgo)
          .get();
        recoverySnap.docs.forEach(doc => {
          const d = doc.data();
          recentRecoveryCount += d.recoveredCount || 0;
          recentRecoveredAmount += d.totalRecoveredAmount || 0;
        });
      } catch { /* recovery_logs pode não existir ainda */ }
    } catch (err: any) {
      checks.metrics = { status: 'fail', error: err?.message?.slice(0, 200) };
    }
  }

  // ── Determine overall status ──
  const failedCriticalChecks = ['firestore', 'mercadoPago', 'firebaseAdmin', 'mercadoPagoWebhook']
    .filter(k => checks[k]?.status === 'fail');

  const errorRate = salesCount24h > 0
    ? errorCount24h / Math.max(salesCount24h, 10) // floor pra evitar 100% com 1 venda
    : (errorCount24h > 50 ? 1 : 0);

  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  const issues: string[] = [];

  if (failedCriticalChecks.length > 0) {
    status = 'down';
    issues.push(`Critical services down: ${failedCriticalChecks.join(', ')}`);
  } else if (errorRate > 0.05) {
    status = 'down';
    issues.push(`Error rate > 5% (${(errorRate * 100).toFixed(1)}%)`);
  } else if (errorRate > 0.005) {
    status = 'degraded';
    issues.push(`Elevated error rate (${(errorRate * 100).toFixed(2)}%)`);
  }

  if (stuckPixCount > 10) {
    if (status === 'healthy') status = 'degraded';
    issues.push(`${stuckPixCount} PIX intents stuck > 1h (cron-recover-stuck-pix should pick these up)`);
  }

  const latencyMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      status,
      lastCheck: new Date().toISOString(),
      latencyMs,
      checks,
      metrics: {
        errorCount24h,
        unresolvedErrors,
        salesCount24h,
        stuckPixCount,
        recoveredVialastCron24h: recentRecoveryCount,
        recoveredAmountBRL24h: Number(recentRecoveredAmount.toFixed(2)),
        errorRatePct: Number((errorRate * 100).toFixed(3)),
      },
      issues,
      meta: {
        timezone: 'America/Sao_Paulo',
        thresholds: {
          degradedErrorRate: 0.5, // %
          downErrorRate: 5,        // %
          stuckPixWarn: 10,        // count
        },
        note: 'Pode ser pingado a cada 1-5min sem load. Critical checks: firestore, mercadoPago, firebaseAdmin, mercadoPagoWebhook.',
      },
    },
    {
      status: status === 'down' ? 503 : 200,
      headers: corsHeaders(req.headers.get('origin')),
    },
  );
}
