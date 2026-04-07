import { getAdminFirestore } from '@/lib/firebase/admin/config';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BFVpYTPhsd-dbg4p-a09S3t1WoJIWw3ULVv6jpuGYWA5vsbB9ClFkl2Y64_QKSkt2evt9-kFHo9tb35W3oHM1HU';

export async function notifyAdmins(title: string, body: string, url?: string) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('[notifyAdmins] VAPID_PRIVATE_KEY not set, skipping');
    return;
  }

  webpush.setVapidDetails('mailto:contato@mycupid.com.br', VAPID_PUBLIC_KEY, privateKey);

  const db = getAdminFirestore();
  const snap = await db.collection('push_subscriptions')
    .where('active', '==', true)
    .where('isAdmin', '==', true)
    .get();

  if (snap.empty) return;

  const payload = JSON.stringify({
    title,
    body,
    url: url || 'https://mycupid.com.br/admin',
  });

  const promises = snap.docs.map(async (doc) => {
    const sub = doc.data();
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await doc.ref.update({ active: false });
      }
    }
  });

  await Promise.allSettled(promises);
}
