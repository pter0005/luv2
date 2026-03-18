export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, path } = await request.json();
    if (!deviceId) return NextResponse.json({ ok: false });
    const db = getAdminFirestore();
    const today = new Date().toISOString().slice(0, 10);
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
