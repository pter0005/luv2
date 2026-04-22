
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import { applyUpgrade } from '@/app/p/[pageId]/upgradeActions';
import { logCriticalError } from '@/lib/log-critical-error';
import crypto from 'crypto';

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;


const validateWebhookSignature = (request: NextRequest, rawBody: string): boolean => {
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    
    if (!signatureHeader || !requestId || !WEBHOOK_SECRET) {
        console.error('[WEBHOOK_VALIDATION] Missing signature, request ID, or secret.');
        return false;
    }

    let ts: string | undefined;
    let hash: string | undefined;

    signatureHeader.split(',').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
            if (key.trim() === 'ts') ts = value.trim();
            if (key.trim() === 'v1') hash = value.trim();
        }
    });

    if (!ts || !hash) {
        console.error('[WEBHOOK_VALIDATION] Could not parse timestamp or hash from signature header.');
        return false;
    }

    let dataId;
    try {
        const body = JSON.parse(rawBody);
        dataId = body?.data?.id;
    } catch (e) {
        console.error('[WEBHOOK_VALIDATION] Failed to parse raw body to JSON.');
        return false;
    }

    if (!dataId) {
        console.error('[WEBHOOK_VALIDATION] `data.id` not found in webhook body.');
        return false;
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');
    
    const isValid = expectedHash === hash;
    if (!isValid) {
        console.error(`[WEBHOOK_VALIDATION] Signature mismatch. Expected: ${expectedHash}, Got: ${hash}`);
    }

    return isValid;
};

export async function POST(req: NextRequest) {
    if (!MERCADO_PAGO_ACCESS_TOKEN || !WEBHOOK_SECRET) {
        console.error('[WEBHOOK_ERROR] Missing Environment Variables');
        return NextResponse.json({ error: 'Config Error' }, { status: 500 });
    }

    const rawBody = await req.text();

    if (!validateWebhookSignature(req, rawBody)) {
        console.error('[WEBHOOK_ERROR] Invalid webhook signature.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        const body = JSON.parse(rawBody);
        const { type, data } = body;

        if (type === 'payment' && data?.id) {
            const paymentId = data.id;
            console.log(`[WEBHOOK_INFO] Processing payment: ${paymentId}`);

            const client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });

            if (paymentInfo && paymentInfo.status === 'approved' && paymentInfo.external_reference) {
                const intentId = paymentInfo.external_reference;

                // Upgrade flow (R$9,99 plano permanente) uses a different path:
                // it doesn't create a payment_intent doc — external_reference is
                // `upgrade_${pageId}`, and we just need to flip the page's plan.
                if (intentId.startsWith('upgrade_')) {
                    const pageId = intentId.slice('upgrade_'.length);
                    const upgradeResult = await applyUpgrade(pageId, paymentId.toString());
                    if (!upgradeResult.success) {
                        console.error(`[WEBHOOK_UPGRADE_ERROR] for page ${pageId}:`, upgradeResult.error);
                        logCriticalError('page_creation', `Webhook: upgrade falhou após PIX aprovado`, {
                            intentId,
                            pageId,
                            paymentId: paymentId.toString(),
                            error: upgradeResult.error,
                        }).catch(() => {});
                        // Return 500 so Mercado Pago retries the webhook later.
                        // Returning 200 here would make MP stop retrying, and the
                        // customer who paid would never get their upgrade.
                        return NextResponse.json({ error: 'upgrade_failed' }, { status: 500 });
                    } else {
                        console.log(`[WEBHOOK_UPGRADE_SUCCESS] Page ${pageId} upgraded to permanente.`);
                    }
                    return NextResponse.json({ success: true }, { status: 200 });
                }

                // Persist the real charged amount on the intent BEFORE finalize.
                // Card flow goes straight through MP Checkout Pro (no PIX gen step),
                // so paidAmount is only available here via the webhook payload.
                // Without this, finalizeLovePage falls back to plan base price,
                // triggering the "Intent finalizado sem paidAmount" alert.
                try {
                    const txAmount = Number((paymentInfo as any)?.transaction_amount);
                    if (isFinite(txAmount) && txAmount > 0) {
                        const { getAdminFirestore } = await import('@/lib/firebase/admin/config');
                        const db = getAdminFirestore();
                        await db.collection('payment_intents').doc(intentId).set(
                            { paidAmount: txAmount },
                            { merge: true },
                        );
                    }
                } catch (e) {
                    console.warn('[WEBHOOK] Failed to persist paidAmount before finalize:', e);
                }

                // Centralized Logic: Call the "brain" function to finalize the page
                const finalizationResult = await finalizeLovePage(intentId, paymentId.toString());

                if (!finalizationResult.success) {
                    console.error(`[WEBHOOK_FINALIZE_ERROR] for intent ${intentId}:`, finalizationResult.error);
                    logCriticalError('page_creation', `Webhook: finalize falhou após PIX aprovado`, {
                        intentId,
                        paymentId: paymentId.toString(),
                        error: finalizationResult.error,
                    }).catch(() => {});
                    // CRITICAL: Return 500 so Mercado Pago retries the webhook.
                    // Previously returned 200 here, which made MP stop retrying —
                    // paid customers silently lost their page with no recovery.
                    // finalizeLovePage() is idempotent (checks status === 'completed'),
                    // so retries are safe.
                    return NextResponse.json({ error: 'finalization_failed' }, { status: 500 });
                } else {
                    console.log(`[WEBHOOK_SUCCESS] Page processed for intent ${intentId}. Page ID: ${finalizationResult.pageId}`);
                }
            } else {
                 console.log(`[WEBHOOK_INFO] Payment ${paymentId} not approved or no external reference. Status: ${paymentInfo.status}`);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[WEBHOOK_CRITICAL]', error.message, error.stack);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
