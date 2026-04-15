import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { FieldValue } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const ALLOWED_STEPS = new Set([
  'title', 'message', 'specialDate', 'gallery', 'timeline', 'music',
  'background', 'intro', 'puzzle', 'memory', 'quiz', 'word-game',
  'plan', 'voice', 'payment',
  'pix_generated', 'paid',
]);

function brDateKey(): string {
  return new Date()
    .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(`funnel:${ip}`, 60, 60_000);
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  try {
    const { step } = await req.json();
    if (typeof step !== 'string' || !ALLOWED_STEPS.has(step)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const dateKey = brDateKey();
    const db = getAdminFirestore();
    await db.collection('wizard_funnel').doc(dateKey).set(
      {
        steps: { [step]: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[funnel-step] Failed:', e?.message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
