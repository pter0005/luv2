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
  try {
    await db.collection('discount_codes').doc(clean).set({
      discount,
      maxUses,
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
    return {
      code: doc.id,
      discount: d.discount ?? 10,
      maxUses: d.maxUses ?? 90,
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
