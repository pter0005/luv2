import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { notifyAdmins } from '@/lib/notify-admin';

export async function POST(req: NextRequest) {
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

    // Notifica admin via push
    try {
      await notifyAdmins(
        `Bug detectado no site`,
        `${String(message).slice(0, 100)} — ${String(url || '').split('?')[0]}`,
        'https://mycupid.com.br/admin/monitor',
      );
    } catch {}

    return NextResponse.json({ id: docRef.id });
  } catch (error: any) {
    console.error('[error-log] Failed:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
