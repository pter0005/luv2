import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { isAdminRequest } from '@/lib/admin-guard';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: a real subscriber calls this once per device, so 5/min/IP
  // is generous and blocks anyone trying to flood push_subscriptions.
  const ip = getClientIp(req);
  const { ok } = rateLimit(`push-subscribe:${ip}`, 5, 60_000);
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  try {
    const subscription = await req.json();

    if (!subscription?.endpoint || typeof subscription.endpoint !== 'string') {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Use endpoint hash as doc ID to avoid duplicates
    const id = Buffer.from(subscription.endpoint).toString('base64url').slice(0, 40);

    // ⚠️ isAdmin flag is NEVER trusted from the client — it would let any
    // visitor flip themselves into receiving admin-only sales notifications.
    // Only set it if the request carries a valid admin session cookie.
    const clientClaimedAdmin = subscription.isAdmin === true;
    const realAdmin = clientClaimedAdmin && (await isAdminRequest());
    const { isAdmin: _, ...subData } = subscription;

    await db.collection('push_subscriptions').doc(id).set({
      ...subData,
      createdAt: Timestamp.now(),
      userAgent: req.headers.get('user-agent') || '',
      active: true,
      ...(realAdmin ? { isAdmin: true } : {}),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
