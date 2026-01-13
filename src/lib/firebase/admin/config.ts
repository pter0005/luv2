
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestoreInstance, FieldValue } from 'firebase-admin/firestore';
import { getStorage as getAdminStorageInstance } from 'firebase-admin/storage';

// --- CONFIGURAÇÃO HARDCODED (DIRETA) ---
// Formatei a chave para funcionar perfeitamente sem precisar do arquivo .env
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCm74NvikIf10mF
P9wKiVEeo2WOvjAth89Mc19iX6SiwgDMc0NMdC4g34HBJbdyWCGNsENjAIzTAdz0
sIJmYoMDQR7kSIlTGx5vXWtEjjdwYibt+Z196yi9HapJriXQFcrOTFA0XGGAuMtH
R1qh2XpqNVcgljDaE2bPq3h7uDMfY8DQg+cLoVM+DkOfirKvQkdKEr83Mnfd4wI7
WP2IuaYo5QRImqzAp/NNchNwUTxLN8dZyVVzXM88LPySFIB70X7fKcvmgZdXLoen
NBaF+DPSL8gYNTLRSZa5Co0j6kLjYTckzwS4Lm9SD8RckpipjDW78MozD09ZHEnN
SoAdGo97AgMBAAECggEAFYGHwkfiiu2WWCdI9saH/9V3EPOpi0QSzbuTTz4ZHKq3
pZ83zVKuWqfQtIxiXMXD1NgfZlK80bZMu+09b2lDjZjHHQvHPUCiJCC54AQeWkka
0M+2nXE9N1fqB0H7NxqHnRoxvv0jxoyIC6/CmlVFMweaKOWQd5fGR/zEMdQiKenf
r13bm/tu5dvwjXpXXnXprOW3KDYyWCF0BzqrsP69jTJi3P7IDQDToHBwpciG0eTR
vr1EXykB0BmZdmpYzx/OKd4PIIkmZiiKeoWPCCYta+Be1Y4S6vYyrn94Jvoxj1zP
7E+idXYGvmYmPcwU4aBe9Gll4aMePfhgHIqpvdXnkQKBgQDXN9OR9P2pyFo4bceO
6esIhP8q2MVDejACpkh4l4ldebgEIq1zP79OU24blRxjYkxAinlOSm5WnyQPvAFU
+AJEJiD33C7O3InGe98loqvB2XHMR1gTp2HsuMKDvhsaP5xFyPwOQnPNRYvIbqSR
pOgmQI4Cz+hAWatUFWbXR4f/MwKBgQDGkYQ/FIu+CfKNl50Xb6ztmzjAXeaAg/eE
2kQgxZLuirtbEbadenRA4QdsEd6v5zPiJmTiq7mIEukKbdZPGPCS4DPS1vtHXO5L
P8RakLpusgJ1CpkBqQmLHP2jv4x/ODWjIHgRQr6o0/Ca0B1OvHBgO7s/H7A7/dDF
inHqvKjOmQKBgQDTB/S3G+lXgBOnXU3eftRuCCtE0kWrgrZtAqvxQ3X4aI/dzjsR
1SI7JWfEOBQcB5kJeD62XBmRan6rxwfvTzi5pkGRiR+Ey491RqVqe/W7IQKK8jIV
I33L5uck01Y0CMetTgSJ3vM6BsWoBYXtIixYxdf6Pe9YmhR7YHj1AzkBLQKBgQDE
aHseyfvPZZd9ZlIENHogLEDeRgMRa3cQ+bQZllPXj3HyinrPGaiT5AGra6GQ7Gft
cXyomKNTbSEFJ8+rPUf4f7vC+NJjrBAoblKSIkXF6F11152wfrrp1ysrJPSbgcXM
LPmWWSatZ7W968yRbOLazTpRHc78B/rQ6jfzr9hpQQKBgE4j4wliapVA8baz2cWf
oc7hIMEn82Q7VGoWg+gXk4J6qih01WAshnqOQruN2rCHQgiTALDA1aliFEN2S8yA
HGnBi0R5zXaLi5vnMC7xWiu9FwDmBvAEXpbQ1dK+qq9+zhVAiABayklFlKW99jIF
AX3DxRvmcCE92UJqAJckx23c
-----END PRIVATE KEY-----`;

const firebaseAdminConfig = {
    projectId: "amore-pages1-62585403-acd4b",
    clientEmail: "firebase-adminsdk-fbsvc@amore-pages1-62585403-acd4b.iam.gserviceaccount.com",
    privateKey: PRIVATE_KEY,
};

export function getAdminApp() {
    // Dá um nome único para o App de Servidor
    const ADMIN_NAME = 'amore-admin-app';
    const existingApp = getApps().find(app => app.name === ADMIN_NAME);
    
    if (existingApp) return existingApp;

    return initializeApp({
        credential: cert(firebaseAdminConfig),
        storageBucket: "amore-pages1-62585403-acd4b.firebasestorage.app"
    }, ADMIN_NAME);
}

export const getAdminFirestore = () => getAdminFirestoreInstance(getAdminApp());
export const getAdminStorage = () => getAdminStorageInstance(getAdminApp()).bucket();
export { FieldValue };

