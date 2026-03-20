import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export default async function GiftPage({ params }: { params: { token: string } }) {
  let isValid = false;

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('gift_tokens').doc(params.token).get();
    isValid = snap.exists && !snap.data()?.used;
  } catch (_) {}

  if (isValid) {
    redirect(`/criar/fazer-eu-mesmo?plan=avancado&new=true&gift=${params.token}`);
  }

  redirect('/criar/fazer-eu-mesmo?plan=avancado&new=true');
}
