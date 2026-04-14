export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// GET /api/discount?code=xxx&email=xxx — valida o código
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { ok } = rateLimit(`discount-get:${ip}`, 20, 60_000);
  if (!ok) return NextResponse.json({ valid: false, reason: 'rate_limited' }, { status: 429 });
  const code = request.nextUrl.searchParams.get('code');
  const email = request.nextUrl.searchParams.get('email');
  if (!code || typeof code !== 'string' || code.length > 40) return NextResponse.json({ valid: false, reason: 'no_code' });

  const db = getAdminFirestore();
  const snap = await db.collection('discount_codes').doc(code.toUpperCase()).get();
  if (!snap.exists) return NextResponse.json({ valid: false, reason: 'not_found' });

  const d = snap.data()!;
  if (!d.active) return NextResponse.json({ valid: false, reason: 'inactive' });
  if (d.usedCount >= d.maxUses) return NextResponse.json({ valid: false, reason: 'limit_reached' });

  // Checa se este email já usou
  if (email && d.usedEmails?.includes(email.toLowerCase().trim())) {
    return NextResponse.json({ valid: false, reason: 'already_used' });
  }

  return NextResponse.json({
    valid: true,
    discount: d.discount ?? 10,
    remaining: d.maxUses - d.usedCount,
  });
}

// POST /api/discount — marca como usado por um email
export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();
    if (!code || !email) return NextResponse.json({ ok: false });

    const db = getAdminFirestore();
    const ref = db.collection('discount_codes').doc(code.toUpperCase());
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, reason: 'not_found' });

    const d = snap.data()!;
    if (!d.active || d.usedCount >= d.maxUses) return NextResponse.json({ ok: false, reason: 'unavailable' });

    const cleanEmail = email.toLowerCase().trim();
    if (d.usedEmails?.includes(cleanEmail)) return NextResponse.json({ ok: false, reason: 'already_used' });

    await ref.update({
      usedCount: FieldValue.increment(1),
      usedEmails: FieldValue.arrayUnion(cleanEmail),
      lastUsedAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
