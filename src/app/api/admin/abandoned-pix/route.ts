import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Busca intents que ficaram em waiting_payment (PIX gerado mas não pago)
    // Sem orderBy pra evitar exigir índice composto no Firestore
    const snap = await db.collection('payment_intents')
      .where('status', '==', 'waiting_payment')
      .limit(200)
      .get();

    const abandoned = snap.docs
      .filter(doc => {
        const d = doc.data();
        const updated = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date(0);
        // Entre 30 min e 7 dias atrás (ignora muito antigos e muito recentes)
        return updated < thirtyMinAgo && updated > sevenDaysAgo;
      })
      .sort((a, b) => {
        const ta = (a.data().updatedAt?.toDate?.() || a.data().createdAt?.toDate?.() || new Date(0)).getTime();
        const tb = (b.data().updatedAt?.toDate?.() || b.data().createdAt?.toDate?.() || new Date(0)).getTime();
        return tb - ta;
      })
      .slice(0, 50)
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
