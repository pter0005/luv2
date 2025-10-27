
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

type PayerData = {
    payerFirstName: string;
    payerLastName: string;
    payerEmail: string;
    payerCpf: string;
}

export async function createPixPayment(payerData: PayerData, hasTimeline: boolean, pageTitle: string, pageId: string) {
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
                 external_reference: pageId,
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
        const errorMessage = error?.cause?.error?.message || error.message || "Falha ao iniciar o pagamento com PIX.";
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
