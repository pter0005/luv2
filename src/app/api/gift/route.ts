export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// GET /api/gift?token=xxx — valida o token e retorna os créditos
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { ok } = rateLimit(`gift-get:${ip}`, 20, 60_000);
  if (!ok) return NextResponse.json({ valid: false, reason: 'rate_limited' }, { status: 429 });
  const token = request.nextUrl.searchParams.get('token');
  if (!token || typeof token !== 'string' || token.length > 100) return NextResponse.json({ valid: false });

  const db = getAdminFirestore();
  const snap = await db.collection('gift_tokens').doc(token).get();
  if (!snap.exists) return NextResponse.json({ valid: false });

  const d = snap.data()!;
  if (d.used) return NextResponse.json({ valid: false, reason: 'used' });

  return NextResponse.json({ valid: true, credits: d.credits ?? 1, plan: d.plan || 'avancado' });
}

// POST /api/gift — marca o token como usado (com TRANSACTION pra evitar
// double-spend: 2 requests concorrentes liam used=false, ambos updatavam).
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`gift-post:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string' || token.length > 100) {
      return NextResponse.json({ ok: false });
    }

    const db = getAdminFirestore();
    const ref = db.collection('gift_tokens').doc(token);

    // Atomic check-then-update: se já foi usado, transaction aborta.
    try {
      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('not_found');
        if (snap.data()?.used) throw new Error('already_used');
        t.update(ref, { used: true, usedAt: Timestamp.now() });
      });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      const reason = e?.message === 'already_used' ? 'already_used'
        : e?.message === 'not_found' ? 'not_found'
        : 'invalid_or_used';
      return NextResponse.json({ ok: false, reason });
    }
  } catch {
    return NextResponse.json({ ok: false });
  }
}
