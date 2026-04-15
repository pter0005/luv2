import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export async function POST(_req: NextRequest) {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('error_logs').where('resolved', '==', false).get();
    if (snap.empty) return NextResponse.json({ ok: true, count: 0 });

    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { resolved: true }));
    await batch.commit();

    return NextResponse.json({ ok: true, count: snap.size });
  } catch (error: any) {
    console.error('[error-log/resolve-all] Failed:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
