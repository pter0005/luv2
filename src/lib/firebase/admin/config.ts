import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// --- CONFIGURAÇÃO MANUAL DAS CHAVES (COPIE TUDO ISSO) ---

const PROJECT_ID = "amore-pages1-62585403-acd4b";
const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@amore-pages1-62585403-acd4b.iam.gserviceaccount.com";

// A chave privada foi formatada para remover quebras de linha erradas
const PRIVATE_KEY_RAW = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkzuMcWSnzQJkY\\njYGeV86pGghfJ5j3b1BQXviNNi+Ltc08+9rhyWX6eDwiBH5O4L06B/RAo2I15Hqb\\nQIR2vwfIfHXtjkDfjyKuME94ggORweqIiJHVq/MSU/MMGhvGBvGzusut3R57U9z8\\nIly5oLEUzj2DTLlxLx6j4FAd71AuD3C6EZKIvY3uKhaJvFFgVSyjwrEB1w0TqPLw\\nvFMVoFhVLqAERXkdWJDbEby1Sike/F5MTXx/uulpNPJuZllGdZ3EdzDVdP8Ajsn/\\nEOFgWixbBA8/YGyxhgb5GEJAznwwSRkot0vNmN6RcjusC6UTR3X5L7mh7h1laoI5\\nB4bDOfHhAgMBAAECggEAB+nzV+okLI0ejOJGph7bSp14Z3FUVBVhSuq0jrtaXyAU\\nwefqI8ty/SsG4C9NDWaXT5EQNoZh8eqNxKS9d6JGsmbfls+s589MwAaL2mKL31Tr\\neTDtp9AA9RFY62zZhpHQy2ud2jRzAUMOqoDP6Q4BUtlwdLybbwbvNrlPv5A9TmjV\\nqwc0csUrZhQ1JO3qwQ3ZrvBWdMZtNj2K3IT6LDq4rDFh4URiXN5vT/e6leg6ZiGr\\nDOPdqkA5drXq/Hg2bRApuGP+xtJaYqdbw2CJaNBJJB0PQFZ5jJZO/m/36BwuaKe8\\nSZFKd1oP3m1PeoVznINwTw5ZVAhDwNq9y6Y2qvUm3QKBgQDRKVV64sV5TDr2jfyq\\nAVcz2bBtzyhqPOmr6tY08Q3M+qlExGjhmX0DuWMLTZqvyLE1vrc7LKKAmkASpTq+\\nZek7oiuVUmEbfUkLVk0k2TxecQRasYTM86Hh5MJeftWKC7sVjpb1pERsWH1V2Zbq\\nJ9Jxmrn666vkuUQ8p18jadNWUwKBgQDJtuWfQZ4YwtSWafgic6+8sNoZyHO93418\\nDnQYBma0xC/F7J80adfLaS7uxUAA1RvMqqJ+U1kvYeuLPAQ9yxsqXbO36sjzdNA+\\nzYJZvmBEz7UUgvrKCY5GslCnzGCz7ObExvulbDxZdAAMzRe9SBuMqrXQvXNKjyZM\\n28Ox6rOoewKBgQDOK8gukUnF/vZAAkWD7j5exb26/+/+iHxtEdaD6PiJjKs9Nb2M\\nYxdvjFWs1pobm9/R8mP62Ex2J5Xwyx3Uf/Ae8AO19LXzutM9cZwpLljrXsvD+ifF\\nPoHbgPp22t7ybA3FegAjsgAgLDmfXhP8S7SMds/MHnIZyuUQRIrrBW1kMQKBgGRU\\nUU/uHkmoln6eBKp2KiHLQR/z4QW+7KuYsMvGW01sC2sBr4otXwUwswRWHeiMFwCs\\nmpgEsuZraPHfDykBHejrpFlFMWBOaMnkBALJOy7etO2X3E+jgx3M0Ws0r6Cuo3Wa\\nl04HUNkZZnD3jeg6tmE4A6joojCilOVDpcmXuHaDAoGAVFKpydgUEu0LbxbNBKus\\nU/8y7313YvQWKRVjPhmF/NBznB1xC4HM85b8mB4SkvhAtaaOJfQ22J27REP2stRA\\nl0WW594ieO9Gw86S/HK28tLwjKpjLz1843F8cnyyp72i2Kr+/B7gd1S4JvMzqAz2\\nwAU6fFmyhqgJbcU0lSZkkAQ=\\n-----END PRIVATE KEY-----\\n";

// Limpa a chave para o formato que o Node.js aceita
const privateKey = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

// --------------------------------------------------------

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error: any) {
    console.error('Falha ao inicializar Firebase Admin:', error.message);
    // Se falhar por concorrência, tenta pegar o app existente
    if (getApps().length > 0) return getApp();
    throw new Error(`Erro na inicialização: ${error.message}`);
  }
}

export function getAdminFirestore() {
  const app = getAdminApp();
  return getFirestore(app);
}

export function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}