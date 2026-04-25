import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getDatabase } from 'firebase-admin/database';

// Esta função centraliza a inicialização do Firebase Admin.
export function getAdminApp() {
  // Se o app já foi inicializado, simplesmente retorna a instância existente.
  if (getApps().length > 0) {
    return getApp();
  }

  // PASSO 1: Ler as chaves do ambiente do servidor (Netlify, Vercel, etc.)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // PASSO 2: A "Trava de Segurança" para a chave privada.
  // Isso corrige a formatação da chave que vem como uma única linha da Netlify,
  // trocando os caracteres '\n' por quebras de linha de verdade.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  // PASSO 3: Verificação robusta. Se qualquer chave estiver faltando, o build falha com uma mensagem clara.
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'CONFIGURAÇÃO DE ADMIN INCOMPLETA: Uma ou mais variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não foram encontradas no servidor de build. Verifique as configurações do seu provedor de hospedagem (Netlify).'
    );
  }

  // PASSO 4: Tenta inicializar o App.
  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error: any) {
    console.error('Falha CRÍTICA ao inicializar Firebase Admin:', error.message);
    // Se a inicialização falhar mas um app existir (caso raro de concorrência), retorna o app existente.
    if (getApps().length > 0) {
      return getApp();
    }
    // Lança um erro mais específico para o log.
    throw new Error(`Erro na inicialização do Firebase Admin: ${error.message}`);
  }
}

// Firestore singleton com `ignoreUndefinedProperties: true`.
//
// Sem essa flag, o Firestore Admin lança "Cannot use undefined as a Firestore
// value" quando qualquer campo do doc é `undefined`. Isso acontecia em massa
// no fluxo de PIX: wizard salva `audioRecording: undefined` quando user não
// gravou voz → polling (verifyPaymentWithMercadoPago) tentava atualizar doc e
// falhava a CADA 3 segundos, gerando centenas de logs "Verificação PIX falhou".
//
// `settings()` só pode ser chamado UMA vez por Firestore instance (ou lança
// "Firestore has already been initialized"). Por isso guardamos a instância
// global via _instance flag e usamos sempre a mesma.
let _firestoreInstance: Firestore | null = null;
export function getAdminFirestore() {
  if (_firestoreInstance) return _firestoreInstance;
  const app = getAdminApp();
  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // Já setado por outra chamada — OK, só usa a instância. Não invalida.
    console.warn('[firestore] settings already applied:', (e as any)?.message);
  }
  _firestoreInstance = db;
  return db;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app).bucket();
}

export function getAdminDatabase() {
  const app = getAdminApp();
  return getDatabase(app);
}
