import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { FieldValue } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const ALLOWED_STEPS = new Set([
  'recipient',
  'title', 'message', 'specialDate', 'gallery', 'timeline', 'music',
  'background', 'intro', 'puzzle', 'memory', 'quiz', 'word-game',
  'extras',
  'plan', 'voice', 'payment',
  'pix_generated', 'paid',
]);

function brDateKey(): string {
  return new Date()
    .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-');
}

const ALLOWED_SEGMENTS = new Set([
  'namorade', 'crush', 'aniversario', 'casamento', 'maeepai', 'amigo', 'autoamor',
]);
const ALLOWED_LOCALES = new Set(['pt', 'en']);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(`funnel:${ip}`, 60, 60_000);
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  try {
    const body = await req.json();
    const { step } = body;
    if (typeof step !== 'string' || !ALLOWED_STEPS.has(step)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    const segment = typeof body.segment === 'string' && ALLOWED_SEGMENTS.has(body.segment) ? body.segment : null;
    const locale = typeof body.locale === 'string' && ALLOWED_LOCALES.has(body.locale) ? body.locale : null;

    const dateKey = brDateKey();
    const db = getAdminFirestore();

    // Agregado global (back-compat) + recortes por segmento/locale. Admin dashboard
    // pode ler `steps` pro total histórico ou `bySegment.<seg>` / `byLocale.<loc>`
    // pra conversão por público. Tudo num único doc/dia — zero joins.
    const updates: Record<string, any> = {
      steps: { [step]: FieldValue.increment(1) },
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (segment) updates.bySegment = { [segment]: { [step]: FieldValue.increment(1) } };
    if (locale) updates.byLocale = { [locale]: { [step]: FieldValue.increment(1) } };

    await db.collection('wizard_funnel').doc(dateKey).set(updates, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[funnel-step] Failed:', e?.message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
