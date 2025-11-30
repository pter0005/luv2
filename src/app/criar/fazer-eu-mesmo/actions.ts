
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { PageData, TimelineEvent, FileWithPreview } from './CreatePageWizard';
import 'dotenv/config';
import type { Bucket } from '@google-cloud/storage';

/**
 * Handles the form submission for AI content suggestions.
 * @param formData - The form data containing the user's input.
 * @returns An object with either suggestions or an error message.
 */
export async function handleSuggestContent(formData: FormData) {
  const userInput = formData.get('userInput') as string;

  if (!userInput) {
    return { error: 'Por favor, descreva o que você gostaria de sugerir.' };
  }

  try {
    const result = await suggestContent({ userInput });
    return { suggestions: result.suggestions };
  } catch (e: any) {
    console.error('Error suggesting content:', e);
    return { error: 'Ocorreu um erro ao gerar sugestões. Tente novamente.' };
  }
}

type PayerData = {
    payerFirstName: string;
    payerLastName: string;
    payerEmail: string;
    payerCpf: string;
}

const uploadFileToStorage = async (storage: Bucket, fileSource: File | string | undefined | null, storagePath: string): Promise<string | null> => {
    if (!fileSource) return null;
    
    const fileRef = storage.file(storagePath);

    try {
        let buffer: Buffer;
        let contentType: string | undefined;

        if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
            const match = fileSource.match(/^data:(.+);base64,(.+)$/);
            if (!match) {
                console.warn(`[UPLOAD WARNING] Invalid data URL format for ${storagePath}`);
                return null;
            }
            contentType = match[1];
            buffer = Buffer.from(match[2], 'base64');
        } else if (fileSource instanceof File) {
            const arrayBuffer = await fileSource.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            contentType = fileSource.type;
        } else {
            console.warn(`[UPLOAD WARNING] Invalid file source type for upload at ${storagePath}:`, typeof fileSource);
            return null;
        }

        await fileRef.save(buffer, {
            metadata: { contentType },
            public: true, // Make file publicly readable
        });

        return fileRef.publicUrl();

    } catch (error) {
        console.error(`[UPLOAD ERROR] Error uploading file to ${storagePath}:`, error);
        throw error;
    }
};


export async function createLovePage(pageData: PageData, pageId: string) {
    console.log(`--- [ACTION] Creating Love Page with ID: ${pageId} ---`);
    try {
        const { getAdminFirestore, getAdminStorage } = await import('@/lib/firebase/admin/config');
        const { FieldValue } = await import('firebase-admin/firestore');
        
        const firestore = getAdminFirestore();
        const storage = getAdminStorage();
        
        const { payment, aiPrompt, ...lovePageDataToSave } = pageData;

        const processImage = (imageSource: FileWithPreview | string | undefined): string | undefined => {
            if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
                return imageSource;
            }
            if (typeof imageSource === 'object' && imageSource?.preview && imageSource.preview.startsWith('data:')) {
                return imageSource.preview;
            }
            return undefined;
        };

        console.log("[ACTION LOG] Uploading gallery images...");
        const uploadedGalleryUrls = await Promise.all(
            (lovePageDataToSave.galleryImages || []).map((img, index) => {
                const base64String = processImage(img);
                return uploadFileToStorage(storage, base64String, `lovepages/${pageId}/gallery/image_${index}.jpg`);
            })
        );
        const finalGalleryImages = uploadedGalleryUrls.filter((url): url is string => !!url);
        console.log(`[ACTION LOG] ${finalGalleryImages.length} gallery images uploaded.`);

        console.log("[ACTION LOG] Uploading timeline images...");
        const finalTimelineEvents = await Promise.all(
            (lovePageDataToSave.timelineEvents || []).map(async (event, index) => {
                const base64String = processImage(event.image);
                const imageUrl = await uploadFileToStorage(storage, base64String, `lovepages/${pageId}/timeline/event_${index}.jpg`);
                return {
                    id: event.id || String(index),
                    description: event.description,
                    date: event.date,
                    image: imageUrl || null
                };
            })
        );
        console.log(`[ACTION LOG] ${finalTimelineEvents.length} timeline events processed.`);
        
        console.log("[ACTION LOG] Uploading other assets (audio, puzzle, video)...");
        const audioRecordingUrl = await uploadFileToStorage(storage, lovePageDataToSave.audioRecording, `lovepages/${pageId}/audio/recording.webm`);
        const puzzleImageUrl = await uploadFileToStorage(storage, processImage(lovePageDataToSave.puzzleImage), `lovepages/${pageId}/puzzle/puzzle_image.jpg`);
        const backgroundVideoUrl = await uploadFileToStorage(storage, lovePageDataToSave.backgroundVideo, `lovepages/${pageId}/background/background_video.mp4`);
        console.log("[ACTION LOG] Asset upload complete.");

        const finalData = {
            ...lovePageDataToSave,
            galleryImages: finalGalleryImages,
            timelineEvents: finalTimelineEvents,
            audioRecording: audioRecordingUrl || null,
            puzzleImage: puzzleImageUrl || null,
            createdAt: FieldValue.serverTimestamp(),
            backgroundVideo: backgroundVideoUrl || null,
        };

        console.log(`[ACTION LOG] Saving final page data to Firestore at lovepages/${pageId}...`);
        const lovepagesRef = firestore.collection('lovepages').doc(pageId);
        await lovepagesRef.set(finalData);
        console.log("[ACTION LOG] Firestore save complete.");

        return { pageId };
    } catch (error: any) {
        console.error(`---!!! ERROR in createLovePage for Page ID: ${pageId} !!!---`);
        console.error("Error Message:", error.message);
        console.error("Stack Trace:", error.stack);
        return { error: `Não foi possível salvar os dados da sua página: ${error.message}` };
    }
}


