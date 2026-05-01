import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import EditPageClient from './EditPageClient';
import { verifyEditToken } from './auth';

export const dynamic = 'force-dynamic';

function deepSerialize(v: any): any {
  if (v === null || v === undefined) return v;
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
  // Aceita 'vip' (chat) e 'avancado' (wizard /criar) — ambos são planos pagos
  // top-tier que dão direito a editar. Só 'basico' fica de fora.
  const editablePlans = new Set(['vip', 'avancado']);
  if (!data?.plan || !editablePlans.has(data.plan)) {
    redirect(`/p/${pageId}`);
  }

  const serialized = deepSerialize(data);

  // Verifica se já tem cookie de edição (email validado previamente). Se
  // sim, passa pro client em modo "liberado"; senão, cliente exibe modal
  // pedindo email antes de mostrar o form.
  const tokenCheck = await verifyEditToken(pageId);

  return (
    <EditPageClient
      pageId={pageId}
      initialData={serialized}
      ownerId={data?.userId || ''}
      pageEmailHint={maskEmail(data?.guestEmail || data?.ownerEmail || '')}
      preAuthorized={tokenCheck.ok}
    />
  );
}

// Mascara email pra mostrar uma dica no modal de verificação:
// "pedr***@gmail.com" — suficiente pra user lembrar sem vazar o email inteiro.
function maskEmail(raw: string): string {
  if (!raw || !raw.includes('@')) return '';
  const [local, domain] = raw.split('@');
  if (!local || !domain) return '';
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
