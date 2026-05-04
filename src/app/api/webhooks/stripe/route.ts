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

  // Dedup ATÔMICO: write-or-skip via transaction. Antes era read+write
  // separados → 2 webhooks concorrentes podiam ambos passar e processar 2x.
  const db = getAdminFirestore();
  const eventRef = db.collection('stripe_events').doc(event.id);
  let alreadyProcessed = false;
  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(eventRef);
      if (snap.exists) { alreadyProcessed = true; return; }
      t.set(eventRef, { type: event.type, createdAt: Timestamp.now() });
    });
  } catch (err: any) {
    console.error('[stripe-webhook] dedup transaction failed:', err?.message);
    return NextResponse.json({ error: 'dedup_failed' }, { status: 500 });
  }
  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  try {
    // Multibanco (PT): Stripe dispara checkout.session.completed com payment_status='unpaid'
    // quando a referência é gerada e ainda não paga. O dinheiro só entra dias depois.
    // Pra capturar ambos os fluxos (card-instant + multibanco-async), tratamos:
    //   checkout.session.completed (paid)         → finalize agora
    //   checkout.session.async_payment_succeeded  → finalize depois (multibanco confirmado)
    //   checkout.session.async_payment_failed     → log, intent fica pending
    const isFinalizeEvent =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded';
    const isAsyncFailure = event.type === 'checkout.session.async_payment_failed';

    if (isFinalizeEvent) {
      const session = event.data.object as Stripe.Checkout.Session;
      // Pra multibanco em "completed" o status vem 'unpaid' — só finaliza
      // de fato em async_payment_succeeded. Card vem 'paid' em completed.
      const isPaid = session.payment_status === 'paid';

      if (session.metadata?.type === 'upgrade' && session.metadata?.pageId) {
        if (isPaid) {
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
        } else if (isPaid) {
          const result = await finalizeLovePage(intentId, session.id);
          if (!result.success) {
            console.error('[stripe-webhook] finalizeLovePage failed', {
              intentId, sessionId: session.id, error: result.error,
            });
          }
        } else {
          // Multibanco aguardando pagamento — registra pra UI mostrar "pendente".
          await db.collection('payment_intents').doc(intentId).set(
            { stripeStatus: 'awaiting_payment', stripeSessionId: session.id, updatedAt: Timestamp.now() },
            { merge: true },
          ).catch(() => {});
          console.log('[stripe-webhook] multibanco awaiting payment', { intentId, sessionId: session.id });
        }
      }
    } else if (isAsyncFailure) {
      const session = event.data.object as Stripe.Checkout.Session;
      const intentId = session.metadata?.intentId;
      if (intentId) {
        await db.collection('payment_intents').doc(intentId).set(
          { stripeStatus: 'failed', stripeSessionId: session.id, updatedAt: Timestamp.now() },
          { merge: true },
        ).catch(() => {});
      }
      console.warn('[stripe-webhook] async payment failed', { sessionId: session.id, intentId });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[stripe-webhook] handler error:', err?.message);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }
}
