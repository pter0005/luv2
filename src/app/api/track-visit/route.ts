export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Normaliza valores de source pra chaves canônicas. Evita que tiktok/TikTok/TIKTOK
// virem buckets separados no painel. Undefined/vazio → 'direct'.
const ALLOWED_SOURCES = new Set([
  'tiktok', 'instagram', 'facebook', 'google', 'whatsapp', 'youtube',
  'twitter', 'direct', 'organic',
]);
function normalizeSource(raw: unknown): string {
  if (typeof raw !== 'string') return 'direct';
  const s = raw.toLowerCase().trim();
  if (!s) return 'direct';
  if (ALLOWED_SOURCES.has(s)) return s;
  // Variações comuns
  if (s.includes('tiktok')) return 'tiktok';
  if (s.includes('instagram') || s === 'ig') return 'instagram';
  if (s.includes('facebook') || s === 'fb') return 'facebook';
  if (s.includes('google')) return 'google';
  if (s.includes('whats') || s === 'wa') return 'whatsapp';
  return s.slice(0, 30); // custom source — guarda até 30 chars
}

export async function POST(request: NextRequest) {
  // Cap at 30 writes / IP / minute — a real visitor fires ~1 per page view.
  const ip = getClientIp(request);
  const { ok } = rateLimit(`track-visit:${ip}`, 30, 60_000);
  if (!ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  try {
    const body = await request.json();
    const { deviceId, path } = body;
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 100) return NextResponse.json({ ok: false });
    const source = normalizeSource(body.source);

    const db = getAdminFirestore();
    // YYYY-MM-DD no timezone de São Paulo — alinha com o que o /admin lê
    const today = new Date()
      .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      .split('/').reverse().join('-');

    const visitorRef = db.collection('analytics').doc('daily').collection(today).doc(deviceId);
    const snap = await visitorRef.get();

    // Só conta 1 visita por device/dia no utm_visits — evita inflar a métrica
    // quando o user recarrega a página 10x (o sessionStorage no hook já bloqueia
    // fetches duplicados, mas redundância aqui protege contra sessões novas).
    const isFirstVisitToday = !snap.exists;

    if (isFirstVisitToday) {
      await visitorRef.set({
        deviceId,
        firstPath: path || '/',
        source,
        visits: 1,
        firstSeenAt: Timestamp.now(),
        lastSeenAt: Timestamp.now(),
      });
      const dayRef = db.collection('analytics').doc(`day_${today}`);
      const daySnap = await dayRef.get();
      if (daySnap.exists) {
        await dayRef.update({ uniqueVisitors: (daySnap.data()?.uniqueVisitors ?? 0) + 1, updatedAt: Timestamp.now() });
      } else {
        await dayRef.set({ date: today, uniqueVisitors: 1, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      }

      // utm_visits: 1 doc por (device, date) — alimenta o painel "Performance
      // por Fonte". `date` é string YYYY-MM-DD porque o admin filtra por
      // `where('date', '>=', cutoff)` (lexicográfico funciona nesse formato).
      try {
        await db.collection('utm_visits').doc(`${deviceId}_${today}`).set({
          deviceId,
          date: today,
          source,
          path: path || '/',
          createdAt: Timestamp.now(),
        });
      } catch (e) {
        console.warn('[track-visit] utm_visits write failed:', e);
      }
    } else {
      await visitorRef.update({ visits: (snap.data()?.visits ?? 1) + 1, lastSeenAt: Timestamp.now() });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false });
  }
}
