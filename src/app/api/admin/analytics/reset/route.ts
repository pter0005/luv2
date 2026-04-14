export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';

// Apaga todos os docs de uma coleção em batches de 500
async function nukeCollection(db: any, collectionRef: any): Promise<void> {
  const snap = await collectionRef.limit(500).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  await batch.commit();
  if (snap.size === 500) await nukeCollection(db, collectionRef);
}

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminFirestore();

    // 1. analytics (docs day_* + report_* etc)
    await nukeCollection(db, db.collection('analytics'));

    // 2. analytics/daily/{date} subcoleções (últimos 90 dias)
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      await nukeCollection(db, db.collection('analytics').doc('daily').collection(ds));
    }

    // 3. utm_visits
    await nukeCollection(db, db.collection('utm_visits'));

    // lovepages e payment_intents NÃO são deletados — contêm dados reais de clientes

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Reset] Erro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
