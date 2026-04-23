import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import EditPageClient from './EditPageClient';

export const dynamic = 'force-dynamic';

// Serialização profunda tratando Firestore Timestamps. O JSON.stringify nativo
// chama toJSON() do Timestamp antes do replacer, produzindo {seconds,nanoseconds}
// que quebra o revive no cliente. Aqui convertemos pra ISO string ANTES do stringify.
function deepSerialize(v: any): any {
  if (v === null || v === undefined) return v;
  // Firestore Timestamp (tem seconds + nanoseconds OU _seconds/_nanoseconds)
  if (typeof v === 'object') {
    if (typeof (v as any).toDate === 'function') {
      try { return (v as any).toDate().toISOString(); } catch { return null; }
    }
    if (typeof (v as any).seconds === 'number' && typeof (v as any).nanoseconds === 'number') {
      try { return new Date((v as any).seconds * 1000 + (v as any).nanoseconds / 1e6).toISOString(); } catch { return null; }
    }
    if (typeof (v as any)._seconds === 'number') {
      try { return new Date((v as any)._seconds * 1000).toISOString(); } catch { return null; }
    }
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(deepSerialize);
    const out: Record<string, any> = {};
    for (const k in v) {
      if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = deepSerialize((v as any)[k]);
    }
    return out;
  }
  return v;
}

export default async function EditarPaginaPage({ params }: { params: { pageId: string } }) {
  const pageId = params.pageId;
  if (!pageId) redirect('/');

  const db = getAdminFirestore();
  const snap = await db.collection('lovepages').doc(pageId).get();
  if (!snap.exists) redirect('/');

  const data = snap.data();
  if (data?.plan !== 'vip') {
    redirect(`/p/${pageId}`);
  }

  const serialized = deepSerialize(data);

  return <EditPageClient pageId={pageId} initialData={serialized} ownerId={data?.userId || ''} />;
}
