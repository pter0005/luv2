import { NextResponse } from "next/server";
import { finalizeLovePage } from "@/app/criar/fazer-eu-mesmo/actions";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials are not configured.");
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error("Failed to get PayPal access token.");
  const data = await response.json();
  return data.access_token;
}

async function verifyPayPalSignature(req: Request, body: any): Promise<boolean> {
    const headers = req.headers;
    const transmissionId = headers.get('paypal-transmission-id');
    const timestamp = headers.get('paypal-transmission-time');
    const signature = headers.get('paypal-transmission-sig');
    const certUrl = headers.get('paypal-cert-url');
    const authAlgo = headers.get('paypal-auth-algo');

    if (!transmissionId || !timestamp || !signature || !certUrl || !authAlgo || !PAYPAL_WEBHOOK_ID) {
        console.error("Webhook Error: Missing PayPal headers.");
        return false;
    }
    
    try {
        const accessToken = await getPayPalAccessToken();
        const verificationResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                auth_algo: authAlgo,
                cert_url: certUrl,
                transmission_id: transmissionId,
                transmission_sig: signature,
                transmission_time: timestamp,
                webhook_id: PAYPAL_WEBHOOK_ID,
                webhook_event: body
            })
        });

        const verificationData = await verificationResponse.json();
        return verificationData.verification_status === 'SUCCESS';
    } catch (e) {
        console.error("Error verifying PayPal signature:", e);
        return false;
    }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const isValid = await verifyPayPalSignature(req, body);
    if (!isValid) {
      console.warn("PayPal Webhook: INVALID SIGNATURE.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    console.log("PayPal Webhook: Valid signature. Processing event...");
    const eventType = body.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource;
      const intentId = resource.custom_id;
      const transactionId = resource.id;
      const status = resource.status;

      if (status === "COMPLETED" && intentId) {
        console.log(`💰 PAGAMENTO PAYPAL CONFIRMADO! Intent: ${intentId}, Transação: ${transactionId}`);
        await finalizeLovePage(intentId, transactionId);
        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
      } else {
        console.log(`PayPal Webhook: Payment status is ${status} for intent ${intentId}. No action taken.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("CRITICAL PAYPAL WEBHOOK ERROR:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
