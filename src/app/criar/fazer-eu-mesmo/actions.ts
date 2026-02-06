
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import type { PageData } from './CreatePageWizard';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { MercadoPagoConfig, Payment } from 'mercadopago'; 
import { Timestamp } from 'firebase-admin/firestore';
import "dotenv/config";
import Stripe from 'stripe';


// TRADUTOR UNIVERSAL DE DATAS (MATA O ERRO DE "SECONDS")
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
        console.error("ERRO NO SERVIDOR:", error.message);
        return { 
            error: 'Falha no servidor ao salvar rascunho.',
            details: {
                 log: `Falha ao salvar dados para o usuário ${restOfPageData.userId} com intentId ${intentId || '(novo)'}. Erro: ${error.code} - ${error.message}`
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
        return { error: `Erro ao processar pagamento: ${error.message}` }; 
    }
}

export async function createStripeCheckoutSession(intentId: string, plan: 'basico' | 'avancado', domain: string) {
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
        return { error: 'Stripe secret key not configured on the server.' };
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
    });

    const prices = {
        basico: {
            unit_amount: 1490, // $14.90 in cents
            name: 'Basic Plan',
            description: 'A beautiful, temporary page to share your love.'
        },
        avancado: {
            unit_amount: 1990, // $19.90 in cents
            name: 'Advanced Plan',
            description: 'A permanent page with all features unlocked.'
        }
    };
    
    const selectedPrice = prices[plan];

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selectedPrice.name,
                            description: selectedPrice.description,
                        },
                        unit_amount: selectedPrice.unit_amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${domain}/pagamento/sucesso`,
            cancel_url: `${domain}/pagamento/cancelado`,
            client_reference_id: intentId, // THIS IS KEY! Link Stripe session to our intentId
        });

        if (!session.url) {
            return { error: "Could not create Stripe session." };
        }

        return { url: session.url };

    } catch (error: any) {
        console.error("Stripe Session Creation Error:", error);
        return { error: `Stripe Error: ${error.message}` };
    }
}

// ----------------------------------------------------------------
// NOVA LÓGICA DE MOVIMENTAÇÃO DE ARQUIVOS (ROBUSTA)
// ----------------------------------------------------------------

/**
 * Move um único arquivo da pasta temporária para a permanente e retorna os novos dados.
 * É idempotente: se o processo falhar e for re-executado, ele não quebra.
 */
async function moveFile(
    fileData: { url: string, path: string }, 
    pageId: string, 
    targetFolder: string
): Promise<{ url: string; path: string }> {
    // IDEMPOTÊNCIA 1: Se o arquivo NÃO estiver na pasta 'temp/', assume que já foi movido e retorna os dados originais.
    if (!fileData || !fileData.path || !fileData.path.includes('temp/')) {
        return fileData; 
    }

    try {
        const storage = getAdminStorage();
        const oldPath = fileData.path;
        const fileName = oldPath.split('/').pop();
        
        if (!fileName) {
            console.error(`Nome do arquivo inválido para o caminho: ${oldPath}`);
            return fileData; // Retorna original se não conseguir extrair o nome
        }
        
        // O novo caminho agora é `lovepages/{pageId}/{tipo_do_arquivo}/{nome_do_arquivo}`
        const newPath = `lovepages/${pageId}/${targetFolder}/${fileName}`;
        
        const oldFile = storage.file(oldPath);
        const newFile = storage.file(newPath);

        // Copia o arquivo para o novo local
        await oldFile.copy(newFile);
        
        // Torna o novo arquivo público (ESSENCIAL!)
        await newFile.makePublic();

        // Deleta o arquivo antigo da pasta temp
        await oldFile.delete();

        // Retorna os novos dados com a URL pública permanente
        return {
            url: newFile.publicUrl(),
            path: newPath,
        };
    } catch (error: any) {
        // IDEMPOTÊNCIA 2 (Tratamento de Erro): Se o arquivo de origem não existir (404),
        // pode ser que o processo tenha sido interrompido após a cópia mas antes da deleção.
        if (error.code === 404) {
            const newFile = getAdminStorage().file(`lovepages/${pageId}/${targetFolder}/${fileData.path.split('/').pop()}`);
            const [exists] = await newFile.exists();
            if (exists) {
                console.warn(`Arquivo temporário não encontrado, mas arquivo final existe. Assumindo que já foi movido: ${newFile.name}`);
                // Garante que o arquivo de destino seja público e retorna sua URL
                await newFile.makePublic();
                return { url: newFile.publicUrl(), path: newFile.name };
            }
        }
        
        console.error(`Falha ao mover arquivo de ${fileData.path} para ${targetFolder}:`, error);
        return fileData; // Em caso de erro, mantém os dados antigos para não quebrar
    }
}


/**
 * Orquestra a movimentação de todos os arquivos de uma página para o armazenamento permanente.
 */
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


// ----------------------------------------------------------------
// LÓGICA PRINCIPAL DE FINALIZAÇÃO (ATUALIZADA)
// ----------------------------------------------------------------

export async function finalizeLovePage(intentId: string, paymentId: string) {
    const db = getAdminFirestore();
    const intentRef = db.collection('payment_intents').doc(intentId);
    try {
        const intentDoc = await intentRef.get();
        const data = intentDoc.data();
        if (!data) return { error: `Rascunho com ID ${intentId} não encontrado.` };
        if (data.status === 'completed') return { success: true, pageId: data.lovePageId };

        const newPageId = db.collection('lovepages').doc().id;
        
        // 1. Sanitiza os dados e normaliza as datas
        const sanitized = sanitizeForFirebase(data);
        if (sanitized.timelineEvents) {
            sanitized.timelineEvents = sanitized.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
        }
        if (sanitized.specialDate) {
            sanitized.specialDate = ensureTimestamp(sanitized.specialDate);
        }
        
        // 2. Separa os dados e define o ID e a data de criação
        const { payment, aiPrompt, ...finalPageData } = sanitized;
        finalPageData.id = newPageId;
        finalPageData.createdAt = Timestamp.now();
        finalPageData.paymentId = paymentId; // Guarda o ID do pagamento para referência

        // LÓGICA DE EXPIRAÇÃO
        if (finalPageData.plan === 'basico') {
            const twelveHoursInMillis = 12 * 60 * 60 * 1000;
            finalPageData.expireAt = Timestamp.fromMillis(Date.now() + twelveHoursInMillis);
        }

        // 3. (ETAPA CRUCIAL) Move os arquivos para o local permanente ANTES de salvar no DB
        const dataWithPermanentFiles = await moveFilesToPermanentStorage(finalPageData, newPageId);

        // 4. Salva a versão final da página com as URLs permanentes
        await db.collection('lovepages').doc(newPageId).set(dataWithPermanentFiles);
        
        // 5. Cria uma referência no perfil do usuário
        if (data.userId) {
            await db.collection('users').doc(data.userId).collection('love_pages').doc(newPageId).set({ 
                title: finalPageData.title, 
                pageId: newPageId, 
                createdAt: Timestamp.now() 
            });
        }


        // 6. Atualiza o rascunho como 'completed'
        await intentRef.update({ status: 'completed', lovePageId: newPageId });
        
        return { success: true, pageId: newPageId };
    } catch (error: any) { 
        console.error("Erro no Servidor (finalizeLovePage):", error);
        return { error: `Erro ao finalizar a página: ${error.message}` };
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
                return { status: 'error', error: result.error }; // Retorna o erro específico da finalização
            }
            return { status: 'approved', pageId: result.pageId };
        }

        return { status: paymentInfo.status };
    } catch (error: any) {
        console.error("Erro no Servidor (verifyPaymentWithMercadoPago):", error);
        return { status: 'error', error: `Falha na verificação com Mercado Pago: ${error.message}` };
    }
}

// Manter a função de sugestão de conteúdo que já estava aqui
export { suggestContent };


// --- PAYPAL ACTIONS ---
async function generateAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("PayPal credentials not configured.");
    throw new Error("Credenciais do PayPal não configuradas.");
  }

  const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const base = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.paypal.com';

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to generate PayPal access token:", response.status, errorBody);
    throw new Error("Failed to generate access token.");
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(planType: string) {
  try {
      const accessToken = await generateAccessToken();
      const value = (planType === 'advanced' || planType === 'avancado') ? "19.90" : "14.90";
      const base = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.paypal.com';

      const response = await fetch(`${base}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: value,
              },
              description: `MyCupid - ${planType} Plan`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("PayPal Create Order Error:", errorBody);
        throw new Error("Failed to create PayPal order.");
      }

      const order = await response.json();
      console.log("Created PayPal Order ID:", order.id);
      return order.id;
  } catch(error) {
    console.error("[SERVER] createPayPalOrder error:", error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string, intentId: string) {
  try {
    const accessToken = await generateAccessToken();
    const base = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.paypal.com';

    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await captureResponse.json();
    console.log("PayPal Capture Response:", data);

    if (data.status === 'COMPLETED') {
      const paymentId = data.id || orderId;
      const result = await finalizeLovePage(intentId, paymentId);
      
      if (result.error) {
          console.error("Error in finalizeLovePage after PayPal capture:", result.error);
          return { success: false, error: "Internal error finalizing the page." };
      }
      
      console.log("finalizeLovePage successful for intent:", intentId);
      return { success: true, pageId: result.pageId };
    }
    
    console.error("PayPal payment not completed. Status:", data.status, data);
    return { success: false, error: `Payment not completed. Status: ${data.status}` };

  } catch (error: any) {
    console.error("[SERVER] Error capturing PayPal order:", error);
    return { success: false, error: "Server error capturing payment." };
  }
}
