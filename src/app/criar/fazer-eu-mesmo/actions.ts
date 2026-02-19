
'use server';

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { Timestamp } from 'firebase-admin/firestore';

// --- TYPE DEFINITIONS for consistent returns ---
type CreateIntentResult = 
  | { success: true; intentId: string }
  | { success: false; error: string; details?: any };

type FinalizePageResult = 
  | { success: true; pageId: string }
  | { success: false; error: string; details?: any };

type PaymentVerificationResult = 
  | { status: 'approved'; pageId: string }
  | { status: 'error'; error: string; details?: any }
  | { status: 'pending' | 'in_process' | 'authorized' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' };

type StripeSessionResult =
  | { success: true; url: string }
  | { success: false; error: string; details?: any };


// --- UTILITÁRIOS ---
function ensureTimestamp(dateValue: any): any {
    if (!dateValue) return null;
    if (typeof dateValue === 'object' && (dateValue.seconds || dateValue._seconds)) {
        return Timestamp.fromMillis((dateValue.seconds || dateValue._seconds) * 1000);
    }
    if (dateValue instanceof Date) return Timestamp.fromDate(dateValue);
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : Timestamp.fromDate(parsedDate);
}

function sanitizeForFirebase(obj: any): any {
    if (obj === undefined || obj === null) return null;
    if (obj instanceof Date || (typeof obj === 'object' && (obj.seconds || obj._seconds))) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = sanitizeForFirebase(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

// --- SALVAR RASCUNHO ---
export async function createOrUpdatePaymentIntent(fullPageData: any): Promise<CreateIntentResult> {
    const { intentId, ...restOfPageData } = fullPageData;
    if (!restOfPageData.userId) {
        return { success: false, error: 'Usuário não logado.', details: 'User ID was not provided in the page data.' };
    }
    try {
        const db = getAdminFirestore(); 
        const dataToSave = { ...sanitizeForFirebase(restOfPageData), updatedAt: Timestamp.now(), expireAt: Timestamp.fromMillis(Date.now() + (24 * 60 * 60 * 1000)) };
        if (intentId) {
            await db.collection('payment_intents').doc(intentId).set(dataToSave, { merge: true });
            return { success: true, intentId };
        } else {
            const intentDoc = await db.collection('payment_intents').add({ ...dataToSave, status: 'pending', createdAt: Timestamp.now() });
            return { success: true, intentId: intentDoc.id };
        }
    } catch (error: any) {
        return { success: false, error: error.message, details: error };
    }
}

// --- GERAR PIX (EXTRAÇÃO MANUAL DOS DADOS) ---
export async function processPixPayment(intentId: string, price: number) {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) return { error: "Token Mercado Pago não configurado." };

    try {
        const db = getAdminFirestore();
        const intentDoc = await db.collection('payment_intents').doc(intentId).get();
        if (!intentDoc.exists) return { error: 'Rascunho não encontrado.' };
        
        const intentData = intentDoc.data();
        const cleanEmail = (intentData?.userEmail || 'pagamento@mycupid.com.br').trim().toLowerCase();
        
        const rawName = intentData?.userName || 'Cliente MyCupid';
        const firstName = rawName.split(' ')[0];
        const lastName = rawName.split(' ').slice(1).join(' ') || 'Cliente';

        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);
        
        // Configuração da requisição
        const body = {
            transaction_amount: Number(price.toFixed(2)),
            description: `MyCupid - Plano ${intentData?.plan || 'Premium'}`,
            payment_method_id: 'pix',
            payer: {
                email: cleanEmail,
                first_name: firstName,
                last_name: lastName,
                // CPF genérico para garantir aprovação em produção
                identification: { type: 'CPF', number: '19100000000' }
            },
            external_reference: intentId,
        };

        const result = await payment.create({ body });
        
        const responseData = result as any;
        const transactionData = responseData.point_of_interaction?.transaction_data;

        const qrCode = transactionData?.qr_code;
        const qrCodeBase64 = transactionData?.qr_code_base64;
        const paymentId = responseData.id;

        if (qrCode && qrCodeBase64 && paymentId) {
            await db.collection('payment_intents').doc(intentId).update({ 
                paymentId: paymentId.toString(),
                status: 'waiting_payment'
            });
            
            return { 
                qrCode: qrCode, 
                qrCodeBase64: qrCodeBase64, 
                paymentId: paymentId.toString() 
            };
        }
        
        console.error("PIX GERADO MAS NÃO LIDO:", JSON.stringify(result, null, 2));
        return { 
            error: "PIX gerado, mas falha ao ler o código. Veja o console.",
            details: JSON.stringify(result) 
        };

    } catch (error: any) { 
        console.error("ERRO CRÍTICO MP:", error);
        return { 
            error: "Erro na API Mercado Pago.", 
            details: error.message 
        }; 
    }
}

// --- CAPTURAR ORDEM PAYPAL ---
export async function capturePaypalOrder(orderId: string, intentId: string): Promise<FinalizePageResult> {
    if (!intentId) return { success: false, error: "ID do rascunho não encontrado." };

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return { success: false, error: "Credenciais do PayPal não configuradas no servidor." };
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const url = `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`; // Use 'api-m.paypal.com' para produção

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
            },
        });

        const data = await response.json();

        if (data.status === 'COMPLETED') {
            const finalizationResult = await finalizeLovePage(intentId, orderId);
            if (!finalizationResult.success) {
                return { success: false, error: `Erro ao finalizar a página: ${finalizationResult.error}`, details: finalizationResult.details };
            }
            return { success: true, pageId: finalizationResult.pageId };
        } else {
            console.error("PAYPAL CAPTURE FAILED:", data);
            return { success: false, error: "A captura do pagamento com PayPal falhou.", details: data };
        }
    } catch (error: any) {
        console.error("PAYPAL API ERROR:", error);
        return { success: false, error: `Erro de conexão com a API do PayPal: ${error.message}`, details: error };
    }
}


