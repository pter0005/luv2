'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { computeTotalBRL } from '@/lib/price';

export type MpCardResult =
  | { success: true; url: string; preferenceId: string }
  | { success: false; error: string };

/**
 * Cria uma preferência de pagamento no Mercado Pago (checkout hospedado)
 * com cartão de crédito/débito. Retorna a URL pra redirecionar.
 *
 * Preço é recomputado server-side a partir do intentId — cliente não
 * controla o valor cobrado.
 */
export async function createMercadoPagoCardSession(
  intentId: string,
  domain: string,
  contact?: { whatsapp?: string; email?: string } | null,
  // Device ID do MP SDK (X-meli-session-id) — fingerprint do device pra
  // anti-fraude. Sem ele, score MP cai e mais transações são bloqueadas.
  deviceId?: string | null,
): Promise<MpCardResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { success: false, error: 'Mercado Pago não configurado.' };

  try {
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) return { success: false, error: 'Rascunho não encontrado.' };

    const intent = intentDoc.data() || {};
    const contactEmail = (contact?.email || '').trim().toLowerCase();
    const contactWhatsapp = (contact?.whatsapp || '').replace(/\D/g, '');
    const docEmail = (intent.guestEmail || intent.userEmail || '').trim().toLowerCase();
    const docWhatsapp = (intent.whatsappNumber || '').replace(/\D/g, '');

    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ? contactEmail : docEmail;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Email obrigatório. Preencha um email válido.' };
    }
    const whatsapp = contactWhatsapp.length >= 10 ? contactWhatsapp : docWhatsapp;
    if (whatsapp.length < 10) {
      return { success: false, error: 'WhatsApp obrigatório com DDD.' };
    }

    // Persiste contact no intent se veio novo
    if (contactWhatsapp.length >= 10 && contactWhatsapp !== docWhatsapp) {
      await intentDoc.ref.set({ whatsappNumber: contactWhatsapp }, { merge: true });
    }
    if (contactEmail && contactEmail !== docEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      await intentDoc.ref.set({ guestEmail: contactEmail }, { merge: true });
    }

    // Preço server-trusted
    const amount = Number(
      computeTotalBRL({
        plan: intent.plan,
        qrCodeDesign: intent.qrCodeDesign,
        enableWordGame: intent.enableWordGame,
        wordGameQuestions: intent.wordGameQuestions,
        introType: intent.introType,
        audioRecording: intent.audioRecording,
      }).toFixed(2)
    );
    if (!amount || amount < 1 || isNaN(amount)) {
      return { success: false, error: `Valor inválido: R$${amount}.` };
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const safeDomain = domain.replace(/\/$/, '');
    const planLabel = intent.plan === 'vip' ? 'VIP' : intent.plan === 'avancado' ? 'Avançado' : 'Básico';

    // SDK MP aceita meliSessionId em Options — vai como header pra anti-fraude.
    const safeDeviceId = deviceId && deviceId.length > 4 && deviceId.length < 200 ? deviceId : null;

    const prefArgs: any = {
      body: {
        items: [
          {
            id: intentId,
            title: `MyCupid — Plano ${planLabel}`,
            description: 'Página de amor personalizada · acesso vitalício',
            // category_id ajuda o motor de risco MP a entender o tipo de
            // produto. 'services' é o canônico pra produto digital/serviço.
            category_id: 'services',
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email,
        },
        payment_methods: {
          // Exclui PIX no checkout do MP (já temos fluxo PIX próprio)
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'bank_transfer' }],
          installments: 12,
        },
        back_urls: {
          success: `${safeDomain}/chat/pagamento?status=approved&intent=${intentId}`,
          failure: `${safeDomain}/chat/pagamento?status=rejected&intent=${intentId}`,
          pending: `${safeDomain}/chat/pagamento?status=pending&intent=${intentId}`,
        },
        auto_return: 'approved',
        external_reference: intentId,
        statement_descriptor: 'MYCUPID',
        notification_url: `${safeDomain}/api/webhooks/mercadopago`,
      },
    };
    if (safeDeviceId) {
      prefArgs.requestOptions = { meliSessionId: safeDeviceId };
    }
    const pref = await preference.create(prefArgs);

    const url = pref.init_point || pref.sandbox_init_point;
    if (!url || !pref.id) {
      return { success: false, error: 'Mercado Pago não retornou URL de checkout.' };
    }

    await db.collection('payment_intents').doc(intentId).update({
      mpPreferenceId: pref.id,
      status: 'waiting_card_payment',
      updatedAt: Timestamp.now(),
    });

    return { success: true, url, preferenceId: pref.id };
  } catch (err: any) {
    console.error('[MP Card] erro:', err?.message);
    return { success: false, error: err?.message || 'Erro ao criar checkout de cartão.' };
  }
}

