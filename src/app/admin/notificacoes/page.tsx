import NotificacoesClient from './NotificacoesClient';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

async function getStats() {
  const db = getAdminFirestore();
  let total = 0;
  let active = 0;

  try {
    const snap = await db.collection('push_subscriptions').get();
    total = snap.size;
    snap.forEach(doc => {
      if (doc.data().active) active++;
    });
  } catch (e) {
    console.error('[Notificacoes] Error:', e);
  }

  return { total, active };
}

export default async function NotificacoesPage() {
  const stats = await getStats();
  return <NotificacoesClient {...stats} />;
}
