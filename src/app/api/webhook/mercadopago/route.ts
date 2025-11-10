
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { FieldValue } from 'firebase-admin/firestore';
import { createLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import 'dotenv/config';

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

        if (paymentInfo.status === 'approved') {
            const paymentDoc = await paymentRef.get();
            
            if (!paymentDoc.exists) {
                 console.error(`[WEBHOOK CRITICAL] Payment document ${paymentId} not found in Firestore. Cannot create page.`);
                 return NextResponse.json({ error: 'Payment document not found.' }, { status: 404 });
            }

            const paymentData = paymentDoc.data();

            if (paymentData?.pageCreationStatus === 'completed') {
                console.log(`[WEBHOOK LOG] Love page for payment ${paymentId} already created. Ignoring.`);
                return NextResponse.json({ status: 'ok_duplicate_ignored' });
            }

            console.log(`[WEBHOOK LOG] Payment ${paymentId} approved. Proceeding to create love page.`);
            
            if (!paymentData?.lovePageData || !paymentData?.lovePageId) {
                console.error(`[WEBHOOK CRITICAL] lovePageData or lovePageId missing from Firestore payment document ${paymentId}. Cannot create page.`);
                await paymentRef.set({ status: 'approved_error_missing_data' }, { merge: true });
                return NextResponse.json({ error: 'Payment data missing in Firestore.' }, { status: 400 });
            }
            
            const lovePageData = paymentData.lovePageData;
            const pageId = paymentData.lovePageId;

            console.log(`[WEBHOOK LOG] Calling createLovePage for pageId: ${pageId}`);
            const creationResult = await createLovePage(lovePageData, pageId);
            
            if (creationResult.error) {
                console.error(`[WEBHOOK ERROR] Failed to create love page for payment ${paymentId}. Error:`, creationResult.error);
                await paymentRef.update({ pageCreationStatus: 'error', pageCreationError: creationResult.error });
                return NextResponse.json({ error: `Failed to create page: ${creationResult.error}` }, { status: 500 });
            }

            console.log(`[WEBHOOK LOG] Love page ${pageId} created successfully. Updating payment document.`);
            await paymentRef.update({
                status: 'approved',
                pageCreationStatus: 'completed',
                updatedAt: FieldValue.serverTimestamp(),
            });

            return NextResponse.json({ status: 'ok_page_created' });
        } else {
             console.log(`[WEBHOOK LOG] Payment status is not 'approved'. Updating status to '${paymentInfo.status}'.`);
             await paymentRef.update({
                status: paymentInfo.status,
                updatedAt: FieldValue.serverTimestamp(),
             });
        }
        
        return NextResponse.json({ status: 'payment_status_updated' });

    } catch (error: any) {
        console.error(`[WEBHOOK ERROR] Error processing webhook for paymentId ${paymentId}:`, error);
        const errorMessage = error.message || 'Failed to process webhook';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
