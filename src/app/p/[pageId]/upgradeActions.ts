'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { logCriticalError } from '@/lib/log-critical-error';
import Stripe from 'stripe';

const UPGRADE_PRICE = 9.99;
const UPGRADE_PRICE_USD = 2.99;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getClientIp(): string {
  try {
    const h = headers();
    return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  } catch { return 'unknown'; }
}

export async function createUpgradePayment(pageId: string, email: string): Promise<
  { qrCode: string; qrCodeBase64: string; paymentId: string } | { error: string }
> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { error: 'Pagamento não configurado.' };

  // Rate limit: 5 gerações PIX por IP por minuto. Evita spam que pode derrubar
  // a conta no antifraude do MP — cada PIX gerado conta como "transação
  // iniciada" mesmo se ninguém pagar.
  const ip = getClientIp();
  if (!rateLimit(`upgrade-pix:${ip}`, 5, 60_000).ok) {
    return { error: 'Muitas tentativas. Espere 1 minuto.' };
  }

  // Valida email server-side (o frontend valida mas cliente pode fazer bypass)
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return { error: 'Email inválido.' };

  try {
    const db = getAdminFirestore();
    const pageSnap = await db.collection('lovepages').doc(pageId).get();
    if (!pageSnap.exists) return { error: 'Página não encontrada.' };
    if (pageSnap.data()?.plan === 'avancado' && !pageSnap.data()?.expireAt) {
      return { error: 'Página já é permanente.' };
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: UPGRADE_PRICE,
        description: 'MyCupid — Upgrade para Permanente',
        payment_method_id: 'pix',
        payer: {
          email: cleanEmail,
          first_name: 'Cliente',
          last_name: 'MyCupid',
          identification: { type: 'CPF', number: '19100000000' },
        },
        external_reference: `upgrade_${pageId}`,
      },
    });

    const data = result as any;
    const tx = data.point_of_interaction?.transaction_data;
    if (tx?.qr_code && tx?.qr_code_base64 && data.id) {
      return { qrCode: tx.qr_code, qrCodeBase64: tx.qr_code_base64, paymentId: String(data.id) };
    }
    return { error: 'Erro ao gerar PIX.' };
  } catch (e: any) {
    return { error: e.message || 'Erro inesperado.' };
  }
}

export async function verifyUpgradePayment(
  pageId: string,
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { success: false, error: 'Token não configurado.' };

  // Rate limit: polling legítimo é ~1 chamada a cada 5s (= 12/min). Cap em 60
  // cobre polling + retries. Previne brute-force de paymentIds.
  const ip = getClientIp();
  if (!rateLimit(`upgrade-verify:${ip}`, 60, 60_000).ok) {
    return { success: false, error: 'Muitas tentativas.' };
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);
    const info = await payment.get({ id: paymentId }) as any;

    if (info.status !== 'approved') return { success: false };

    // ── VALIDAÇÃO CRÍTICA ─────────────────────────────────────────────────
    // Sem isso, qualquer atacante com acesso a QUALQUER paymentId aprovado
    // da MP (seu ou de terceiro) poderia upgradar páginas alheias grátis.
    // O external_reference é fixado pelo createUpgradePayment com formato
    // "upgrade_{pageId}" e é imutável pelo cliente — amarra a prova de
    // pagamento à página específica.
    const expectedRef = `upgrade_${pageId}`;
    if (info.external_reference !== expectedRef) {
      logCriticalError('payment', 'verifyUpgradePayment: external_reference mismatch', {
        pageId,
        paymentId,
        received: info.external_reference,
        expected: expectedRef,
        ip,
      }).catch(() => {});
      return { success: false, error: 'Pagamento não corresponde a esta página.' };
    }

    // Valida valor também — proteção extra (atacante com payment aprovado de
    // R$1 centavo não consegue upgradar página).
    const amount = Number(info.transaction_amount);
    if (!isFinite(amount) || amount < UPGRADE_PRICE - 0.01) {
      logCriticalError('payment', 'verifyUpgradePayment: amount mismatch', {
        pageId, paymentId, amount, expected: UPGRADE_PRICE, ip,
      }).catch(() => {});
      return { success: false, error: 'Valor do pagamento incorreto.' };
    }

    return await applyUpgrade(pageId, paymentId);
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createUpgradeStripeSession(
  pageId: string,
  email: string,
): Promise<{ url: string } | { error: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: 'Stripe not configured.' };

  const ip = getClientIp();
  if (!rateLimit(`upgrade-stripe:${ip}`, 5, 60_000).ok) {
    return { error: 'Too many attempts. Wait 1 minute.' };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return { error: 'Invalid email.' };

  try {
    const db = getAdminFirestore();
    const pageSnap = await db.collection('lovepages').doc(pageId).get();
    if (!pageSnap.exists) return { error: 'Page not found.' };
    if (pageSnap.data()?.plan === 'avancado' && !pageSnap.data()?.expireAt) {
      return { error: 'Page is already permanent.' };
    }

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const origin = headers().get('origin') || 'https://mycupid.net';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: cleanEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(UPGRADE_PRICE_USD * 100),
          product_data: {
            name: 'MyCupid — Permanent upgrade',
            description: 'Keep your love page online forever.',
          },
        },
      }],
      metadata: { pageId, type: 'upgrade' },
      success_url: `${origin}/p/${pageId}?upgraded=1`,
      cancel_url: `${origin}/p/${pageId}`,
    });

    if (!session.url) return { error: 'Failed to create checkout.' };
    return { url: session.url };
  } catch (e: any) {
    return { error: e.message || 'Stripe error.' };
  }
}

// Shared upgrade-apply logic with idempotency. Called from both client-side
// polling (verifyUpgradePayment) and the MP webhook. Safe to call multiple
// times for the same pageId — if already upgraded, it no-ops.
export async function applyUpgrade(
  pageId: string,
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminFirestore();
    const ref = db.collection('lovepages').doc(pageId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: 'Página não encontrada.' };

    const data = snap.data() || {};
    // Idempotency: if already upgraded to permanente, skip the write so we
    // don't overwrite upgradedAt on every webhook retry.
    if (data.plan === 'avancado' && !data.expireAt) {
      return { success: true };
    }

    await ref.update({
      plan: 'avancado',
      expireAt: FieldValue.delete(),
      upgradedAt: new Date(),
      upgradePaymentId: paymentId,
    });
    return { success: true };
  } catch (e: any) {
    logCriticalError('payment', 'applyUpgrade failed', {
      pageId, paymentId, error: e?.message,
    }).catch(() => {});
    return { success: false, error: e.message };
  }
}
