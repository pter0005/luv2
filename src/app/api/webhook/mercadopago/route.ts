
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { FieldValue } from 'firebase-admin/firestore';
import 'dotenv/config';

// A função createLovePage foi removida deste arquivo para evitar problemas de build com dependências do lado do servidor.
// A lógica de criação da página agora é tratada exclusivamente pela action `checkPaymentStatus`.

export async function POST(req: NextRequest) {
    const body = await req.json();
    console.log("--- [WEBHOOK] Mercado Pago Notification Received ---", body);
    
    if (body.type !== 'payment') {
        console.log("[WEBHOOK LOG] Notification is not of type 'payment'. Ignoring.");
        return NextResponse.json({ status: 'notification_type_ignored' });
    }
    
    const paymentId = body.data.id;
    
    if (!paymentId) {
        console.error("[WEBHOOK ERROR] Payment ID not found in body.", body);
        return NextResponse.json({ error: 'Payment ID not found.' }, { status: 400 });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('[WEBHOOK CRITICAL] Mercado Pago access token is not configured.');
        return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 });
    }
    
    try {
        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);
        
        console.log(`[WEBHOOK LOG] Fetching payment details for ID: ${paymentId}`);
        const paymentInfo = await payment.get({ id: paymentId });
        console.log(`[WEBHOOK LOG] Payment status for ${paymentId} is '${paymentInfo.status}'.`);

        const firestore = getAdminFirestore();
        const paymentRef = firestore.collection('payments').doc(paymentId.toString());
        
        // O webhook agora APENAS atualiza o status do pagamento.
        // A lógica de criação da página foi centralizada na server action `checkPaymentStatus`
        // que é acionada manualmente pelo usuário, garantindo um fluxo mais robusto.
        
        await paymentRef.update({
            status: paymentInfo.status,
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        console.log(`[WEBHOOK LOG] Payment status for ${paymentId} updated to '${paymentInfo.status}'.`);
        
        return NextResponse.json({ status: 'payment_status_updated' });

    } catch (error: any) {
        console.error(`[WEBHOOK ERROR] Error processing webhook for paymentId ${paymentId}:`, error);
        const errorMessage = error.message || 'Failed to process webhook';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
