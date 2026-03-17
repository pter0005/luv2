'use server';

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createHash } from 'crypto';

// --- SERVER-SIDE META PIXEL EVENT ---
async function sendServerSidePurchaseEvent(
    plan: 'basico' | 'avancado',
    pageId: string,
    userEmail?: string
) {
    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('[Meta CAPI] Env vars não configuradas. Pulando evento server-side.');
        return;
    }

    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
                  || headersList.get('x-real-ip')
                  || '177.160.0.1';
    const userAgent = headersList.get('user-agent') || 'Mozilla/5.0';

    const value = plan === 'avancado' ? 24.90 : 14.90;

    const userData: Record<string, any> = {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
    };
    if (userEmail) {
        userData.em = [createHash('sha256').update(userEmail.toLowerCase().trim()).digest('hex')];
    }

    const payload = {
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: `https://mycupid.com.br/criar/fazer-eu-mesmo`,
            action_source: 'website',
            user_data: userData,
            custom_data: {
                value,
                currency: 'BRL',
                content_ids: [plan],
                content_type: 'product',
                order_id: pageId,
            },
        }],
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const responseData = await response.json();
        if (!response.ok) {
            console.error('[Meta CAPI] Erro:', responseData);
        } else {
            console.log('[Meta CAPI] Purchase enviado com sucesso. PageId:', pageId);
        }
    } catch (err) {
        console.error('[Meta CAPI] Exceção:', err);
    }
}


// --- TYPE DEFINITIONS ---
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
        const dataToSave = {
            ...sanitizeForFirebase(restOfPageData),
            updatedAt: Timestamp.now(),
            expireAt: Timestamp.fromMillis(Date.now() + (24 * 60 * 60 * 1000))
        };
        
        if (intentId) {
            const intentRef = db.collection('payment_intents').doc(intentId);
            const docSnap = await intentRef.get();

            if (docSnap.exists && docSnap.data()?.status === 'completed') {
                return { success: true, intentId };
            }

            await intentRef.set(dataToSave, { merge: true });
            return { success: true, intentId };
        } else {
            const intentDoc = await db.collection('payment_intents').add({
                ...dataToSave,
                status: 'pending',
                createdAt: Timestamp.now()
            });
            return { success: true, intentId: intentDoc.id };
        }
    } catch (error: any) {
        return { success: false, error: error.message, details: error };
    }
}

// --- GERAR PIX ---
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
        
        const body = {
            transaction_amount: Number(price.toFixed(2)),
            description: `MyCupid - Plano ${intentData?.plan || 'Premium'}`,
            payment_method_id: 'pix',
            payer: {
                email: cleanEmail,
                first_name: firstName,
                last_name: lastName,
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
            return { qrCode, qrCodeBase64, paymentId: paymentId.toString() };
        }
        
        console.error("PIX GERADO MAS NÃO LIDO:", JSON.stringify(result, null, 2));
        return { error: "PIX gerado, mas falha ao ler o código.", details: JSON.stringify(result) };

    } catch (error: any) { 
        console.error("ERRO CRÍTICO MP:", error);
        return { error: "Erro na API Mercado Pago.", details: error.message }; 
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
    const url = `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
        });
        const data = await response.json();

        if (data.status === 'COMPLETED') {
            const finalizationResult = await finalizeLovePage(intentId, orderId);
            if (!finalizationResult.success) {
                return { success: false, error: `Erro ao finalizar a página: ${finalizationResult.error}`, details: finalizationResult.details };
            }
            return { success: true, pageId: finalizationResult.pageId };
        } else {
            return { success: false, error: "A captura do pagamento com PayPal falhou.", details: data };
        }
    } catch (error: any) {
        return { success: false, error: `Erro de conexão com a API do PayPal: ${error.message}`, details: error };
    }
}

async function moveFileWithRetry(
    bucket: any,
    db: any,
    fileObject: any,
    targetFolder: string,
    newPageId: string,
    maxRetries = 3
): Promise<any> {
    if (!fileObject || !fileObject.path || !fileObject.path.startsWith('temp/')) {
        return fileObject;
    }

    const oldPath = fileObject.path;
    const fileName = oldPath.split('/').pop();
    if (!fileName) return fileObject;

    const newPath = `lovepages/${newPageId}/${targetFolder}/${fileName}`;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await bucket.file(oldPath).move(newPath);
            const newFileRef = bucket.file(newPath);
            await newFileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${newPath}`;
            return { url: publicUrl, path: newPath };
        } catch (error: any) {
            lastError = error;
            console.error(`[moveFile] Tentativa ${attempt}/${maxRetries} falhou para ${oldPath}:`, error.message);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    try {
        await db.collection('failed_file_moves').add({
            pageId: newPageId,
            oldPath,
            newPath,
            targetFolder,
            error: lastError?.message || 'unknown',
            createdAt: Timestamp.now(),
            resolved: false,
        });
    } catch (logError) {
        console.error(`[moveFile] FALHA CRÍTICA:`, { oldPath, newPath, lastError });
    }

    return fileObject;
}

