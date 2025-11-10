import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
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
    try {
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        console.log(`[LOG] Searching for service account file at: ${serviceAccountPath}`);

        if (!fs.existsSync(serviceAccountPath)) {
            const errorMsg = `CRITICAL FAILURE: Service account file not found at path: ${serviceAccountPath}. Ensure 'firebase-service-account.json' with valid credentials is in the project root.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        console.log("[LOG] Service account file found.");

        const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf-8');
        if (!serviceAccountJson) {
            const errorMsg = "CRITICAL FAILURE: Service account file is empty.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        console.log("[LOG] Service account file read successfully.");

        const serviceAccount = JSON.parse(serviceAccountJson);

        if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
            const errorMsg = "CRITICAL FAILURE: Service account JSON is missing required fields (project_id, client_email, private_key).";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        console.log(`[LOG] Service account for project '${serviceAccount.project_id}' parsed successfully.`);
        
        app = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });

        console.log("--- Firebase Admin SDK Initialized Successfully ---");
    } catch (e: any) {
        console.error("!!! FATAL ERROR INITIALIZING FIREBASE ADMIN !!!");
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        console.error("Stack Trace:", e.stack);
        throw new Error(`Failed to initialize Firebase Admin: ${e.message}`);
    }
};

// Ensure initialization is run only once
initializeAppOnce();

// Export getters for the initialized services
export const getAdminFirestore = () => getFirestore(app);
export const getAdminStorage = () => getStorage(app).bucket();
