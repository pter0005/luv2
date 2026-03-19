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
    // Deleta docs da coleção analytics (day_* e outros)
    await deleteCollection(db, db.collection('analytics'));
    // Deleta subcoleções daily por data
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      await deleteCollection(db, db.collection('analytics').doc('daily').collection(dateStr));
    }
    // Deleta utm_visits
    await deleteCollection(db, db.collection('utm_visits'));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
