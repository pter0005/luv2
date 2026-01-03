
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import type { PageData, FileWithPreview } from './CreatePageWizard';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import "dotenv/config";
import { randomUUID } from 'crypto';


/**
 * Sanitizes the final page data before saving it to the permanent 'lovepages' collection.
 * This primarily involves converting complex objects (like Dates) to Firestore-compatible types.
 * @param pageData The full page data from the payment intent.
 * @returns The sanitized page data ready for Firestore.
 */
function sanitizePageDataForFirestore(pageData: Partial<PageData>): any {
    const { payment, aiPrompt, intentId, ...lovePageDataToSave } = pageData;
    const sanitizedData: any = JSON.parse(JSON.stringify(lovePageDataToSave));

    // URLs from Storage are now just strings, so no need to process gallery, timeline, puzzle images.

    if (sanitizedData.timelineEvents) {
        sanitizedData.timelineEvents = sanitizedData.timelineEvents.map((event: any) => {
            const sanitizedEvent = { ...event };
            if (sanitizedEvent.date) sanitizedEvent.date = Timestamp.fromDate(new Date(sanitizedEvent.date));
            return sanitizedEvent;
        });
    }
    if (sanitizedData.specialDate) sanitizedData.specialDate = Timestamp.fromDate(new Date(sanitizedData.specialDate));

    sanitizedData.createdAt = Timestamp.now();
    return sanitizedData;
}


const PayerDataSchema = z.object({
  payerEmail: z.string().email(),
  payerFirstName: z.string().min(1),
  payerLastName: z.string().min(1),
  payerCpf: z.string().min(14).max(14),
});

// --- SERVER ACTIONS ---

export async function handleSuggestContent(formData: FormData) {
  const userInput = formData.get('userInput') as string;
  if (!userInput) return { error: 'Por favor, descreva o que você gostaria de sugerir.' };

  try {
    const result = await suggestContent({ userInput });
    return { suggestions: result };
  } catch (e: any) {
    console.error('Error suggesting content:', e);
    return { error: 'Ocorreu um erro ao gerar sugestões.' };
  }
}

/**
 * Creates or updates a draft of the love page in the `payment_intents` collection.
 * This is the core of the autosave functionality.
 */
export async function createOrUpdatePaymentIntent(fullPageData: PageData) {
    const { userId, intentId, payment, ...restOfPageData } = fullPageData;

    if (!userId) return { error: 'Usuário não autenticado.' };

    try {
        const firestore = getAdminFirestore();
        const paymentIntentsRef = firestore.collection('payment_intents');
        
        const serializablePageData = JSON.parse(JSON.stringify(restOfPageData));
        
        const dataToSave = {
            fullPageData: serializablePageData,
            payment: payment || {}, // Save payment info at the top level
            userId: userId,
            updatedAt: Timestamp.now(),
            expireAt: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)), // Expires in 30 minutes
        };

        if (intentId) {
            const intentDocRef = paymentIntentsRef.doc(intentId);
            await intentDocRef.update(dataToSave);
            return { intentId: intentId };
        } else {
            const intentDoc = await paymentIntentsRef.add({
                ...dataToSave,
                status: 'pending',
                createdAt: Timestamp.now(),
            });
            return { intentId: intentDoc.id };
        }

    } catch (error: any) {
        console.error('--- ERROR SAVING DRAFT (AUTOSAVE) ---', error);
        return { error: 'Falha no salvamento automático.' };
    }
}

/**
 * Creates a PIX payment order with Mercado Pago.
 */
export async function processPixPayment(intentId: string) {
    const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:9002';
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) return { error: "Erro de configuração: Token MP ausente." };
    if (!intentId) return { error: "ID da intenção não fornecido." };

    try {
        const firestore = getAdminFirestore();
        const intentDocRef = firestore.collection('payment_intents').doc(intentId);
        const intentDoc = await intentDocRef.get();

        if (!intentDoc.exists) throw new Error('Dados do pedido não encontrados.');

        const intentData = intentDoc.data();
        const payerData = intentData?.payment; // Corrected path to payment data
        
        const validation = PayerDataSchema.safeParse(payerData);
        if (!validation.success) {
            console.error("Payer data validation failed:", validation.error);
            return { error: "Dados do pagador inválidos ou incompletos." };
        }

        const client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        const body = {
            transaction_amount: 24.99,
            description: 'Página de Amor Personalizada - Amore Pages',
            payment_method_id: 'pix',
            payer: {
                email: validation.data.payerEmail,
                first_name: validation.data.payerFirstName,
                last_name: validation.data.payerLastName,
                identification: {
                    type: 'CPF',
                    number: validation.data.payerCpf.replace(/\D/g, ''),
                },
            },
            notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
            external_reference: intentId,
            statement_descriptor: "AMORE PAGES",
        };

        const result = await payment.create({ body });
        
        if (result && result.id && result.point_of_interaction?.transaction_data) {
            const { qr_code, qr_code_base_64 } = result.point_of_interaction.transaction_data;
            
            await intentDocRef.update({ paymentId: result.id.toString() });
            
            return {
                qrCode: qr_code,
                qrCodeBase64: qr_code_base_64,
                paymentId: result.id.toString(),
            };
        } else {
             throw new Error('Mercado Pago não retornou os dados completos do pagamento.');
        }

    } catch (error: any) {
        console.error('--- ERRO MP ---', error?.cause?.error || error);
        return { error: error.message || 'Erro ao gerar o PIX.', details: error?.cause?.error };
    }
}

