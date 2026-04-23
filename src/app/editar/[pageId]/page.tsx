import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import EditPageClient from './EditPageClient';

export const dynamic = 'force-dynamic';

// Server-side pre-check: página existe e é VIP? Se não, redireciona pro /p/.
// A auth real (userId bate) acontece dentro do EditPageClient (precisa do user
// logado via Firebase Auth no client), mas já fazemos essa primeira filtragem
// pra não servir um form de edit inútil pra quem nunca vai poder submeter.
export default async function EditarPaginaPage({ params }: { params: { pageId: string } }) {
  const pageId = params.pageId;
  if (!pageId) redirect('/');

  const db = getAdminFirestore();
  const snap = await db.collection('lovepages').doc(pageId).get();
  if (!snap.exists) redirect('/');

  const data = snap.data();
  if (data?.plan !== 'vip') {
    // Não é VIP — redireciona pra página pública (usuário pode ver, não editar)
    redirect(`/p/${pageId}`);
  }

  // Serializa pro client. Timestamps viram ISO strings, o resto passa tal qual.
  // Campos pesados (galleryImages, timelineEvents) são passados porque o form
  // precisa deles pré-preenchidos. Firestore refs/funções são removidas por JSON.
  const serialized = JSON.parse(JSON.stringify(data, (_k, v) => {
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      return v.toDate().toISOString();
    }
    return v;
  }));

  return <EditPageClient pageId={pageId} initialData={serialized} ownerId={data?.userId || ''} />;
}
