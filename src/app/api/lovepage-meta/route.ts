import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Rate limit: previne enumeração massiva de pageIds. Endpoint é público
  // por design (preview de social share) mas não tem motivo de 1 IP fazer
  // 1000 req/min — só atacante varrendo o catálogo.
  const ip = getClientIp(req);
  const rl = rateLimit(`lovepage-meta:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  const rawPageId = req.nextUrl.searchParams.get('pageId');
  // Cap de length + caracteres seguros (Firestore doc IDs aceitam alphanum,
  // hífen, underscore). Evita query payload absurdo.
  if (!rawPageId || typeof rawPageId !== 'string') {
    return NextResponse.json({ error: 'missing pageId' }, { status: 400 });
  }
  const pageId = rawPageId.slice(0, 64);
  if (!/^[a-zA-Z0-9_-]+$/.test(pageId)) {
    return NextResponse.json({ error: 'invalid pageId' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection('lovepages').doc(pageId).get();
    if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const d = doc.data()!;
    const images: any[] = Array.isArray(d.galleryImages) ? d.galleryImages : [];
    const firstImage = images.find(i => i?.url)?.url || d.puzzleImage?.url || null;

    return NextResponse.json({
      title: (d.title as string) || '',
      imageUrl: firstImage,
      plan: d.plan || 'basico',
    });
  } catch (e: any) {
    console.error('[lovepage-meta]', e?.message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
