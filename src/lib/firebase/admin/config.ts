
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';

<<<<<<< HEAD
// As chaves são lidas diretamente do process.env
const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // A chave privada precisa de um tratamento para substituir o `\n` literal por quebras de linha reais
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getAdminApp(): App {
=======
// As chaves agora são lidas do process.env
const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // A chave precisa ter os \n restaurados
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function getAdminApp() {
>>>>>>> 66de4086a5b0a4bc9c49a2a97e1d3910149e0fd2
    const ADMIN_NAME = 'amore-admin-app';
    const existingApp = getApps().find(app => app.name === ADMIN_NAME);
    
    if (existingApp) return existingApp;

<<<<<<< HEAD
    // Validação para garantir que as variáveis de ambiente foram carregadas
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error('As variáveis de ambiente do Firebase Admin não estão configuradas corretamente.');
=======
    // Validação para garantir que as chaves existem
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error("As variáveis de ambiente do Firebase Admin (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) não foram definidas. Verifique seu arquivo .env.");
>>>>>>> 66de4086a5b0a4bc9c49a2a97e1d3910149e0fd2
    }

    return initializeApp({
        credential: cert(firebaseAdminConfig as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, ADMIN_NAME);
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };
