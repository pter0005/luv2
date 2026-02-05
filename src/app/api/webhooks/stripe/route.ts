import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeLovePage } from "@/app/criar/fazer-eu-mesmo/actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // O evento que nos interessa: Checkout Completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Aqui pegamos o ID que você enviou no actions.ts
    const intentId = session.client_reference_id;
    const paymentId = session.payment_intent as string;

    if (intentId) {
      console.log(`💰 Pagamento Stripe aprovado para intent: ${intentId}`);
      // Chama a sua função que move as fotos e cria a página final
      await finalizeLovePage(intentId, paymentId);
    } else {
        console.error('Stripe Webhook: client_reference_id (intentId) não encontrado na sessão.');
    }
  }

  return new NextResponse(null, { status: 200 });
}
