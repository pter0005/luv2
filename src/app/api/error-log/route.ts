import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

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
