'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { computeTotalBRL, computeTotalUSD } from '@/lib/price';
import { headers } from 'next/headers';
import { localeFromHost } from '@/i18n/config';

export interface IntentPriceResult {
  ok: boolean;
  total?: number;
  currency?: 'BRL' | 'USD';
  error?: string;
}

/**
 * Canonical price for an intent — what the server WILL charge if the user
 * clicks "pay now". PaymentField renders this value, so the total shown to
 * the user can never diverge from the amount processPixPayment/Stripe will
 * actually request. Kills the "O valor mudou desde que você começou" error
 * at the root: if client and server agree, there's no mismatch to refuse.
 */
export async function getIntentServerPrice(intentId: string): Promise<IntentPriceResult> {
  if (!intentId) return { ok: false, error: 'missing intent' };
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('payment_intents').doc(intentId).get();
    if (!snap.exists) return { ok: false, error: 'not found' };
    const d = snap.data() || {};

    const input = {
      plan: d.plan,
      qrCodeDesign: d.qrCodeDesign,
      enableWordGame: d.enableWordGame,
      wordGameQuestions: d.wordGameQuestions,
      introType: d.introType,
      audioRecording: d.audioRecording,
      discountAmount: Number(d.appliedDiscount) || 0,
    };

    // BUG ANTERIOR: se intent não tinha d.locale nem d.currency setado
    // (cenário comum: createOrUpdatePaymentIntent é chamado em useEffect
    // SEM passar locale, só preenchidos no handlePix/handleStripe DEPOIS),
    // isEN caía pra false → calculava em BRL pra usuário US → cliente
    // formatava esse número como USD = "$34.99 sendo R$ 34,99 mascarado".
    // Fallback: lê o host do request e infere locale corretamente.
    let isEN = d.locale === 'en' || d.currency === 'USD';
    if (!d.locale && !d.currency) {
      try {
        const host = headers().get('host');
        isEN = localeFromHost(host) === 'en';
      } catch { /* fora de request context — segue com isEN=false */ }
    }
    const total = isEN ? computeTotalUSD(input) : computeTotalBRL(input);
    return { ok: true, total, currency: isEN ? 'USD' : 'BRL' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'server error' };
  }
}
