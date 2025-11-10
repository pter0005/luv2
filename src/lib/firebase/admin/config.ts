
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

let app: App | null = null;

// This function ensures the Firebase Admin SDK is initialized only once.
const initializeAppOnce = (): App => {
    // If already initialized, return the existing instance.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    console.log("--- [Admin SDK] Initializing... ---");
    let serviceAccount: ServiceAccount;

    // The primary method for production: environment variables.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log("[Admin SDK] Found FIREBASE_SERVICE_ACCOUNT environment variable.");
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e: any) {
            const errorMsg = "CRITICAL FAILURE: Could not parse FIREBASE_SERVICE_ACCOUNT JSON.";
            console.error(errorMsg, e);
            throw new Error(errorMsg);
        }
    } else {
        // This is a fallback for local development and should not be used in production.
        console.warn("[Admin SDK] WARNING: FIREBASE_SERVICE_ACCOUNT env var not found. Falling back to local file.");
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        
        if (!fs.existsSync(serviceAccountPath)) {
            const errorMsg = `CRITICAL FAILURE: Service account file not found at path: ${serviceAccountPath}. For production, set the FIREBASE_SERVICE_ACCOUNT env var.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf-8');
        serviceAccount = JSON.parse(serviceAccountJson);
    }
    
    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        const errorMsg = "CRITICAL FAILURE: Service account is missing required fields (project_id, client_email, private_key).";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        console.log(`[Admin SDK] Initializing app for project '${serviceAccount.project_id}'...`);
        const newApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        console.log("--- [Admin SDK] Initialized Successfully ---");
        return newApp;
    } catch (e: any) {
        console.error("!!! FATAL ERROR INITIALIZING FIREBASE ADMIN !!!", e);
        throw new Error(`Failed to initialize Firebase Admin: ${e.message}`);
    }
};

// Lazy getter for the app instance.
// This prevents initialization from running at module-load time (which breaks Next.js build).
const getApp = (): App => {
    if (!app) {
        app = initializeAppOnce();
    }
    return app;
}

// Export getters for the services. These will trigger initialization on their first use.
export const getAdminFirestore = () => getFirestore(getApp());
export const getAdminStorage = () => getStorage(getApp()).bucket();
