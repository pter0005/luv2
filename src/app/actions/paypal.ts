'use server'

import { finalizeLovePage } from "@/app/criar/fazer-eu-mesmo/actions";

async function generateAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
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

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(planType: 'basic' | 'advanced') {
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

  const order = await response.json();
  return order.id;
}

export async function capturePayPalOrder(orderID: string, firebaseIntentId: string) {
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

  if (data.status === "COMPLETED") {
    // Pagamento confirmado, chamando função de finalização existente
    try {
      const paymentId = data.id || orderID;
      await finalizeLovePage(firebaseIntentId, paymentId);
      return { success: true };
    } catch (error) {
      console.error("Erro no finalizeLovePage:", error);
      return { success: false, error: "Erro interno." };
    }
  }

  return { success: false, error: "Pagamento não concluído." };
}
