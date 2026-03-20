import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export default async function GiftPage({ params }: { params: { token: string } }) {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('gift_tokens').doc(params.token).get();

    if (snap.exists && !snap.data()?.used) {
      redirect(`/criar/fazer-eu-mesmo?plan=avancado&new=true&gift=${params.token}`);
    }
  } catch (_) {}

  redirect('/criar/fazer-eu-mesmo?plan=avancado&new=true');
}
