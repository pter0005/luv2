'use server'

import { finalizeLovePage } from "@/app/criar/fazer-eu-mesmo/actions";

async function generateAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("PayPal credentials not configured.");
    throw new Error("Credenciais do PayPal não configuradas.");
  }

  const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");

  const response = await fetch(`${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v1/oauth2/token`, {
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

export async function createPayPalOrder(planType: 'basic' | 'advanced') {
  try {
      const accessToken = await generateAccessToken();
      const value = planType === 'advanced' ? "19.99" : "9.99";

      const response = await fetch(`${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v2/checkout/orders`, {
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
        console.error("Failed to create PayPal order:", response.status, errorBody);
        throw new Error("Failed to create order.");
      }

      const order = await response.json();
      console.log("Created PayPal Order:", order.id);
      return order.id;
  } catch(error) {
    console.error("[SERVER] Error creating PayPal order:", error);
    throw error;
  }
}

export async function capturePayPalOrder(orderID: string, firebaseIntentId: string) {
  try {
    const accessToken = await generateAccessToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    console.log("PayPal Capture Response:", data);

    if (data.status === "COMPLETED") {
      try {
        const paymentId = data.id || orderID;
        const result = await finalizeLovePage(firebaseIntentId, paymentId);
        
        if (result.error) {
            console.error("Erro no finalizeLovePage após captura do PayPal:", result.error);
            return { success: false, error: "Erro interno ao finalizar a página." };
        }
        
        console.log("finalizeLovePage successful for intent:", firebaseIntentId);
        return { success: true, pageId: result.pageId };
      } catch (error) {
        console.error("Erro crítico no finalizeLovePage:", error);
        return { success: false, error: "Erro interno." };
      }
    }

    console.error("PayPal payment not completed. Status:", data.status, data);
    return { success: false, error: `Pagamento não concluído. Status: ${data.status}` };
  } catch(error) {
    console.error("[SERVER] Error capturing PayPal order:", error);
    return { success: false, error: "Erro de servidor ao capturar pagamento." };
  }
}
