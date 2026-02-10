'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import type { PageData } from './CreatePageWizard';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

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
    if (obj === undefined) return null;
    if (obj === null) return null;
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

// --- LOGICA DE BANCO E STORAGE ---

export async function createOrUpdatePaymentIntent(fullPageData: PageData) {
    const { intentId, ...restOfPageData } = fullPageData;
    if (!restOfPageData.userId) return { error: 'Usuário não autenticado.' };

    try {
        const db = getAdminFirestore(); 
        const paymentIntentsRef = db.collection('payment_intents');
        
        const dataToSave = { 
            ...sanitizeForFirebase(restOfPageData), 
            updatedAt: Timestamp.now() 
        };

        if (intentId) {
            await paymentIntentsRef.doc(intentId).set(dataToSave, { merge: true });
            return { intentId };
        } else {
            const intentDoc = await paymentIntentsRef.add({ 
                ...dataToSave, 
                status: 'pending', 
                createdAt: Timestamp.now() 
            });
            return { intentId: intentDoc.id };
        }
    } catch (error: any) {
        console.error("CREATE_OR_UPDATE_PAYMENT_INTENT FAILED:", error);
        const errorMessage = `Falha no servidor ao salvar rascunho. Por favor, verifique a configuração do Firebase Admin em suas variáveis de ambiente. Detalhes: ${error.message}`;
        return { 
            error: errorMessage,
            details: {
                code: error.code || 'UNKNOWN_SERVER_ERROR',
                stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace available in development mode.',
            }
        };
    }
}

export async function processPixPayment(intentId: string, price: number) {
    const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!MERCADO_PAGO_ACCESS_TOKEN) return { error: "Token do Mercado Pago não configurado no servidor." };

    try {
        const db = getAdminFirestore();
        const intentDoc = await db.collection('payment_intents').doc(intentId).get();
        if (!intentDoc.exists) return { error: 'Rascunho da página não encontrado para o pagamento.' };
        
        const intentData = intentDoc.data();
        if (!intentData) return { error: 'Dados do rascunho de pagamento não encontrados.' };
        
        const payerEmail = intentData.userEmail || 'cliente@mycupid.net';

        const client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
        const payment = new Payment(client);
        
        const result = await payment.create({
            body: {
                transaction_amount: price,
                description: `MyCupid - Plano ${intentData.plan || 'personalizado'}`,
                payment_method_id: 'pix',
                payer: {
                    email: payerEmail,
                },
                external_reference: intentId,
            }
        });
        
        if (result && result.id && result.point_of_interaction?.transaction_data) {
            const { qr_code, qr_code_base64 } = result.point_of_interaction.transaction_data;
            await db.collection('payment_intents').doc(intentId).update({ paymentId: result.id!.toString() });
            return { qrCode: qr_code, qrCodeBase64: qr_code_base64, paymentId: result.id!.toString() };
        }
        
        console.error("Resposta inesperada do Mercado Pago:", result);
        throw new Error('Erro ao gerar PIX junto ao Mercado Pago.');
    } catch (error: any) { 
        console.error("Erro no Servidor (processPixPayment):", error);
        return { 
            error: `Erro ao processar pagamento: ${error.message}`,
            details: { code: error.code || 'MERCADO_PAGO_ERROR', response: error.response?.data }
        }; 
    }
}

