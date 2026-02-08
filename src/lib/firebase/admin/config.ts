
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';
import { ServiceAccount } from 'firebase-admin';

// This function now provides granular error messages to pinpoint configuration issues.
const getServiceAccount = (): ServiceAccount => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
        throw new Error('A variável de ambiente FIREBASE_PROJECT_ID não foi encontrada. Verifique suas configurações de deploy.');
    }
    if (!clientEmail) {
        throw new Error('A variável de ambiente FIREBASE_CLIENT_EMAIL não foi encontrada. Verifique suas configurações de deploy.');
    }
    if (!privateKeyRaw) {
        throw new Error('A variável de ambiente FIREBASE_PRIVATE_KEY não foi encontrada. Verifique suas configurações de deploy.');
    }

    // The private key from .env needs its literal '\\n' replaced with actual newlines.
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    
    return {
        projectId,
        clientEmail,
        privateKey,
    };
};

export function getAdminApp(): App {
    const ADMIN_NAME = 'amore-admin-app';
    const existingApp = getApps().find(app => app.name === ADMIN_NAME);
    if (existingApp) return existingApp;

    try {
        const serviceAccount = getServiceAccount();

        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        }, ADMIN_NAME);
    } catch (error: any) {
        console.error('Falha CRÍTICA ao inicializar Firebase Admin:', error.message);
        // This will now propagate the more specific error from getServiceAccount
        throw new Error(`Falha na inicialização do Firebase Admin. Verifique as credenciais. Erro original: ${error.message}`);
    }
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
