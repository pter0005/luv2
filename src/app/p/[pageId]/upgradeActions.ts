'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { FieldValue } from 'firebase-admin/firestore';

const UPGRADE_PRICE = 9.99;

export async function createUpgradePayment(pageId: string, email: string): Promise<
  { qrCode: string; qrCodeBase64: string; paymentId: string } | { error: string }
> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { error: 'Pagamento não configurado.' };

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
          email: email || 'upgrade@mycupid.com.br',
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

  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);
    const info = await payment.get({ id: paymentId }) as any;

    if (info.status !== 'approved') return { success: false };

    return await applyUpgrade(pageId, paymentId);
  } catch (e: any) {
    return { success: false, error: e.message };
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
    return { success: false, error: e.message };
  }
}