// --- FINALIZAR PÁGINA ---
export async function finalizeLovePage(intentId: string, paymentId: string): Promise<FinalizePageResult> {
    const db = getAdminFirestore();
    
    const transactionResult = await db.runTransaction(async (transaction) => {
        const intentRef = db.collection('payment_intents').doc(intentId);
        const intentDoc = await transaction.get(intentRef);

        if (!intentDoc.exists) throw new Error("Rascunho não encontrado.");
        const data = intentDoc.data();
        if (!data) throw new Error("Dados do rascunho inválidos.");

        if (data.status === 'completed' && data.lovePageId) {
            return { success: true as const, pageId: data.lovePageId as string, plan: data.plan as 'basico' | 'avancado', userEmail: data.userEmail as string | undefined };
        }
        
        const adminEmails = ['giibrossini@gmail.com', 'inesvalentim45@gmail.com'];
        let isCreatorAdmin = false;
        if (data.userId) {
            const userRef = db.collection('users').doc(data.userId);
            try {
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists) {
                    const userEmail = userDoc.data()?.email;
                    if (userEmail && adminEmails.includes(userEmail)) isCreatorAdmin = true;
                }
            } catch (e) {
                console.warn(`Could not verify admin status for user ${data.userId}`, e);
            }
        }

        const bucket = getAdminStorage();
        const newPageId = db.collection('lovepages').doc().id;
        const sanitizedData = sanitizeForFirebase(data);

        if (sanitizedData.galleryImages?.length) {
            sanitizedData.galleryImages = await Promise.all(
                sanitizedData.galleryImages.map((img: any) => moveFileWithRetry(bucket, db, img, 'gallery', newPageId))
            );
        }
        if (sanitizedData.timelineEvents?.length) {
            sanitizedData.timelineEvents = await Promise.all(
                sanitizedData.timelineEvents.map(async (event: any) => {
                    if (event.image) event.image = await moveFileWithRetry(bucket, db, event.image, 'timeline', newPageId);
                    return { ...event, date: ensureTimestamp(event.date) };
                })
            );
        } else if (sanitizedData.timelineEvents) {
            sanitizedData.timelineEvents = sanitizedData.timelineEvents.map(
                (e: any) => ({ ...e, date: ensureTimestamp(e.date) })
            );
        }
        if (sanitizedData.puzzleImage) sanitizedData.puzzleImage = await moveFileWithRetry(bucket, db, sanitizedData.puzzleImage, 'puzzle', newPageId);
        if (sanitizedData.audioRecording) sanitizedData.audioRecording = await moveFileWithRetry(bucket, db, sanitizedData.audioRecording, 'audio', newPageId);
        if (sanitizedData.backgroundVideo) sanitizedData.backgroundVideo = await moveFileWithRetry(bucket, db, sanitizedData.backgroundVideo, 'video', newPageId);
        if (sanitizedData.memoryGameImages?.length) {
            sanitizedData.memoryGameImages = await Promise.all(
                sanitizedData.memoryGameImages.map((img: any) => moveFileWithRetry(bucket, db, img, 'memory-game', newPageId))
            );
        }
        sanitizedData.specialDate = ensureTimestamp(sanitizedData.specialDate);

        const { payment, ...finalData } = sanitizedData;
        finalData.id = newPageId;
        finalData.createdAt = Timestamp.now();
        finalData.paymentId = paymentId;
        finalData.status = 'paid';
        finalData.componentVersion = 'v2';
        
        if (isCreatorAdmin) {
            finalData.plan = 'avancado';
            delete finalData.expireAt;
        } else if (finalData.plan === 'basico') {
            finalData.expireAt = Timestamp.fromMillis(Date.now() + 25 * 60 * 60 * 1000);
        } else {
            delete finalData.expireAt;
        }

        const newPageRef = db.collection('lovepages').doc(newPageId);
        transaction.set(newPageRef, finalData);
        
        if (data.userId) {
            const userSubcollectionRef = db.collection('users').doc(data.userId).collection('love_pages').doc(newPageId);
            transaction.set(userSubcollectionRef, { title: finalData.title, pageId: newPageId, createdAt: Timestamp.now() });
        }
        
        transaction.update(intentRef, { status: 'completed', lovePageId: newPageId });
        return { success: true as const, pageId: newPageId, plan: finalData.plan as 'basico' | 'avancado', userEmail: data.userEmail as string | undefined };
    });

    if (transactionResult.success) {
        await sendServerSidePurchaseEvent(transactionResult.plan, transactionResult.pageId, transactionResult.userEmail);
        revalidatePath(`/p/${transactionResult.pageId}`);
        revalidatePath('/minhas-paginas');
        return { success: true, pageId: transactionResult.pageId };
    }
    return { success: false, error: 'Transação falhou.' };
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
            if (!result.success) return { status: 'error', error: result.error || 'Falha ao finalizar a página após aprovação.' };
            return { status: 'approved', pageId: result.pageId };
        }
        
        const currentStatus = paymentInfo.status || 'pending';
        const knownOtherStatuses: Array<'pending' | 'in_process' | 'authorized' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'> = [
            'pending', 'in_process', 'authorized', 'in_mediation',
            'rejected', 'cancelled', 'refunded', 'charged_back'
        ];

        if (knownOtherStatuses.includes(currentStatus as any)) return { status: currentStatus as any };
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
