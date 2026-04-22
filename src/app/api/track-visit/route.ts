export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Cap at 30 writes / IP / minute — a real visitor fires ~1 per page view.
  const ip = getClientIp(request);
  const { ok } = rateLimit(`track-visit:${ip}`, 30, 60_000);
  if (!ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  try {
    const { deviceId, path } = await request.json();
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 100) return NextResponse.json({ ok: false });
    const db = getAdminFirestore();
    // YYYY-MM-DD no timezone de São Paulo — alinha com o que o /admin lê
    const today = new Date()
      .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      .split('/').reverse().join('-');
    const visitorRef = db.collection('analytics').doc('daily').collection(today).doc(deviceId);
    const snap = await visitorRef.get();
    if (!snap.exists) {
      await visitorRef.set({ deviceId, firstPath: path || '/', visits: 1, firstSeenAt: Timestamp.now(), lastSeenAt: Timestamp.now() });
      const dayRef = db.collection('analytics').doc(`day_${today}`);
      const daySnap = await dayRef.get();
      if (daySnap.exists) {
        await dayRef.update({ uniqueVisitors: (daySnap.data()?.uniqueVisitors ?? 0) + 1, updatedAt: Timestamp.now() });
      } else {
        await dayRef.set({ date: today, uniqueVisitors: 1, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      }
    } else {
      await visitorRef.update({ visits: (snap.data()?.visits ?? 1) + 1, lastSeenAt: Timestamp.now() });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false });
  }
}
