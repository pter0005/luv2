import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const ALLOWED_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
];

export async function GET(req: NextRequest) {
  // Rate limit pra proteger egress bandwidth — proxy gera tráfego upstream
  // mesmo com whitelist. 30/min por IP cobre uso real (~1 req/imagem) e
  // bloqueia DDoS amplificado via teu servidor.
  const ip = getClientIp(req);
  const rl = rateLimit(`proxy-image:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });
  if (url.length > 2048) return NextResponse.json({ error: 'url too long' }, { status: 400 });

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname.endsWith(h))) {
    return NextResponse.json({ error: 'disallowed host' }, { status: 403 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'upstream failed' }, { status: 502 });

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
