import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import GiftReveal from './GiftReveal';

export const dynamic = 'force-dynamic';

export default async function GiftPage({ params }: { params: { token: string } }) {
  let credits = 0;
  let plan = 'avancado';
  let isValid = false;

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('gift_tokens').doc(params.token).get();
    if (snap.exists && !snap.data()?.used) {
      isValid = true;
      credits = snap.data()?.credits ?? 1;
      plan = snap.data()?.plan || 'avancado';
    }
  } catch (_) {}

  if (!isValid) {
    redirect('/chat?plan=avancado&new=true');
  }

  return <GiftReveal token={params.token} credits={credits} plan={plan} />;
}
