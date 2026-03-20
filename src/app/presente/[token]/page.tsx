import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export default async function GiftPage({ params }: { params: { token: string } }) {
  const db = getAdminFirestore();
  const snap = await db.collection('gift_tokens').doc(params.token).get();

  if (!snap.exists || snap.data()?.used) {
    redirect('/criar?plan=avancado&new=true');
  }

  // Redireciona para o wizard com o token na URL — o wizard salva no localStorage
  redirect(`/criar?plan=avancado&new=true&gift=${params.token}`);
}
