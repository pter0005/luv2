import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';


// =========================================================================
// CHAVE DE SEGURANÇA: Esta é a forma CORRETA e SEGURA.
// A chave privada é lida do ambiente (process.env) e nunca fica no código.
// O .replace é uma "trava de segurança" para corrigir formatação se a chave
// for copiada errada para a variável de ambiente.
// =========================================================================
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

// =========================================================================
// VERIFICAÇÃO DE CONFIGURAÇÃO
// Garante que o app não quebre se as variáveis não estiverem definidas.
// =========================================================================
const adminSdkConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

const isConfigured = adminSdkConfig.projectId && adminSdkConfig.clientEmail && adminSdkConfig.privateKey;

if (process.env.NODE_ENV !== 'development' && !isConfigured) {
    console.error("CONFIGURAÇÃO INCOMPLETA: As variáveis de ambiente do Firebase Admin não foram definidas. O aplicativo não pode iniciar em produção.");
}


export function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  if (!isConfigured) {
    throw new Error('CONFIGURAÇÃO AUSENTE: As variáveis de ambiente do Firebase Admin (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) não foram encontradas. Verifique seu arquivo .env ou as configurações do seu provedor de hospedagem.');
  }

  // Validação extra para garantir que a chave tem o formato esperado
  if (!adminSdkConfig.privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('CONFIGURAÇÃO INVÁLIDA: A variável de ambiente FIREBASE_PRIVATE_KEY não parece conter uma chave privada válida. Verifique se copiou o valor completo do arquivo JSON.');
  }
  
  try {
    return initializeApp({
      credential: cert(adminSdkConfig),
      storageBucket: `${adminSdkConfig.projectId}.appspot.com`,
    });
  } catch (error: any) {
    console.error('Falha CRÍTICA ao inicializar Firebase Admin:', error.message);
    if (getApps().length > 0) return getApp();
    throw new Error(`Erro na inicialização: ${error.message}`);
  }
}

export function getAdminFirestore() {
  if (!isConfigured) {
      throw new Error("Admin SDK não configurado para acessar o Firestore.");
  }
  const app = getAdminApp();
  return getFirestore(app);
}

export function getAdminAuth() {
   if (!isConfigured) {
      throw new Error("Admin SDK não configurado para acessar o Auth.");
  }
  const app = getAdminApp();
  return getAuth(app);
}

export function getAdminStorage() {
  if (!isConfigured) {
      throw new Error("Admin SDK não configurado para acessar o Storage.");
  }
  const app = getAdminApp();
  // Retorna a instância do bucket padrão
  return getStorage(app).bucket();
}
