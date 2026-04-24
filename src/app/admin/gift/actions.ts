'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';
import { requireAdmin } from '@/lib/admin-action-guard';

export type GiftToken = {
  token: string;
  credits: number;
  used: boolean;
  usedAt?: string;
  note?: string;
  createdAt: string;
  url: string;
};

export async function createGiftToken(
  credits: number,
  note?: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  await requireAdmin();
  const db = getAdminFirestore();
  const token = randomBytes(16).toString('hex');
  try {
    await db.collection('gift_tokens').doc(token).set({
      credits,
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
      used: d.used ?? false,
      usedAt: d.usedAt?.toDate?.()?.toISOString(),
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
