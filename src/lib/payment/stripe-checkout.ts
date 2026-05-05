'use server';

import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { computeTotalForMarket } from '@/lib/price';
import { getSiteConfigByMarket } from '@/lib/site-config';
import { isMarket, type Market } from '@/i18n/config';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sanitizeEmail = (v: string) =>
  v.normalize('NFKC').replace(/[​-‏‪-‮⁠﻿\s]/g, '').toLowerCase();

export interface StripeCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Stripe Checkout Session — parametrizado por market (US/PT).
 * - US: USD + card + Link
 * - PT: EUR + card + Multibanco (referência bancária instantânea, padrão em PT)
 * BR não passa por aqui (usa Mercado Pago).
 *
 * Webhook em /api/webhooks/stripe consome checkout.session.completed
 * e chama finalizeLovePage() — mesma pipeline que MP usa hoje.
 */
export async function createStripeCheckoutSession(
  intentId: string,
  clientClaimedTotal?: number,
  discountCode?: string | null,
  contact?: { phone?: string; email?: string } | null,
  market: Market = 'US',
): Promise<StripeCheckoutResult> {
  try {
    const stripe = getStripe();
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) return { success: false, error: 'Draft not found.' };

    const intentData = intentDoc.data() || {};

    // Market vem do request, mas se intent já tem persistido, intent vence
    // (fonte da verdade do checkout — evita bug se Header dropdown muda mid-flow).
    const resolvedMarket: Market = isMarket(intentData.market) ? intentData.market : market;
    if (resolvedMarket === 'BR') {
      return { success: false, error: 'BR market should use Mercado Pago, not Stripe.' };
    }

    const config = getSiteConfigByMarket(resolvedMarket);
    const stripeCurrency = config.currency.toLowerCase();
    const paymentMethods = (config.stripePaymentMethods || ['card']) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

    // Contact (email + phone)
    const contactPhone = (contact?.phone || '').replace(/\D/g, '').slice(0, 15);
    const contactEmail = sanitizeEmail(contact?.email || '').slice(0, 256);
    const docPhone = (intentData?.whatsappNumber || '').replace(/\D/g, '').slice(0, 15);
    const docEmail = sanitizeEmail(intentData?.guestEmail || intentData?.userEmail || '').slice(0, 256);

    // Phone validation per market: PT 9 díg / US 10 / BR fallback 10-11.
    // Sem isso, atacante podia enviar phone vazio/curto e Stripe rejeitava
    // a sessão DEPOIS de criar — gerava log de erro e UX ruim.
    const phoneMin = resolvedMarket === 'PT' ? 9 : resolvedMarket === 'US' ? 10 : 10;
    const phoneMax = resolvedMarket === 'PT' ? 9 : resolvedMarket === 'US' ? 11 : 13;
    const rawPhone = contactPhone.length >= phoneMin ? contactPhone : docPhone;
    if (rawPhone.length < phoneMin || rawPhone.length > phoneMax) {
      return { success: false, error: 'Phone required. Please enter a valid number before continuing.' };
    }

    const rawEmail = EMAIL_RE.test(contactEmail) ? contactEmail : docEmail;
    if (!EMAIL_RE.test(rawEmail)) {
      return { success: false, error: 'Email required. Please enter a valid email before continuing.' };
    }

    // Persiste contato + market no intent pra webhook saber
    await intentDoc.ref.set(
      {
        whatsappNumber: rawPhone,
        guestEmail: rawEmail,
        market: resolvedMarket,
        locale: resolvedMarket === 'US' ? 'en' : 'pt',
        currency: config.currency,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    // Total server-side (ignora client claim se divergir)
    // Aplica desconto se houver — server-side validado contra discount_codes
    // pra cliente não conseguir forjar desconto. Idempotente: se intent já
    // tem appliedDiscount de tentativa anterior, reusa ao invés de re-validar
    // (cupom já foi consumido, ficaria preso senão).
    let validatedDiscount = 0;
    const existingDiscount = Number(intentData?.appliedDiscount);
    if (isFinite(existingDiscount) && existingDiscount > 0) {
      validatedDiscount = existingDiscount;
    } else if (discountCode && typeof discountCode === 'string') {
      try {
        const codeNorm = discountCode.toUpperCase().trim();
        const discDoc = await db.collection('discount_codes').doc(codeNorm).get();
        if (discDoc.exists) {
          const dd = discDoc.data()!;
          const discValue = Number(dd.discount);
          const usedOk = (dd.usedCount ?? 0) < (dd.maxUses ?? 0);
          const emailOk = !Array.isArray(dd.usedEmails) || !dd.usedEmails.includes(rawEmail);
          if (dd.active && usedOk && emailOk && isFinite(discValue) && discValue > 0) {
            validatedDiscount = discValue;
            // Persiste no intent — finalize não re-cobra desconto duplicado e
            // intent-price.ts vê o valor canônico.
            await intentDoc.ref.set({ appliedDiscount: validatedDiscount, discountCode: codeNorm }, { merge: true });
          }
        }
      } catch (e: any) {
        console.warn('[stripe-checkout] discount validation failed:', e?.message);
      }
    }

    const serverTotal = computeTotalForMarket(
      {
        plan: intentData.plan,
        qrCodeDesign: intentData.qrCodeDesign,
        enableWordGame: intentData.enableWordGame,
        wordGameQuestions: intentData.wordGameQuestions,
        introType: intentData.introType,
        audioRecording: intentData.audioRecording,
        discountAmount: validatedDiscount,
      },
      resolvedMarket,
    );
    const total = Number(serverTotal.toFixed(2));

    if (clientClaimedTotal && Math.abs(clientClaimedTotal - total) > 0.01) {
      console.warn('[stripe-checkout] client/server total mismatch', {
        intentId, market: resolvedMarket, clientClaimedTotal, serverTotal: total,
      });
    }

    const { baseUrl } = config;
    const isEN = resolvedMarket === 'US';
    const planLabel = intentData.plan === 'vip'
      ? 'VIP'
      : intentData.plan === 'avancado'
        ? (isEN ? 'Advanced' : 'Avançado')
        : (isEN ? 'Basic' : 'Básico');
    const productName = intentData.plan === 'vip'
      ? 'MyCupid VIP bundle · love page'
      : `MyCupid ${planLabel} love page`;
    const productDescription = isEN
      ? 'Your personalized love page, ready to share.'
      : 'A tua página personalizada, pronta a partilhar.';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethods,
      customer_email: rawEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeCurrency,
            unit_amount: Math.round(total * 100), // cents
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
        },
      ],
      metadata: {
        intentId,
        userId: intentData.userId || '',
        plan: intentData.plan || 'basico',
        market: resolvedMarket,
        locale: isEN ? 'en' : 'pt',
      },
      success_url: `${baseUrl}/chat?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/chat?cancelled=1`,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      automatic_tax: { enabled: false },
      // Locale do checkout UI da Stripe (idioma dos botões/textos do hosted page).
      locale: isEN ? 'en' : 'pt',
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
