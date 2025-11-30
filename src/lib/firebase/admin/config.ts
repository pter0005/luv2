
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance, Storage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

let app: App | null = null;

// This function ensures the Firebase Admin SDK is initialized only once.
const initializeAdminApp = (): App => {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    console.log("--- [Admin SDK] Initializing... ---");
    let serviceAccount: ServiceAccount;

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
const getApp = (): App => {
    if (!app) {
        app = initializeAdminApp();
    }
    return app;
}

// Export getters for the services. These will trigger initialization on their first use.
export const getAdminFirestore = () => getAdminFirestoreInstance(getApp());
export const getAdminStorage = () => getAdminStorageInstance(getApp()).bucket();