// --- FINALIZAR PÁGINA ---
export async function finalizeLovePage(intentId: string, paymentId: string): Promise<FinalizePageResult> {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();
    const intentRef = db.collection('payment_intents').doc(intentId);
    
    try {
        const intentDoc = await intentRef.get();
        const data = intentDoc.data();
        if (!data) return { success: false, error: "Rascunho não encontrado." };
        if (data.status === 'completed') return { success: true, pageId: data.lovePageId };

        const newPageId = db.collection('lovepages').doc().id;
        
        const moveFile = async (fileObject: any, targetFolder: string) => {
            if (!fileObject || !fileObject.path || !fileObject.path.startsWith('temp/')) {
                return fileObject;
            }
            
            const oldPath = fileObject.path;
            const fileName = oldPath.split('/').pop();
            if (!fileName) return fileObject;
            
            const newPath = `lovepages/${newPageId}/${targetFolder}/${fileName}`;

            try {
                await bucket.file(oldPath).move(newPath);
                const newFileRef = bucket.file(newPath);
                await newFileRef.makePublic();

                return {
                    url: newFileRef.publicUrl(),
                    path: newPath,
                };
            } catch (error) {
                console.error(`Failed to move file from ${oldPath} to ${newPath}:`, error);
                return fileObject;
            }
        };

        const sanitizedData = sanitizeForFirebase(data);

        if (sanitizedData.galleryImages?.length) {
            sanitizedData.galleryImages = await Promise.all(sanitizedData.galleryImages.map((img: any) => moveFile(img, 'gallery')));
        }
        if (sanitizedData.timelineEvents?.length) {
            sanitizedData.timelineEvents = await Promise.all(
                sanitizedData.timelineEvents.map(async (event: any) => {
                    if (event.image) {
                        event.image = await moveFile(event.image, 'timeline');
                    }
                    return { ...event, date: ensureTimestamp(event.date) };
                })
            );
        } else if (sanitizedData.timelineEvents) {
             sanitizedData.timelineEvents = sanitizedData.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
        }
        
        if (sanitizedData.puzzleImage) {
            sanitizedData.puzzleImage = await moveFile(sanitizedData.puzzleImage, 'puzzle');
        }
        if (sanitizedData.audioRecording) {
            sanitizedData.audioRecording = await moveFile(sanitizedData.audioRecording, 'audio');
        }
        if (sanitizedData.backgroundVideo) {
             sanitizedData.backgroundVideo = await moveFile(sanitizedData.backgroundVideo, 'video');
        }
        if (sanitizedData.memoryGameImages?.length) {
           sanitizedData.memoryGameImages = await Promise.all(sanitizedData.memoryGameImages.map((img: any) => moveFile(img, 'memory-game')));
        }

        sanitizedData.specialDate = ensureTimestamp(sanitizedData.specialDate);

        const { payment, ...finalData } = sanitizedData;
        finalData.id = newPageId;
        finalData.createdAt = Timestamp.now();
        finalData.paymentId = paymentId;
        finalData.status = 'paid';

        await db.collection('lovepages').doc(newPageId).set(finalData);
        
        if (data.userId) {
            await db.collection('users').doc(data.userId).collection('love_pages').doc(newPageId).set({ 
                title: finalData.title, pageId: newPageId, createdAt: Timestamp.now() 
            });
        }

        await intentRef.update({ status: 'completed', lovePageId: newPageId });
        return { success: true, pageId: newPageId };
    } catch (error: any) {
        console.error("[FINALIZE_PAGE_ERROR]", error);
        return { success: false, error: error.message, details: error };
    }
}

export async function verifyPaymentWithMercadoPago(paymentId: string, intentId: string): Promise<PaymentVerificationResult> {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) return { status: 'error', error: "Token do Mercado Pago não está configurado no servidor." };

    try {
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
            const result = await finalizeLovePage(intentId, paymentId);
            if (!result.success) {
                return { status: 'error', error: result.error || 'Falha ao finalizar a página após aprovação.' };
            }
            return { status: 'approved', pageId: result.pageId };
        }
        
        const currentStatus = paymentInfo.status || 'pending';
        const knownOtherStatuses: Array<'pending' | 'in_process' | 'authorized' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'> = ['pending', 'in_process', 'authorized', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'];

        if (knownOtherStatuses.includes(currentStatus as any)) {
            return { status: currentStatus as any };
        }

        console.warn(`Unknown Mercado Pago status received: "${currentStatus}". Treating as pending.`);
        return { status: 'pending' };

    } catch (error: any) {
        return { status: 'error', error: error.message, details: error };
    }
}

export async function adminFinalizePage(intentId: string, userId: string): Promise<FinalizePageResult> {
    try {
        const result = await finalizeLovePage(intentId, `admin_finalize_${userId}_${Date.now()}`);
        return result;
    } catch (error: any) {
        return { success: false, error: error.message, details: error };
    }
}

export async function createStripeCheckoutSession(intentId: string, plan: 'basico' | 'avancado', domain: string): Promise<StripeSessionResult> {
    const priceId = plan === 'avancado' ? 'price_avancado_stripe' : 'price_basico_stripe';
    console.log(`Creating Stripe session for intent ${intentId} with price ${priceId}`);

    const successUrl = `${domain}/criando-pagina?intentId=${intentId}`;
    const cancelUrl = `${domain}/pagamento/cancelado`;
    
     return { success: false, error: 'Stripe integration is not fully configured on the backend.' };
}