export async function initiatePayment(payerData: PayerData, pageData: PageData) {
    console.log("--- [ACTION] Starting PIX Payment Initiation ---");
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
        const errorMsg = 'CRITICAL: Mercado Pago access token is not configured.';
        console.error(`[ACTION ERROR] ${errorMsg}`);
        return { error: 'A configuração de pagamento não está disponível no momento.' };
    }

    const { getAdminFirestore } = await import('@/lib/firebase/admin/config');
    const { FieldValue } = await import('firebase-admin/firestore');
    const firestore = getAdminFirestore();

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    
    const unit_price = 0.01; // TEST PRICE
    const cleanCpf = payerData.payerCpf.replace(/\D/g, '');
        
    const pageId = firestore.collection('lovepages').doc().id;

    try {
        console.log("[ACTION LOG] Creating payment object for Mercado Pago API...");
        const result = await payment.create({
            body: {
                transaction_amount: unit_price,
                description: `Página de Amor: ${pageData.title}`,
                payment_method_id: 'pix',
                payer: {
                    email: payerData.payerEmail,
                    first_name: payerData.payerFirstName,
                    last_name: payerData.payerLastName,
                    identification: { type: 'CPF', number: cleanCpf },
                },
                external_reference: pageId, 
            },
            idempotencyKey: pageId, 
        });
        console.log("[ACTION LOG] Mercado Pago API response received. Payment ID:", result.id);

        if (!result.id || !result.point_of_interaction?.transaction_data) {
             throw new Error('Invalid response from Mercado Pago API when creating payment.');
        }

        const pixData = {
            paymentId: result.id,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
            qrCode: result.point_of_interaction.transaction_data.qr_code,
        };

        console.log("[ACTION LOG] Saving initial payment document to Firestore...");
        const paymentRef = firestore.collection('payments').doc(result.id.toString());
        await paymentRef.set({
            status: 'pending',
            lovePageId: pageId, 
            createdAt: FieldValue.serverTimestamp(),
            payer_email: payerData.payerEmail,
            lovePageData: pageData, 
        });
        console.log(`[ACTION LOG] Payment document saved for paymentId: ${result.id} linked to lovePageId: ${pageId}`);

        return { pixData, pageId: pageId };

    } catch (error: any) {
        console.error("---!!! ERROR in PIX Payment Creation !!!---");
        console.error("Error Message:", error.message);
        const errorMessage = error?.cause?.error?.message || error.message || "Falha ao iniciar o pagamento com PIX.";
        return { error: errorMessage };
    }
}


export async function checkPaymentStatus(paymentId: string) {
    console.log(`--- [ACTION] Checking status for payment ID: ${paymentId} ---`);
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('[ACTION ERROR] Mercado Pago access token is not configured.');
        throw new Error('A configuração de pagamento não está disponível.');
    }

    try {
        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);
        
        console.log(`[ACTION LOG] Fetching payment details from Mercado Pago for ID: ${paymentId}`);
        const paymentInfo = await payment.get({ id: paymentId });
        console.log(`[ACTION LOG] Mercado Pago status for ${paymentId} is '${paymentInfo.status}'.`);

        if (paymentInfo.status === 'approved') {
            const { getAdminFirestore } = await import('@/lib/firebase/admin/config');
            const { FieldValue } = await import('firebase-admin/firestore');
            const firestore = getAdminFirestore();

            const paymentRef = firestore.collection('payments').doc(paymentId);
            const paymentDoc = await paymentRef.get();

            if (!paymentDoc.exists) {
                throw new Error(`Documento de pagamento ${paymentId} não encontrado no Firestore.`);
            }

            const paymentData = paymentDoc.data();
            if (paymentData?.pageCreationStatus === 'completed') {
                console.log(`[ACTION LOG] Love page for payment ${paymentId} already created. Returning success.`);
                return { status: 'approved', pageId: paymentData.lovePageId };
            }

            console.log(`[ACTION LOG] Payment ${paymentId} approved. Proceeding to create love page.`);
            
            if (!paymentData?.lovePageData || !paymentData?.lovePageId) {
                throw new Error(`lovePageData or lovePageId missing from Firestore for payment ${paymentId}.`);
            }

            const creationResult = await createLovePage(paymentData.lovePageData, paymentData.lovePageId);
            if (creationResult.error) {
                throw new Error(`Falha ao criar a página de amor: ${creationResult.error}`);
            }

            await paymentRef.update({
                status: 'approved',
                pageCreationStatus: 'completed',
                updatedAt: FieldValue.serverTimestamp(),
            });
            console.log(`[ACTION LOG] Love page ${paymentData.lovePageId} created and payment doc updated.`);
            return { status: 'approved', pageId: paymentData.lovePageId };
        }
        
        return { status: paymentInfo.status || 'unknown' };

    } catch (error: any) {
        console.error(`[ACTION ERROR] Error in checkPaymentStatus for paymentId ${paymentId}:`, error);
        throw new Error(error.message || 'Falha ao verificar o status do pagamento.');
    }
}
