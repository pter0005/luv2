'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-action-guard';

export interface AbandonedCart {
  intentId: string;
  title: string;
  plan: string;
  whatsappNumber?: string;
  guestEmail?: string;
  ownerEmail?: string;
  createdAt: string;
  updatedAt: string;
  step?: string;
}

export interface RecentBuyer {
  pageId: string;
  title: string;
  plan: string;
  whatsappNumber?: string;
  ownerEmail?: string;
  createdAt: string;
}

function formatDate(ts: any): string {
  try {
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch { return '—'; }
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  await requireAdmin();
  const db = getAdminFirestore();
  const carts: AbandonedCart[] = [];

  try {
    // Get payment_intents that are still pending (not completed)
    const snap = await db.collection('payment_intents')
      .where('status', '==', 'pending')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      // Only include intents that have some content (not empty drafts)
      if (!d.title || d.title === 'Seu Título Aqui') continue;

      carts.push({
        intentId: doc.id,
        title: d.title || 'Sem título',
        plan: d.plan || 'basico',
        whatsappNumber: d.whatsappNumber || undefined,
        guestEmail: d.guestEmail || undefined,
        ownerEmail: d.payment?.payerEmail || d.guestEmail || undefined,
        createdAt: formatDate(d.createdAt),
        updatedAt: formatDate(d.updatedAt),
      });
    }
  } catch (e) {
    console.error('[WhatsApp Admin] Error fetching abandoned carts:', e);
  }

  return carts;
}

export async function getRecentBuyers(): Promise<RecentBuyer[]> {
  await requireAdmin();
  const db = getAdminFirestore();
  const buyers: RecentBuyer[] = [];

  try {
    const snap = await db.collection('lovepages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      buyers.push({
        pageId: doc.id,
        title: d.title || 'Sem título',
        plan: d.plan || 'basico',
        whatsappNumber: d.whatsappNumber || undefined,
        ownerEmail: d.ownerEmail || undefined,
        createdAt: formatDate(d.createdAt),
      });
    }
  } catch (e) {
    console.error('[WhatsApp Admin] Error fetching recent buyers:', e);
  }

  return buyers;
}

export async function markMessageSent(id: string, type: 'abandoned' | 'buyer', messageType: string) {
  await requireAdmin();
  const db = getAdminFirestore();
  const collection = type === 'abandoned' ? 'payment_intents' : 'lovepages';

  try {
    await db.collection(collection).doc(id).set({
      lastWhatsappMessage: {
        type: messageType,
        sentAt: Timestamp.now(),
      },
    }, { merge: true });
  } catch (e) {
    console.error('[WhatsApp Admin] Error marking message sent:', e);
  }
}