/**
 * Checks the final status of a page creation process.
 */
export async function checkFinalPageStatus(intentId: string) {
    if (!intentId) return { error: 'ID inválido.' };
    try {
        const firestore = getAdminFirestore();
        const intentDoc = await firestore.collection('payment_intents').doc(intentId).get();
        
        if (!intentDoc.exists) return { status: 'expired' };
        const data = intentDoc.data();
        
        if (data?.status === 'completed' && data?.lovePageId) {
            return { status: 'completed', pageId: data.lovePageId };
        }
        return { status: data?.status || 'pending' };
    } catch (error) {
        return { error: 'Erro ao verificar status.' };
    }
}

/**
 * THE "BRAIN" FUNCTION: Centralized logic to finalize a love page.
 * This is idempotent and can be called safely by the webhook or manual verification.
 */
export async function finalizeLovePage(intentId: string, paymentId: string) {
    const firestore = getAdminFirestore();
    const intentRef = firestore.collection('payment_intents').doc(intentId);

    try {
        let finalPageId: string | undefined;

        await firestore.runTransaction(async (transaction) => {
            const intentDoc = await transaction.get(intentRef);
            if (!intentDoc.exists) throw new Error("Pedido (intent) não encontrado.");

            const data = intentDoc.data();
            if (data?.status === 'completed') {
                console.log(`[FINALIZE_INFO] Intent ${intentId} já processado. Pulando.`);
                finalPageId = data.lovePageId;
                return; // Idempotency: stop if already completed
            }
            
            const pageDataFromIntent = data?.fullPageData;
            if (!pageDataFromIntent) throw new Error('fullPageData não encontrado no intent.');
            
            const finalPageData = sanitizePageDataForFirestore(pageDataFromIntent);
            
            const newPageId = firestore.collection('lovepages').doc().id;
            finalPageId = newPageId;
            
            const publicPageRef = firestore.collection('lovepages').doc(newPageId);
            const userLovePageRef = firestore.collection('users').doc(data.userId).collection('love_pages').doc(newPageId);
            
            transaction.set(publicPageRef, finalPageData);
            transaction.set(userLovePageRef, { createdAt: finalPageData.createdAt, title: finalPageData.title });

            transaction.update(intentRef, {
                status: 'completed',
                lovePageId: newPageId,
                paymentId: paymentId,
                updatedAt: Timestamp.now()
            });
        });

        if (!finalPageId) {
           const finalDoc = await intentRef.get();
           finalPageId = finalDoc.data()?.lovePageId;
        }

        return { success: true, pageId: finalPageId };

    } catch (error: any) {
        console.error(`[FINALIZE_CRITICAL] Erro ao finalizar a página para o intent ${intentId}:`, error);
        await intentRef.update({ status: 'error', error: error.message }).catch();
        return { error: error.message };
    }
}


/**
 * Manually verifies payment with Mercado Pago and triggers finalization if needed.
 */
export async function verifyPaymentWithMercadoPago(paymentId: string, intentId: string) {
    if (!paymentId || !intentId) return { error: "IDs inválidos" };

    try {
        const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        const client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN! });
        const payment = new Payment(client);
        
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
            // Instead of duplicating logic, call the centralized finalizer
            const finalizationResult = await finalizeLovePage(intentId, paymentId);
            
            if (finalizationResult.error) {
                return { status: 'error', error: `Falha na finalização: ${finalizationResult.error}` };
            }
            
            return { status: 'approved', pageId: finalizationResult.pageId };
        }

        return { status: paymentInfo.status || 'pending' };

    } catch (error: any) {
        console.error("Erro verificação manual:", error);
        return { error: `Erro: ${error.message}` };
    }
}

    