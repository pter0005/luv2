'use server';

import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { computeTotalUSD } from '@/lib/price';
import { getSiteConfig } from '@/lib/site-config';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sanitizeEmail = (v: string) =>
  v.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\s]/g, '').toLowerCase();

export interface StripeCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Cria uma Stripe Checkout Session em USD para o intent dado.
 * Simétrica ao processPixPayment / createMercadoPagoCardSession
 * (mesmo padrão de retorno, mesma validação de contato).
 *
 * O webhook em /api/webhooks/stripe consome checkout.session.completed
 * e chama finalizeLovePage() — mesma pipeline que MP usa hoje.
 */
export async function createStripeCheckoutSession(
  intentId: string,
  clientClaimedTotalUSD?: number,
  discountCode?: string | null,
  contact?: { phone?: string; email?: string } | null,
): Promise<StripeCheckoutResult> {
  try {
    const stripe = getStripe();
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) return { success: false, error: 'Draft not found.' };

    const intentData = intentDoc.data() || {};

    // Contact (email + phone) — mesma sanitização que MP
    const contactPhone = (contact?.phone || '').replace(/\D/g, '');
    const contactEmail = sanitizeEmail(contact?.email || '');
    const docPhone = (intentData?.whatsappNumber || '').replace(/\D/g, '');
    const docEmail = sanitizeEmail(intentData?.guestEmail || intentData?.userEmail || '');

    const rawPhone = contactPhone.length >= 10 ? contactPhone : docPhone;
    if (rawPhone.length < 10) {
      return { success: false, error: 'Phone required. Please enter a valid number before continuing.' };
    }

    const rawEmail = EMAIL_RE.test(contactEmail) ? contactEmail : docEmail;
    if (!EMAIL_RE.test(rawEmail)) {
      return { success: false, error: 'Email required. Please enter a valid email before continuing.' };
    }

    // Persiste contato + locale no intent pra webhook saber
    await intentDoc.ref.set(
      {
        whatsappNumber: rawPhone,
        guestEmail: rawEmail,
        locale: 'en',
        currency: 'USD',
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    // Total server-side (ignora client claim se divergir)
    const serverTotal = computeTotalUSD({
      plan: intentData.plan,
      qrCodeDesign: intentData.qrCodeDesign,
      enableWordGame: intentData.enableWordGame,
      wordGameQuestions: intentData.wordGameQuestions,
      introType: intentData.introType,
      audioRecording: intentData.audioRecording,
      discountAmount: 0, // TODO: validar código de desconto USD se for suportar
    });
    const total = Number(serverTotal.toFixed(2));

    if (clientClaimedTotalUSD && Math.abs(clientClaimedTotalUSD - total) > 0.01) {
      console.warn('[stripe-checkout] client/server total mismatch', {
        intentId, clientClaimedTotalUSD, serverTotal: total,
      });
    }

    const { baseUrl } = getSiteConfig('en');
    const planLabel = intentData.plan === 'vip' ? 'VIP' : intentData.plan === 'avancado' ? 'Advanced' : 'Basic';
    const productName = intentData.plan === 'vip'
      ? 'MyCupid VIP bundle · love page'
      : `MyCupid ${planLabel} love page`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: rawEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(total * 100), // cents
            product_data: {
              name: productName,
              description: 'Your personalized love page, ready to share.',
            },
          },
        },
      ],
      metadata: {
        intentId,
        userId: intentData.userId || '',
        plan: intentData.plan || 'basico',
        locale: 'en',
      },
      success_url: `${baseUrl}/chat?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/chat?cancelled=1`,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      // Auto tax — dono precisa ativar Stripe Tax no dashboard. Sem risco se não ativar.
      automatic_tax: { enabled: false },
    });

    if (!session.url) {
      return { success: false, error: 'Failed to create checkout session.' };
    }

    return { success: true, url: session.url };
  } catch (err: any) {
    console.error('[stripe-checkout] error:', err?.message, err?.code);
    return { success: false, error: err?.message || 'Stripe error.' };
  }
}
