import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import { applyUpgrade } from '@/app/p/[pageId]/upgradeActions';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

// Stripe requires raw body pra validar signature — Next 14 app router
// já nos entrega isso via req.text() antes de parsear JSON.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  let event: Stripe.Event;
  const body = await req.text();
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error('[stripe-webhook] signature verify failed:', err?.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  // Dedup: checa se já processamos esse event.id
  const db = getAdminFirestore();
  const eventRef = db.collection('stripe_events').doc(event.id);
  const eventSnap = await eventRef.get();
  if (eventSnap.exists) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === 'upgrade' && session.metadata?.pageId) {
        if (session.payment_status === 'paid') {
          const result = await applyUpgrade(session.metadata.pageId, session.id);
          if (!result.success) {
            console.error('[stripe-webhook] applyUpgrade failed', {
              pageId: session.metadata.pageId, sessionId: session.id, error: result.error,
            });
          }
        }
      } else {
        const intentId = session.metadata?.intentId;
        if (!intentId) {
          console.error('[stripe-webhook] missing intentId in metadata', session.id);
        } else if (session.payment_status === 'paid') {
          const result = await finalizeLovePage(intentId, session.id);
          if (!result.success) {
            console.error('[stripe-webhook] finalizeLovePage failed', {
              intentId, sessionId: session.id, error: result.error,
            });
          }
        }
      }
    }

    await eventRef.set({
      type: event.type,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[stripe-webhook] handler error:', err?.message);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }
}
