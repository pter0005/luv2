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
  let reason = 'unknown';

  console.log(`[desconto] raw="${params.code}" decoded="${raw}" cleaned="${code}"`);

  if (!code) {
    reason = 'empty_after_clean';
  } else {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection('discount_codes').doc(code).get();
      if (!snap.exists) {
        reason = 'doc_not_found';
        console.warn(`[desconto] doc '${code}' NÃO existe no Firestore`);
      } else {
        const d = snap.data()!;
        console.log(`[desconto] doc '${code}': active=${d.active} used=${d.usedCount}/${d.maxUses}`);
        if (!d.active) reason = 'inactive';
        else if ((d.usedCount ?? 0) >= (d.maxUses ?? 0)) reason = 'limit_reached';
        else { isValid = true; reason = 'ok'; }
      }
    } catch (e: any) {
      reason = `error:${e?.message}`;
      console.error(`[desconto] erro ao buscar code ${code}:`, e);
    }
  }

  console.log(`[desconto] resultado: isValid=${isValid} reason=${reason}`);

  if (isValid) {
    redirect(`/chat?plan=avancado&new=true&discount=${code}`);
  }

  redirect(`/chat?plan=avancado&new=true&_dbg=${reason}`);
}
