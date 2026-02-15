
'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { Timestamp } from 'firebase-admin/firestore';

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
export async function createOrUpdatePaymentIntent(fullPageData: any) {
    const { intentId, ...restOfPageData } = fullPageData;
    if (!restOfPageData.userId) return { error: 'Usuário não logado.' };
    try {
        const db = getAdminFirestore(); 
        const dataToSave = { ...sanitizeForFirebase(restOfPageData), updatedAt: Timestamp.now(), expireAt: Timestamp.fromMillis(Date.now() + (24 * 60 * 60 * 1000)) };
        if (intentId) { await db.collection('payment_intents').doc(intentId).set(dataToSave, { merge: true }); return { intentId };
        } else { const intentDoc = await db.collection('payment_intents').add({ ...dataToSave, status: 'pending', createdAt: Timestamp.now() }); return { intentId: intentDoc.id }; }
    } catch (error: any) { return { error: error.message }; }
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
        
        // --- AQUI ESTAVA O ERRO ---
        // Tratamos como 'any' para forçar a leitura dos campos snake_case que vieram no seu log
        const responseData = result as any;
        const transactionData = responseData.point_of_interaction?.transaction_data;

        // Lê o campo correto sem o underscore extra
        const qrCode = transactionData?.qr_code;
        const qrCodeBase64 = transactionData?.qr_code_base64; // Era aqui o erro de digitação
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
export async function capturePaypalOrder(orderId: string, intentId: string) {
    if (!intentId) return { error: "ID do rascunho não encontrado." };

    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return { error: "Credenciais do PayPal não configuradas no servidor." };
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
            if (finalizationResult.error) {
                return { error: `Erro ao finalizar a página: ${finalizationResult.error}` };
            }
            return { success: true, pageId: finalizationResult.pageId };
        } else {
            console.error("PAYPAL CAPTURE FAILED:", data);
            return { error: "A captura do pagamento com PayPal falhou." };
        }
    } catch (error: any) {
        console.error("PAYPAL API ERROR:", error);
        return { error: `Erro de conexão com a API do PayPal: ${error.message}` };
    }
}


// --- FINALIZAR PÁGINA ---
export async function finalizeLovePage(intentId: string, paymentId: string) {
    const db = getAdminFirestore();
    const intentRef = db.collection('payment_intents').doc(intentId);
    
    try {
        const intentDoc = await intentRef.get();
        const data = intentDoc.data();
        if (!data) return { error: "Rascunho não encontrado." };
        if (data.status === 'completed') return { success: true, pageId: data.lovePageId };

        const newPageId = db.collection('lovepages').doc().id;
        const sanitized = sanitizeForFirebase(data);
        
        if (sanitized.timelineEvents) {
            sanitized.timelineEvents = sanitized.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
        }
        sanitized.specialDate = ensureTimestamp(sanitized.specialDate);

        const { payment, ...finalData } = sanitized;
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
        return { error: error.message };
    }
}

export async function verifyPaymentWithMercadoPago(paymentId: string, intentId: string) {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) return { status: 'error' };

    try {
        const client = new MercadoPagoConfig({ accessToken: token });
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
            const result = await finalizeLovePage(intentId, paymentId);
            if (result.error) return { status: 'error', error: result.error };
            return { status: 'approved', pageId: result.pageId };
        }
        return { status: paymentInfo.status };
    } catch (error: any) {
        return { status: 'error', error: error.message };
    }
}
