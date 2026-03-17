
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  // Proteção básica pra não rodar por qualquer um
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();
    const now = Timestamp.now();

    // Busca só páginas básicas expiradas
    const expired = await db.collection('lovepages')
      .where('plan', '==', 'basico')
      .where('expireAt', '<=', now)
      .get();

    let deleted = 0;
    let errors = 0;

    for (const doc of expired.docs) {
      try {
        const pageId = doc.id;

        // Deleta todos os arquivos do Storage em lovepages/{pageId}/
        const [files] = await bucket.getFiles({ prefix: `lovepages/${pageId}/` });
        await Promise.all(files.map(f => f.delete().catch(() => {})));

        // Deleta o documento do Firestore
        await doc.ref.delete();

        // Deleta da subcoleção do usuário
        const data = doc.data();
        if (data.userId) {
          await db.collection('users')
            .doc(data.userId)
            .collection('love_pages')
            .doc(pageId)
            .delete().catch(() => {});
        }

        deleted++;
      } catch (e) {
        errors++;
      }
    }

    return NextResponse.json({ deleted, errors, total: expired.size });
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message }, { status: 500 });
  }
}
