import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { sendText } from '@/services/zapi/client';
import { buildOrderConfirmation } from '@/services/zapi/messages';
import { categorizeRecipient } from '@/services/zapi/recipient';
import { formatPhoneE164 } from '@/services/zapi/phone';

/**
 * Envia confirmação WhatsApp pra cliente após pagamento aprovado.
 *
 * Chamado pelo webhook MP DEPOIS do finalizeLovePage (que já gravou
 * lovePageId no intent). Fire-and-forget — NUNCA bloqueia o webhook.
 *
 * Idempotência: flag `confirmationSent=true` no intent. Webhook MP
 * pode duplicar (retry, race com cron-recover-stuck-pix), o flag
 * impede envio duplicado.
 *
 * Skip se: opt-out, sem phone válido, sem pageId, ZAPI desligado,
 * ORDER_CONFIRMATION_ENABLED=false.
 */
export async function sendOrderConfirmation(intentId: string, lovePageId?: string | null): Promise<void> {
  if (process.env.ORDER_CONFIRMATION_ENABLED !== 'true') return;
  if (process.env.ZAPI_ENABLED !== 'true') return;
  if (!intentId) return;

  try {
    const db = getAdminFirestore();
    const ref = db.collection('payment_intents').doc(intentId);
    const doc = await ref.get();
    if (!doc.exists) return;

    const sale = doc.data()!;

    // Idempotência — já enviado?
    if (sale.confirmationSent === true) return;

    // LGPD: opt-in (default true se não tiver o campo)
    if (sale.whatsappOptIn === false) {
      await ref.set({
        confirmationStatus: 'skipped',
        confirmationError: 'opt_out',
      }, { merge: true });
      return;
    }

    const phone = formatPhoneE164(sale.whatsappNumber || sale.buyerPhone);
    if (!phone) {
      await ref.set({
        confirmationStatus: 'skipped',
        confirmationError: 'invalid_phone',
      }, { merge: true });
      return;
    }

    const pageId = lovePageId || sale.lovePageId;
    if (!pageId) {
      // Não esperado — finalizeLovePage gravou pageId antes do webhook chamar
      // sendOrderConfirmation. Mas se não tiver, skip silencioso (cliente
      // recebe via push da própria página).
      await ref.set({
        confirmationStatus: 'skipped',
        confirmationError: 'no_page_id',
      }, { merge: true });
      return;
    }

    // Domínio: usa .com.br por default. Se intent for PT, usa .net.
    // Path "/p/" é a rota canônica das love pages (src/app/p/[pageId]).
    // Sem o "/p/" o cliente cai num 404 — bug real reportado em prod.
    const baseUrl = sale.market === 'PT' ? 'https://mycupid.net' : 'https://mycupid.com.br';
    const pageUrl = `${baseUrl}/p/${pageId}`;

    const firstName = (sale.userName as string || 'amor').split(' ')[0];
    const recipient = categorizeRecipient(sale.title);

    const message = buildOrderConfirmation({ firstName, recipient, pageUrl });

    const result = await sendText({ phone, message });

    if (result.ok) {
      await ref.set({
        confirmationSent: true,
        confirmationSentAt: Timestamp.now(),
        confirmationStatus: 'sent',
        confirmationMessageId: result.messageId || null,
      }, { merge: true });
      console.log(`[whatsapp] confirmation sent intent=${intentId} msg=${result.messageId}`);
    } else {
      await ref.set({
        confirmationStatus: 'failed',
        confirmationError: String(result.error || 'unknown').slice(0, 200),
      }, { merge: true });
      console.warn(`[whatsapp] confirmation FAILED intent=${intentId} err=${result.error}`);
    }
  } catch (e: any) {
    console.error(`[whatsapp] confirmation crash intent=${intentId}:`, e?.message);
  }
}
