
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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

export async function createPixPayment(pageData: any, pageId: string) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.error('Mercado Pago access token is not configured.');
        return { error: 'A configuração de pagamento não está disponível no momento. Verifique as chaves da API.' };
    }

    const client = new MercadoPagoConfig({
        accessToken: accessToken,
    });
    const payment = new Payment(client);

    let unit_price = 19.90; // Preço base
    if (pageData.timelineEvents && pageData.timelineEvents.length > 0) {
      unit_price += 10.00; // Custo adicional pela linha do tempo
    }

    try {
        const result = await payment.create({
            body: {
                transaction_amount: unit_price,
                description: `Página para ${pageData.title}`,
                payment_method_id: 'pix',
                payer: {
                    email: `test_user_${Math.floor(Math.random() * 1000000)}@testuser.com`, // Use a different test user
                    first_name: 'Pedro',
                    last_name: 'Henrique Oliveira de Paula',
                    identification: {
                        type: 'CPF',
                        number: '58954844847',
                    },
                },
                 notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/mercadopago`,
                 external_reference: pageId,
            },
        });

        const pixData = {
            qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            qrCode: result.point_of_interaction?.transaction_data?.qr_code,
        }

        if (!pixData.qrCodeBase64 || !pixData.qrCode) {
            throw new Error('Não foi possível obter os dados do PIX a partir da resposta da API.');
        }


        return { pixData };
    } catch (error: any) {
        console.error("Error creating Mercado Pago PIX payment:", error.cause ?? error.message);
        const errorMessage = error?.cause?.error?.message || error.message || "Falha ao iniciar o pagamento com PIX.";
        return { error: errorMessage };
    }
}
