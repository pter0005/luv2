
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';

export function getAdminApp(): App {
    const ADMIN_NAME = 'amore-admin-app';
    const existingApp = getApps().find(app => app.name === ADMIN_NAME);
    if (existingApp) return existingApp;

    // Pega as variáveis
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // DEBUG: Se falhar, vamos ver o que sumiu
    if (!projectId || !clientEmail || !privateKey) {
        console.error("ERRO DE CONFIGURAÇÃO FIREBASE ADMIN:", {
            projectId: !!projectId,
            clientEmail: !!clientEmail,
            privateKey: !!privateKey
        });
        throw new Error('As variáveis de ambiente do Firebase Admin não estão configuradas corretamente.');
    }

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, ADMIN_NAME);
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
