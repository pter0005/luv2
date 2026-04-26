import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/admin-action-guard';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50);
    const db = getAdminFirestore();
    const [snap, countSnap] = await Promise.all([
      db.collection('error_logs').orderBy('createdAt', 'desc').limit(limit).get(),
      db.collection('error_logs').where('resolved', '==', false).count().get(),
    ]);
    const errors = snap.docs.map(d => {
      const data = d.data();
      let parsedExtra: any = null;
      if (data.extra) {
        try { parsedExtra = JSON.parse(data.extra); } catch { parsedExtra = data.extra; }
      }
      return {
        id: d.id,
        message: data.message,
        category: data.category || null,
        url: data.url,
        resolved: data.resolved,
        extra: parsedExtra,
        createdAt: data.createdAt?.toDate
          ? new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            }).format(data.createdAt.toDate())
          : '',
      };
    });
    return NextResponse.json({ errors, unresolvedCount: countSnap.data().count });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Anti-flood: caps the endpoint at ~20 writes / IP / minute. Legitimate
  // usage is a handful of errors per visit at worst; anything above this is
  // abuse or a runaway loop.
  const ip = getClientIp(req);
  const { ok, retryAfter } = rateLimit(`error-log:${ip}`, 5, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }
  try {
    const body = await req.json();
    const { message, stack, url, userAgent, extra } = body;

    if (!message) return NextResponse.json({ error: 'missing message' }, { status: 400 });

    const db = getAdminFirestore();
    const docRef = await db.collection('error_logs').add({
      message: String(message).slice(0, 500),
      stack: String(stack || '').slice(0, 2000),
      url: String(url || '').slice(0, 500),
      userAgent: String(userAgent || '').slice(0, 300),
      extra: extra ? JSON.stringify(extra).slice(0, 1000) : null,
      createdAt: Timestamp.now(),
      resolved: false,
    });


    return NextResponse.json({ id: docRef.id });
  } catch (error: any) {
    console.error('[error-log] Failed:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
