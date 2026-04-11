import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Busca intents que ficaram em waiting_payment (PIX gerado mas não pago)
    const snap = await db.collection('payment_intents')
      .where('status', '==', 'waiting_payment')
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();

    const abandoned = snap.docs
      .filter(doc => {
        const d = doc.data();
        const updated = d.updatedAt?.toDate?.() || new Date();
        return updated < thirtyMinAgo; // Só mostra os que passaram de 30 min
      })
      .map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          email: d.guestEmail || d.userEmail || d.payment?.payerEmail || '—',
          whatsapp: d.whatsappNumber || '—',
          plan: d.plan || 'basico',
          amount: d.paidAmount || 0,
          title: d.title || 'Sem título',
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
        };
      });

    return NextResponse.json({ abandoned });
  } catch (error: any) {
    console.error('[abandoned-pix]', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
