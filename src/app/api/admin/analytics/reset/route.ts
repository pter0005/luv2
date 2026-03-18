export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

async function deleteCollection(db: any, ref: any) {
  const snap = await ref.limit(500).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  await batch.commit();
  if (snap.size === 500) await deleteCollection(db, ref);
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    const analyticsSnap = await db.collection('analytics').get();
    const batch = db.batch();
    analyticsSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      await deleteCollection(db, db.collection('analytics').doc('daily').collection(dateStr));
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
