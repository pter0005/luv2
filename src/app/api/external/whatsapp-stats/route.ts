import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import { checkStatus } from '@/services/zapi/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/whatsapp-stats
 *
 * Stats das mensagens WhatsApp via Z-API. Usado pelo seu sistema externo
 * pra monitorar saúde do envio (taxa de erro, recovery rate, conexão).
 *
 * Response:
 *   today: confirmações + 3 stages de recovery
 *   week:  últimos 7 dias agregados
 *   zapi:  status da conexão Z-API (connected, smartphone)
 *   mothersDay: dias até MOTHERS_DAY_DATE (pra UI saber se mostra contador)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  try {
    const db = getAdminFirestore();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const dayTs = Timestamp.fromDate(startOfDay);
    const weekTs = Timestamp.fromDate(sevenDaysAgo);

    // Today counts (5 paralelas)
    const [
      confirmToday,
      r5minToday,
      r1hToday,
      r24hToday,
      confirmWeek,
      r5minWeek,
      r1hWeek,
      r24hWeek,
    ] = await Promise.all([
      db.collection('payment_intents').where('confirmationSentAt', '>=', dayTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery5minSentAt', '>=', dayTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery1hSentAt', '>=', dayTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery24hSentAt', '>=', dayTs).count().get().catch(() => null),
      db.collection('payment_intents').where('confirmationSentAt', '>=', weekTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery5minSentAt', '>=', weekTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery1hSentAt', '>=', weekTs).count().get().catch(() => null),
      db.collection('payment_intents').where('recovery24hSentAt', '>=', weekTs).count().get().catch(() => null),
    ]);

    // Conta failures (todas falhas registradas hoje)
    const [confirmFailedToday] = await Promise.all([
      db.collection('payment_intents')
        .where('confirmationStatus', '==', 'failed')
        .count().get().catch(() => null),
    ]);

    // Z-API status
    const zapiStatus = await checkStatus();

    // Mother's Day countdown
    const dateStr = process.env.MOTHERS_DAY_DATE || '2026-05-10';
    const target = new Date(dateStr + 'T00:00:00-03:00');
    const daysToMothersDay = isNaN(target.getTime())
      ? null
      : Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        today: {
          confirmations: confirmToday?.data().count ?? 0,
          recovery5min: r5minToday?.data().count ?? 0,
          recovery1h: r1hToday?.data().count ?? 0,
          recovery24h: r24hToday?.data().count ?? 0,
        },
        week: {
          confirmations: confirmWeek?.data().count ?? 0,
          recovery5min: r5minWeek?.data().count ?? 0,
          recovery1h: r1hWeek?.data().count ?? 0,
          recovery24h: r24hWeek?.data().count ?? 0,
        },
        failures: {
          confirmationFailedTotal: confirmFailedToday?.data().count ?? 0,
        },
        zapi: {
          enabled: process.env.ZAPI_ENABLED === 'true',
          configured: !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN && process.env.ZAPI_CLIENT_TOKEN),
          connected: zapiStatus.connected,
          smartphoneConnected: zapiStatus.smartphoneConnected ?? null,
          error: zapiStatus.error || null,
        },
        flags: {
          orderConfirmationEnabled: process.env.ORDER_CONFIRMATION_ENABLED === 'true',
          recoveryEnabled: process.env.RECOVERY_ENABLED === 'true',
          recoveryDailyCap: parseInt(process.env.RECOVERY_DAILY_CAP || '100', 10),
        },
        mothersDay: {
          targetDate: dateStr,
          daysAway: daysToMothersDay,
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/whatsapp-stats] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
