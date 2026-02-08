
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';
import { ServiceAccount } from 'firebase-admin';

// This function now correctly reads from process.env as requested.
const getServiceAccount = (): ServiceAccount => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // The private key from .env.local needs its literal '\n' replaced with actual newlines.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        const errorMessage = 'As variáveis de ambiente do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão configuradas corretamente no ambiente de deploy. Verifique as configurações do seu provedor de hospedagem.';
        console.error(`ERRO DE CONFIGURAÇÃO FIREBASE ADMIN: ${errorMessage}`);
        throw new Error(errorMessage);
    }
    
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
        // Em um cenário de produção, você pode querer lançar o erro
        // para interromper o processo se o Firebase for essencial.
        throw new Error(`Falha na inicialização do Firebase Admin. Verifique as credenciais. Erro original: ${error.message}`);
    }
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
