
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';

// As chaves são lidas diretamente do process.env
const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // A chave privada precisa de um tratamento para substituir o `\n` literal por quebras de linha reais
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getAdminApp(): App {
    const ADMIN_NAME = 'amore-admin-app';
    const existingApp = getApps().find(app => app.name === ADMIN_NAME);
    
    if (existingApp) return existingApp;

    // Validação para garantir que as variáveis de ambiente foram carregadas
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error('As variáveis de ambiente do Firebase Admin não estão configuradas corretamente.');
    }

    return initializeApp({
        credential: cert(firebaseAdminConfig as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, ADMIN_NAME);
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
