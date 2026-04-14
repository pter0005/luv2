import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { logCriticalError } from '@/lib/log-critical-error';

// Public read of payment_intent status so the /criando-pagina screen can
// recover when the anonymous browser session that created the intent is lost
// (user paid PIX on a different device, cleared cookies, etc).
// Only exposes { status, lovePageId, plan } — never payer info or amount.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  // Polling every 3s = 20/min per tab. Cap at 120/min so multiple tabs or
  // a user behind shared NAT still work, but block scrapers hammering it.
  const { ok } = rateLimit(`intent-status:${ip}`, 120, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const intentId = req.nextUrl.searchParams.get('intentId');
  if (!intentId || typeof intentId !== 'string' || intentId.length > 128) {
    return NextResponse.json({ error: 'invalid_intent_id' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('payment_intents').doc(intentId).get();
    if (!snap.exists) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    const data = snap.data() || {};
    const rawPaid = Number(data.paidAmount);
    return NextResponse.json({
      found: true,
      status: data.status || null,
      lovePageId: data.lovePageId || null,
      plan: data.plan || null,
      paidAmount: isFinite(rawPaid) && rawPaid > 0 ? rawPaid : null,
    });
  } catch (err: any) {
    console.error('[PaymentIntentStatus] Error:', err?.message);
    // If this fails, EVERY user on /criando-pagina is stuck on the loader.
    // Notify admin immediately so they can investigate.
    logCriticalError('payment', `payment-intent-status falhou: ${err?.message || 'unknown'}`, {
      intentId,
      stack: err?.stack,
    }).catch(() => {});
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
