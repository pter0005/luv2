import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Sem orderBy pra evitar exigir índice composto no Firestore
    const snap = await db.collection('payment_intents')
      .where('status', '==', 'waiting_payment')
      .limit(300)
      .get();

    const abandoned = snap.docs
      .filter(doc => {
        const d = doc.data();
        const updated = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date(0);
        // Entre 5 min e 7 dias atrás (pega cedo, PIX ainda tá válido)
        return updated < fiveMinAgo && updated > sevenDaysAgo;
      })
      .sort((a, b) => {
        const ta = (a.data().updatedAt?.toDate?.() || a.data().createdAt?.toDate?.() || new Date(0)).getTime();
        const tb = (b.data().updatedAt?.toDate?.() || b.data().createdAt?.toDate?.() || new Date(0)).getTime();
        return tb - ta;
      })
      .slice(0, 100)
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
          contacted: !!d.recoveryContactedAt,
          contactedAt: d.recoveryContactedAt?.toDate?.()?.toISOString() || null,
        };
      });

    return NextResponse.json({ abandoned });
  } catch (error: any) {
    console.error('[abandoned-pix]', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, contacted } = await req.json();
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
    const db = getAdminFirestore();
    await db.collection('payment_intents').doc(id).set(
      { recoveryContactedAt: contacted === false ? null : Timestamp.now() },
      { merge: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[abandoned-pix POST]', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
