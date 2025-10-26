
'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';
import { MercadoPagoConfig, Preference } from 'mercadopago';

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

export async function createPaymentPreference(pageData: any, pageId: string) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('Mercado Pago access token is not configured.');
        return { error: 'A configuração de pagamento não está disponível no momento.' };
    }

    const client = new MercadoPagoConfig({
        accessToken: accessToken,
    });
    const preference = new Preference(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

    let unit_price = 19.90; // Preço base
    if (pageData.timelineEvents && pageData.timelineEvents.length > 0) {
      unit_price += 10.00; // Custo adicional pela linha do tempo
    }

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: pageId,
                        title: 'Página de Amor Personalizada b2gether',
                        quantity: 1,
                        unit_price: unit_price,
                        description: `Página para ${pageData.title}`,
                    },
                ],
                payer: {
                    // Payer info can be collected in the form if needed
                },
                back_urls: {
                    success: `${siteUrl}/criar/fazer-eu-mesmo?status=approved`,
                    failure: `${siteUrl}/criar/fazer-eu-mesmo?status=failure`,
                    pending: `${siteUrl}/criar/fazer-eu-mesmo?status=pending`,
                },
                auto_return: 'approved',
                // We pass the pageId to retrieve it on success
                external_reference: pageId, 
            },
        });
        return { preferenceId: result.id };
    } catch (error: any) {
        console.error("Error creating Mercado Pago preference:", error);
        return { error: error.message || "Falha ao iniciar o pagamento." };
    }
}
