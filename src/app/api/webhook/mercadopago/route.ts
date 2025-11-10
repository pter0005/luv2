
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Helper function to initialize Firebase Admin SDK safely.
// It will only initialize if it hasn't been already.
const initializeAdminApp = () => {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON", e);
            throw new Error("Server configuration error for Firebase.");
        }
    } else {
        // This case is for local development and will fail in production builds on Netlify.
        // The build process doesn't need this to succeed if the logic is correct.
        console.warn("FIREBASE_SERVICE_ACCOUNT env var not found. This is expected during build, but required for runtime.");
        // We throw an error here to make it clear that this path should not be taken in a deployed environment's runtime.
        throw new Error("Firebase Admin credentials not found in environment variables.");
    }
    
    return initializeApp({
        credential: cert(serviceAccount)
    });
};


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
        // We only initialize the admin app when the webhook is actually hit at runtime.
        // This avoids breaking the Next.js build process which can't access env vars.
        const adminApp = initializeAdminApp();
        const firestore = getFirestore(adminApp);
        
        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);
        
        console.log(`[WEBHOOK LOG] Fetching payment details for ID: ${paymentId}`);
        const paymentInfo = await payment.get({ id: paymentId });
        console.log(`[WEBHOOK LOG] Payment status for ${paymentId} is '${paymentInfo.status}'.`);

        const paymentRef = firestore.collection('payments').doc(paymentId.toString());
        
        // The webhook now ONLY updates the payment status.
        // The `checkPaymentStatus` action, triggered by the user, is responsible for creating the page.
        // This makes the system more robust and avoids race conditions.
        await paymentRef.update({
            status: paymentInfo.status,
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        console.log(`[WEBHOOK LOG] Payment status for ${paymentId} updated to '${paymentInfo.status}'.`);
        
        // If payment is approved, trigger the checkPaymentStatus action on the frontend side if needed.
        // However, the primary flow is user-driven via the "I've paid" button.
        // This webhook serves as a backup and real-time update mechanism.
        if (paymentInfo.status === 'approved') {
            const paymentDoc = await paymentRef.get();
            const paymentData = paymentDoc.data();
            if (paymentData && paymentData.lovePageData && !paymentData.pageCreationStatus) {
                 // The 'checkPaymentStatus' action will handle the page creation.
                 // This webhook's job is just to keep the status fresh.
                 console.log(`[WEBHOOK LOG] Payment ${paymentId} is approved. The user-driven flow will now create the page.`);
            }
        }
        
        return NextResponse.json({ status: 'payment_status_updated' });

    } catch (error: any) {
        // If an error occurs (e.g., Firebase init fails at runtime), log it.
        console.error(`[WEBHOOK ERROR] Error processing webhook for paymentId ${paymentId}:`, error);
        const errorMessage = error.message || 'Failed to process webhook';
        // Return a 500 but don't expose internal details.
        return NextResponse.json({ error: "An internal error occurred." }, { status: 500 });
    }
}