export type MpDryRunReport = {
  ok: boolean;
  amount?: number;
  email?: string;
  whatsapp?: string;
  plan?: string;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  notificationUrl?: string;
  backUrls?: { success: string; failure: string; pending: string };
  error?: string;
  errorDetail?: string;
  tokenConfigured: boolean;
};

/**
 * Admin-only: roda o fluxo REAL de criação de preference no Mercado Pago
 * pra verificar que tudo funciona ponta-a-ponta. Retorna um relatório
 * detalhado em vez de redirecionar — assim dá pra inspecionar antes
 * de soltar pro cliente.
 */
export async function dryRunMercadoPagoCardSession(
  intentId: string,
  domain: string,
  contact?: { whatsapp?: string; email?: string } | null
): Promise<MpDryRunReport> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const tokenConfigured = !!token;
  if (!token) {
    return {
      ok: false,
      tokenConfigured: false,
      error: 'MERCADO_PAGO_ACCESS_TOKEN ausente no ambiente.',
    };
  }

  try {
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) {
      return { ok: false, tokenConfigured, error: 'Rascunho não encontrado.' };
    }

    const intent = intentDoc.data() || {};
    const contactEmail = (contact?.email || '').trim().toLowerCase();
    const contactWhatsapp = (contact?.whatsapp || '').replace(/\D/g, '');
    const docEmail = (intent.guestEmail || intent.userEmail || '').trim().toLowerCase();
    const docWhatsapp = (intent.whatsappNumber || '').replace(/\D/g, '');
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ? contactEmail : docEmail;
    const whatsapp = contactWhatsapp.length >= 10 ? contactWhatsapp : docWhatsapp;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, tokenConfigured, email, error: 'Email inválido no intent.' };
    }
    if (whatsapp.length < 10) {
      return { ok: false, tokenConfigured, email, whatsapp, error: 'WhatsApp inválido.' };
    }

    const amount = Number(
      computeTotalBRL({
        plan: intent.plan,
        qrCodeDesign: intent.qrCodeDesign,
        enableWordGame: intent.enableWordGame,
        wordGameQuestions: intent.wordGameQuestions,
        introType: intent.introType,
        audioRecording: intent.audioRecording,
      }).toFixed(2)
    );
    if (!amount || amount < 1 || isNaN(amount)) {
      return { ok: false, tokenConfigured, email, whatsapp, error: `Valor inválido: R$${amount}.` };
    }

    const safeDomain = domain.replace(/\/$/, '');
    const planLabel = intent.plan === 'vip' ? 'VIP' : intent.plan === 'avancado' ? 'Avançado' : 'Básico';
    const backUrls = {
      success: `${safeDomain}/chat/pagamento?status=approved&intent=${intentId}`,
      failure: `${safeDomain}/chat/pagamento?status=rejected&intent=${intentId}`,
      pending: `${safeDomain}/chat/pagamento?status=pending&intent=${intentId}`,
    };
    const notificationUrl = `${safeDomain}/api/webhooks/mercadopago`;

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items: [
          {
            id: intentId,
            title: `MyCupid — Plano ${planLabel} (TESTE)`,
            description: 'Dry-run admin · checkout de cartão',
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: { email },
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'bank_transfer' }],
          installments: 12,
        },
        back_urls: backUrls,
        auto_return: 'approved',
        external_reference: `dryrun_${intentId}`,
        statement_descriptor: 'MYCUPID',
        notification_url: notificationUrl,
      },
    });

    if (!pref.id || (!pref.init_point && !pref.sandbox_init_point)) {
      return {
        ok: false,
        tokenConfigured,
        amount,
        email,
        whatsapp,
        plan: planLabel,
        error: 'MP retornou sem preferenceId/URL.',
      };
    }

    return {
      ok: true,
      tokenConfigured,
      amount,
      email,
      whatsapp,
      plan: planLabel,
      preferenceId: pref.id,
      initPoint: pref.init_point,
      sandboxInitPoint: pref.sandbox_init_point,
      notificationUrl,
      backUrls,
    };
  } catch (err: any) {
    console.error('[MP DryRun] erro:', err?.message, err?.cause);
    return {
      ok: false,
      tokenConfigured,
      error: err?.message || 'Erro ao criar preference.',
      errorDetail: err?.cause ? String(err.cause) : err?.stack?.split('\n')[0],
    };
  }
}
