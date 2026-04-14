import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import webpush from 'web-push';
import { isAdminRequest } from '@/lib/admin-guard';

const VAPID_PUBLIC_KEY = 'BFVpYTPhsd-dbg4p-a09S3t1WoJIWw3ULVv6jpuGYWA5vsbB9ClFkl2Y64_QKSkt2evt9-kFHo9tb35W3oHM1HU';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  'mailto:contato@mycupid.com.br',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

export async function POST(req: NextRequest) {
  // Only admins can broadcast push notifications. Without this gate any visitor
  // could spam every subscriber in the database.
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { title, body, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const snap = await db.collection('push_subscriptions')
      .where('active', '==', true)
      .get();

    const payload = JSON.stringify({ title, body, url: url || 'https://mycupid.com.br' });

    let sent = 0;
    let failed = 0;

    const promises = snap.docs.map(async (doc) => {
      const sub = doc.data();
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
        );
        sent++;
      } catch (error: any) {
        failed++;
        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await doc.ref.update({ active: false });
        }
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, sent, failed, total: snap.size });
  } catch (error: any) {
    console.error('[Push Send] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
