import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export default async function DescontoPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  let isValid = false;

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('discount_codes').doc(code).get();
    if (snap.exists) {
      const d = snap.data()!;
      isValid = d.active && d.usedCount < d.maxUses;
    }
  } catch (_) {}

  if (isValid) {
    redirect(`/chat?plan=avancado&new=true&discount=${code}`);
  }

  redirect('/chat?plan=avancado&new=true');
}