export async function createStripeCheckoutSession(intentId: string, plan: 'basico' | 'avancado', domain: string) {
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
        return { error: 'Stripe secret key not configured on the server.' };
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const prices = {
        basico: { unit_amount: 1990, name: 'Economic Plan' },
        avancado: { unit_amount: 2499, name: 'Advanced Plan' }
    };
    
    const selectedPrice = prices[plan];

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: selectedPrice.name },
                    unit_amount: selectedPrice.unit_amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${domain}/criando-pagina?intentId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/pagamento/cancelado`,
            client_reference_id: intentId,
        });

        return { url: session.url };

    } catch (error: any) {
        return { 
            error: `Stripe Error: ${error.message}`,
            details: { code: error.code || 'STRIPE_ERROR' }
        };
    }
}

async function moveFile(
    fileData: { url: string, path: string }, 
    pageId: string, 
    targetFolder: string
): Promise<{ url: string; path: string }> {
    if (!fileData || !fileData.path || !fileData.path.includes('temp/')) {
        return fileData; 
    }
    try {
        const storage = getAdminStorage();
        const oldPath = fileData.path;
        const fileName = oldPath.split('/').pop();
        if (!fileName) {
            console.error(`Nome do arquivo inválido para o caminho: ${oldPath}`);
            return fileData;
        }
        const newPath = `lovepages/${pageId}/${targetFolder}/${fileName}`;
        const oldFile = storage.file(oldPath);
        const newFile = storage.file(newPath);
        await oldFile.copy(newFile);
        await newFile.makePublic();
        await oldFile.delete();
        return {
            url: newFile.publicUrl(),
            path: newPath,
        };
    } catch (error: any) {
        if (error.code === 404) {
            const newFile = getAdminStorage().file(`lovepages/${pageId}/${targetFolder}/${fileData.path.split('/').pop()}`);
            const [exists] = await newFile.exists();
            if (exists) {
                console.warn(`Arquivo temporário não encontrado, mas arquivo final existe. Assumindo que já foi movido: ${newFile.name}`);
                await newFile.makePublic();
                return { url: newFile.publicUrl(), path: newFile.name };
            }
        }
        console.error(`Falha ao mover arquivo de ${fileData.path} para ${targetFolder}:`, error);
        return fileData;
    }
}

async function moveFilesToPermanentStorage(pageData: any, pageId: string) {
    const updatedData = { ...pageData };
    const filesToMove = [
        ... (pageData.galleryImages || []).map((img: any) => ({ file: img, folder: 'gallery' })),
        ... (pageData.timelineEvents || []).map((evt: any) => ({ file: evt.image, folder: 'timeline' })).filter((item: any) => item.file),
    ];
    if (pageData.puzzleImage) filesToMove.push({ file: pageData.puzzleImage, folder: 'puzzle' });
    if (pageData.audioRecording) filesToMove.push({ file: pageData.audioRecording, folder: 'audio' });
    const movedFiles = await Promise.all(
        filesToMove.map(item => moveFile(item.file, pageId, item.folder))
    );
    let movedIndex = 0;
    if (updatedData.galleryImages) {
        updatedData.galleryImages = movedFiles.slice(movedIndex, movedIndex + updatedData.galleryImages.length);
        movedIndex += updatedData.galleryImages.length;
    }
    if (updatedData.timelineEvents) {
        updatedData.timelineEvents = updatedData.timelineEvents.map((event: any) => {
            if (event.image) {
                event.image = movedFiles[movedIndex++];
            }
            return event;
        });
    }
    if (updatedData.puzzleImage) updatedData.puzzleImage = movedFiles[movedIndex++];
    if (updatedData.audioRecording) updatedData.audioRecording = movedFiles[movedIndex];
    return updatedData;
}


// --- PAYPAL (SEGURANÇA MÁXIMA) ---

function getPayPalClient() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Credenciais do PayPal não configuradas no servidor.");
    }

    const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    return new paypal.core.PayPalHttpClient(environment);
}

export async function createPayPalOrder(planType: 'basico' | 'avancado', intentId: string) {
    try {
        const client = getPayPalClient();
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        
        const prices = {
            basico: "19.90",
            avancado: "24.99"
        };
        const value = prices[planType];
        const description = planType === 'basico' ? 'MyCupid - Economic Plan' : 'MyCupid - Advanced Plan';

        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: "USD",
                    value: value,
                },
                description: description,
                custom_id: intentId,
            }],
        });

        const response = await client.execute(request);
        return response.result.id;
    } catch (error: any) {
        console.error("Erro PayPal Create:", error);
        throw new Error("Não foi possível iniciar o PayPal.");
    }
}

export async function capturePayPalOrder(orderId: string, intentId: string) {
    try {
        const client = getPayPalClient();
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const response = await client.execute(request);
        const captureData = response.result;

        if (captureData.status === 'COMPLETED') {
            const paymentId = captureData.id || orderId;
            const result = await finalizeLovePage(intentId, paymentId);
            if (result.error) {
                return { success: false, error: "Pagamento aprovado, mas erro ao gerar página." };
            }
            return { success: true, pageId: result.pageId };
        }
        return { success: false, error: "Pagamento não concluído." };
    } catch (error: any) {
        console.error("Erro PayPal Capture:", error);
        return { success: false, error: "Erro ao processar captura do PayPal." };
    }
}

// --- FINALIZAÇÃO DA PÁGINA ---

export async function finalizeLovePage(intentId: string, paymentId: string) {
    const db = getAdminFirestore();
    const intentRef = db.collection('payment_intents').doc(intentId);
    
    try {
        const intentDoc = await intentRef.get();
        const data = intentDoc.data();
        if (!data) return { error: `Rascunho ${intentId} não encontrado.` };
        if (data.status === 'completed') return { success: true, pageId: data.lovePageId };

        const newPageId = db.collection('lovepages').doc().id;
        const sanitized = sanitizeForFirebase(data);
        
        if (sanitized.timelineEvents) {
            sanitized.timelineEvents = sanitized.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
        }
        if (sanitized.specialDate) sanitized.specialDate = ensureTimestamp(sanitized.specialDate);

        const { payment, aiPrompt, ...finalPageData } = sanitized;
        finalPageData.id = newPageId;
        finalPageData.createdAt = Timestamp.now();
        finalPageData.paymentId = paymentId;

        if (finalPageData.plan === 'basico') {
            const twelveHoursInMillis = 12 * 60 * 60 * 1000;
            finalPageData.expireAt = Timestamp.fromMillis(Date.now() + twelveHoursInMillis);
        }

        const dataWithPermanentFiles = await moveFilesToPermanentStorage(finalPageData, newPageId);

        await db.collection('lovepages').doc(newPageId).set(dataWithPermanentFiles);
        
        if (data.userId) {
            await db.collection('users').doc(data.userId).collection('love_pages').doc(newPageId).set({ 
                title: finalPageData.title, pageId: newPageId, createdAt: Timestamp.now() 
            });
        }

        await intentRef.update({ status: 'completed', lovePageId: newPageId });
        return { success: true, pageId: newPageId };
    } catch (error: any) {
        console.error("Erro finalizeLovePage:", error);
        return { 
            error: `Erro ao finalizar a página: ${error.message}`,
            details: { code: error.code || 'FINALIZE_ERROR' }
        };
    }
}

export async function adminFinalizePage(intentId: string, adminUserId: string) {
    const db = getAdminFirestore();
    const adminUserDoc = await db.collection('users').doc(adminUserId).get();
    const adminEmail = adminUserDoc.data()?.email;

    const adminEmails = ['giibrossini@gmail.com', 'inesvalentim45@gmail.com'];

    if (!adminEmail || !adminEmails.includes(adminEmail)) {
        return { error: 'Acesso negado. Ação restrita ao administrador.' };
    }

    return finalizeLovePage(intentId, `admin_override_${Date.now()}`);
}


export async function verifyPaymentWithMercadoPago(paymentId: string, intentId: string) {
    const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!MERCADO_PAGO_ACCESS_TOKEN) return { status: 'error', error: 'Token do Mercado Pago ausente.' };

    try {
        const client = new MercadoPagoConfig({ accessToken: MERCADO_PAGO_ACCESS_TOKEN });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        console.log("STATUS MP:", paymentInfo.status);

        if (paymentInfo.status === 'approved' || paymentInfo.status === 'authorized') {
            const result = await finalizeLovePage(intentId, paymentId);
            if (result.error) {
                console.error(`Erro na finalização pós-pagamento: ${result.error}`);
                return { status: 'error', error: result.error, details: result.details };
            }
            return { status: 'approved', pageId: result.pageId };
        }

        return { status: paymentInfo.status };
    } catch (error: any) {
        console.error("Erro no Servidor (verifyPaymentWithMercadoPago):", error);
        return { 
            status: 'error', 
            error: `Falha na verificação com Mercado Pago: ${error.message}`,
            details: { code: error.code || 'MERCADO_PAGO_VERIFY_ERROR' }
        };
    }
}

export { suggestContent };
