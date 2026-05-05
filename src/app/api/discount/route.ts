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

  // CRÍTICO: NÃO usa fallback ?? 10. Se doc não tem campo discount, é bug
  // de criação — falha cedo pra admin perceber em vez de aplicar R$10
  // silenciosamente em código que ele criou com outro valor.
  const discountValue = Number(d.discount);
  if (!isFinite(discountValue) || discountValue <= 0) {
    console.error(`[discount] Code ${code} sem campo discount válido:`, d);
    return NextResponse.json({ valid: false, reason: 'broken_code' });
  }

  return NextResponse.json({
    valid: true,
    discount: discountValue,
    remaining: (d.maxUses ?? 0) - (d.usedCount ?? 0),
  });
}

// POST /api/discount — marca como usado por um email
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`discount-post:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  try {
    const { code, email } = await request.json();
    if (!code || !email) return NextResponse.json({ ok: false });

    const db = getAdminFirestore();
    const ref = db.collection('discount_codes').doc(code.toUpperCase());
    const cleanEmail = email.toLowerCase().trim();

    // TRANSACTION: previne race condition onde 2 requests concorrentes leem
    // usedCount/usedEmails antes do primeiro write — ambos passam, ambos
    // incrementam, código fica "esgotado" prematuramente OU email único é
    // marcado 2x.
    try {
      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('not_found');
        const d = snap.data()!;
        if (!d.active) throw new Error('inactive');
        if ((d.usedCount ?? 0) >= (d.maxUses ?? 0)) throw new Error('limit_reached');
        if (Array.isArray(d.usedEmails) && d.usedEmails.includes(cleanEmail)) {
          throw new Error('already_used');
        }
        t.update(ref, {
          usedCount: FieldValue.increment(1),
          usedEmails: FieldValue.arrayUnion(cleanEmail),
          lastUsedAt: Timestamp.now(),
        });
      });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      const reason = e?.message || 'unavailable';
      return NextResponse.json({ ok: false, reason });
    }
  } catch {
    return NextResponse.json({ ok: false });
  }
}
