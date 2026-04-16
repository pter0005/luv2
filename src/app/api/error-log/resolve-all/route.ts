import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export async function POST(_req: NextRequest) {
  try {
    const db = getAdminFirestore();
    let totalResolved = 0;

    // Firestore batch limit is 500 — loop until all resolved
    while (true) {
      const snap = await db.collection('error_logs')
        .where('resolved', '==', false)
        .limit(450)
        .get();

      if (snap.empty) break;

      const batch = db.batch();
      snap.docs.forEach(doc => batch.update(doc.ref, { resolved: true }));
      await batch.commit();
      totalResolved += snap.size;

      // Safety: don't loop forever
      if (totalResolved > 5000) break;
    }

    return NextResponse.json({ ok: true, count: totalResolved });
  } catch (error: any) {
    console.error('[error-log/resolve-all] Failed:', error);
    return NextResponse.json({ error: 'failed', message: error?.message }, { status: 500 });
  }
}
