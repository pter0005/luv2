import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`❌ Error message: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Fulfill the purchase...
        const intentId = session.client_reference_id;
        const paymentId = session.payment_intent;

        if (!intentId || !paymentId) {
            console.error('Webhook Error: Missing intentId or paymentId in Stripe session');
            return NextResponse.json({ error: 'Missing metadata from session' }, { status: 400 });
        }
        
        console.log(`[STRIPE_WEBHOOK_INFO] Processing successful payment for intent: ${intentId}`);

        // Centralized Logic: Call the "brain" function to finalize the page
        const finalizationResult = await finalizeLovePage(intentId, paymentId.toString());

        if (finalizationResult.error) {
            console.error(`[STRIPE_WEBHOOK_FINALIZE_ERROR] for intent ${intentId}:`, finalizationResult.error);
        } else {
            console.log(`[STRIPE_WEBHOOK_SUCCESS] Page processed for intent ${intentId}. Page ID: ${finalizationResult.pageId}`);
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
