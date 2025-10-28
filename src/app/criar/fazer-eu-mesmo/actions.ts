
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { PageData } from './CreatePageWizard';

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

export async function createPixPayment(payerData: PayerData, pageTitle: string) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.error('Mercado Pago access token is not configured.');
        return { error: 'A configuração de pagamento não está disponível no momento. Verifique as chaves da API.' };
    }

    if (!payerData || !payerData.payerCpf) {
        return { error: "Dados do pagador, especialmente o CPF, são obrigatórios." };
    }

    const client = new MercadoPagoConfig({
        accessToken: accessToken,
    });
    const payment = new Payment(client);

    const unit_price = 19.90; // Preço fixo
    
    const cleanCpf = payerData.payerCpf.replace(/\D/g, '');


    try {
        const result = await payment.create({
            body: {
                transaction_amount: unit_price,
                description: `Página para ${pageTitle}`,
                payment_method_id: 'pix',
                payer: {
                    email: payerData.payerEmail,
                    first_name: payerData.payerFirstName,
                    last_name: payerData.payerLastName,
                    identification: {
                        type: 'CPF',
                        number: cleanCpf,
                    },
                },
                 notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/mercadopago`,
                 // We will set external_reference after creating the doc in Firestore
            },
        });

        if (!result.id || !result.point_of_interaction?.transaction_data) {
             throw new Error('Resposta inválida da API do Mercado Pago ao criar pagamento.');
        }

        const pixData = {
            paymentId: result.id,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
            qrCode: result.point_of_interaction.transaction_data.qr_code,
        }

        if (!pixData.qrCodeBase64 || !pixData.qrCode) {
            throw new Error('Não foi possível obter os dados do PIX a partir da resposta da API.');
        }

        return { pixData };
    } catch (error: any) {
        console.error("Error creating Mercado Pago PIX payment:", error.cause ?? error.message);
        const errorMessage = error?.cause?.error?.message || "Falha ao iniciar o pagamento com PIX.";
        return { error: errorMessage };
    }
}


export async function checkPaymentStatus(paymentId: number) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('Mercado Pago access token is not configured.');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    try {
        const result = await payment.get({ id: paymentId });
        return { status: result.status };
    } catch (error: any) {
        console.error(`Error checking payment status for ID ${paymentId}:`, error.message);
        // Return a neutral status or error status so the client can decide what to do
        return { status: 'error', message: error.message };
    }
}


// Helper function to upload a file (as a Base64 string) to Firebase Storage
const uploadFileToStorage = async (fileString: string, storagePath: string): Promise<string> => {
    const { firebaseApp } = initializeFirebase();
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, storagePath);

    try {
        await uploadString(storageRef, fileString, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error(`Error uploading file to ${storagePath}:`, error);
        throw error;
    }
};

export async function createLovePage(pageData: PageData) {
    try {
        const { firestore } = initializeFirebase();
        const lovePagesCollection = collection(firestore, 'lovepages');

        // We remove the payment details before saving to Firestore for security and privacy.
        const { payment, ...lovePageDataToSave } = pageData;

        // Create a temporary ID for storage paths to avoid collisions
        const tempId = lovePagesCollection.doc().id;

        // Process gallery images
        if (lovePageDataToSave.galleryImages && lovePageDataToSave.galleryImages.length > 0) {
            lovePageDataToSave.galleryImages = await Promise.all(
                lovePageDataToSave.galleryImages.map((image, index) => 
                    uploadFileToStorage(image, `lovepages/${tempId}/gallery/image_${index}.jpg`)
                )
            );
        }

        // Process timeline events images
        if (lovePageDataToSave.timelineEvents && lovePageDataToSave.timelineEvents.length > 0) {
            lovePageDataToSave.timelineEvents = await Promise.all(
                lovePageDataToSave.timelineEvents.map(async (event, index) => {
                    if (event.image) {
                        const imageUrl = await uploadFileToStorage(event.image, `lovepages/${tempId}/timeline/event_${index}.jpg`);
                        return { ...event, image: imageUrl };
                    }
                    return event;
                })
            );
        }

        // Process audio recording
        if (lovePageDataToSave.audioRecording) {
            lovePageDataToSave.audioRecording = await uploadFileToStorage(lovePageDataToSave.audioRecording, `lovepages/${tempId}/audio/recording.webm`);
        }
        
        // Process puzzle image
        if (lovePageDataToSave.puzzleImage) {
            lovePageDataToSave.puzzleImage = await uploadFileToStorage(lovePageDataToSave.puzzleImage, `lovepages/${tempId}/puzzle/puzzle_image.jpg`);
        }

        // Process background video
        if (lovePageDataToSave.backgroundVideo) {
            lovePageDataToSave.backgroundVideo = await uploadFileToStorage(lovePageDataToSave.backgroundVideo, `lovepages/${tempId}/background/background_video.mp4`);
        }

        const docRef = await addDoc(lovePagesCollection, {
            ...lovePageDataToSave,
            createdAt: serverTimestamp(),
        });

        return { pageId: docRef.id };
    } catch (error: any) {
        console.error("Error creating love page in Firestore:", error);
        return { error: "Não foi possível salvar os dados da sua página. Por favor, tente novamente." };
    }
}
