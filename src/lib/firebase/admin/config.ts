
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

let app: App;

const initializeAppOnce = () => {
    if (getApps().length > 0) {
        app = getApps()[0];
        return;
    }

    console.log("--- Firebase Admin SDK Initialization ---");
    let serviceAccount: ServiceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log("[LOG] Found FIREBASE_SERVICE_ACCOUNT environment variable.");
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e: any) {
            const errorMsg = "CRITICAL FAILURE: Could not parse FIREBASE_SERVICE_ACCOUNT JSON.";
            console.error(errorMsg, e);
            throw new Error(errorMsg);
        }
    } else {
        console.log("[LOG] FIREBASE_SERVICE_ACCOUNT env var not found. Falling back to local file.");
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        console.log(`[LOG] Searching for service account file at: ${serviceAccountPath}`);

        if (!fs.existsSync(serviceAccountPath)) {
            const errorMsg = `CRITICAL FAILURE: Service account file not found at path: ${serviceAccountPath}. For production, set the FIREBASE_SERVICE_ACCOUNT env var.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf-8');
        serviceAccount = JSON.parse(serviceAccountJson);
    }
    
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        const errorMsg = "CRITICAL FAILURE: Service account is missing required fields (project_id, client_email, private_key).";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        console.log(`[LOG] Initializing app for project '${serviceAccount.project_id}'...`);
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        console.log("--- Firebase Admin SDK Initialized Successfully ---");
    } catch (e: any) {
        console.error("!!! FATAL ERROR INITIALIZING FIREBASE ADMIN !!!", e);
        throw new Error(`Failed to initialize Firebase Admin: ${e.message}`);
    }
};

// Ensure initialization is run only once
initializeAppOnce();

// Export getters for the initialized services
export const getAdminFirestore = () => getFirestore(app);
export const getAdminStorage = () => getStorage(app).bucket();
