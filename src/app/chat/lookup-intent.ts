'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';

export interface IntentLookupResult {
  exists: boolean;
  status?: 'pending' | 'completed' | string;
  pageId?: string;
}

/**
 * Consulta o estado de um payment_intent. Usado quando o ChatWizardClient
 * monta — se o usuário já pagou (ou a página já foi finalizada por webhook),
 * mostramos direto a tela "sua página tá pronta" em vez de deixar ele
 * preenchendo o wizard de novo ou ficar sem o link.
 */
export async function lookupIntentStatus(intentId: string): Promise<IntentLookupResult> {
  if (!intentId) return { exists: false };

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('payment_intents').doc(intentId).get();
    if (!snap.exists) return { exists: false };
    const data = snap.data() || {};
    return {
      exists: true,
      status: data.status,
      pageId: data.lovePageId || data.pageId || undefined,
    };
  } catch (err) {
    return { exists: false };
  }
}
