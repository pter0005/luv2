'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { computeTotalForMarket } from '@/lib/price';
import { headers } from 'next/headers';
import { isMarket, marketFromRequest, type Market } from '@/i18n/config';

export interface IntentPriceResult {
  ok: boolean;
  total?: number;
  currency?: 'BRL' | 'USD' | 'EUR';
  market?: Market;
  status?: string;            // 'pending' | 'completed' | etc
  lovePageId?: string | null; // setado quando status === 'completed'
  error?: string;
}

const currencyForMarket: Record<Market, 'BRL' | 'USD' | 'EUR'> = {
  BR: 'BRL',
  PT: 'EUR',
  US: 'USD',
};

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

    // Resolução de market: prefere o que tá persistido no intent (fonte da
    // verdade desde o início do checkout); se ausente — caso comum quando
    // createOrUpdatePaymentIntent é chamado em useEffect SEM passar market —
    // deriva do request (host + geo + override). Currency legada (USD/EUR/BRL)
    // serve como fallback adicional pra intents pré-multimarket.
    let market: Market;
    if (isMarket(d.market)) {
      market = d.market;
    } else if (d.currency === 'EUR') {
      market = 'PT';
    } else if (d.currency === 'USD' || d.locale === 'en') {
      market = 'US';
    } else if (d.currency === 'BRL' || d.locale === 'pt') {
      market = 'BR';
    } else {
      try {
        const h = headers();
        market = marketFromRequest({
          host: h.get('host'),
          geoCountry: h.get('x-geo-country'),
          override: null,
        });
      } catch {
        market = 'BR';
      }
    }

    const total = computeTotalForMarket(input, market);
    return {
      ok: true,
      total,
      currency: currencyForMarket[market],
      market,
      status: (d.status as string) || 'pending',
      // lovePageId é setado pelo finalizeLovePage quando vira 'completed'.
      // Polling do client usa pra atalho: se já foi finalizado pelo webhook,
      // pula a query do MP API e vai direto pra tela de sucesso.
      lovePageId: (d.lovePageId as string) || null,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'server error' };
  }
}
