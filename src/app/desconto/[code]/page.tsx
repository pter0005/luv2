import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export default async function DescontoPage({ params }: { params: { code: string } }) {
  // URL pode chegar com emojis ou caracteres extras (admin renderiza
  // visualmente "🏷️CUPOM10🎁" mas o doc no Firestore é só CUPOM10).
  // Decode + strip de tudo que não for [A-Z0-9_-] antes de buscar.
  const raw = decodeURIComponent(params.code || '');
  const code = raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '').trim();
  let isValid = false;

  if (code) {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection('discount_codes').doc(code).get();
      if (snap.exists) {
        const d = snap.data()!;
        isValid = d.active && d.usedCount < d.maxUses;
      }
    } catch (_) {}
  }

  if (isValid) {
    redirect(`/chat?plan=avancado&new=true&discount=${code}`);
  }

  redirect('/chat?plan=avancado&new=true');
}
