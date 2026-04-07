import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Use endpoint hash as doc ID to avoid duplicates
    const id = Buffer.from(subscription.endpoint).toString('base64url').slice(0, 40);

    await db.collection('push_subscriptions').doc(id).set({
      ...subscription,
      createdAt: Timestamp.now(),
      userAgent: req.headers.get('user-agent') || '',
      active: true,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
