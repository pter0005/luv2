'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export type CreditEntry = {
  email: string;
  uid?: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
  lastUsedPageId?: string;
};

// ── Busca todos os créditos ──────────────────
export async function getAllCredits(): Promise<CreditEntry[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('user_credits').orderBy('updatedAt', 'desc').get();
  return snap.docs.map(doc => {
    const d = doc.data();
    const total = d.totalCredits ?? 0;
    const used = d.usedCredits ?? 0;
    return {
      email: doc.id,
      uid: d.uid,
      totalCredits: total,
      usedCredits: used,
      availableCredits: Math.max(0, total - used),
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? '',
      note: d.note ?? '',
      lastUsedPageId: d.lastUsedPageId,
    };
  });
}

// ── Adiciona créditos (incremental) ──────────
export async function addCredits(
  email: string,
  credits: number,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || credits < 1) return { success: false, error: 'Email ou créditos inválidos.' };

  const db = getAdminFirestore();
  const emailClean = email.toLowerCase().trim();
  const ref = db.collection('user_credits').doc(emailClean);

  try {
    let uid: string | undefined;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUserByEmail(emailClean);
      uid = userRecord.uid;
    } catch {
      // Usuário ainda não tem conta, tudo bem
    }

    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        totalCredits: FieldValue.increment(credits),
        updatedAt: Timestamp.now(),
        ...(uid && { uid }),
        ...(note && { note }),
      });
    } else {
      await ref.set({
        email: emailClean,
        totalCredits: credits,
        usedCredits: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(uid && { uid }),
        ...(note && { note }),
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Define valor exato de créditos ──────────
export async function setTotalCredits(
  email: string,
  totalCredits: number,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || totalCredits < 0) return { success: false, error: 'Dados inválidos.' };

  const db = getAdminFirestore();
  const emailClean = email.toLowerCase().trim();
  const ref = db.collection('user_credits').doc(emailClean);

  try {
    let uid: string | undefined;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUserByEmail(emailClean);
      uid = userRecord.uid;
    } catch {}

    await ref.set({
      email: emailClean,
      totalCredits,
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      ...(uid && { uid }),
      ...(note && { note }),
    }, { merge: true });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Remove usuário dos créditos ──────────────
export async function removeUserCredits(email: string): Promise<{ success: boolean; error?: string }> {
  const db = getAdminFirestore();
  try {
    await db.collection('user_credits').doc(email.toLowerCase().trim()).delete();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
