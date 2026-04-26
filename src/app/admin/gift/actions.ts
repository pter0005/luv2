'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/admin-action-guard';

export type GiftPlan = 'basico' | 'avancado' | 'vip';

export type GiftToken = {
  token: string;
  credits: number;
  plan: GiftPlan;
  used: boolean;
  usedAt?: string;
  usedByEmail?: string;
  note?: string;
  createdAt: string;
  url: string;
};

export async function createGiftToken(
  credits: number,
  note?: string,
  plan?: GiftPlan,
): Promise<{ success: boolean; token?: string; error?: string }> {
  await requireAdmin();
  const db = getAdminFirestore();
  const token = randomBytes(16).toString('hex');
  try {
    await db.collection('gift_tokens').doc(token).set({
      credits,
      plan: plan || 'avancado',
      used: false,
      note: note || '',
      createdAt: Timestamp.now(),
    });
    return { success: true, token };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllGiftTokens(): Promise<GiftToken[]> {
  await requireAdmin();
  const db = getAdminFirestore();
  const snap = await db.collection('gift_tokens').orderBy('createdAt', 'desc').limit(50).get();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mycupid.com.br').replace(/\/$/, '');
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      token: doc.id,
      credits: d.credits ?? 1,
      plan: (d.plan || 'avancado') as GiftPlan,
      used: d.used ?? false,
      usedAt: d.usedAt?.toDate?.()?.toISOString(),
      usedByEmail: d.claimedByEmail,
      note: d.note ?? '',
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
      url: `${baseUrl}/presente/${doc.id}`,
    };
  });
}

export async function deleteGiftToken(token: string): Promise<void> {
  await requireAdmin();
  const db = getAdminFirestore();
  await db.collection('gift_tokens').doc(token).delete();
}
