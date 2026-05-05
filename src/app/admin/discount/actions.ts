'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-action-guard';

export async function createDiscountCode(
  code: string,
  discount: number,
  maxUses: number,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const db = getAdminFirestore();
  const clean = code.toUpperCase().trim();

  // Validação rigorosa de input — sem isso, browser podia mandar string
  // ou NaN e Firestore aceitaria, gerando código sem discount válido.
  const discountNum = Number(discount);
  const maxUsesNum = Number(maxUses);
  if (!clean || clean.length > 40) return { success: false, error: 'Código inválido (1-40 chars).' };
  if (!isFinite(discountNum) || discountNum < 1 || discountNum > 1000) {
    return { success: false, error: 'Desconto deve ser entre R$1 e R$1000.' };
  }
  if (!isFinite(maxUsesNum) || maxUsesNum < 1 || maxUsesNum > 100000) {
    return { success: false, error: 'Limite de usos deve ser entre 1 e 100.000.' };
  }

  try {
    await db.collection('discount_codes').doc(clean).set({
      discount: discountNum,
      maxUses: maxUsesNum,
      usedCount: 0,
      usedEmails: [],
      active: true,
      createdAt: Timestamp.now(),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDiscountCodes() {
  await requireAdmin();
  const db = getAdminFirestore();
  const snap = await db.collection('discount_codes').orderBy('createdAt', 'desc').get();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mycupid.com.br').replace(/\/$/, '');
  return snap.docs.map(doc => {
    const d = doc.data();
    // discount/maxUses sem fallback de 10/90 — se doc não tem, mostra 0
    // pro admin VER que o código tá quebrado, em vez de mascarar com default.
    const discountVal = Number(d.discount);
    const maxUsesVal = Number(d.maxUses);
    return {
      code: doc.id,
      discount: isFinite(discountVal) && discountVal > 0 ? discountVal : 0,
      maxUses: isFinite(maxUsesVal) && maxUsesVal > 0 ? maxUsesVal : 0,
      usedCount: d.usedCount ?? 0,
      active: d.active ?? true,
      usedEmails: (d.usedEmails ?? []) as string[],
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
      url: `${baseUrl}/desconto/${doc.id}`,
    };
  });
}

export async function toggleDiscountCode(code: string, active: boolean): Promise<void> {
  await requireAdmin();
  const db = getAdminFirestore();
  await db.collection('discount_codes').doc(code).update({ active });
}

export async function deleteDiscountCode(code: string): Promise<void> {
  await requireAdmin();
  const db = getAdminFirestore();
  await db.collection('discount_codes').doc(code).delete();
}
