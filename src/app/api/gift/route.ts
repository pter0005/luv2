export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/gift?token=xxx — valida o token e retorna os créditos
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false });

  const db = getAdminFirestore();
  const snap = await db.collection('gift_tokens').doc(token).get();
  if (!snap.exists) return NextResponse.json({ valid: false });

  const d = snap.data()!;
  if (d.used) return NextResponse.json({ valid: false, reason: 'used' });

  return NextResponse.json({ valid: true, credits: d.credits ?? 1 });
}

// POST /api/gift — marca o token como usado
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ ok: false });

    const db = getAdminFirestore();
    const ref = db.collection('gift_tokens').doc(token);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.used) return NextResponse.json({ ok: false, reason: 'invalid_or_used' });

    await ref.update({ used: true, usedAt: Timestamp.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
