
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';
import { ServiceAccount } from 'firebase-admin';

const getServiceAccount = (): ServiceAccount => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Variáveis de ambiente do Firebase Admin faltando.');
    }

    // --- LIMPEZA DA CHAVE (O SEGREDINHO) ---
    
    // 1. Se a chave estiver entre aspas duplas (erro comum no Netlify), remove elas.
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }

    // 2. Converte os "\n" literais em quebras de linha reais
    // Isso resolve tanto se você colou em uma linha quanto se colou formatado
    privateKey = privateKey.replace(/\\n/g, '\n');

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
        throw new Error(`Erro na inicialização: ${error.message}`);
    }
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
