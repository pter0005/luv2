'use server';

import { getAdminFirestore, getAdminStorage, getAdminDatabase } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers, cookies } from 'next/headers';
import { createHash, randomUUID } from 'crypto';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { logCriticalError } from '@/lib/log-critical-error';
import { computeTotalBRL } from '@/lib/price';
import { notifyAdmins } from '@/lib/notify-admin';

// ─────────────────────────────────────────────
// META CAPI + TIKTOK EVENTS API
// ─────────────────────────────────────────────
// Server-side pixel calls são críticas pós iOS 14.5 (ATT) e Safari ITP: o
// pixel do browser perde 20–40% dos eventos (ad blockers, navegação privada,
// ITP expirando cookies). CAPI/Events API complementam enviando direto de
// server-to-server. O event_id = pageId dedup com o pixel do browser.
async function postJson(url: string, body: unknown, label: string) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error(`[${label}] Erro:`, data);
    else console.log(`[${label}] OK`);
  } catch (err) {
    console.error(`[${label}] Exceção:`, err);
  }
}

function sha256(raw: string): string {
  return createHash('sha256').update(raw.toLowerCase().trim()).digest('hex');
}

interface ServerPurchaseInput {
  plan: 'basico' | 'avancado' | 'vip';
  pageId: string;
  userEmail?: string;
  userPhone?: string;
  paidAmount?: number;
  locale?: 'pt' | 'en';
  fbp?: string; // _fbp cookie (Facebook browser id)
  fbc?: string; // _fbc cookie (Facebook click id, from fbclid param)
  ttclid?: string; // TikTok click id
  ttp?: string; // _ttp cookie
  eventSourceUrl?: string;
}

async function sendServerSidePurchaseEvent(input: ServerPurchaseInput | 'basico' | 'avancado' | 'vip', pageIdLegacy?: string, userEmailLegacy?: string, paidAmountLegacy?: number) {
  // Legacy call signature: (plan, pageId, email, paidAmount)
  const opts: ServerPurchaseInput = typeof input === 'string'
    ? { plan: input, pageId: pageIdLegacy!, userEmail: userEmailLegacy, paidAmount: paidAmountLegacy }
    : input;

  const { plan, pageId, userEmail, userPhone, paidAmount, locale, fbp, fbc, ttclid, ttp, eventSourceUrl } = opts;
  const isEN = locale === 'en';
  const currency = isEN ? 'USD' : 'BRL';
  const defaultDomain = isEN ? 'https://mycupid.net' : 'https://mycupid.com.br';
  const sourceUrl = eventSourceUrl || `${defaultDomain}/chat`;

  const value = (typeof paidAmount === 'number' && paidAmount > 0)
    ? paidAmount
    : (plan === 'vip' ? 34.99 : plan === 'avancado' ? 24.90 : 19.90);

  // Phone para hashing: só dígitos, país prefixo (55 BR, 1 US) se faltar.
  const rawPhone = (userPhone || '').replace(/\D/g, '');
  const hashedPhone = rawPhone
    ? sha256(rawPhone.length >= 10 && rawPhone.length <= 11
        ? (isEN ? `1${rawPhone}` : `55${rawPhone}`)
        : rawPhone)
    : null;

  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '177.160.0.1';
  const userAgent = headersList.get('user-agent') || 'Mozilla/5.0';

  // ── Meta CAPI ──
  const META_PIXEL_ID = isEN
    ? (process.env.META_PIXEL_ID_US || process.env.META_PIXEL_ID)
    : process.env.META_PIXEL_ID;
  const META_TOKEN = isEN
    ? (process.env.META_ACCESS_TOKEN_US || process.env.META_ACCESS_TOKEN)
    : process.env.META_ACCESS_TOKEN;

  if (META_PIXEL_ID && META_TOKEN) {
    const metaUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    };
    if (userEmail) metaUserData.em = [sha256(userEmail)];
    if (hashedPhone) metaUserData.ph = [hashedPhone];
    if (fbp) metaUserData.fbp = fbp;
    if (fbc) metaUserData.fbc = fbc;

    await postJson(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_TOKEN}`,
      {
        data: [{
          event_name: 'Purchase',
          event_id: pageId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: sourceUrl,
          action_source: 'website',
          user_data: metaUserData,
          custom_data: {
            value,
            currency,
            content_ids: [plan],
            content_type: 'product',
            order_id: pageId,
          },
        }],
      },
      'Meta CAPI',
    );
  }

  // ── TikTok Events API ──
  const TT_PIXEL_ID = isEN
    ? (process.env.TIKTOK_PIXEL_ID_US || process.env.TIKTOK_PIXEL_ID)
    : process.env.TIKTOK_PIXEL_ID;
  const TT_TOKEN = isEN
    ? (process.env.TIKTOK_ACCESS_TOKEN_US || process.env.TIKTOK_ACCESS_TOKEN)
    : process.env.TIKTOK_ACCESS_TOKEN;

  if (TT_PIXEL_ID && TT_TOKEN) {
    const ttUserData: Record<string, any> = {
      ip: clientIp,
      user_agent: userAgent,
    };
    if (userEmail) ttUserData.email = sha256(userEmail);
    if (hashedPhone) ttUserData.phone = hashedPhone;
    if (ttclid) ttUserData.ttclid = ttclid;
    if (ttp) ttUserData.ttp = ttp;

    try {
      const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Access-Token': TT_TOKEN },
        body: JSON.stringify({
          event_source: 'web',
          event_source_id: TT_PIXEL_ID,
          data: [{
            event: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: pageId,
            user: ttUserData,
            page: { url: sourceUrl },
            properties: {
              currency,
              value,
              contents: [{ content_id: plan, content_type: 'product', quantity: 1, price: value }],
            },
          }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0) console.error('[TikTok Events API] Erro:', data);
      else console.log('[TikTok Events API] OK');
    } catch (e) {
      console.error('[TikTok Events API] Exceção:', e);
    }
  }
}

// ─────────────────────────────────────────────
// CRIAR CONTA GUEST AUTOMATICAMENTE
// ─────────────────────────────────────────────
async function createGuestAccount(email: string, guestId: string, pageId: string): Promise<string | null> {
  try {
    const auth = getAuth();
    const db = getAdminFirestore();

    let uid: string;
    let isNewAccount = false;

    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    } catch {
      const newUser = await auth.createUser({
        email,
        password: randomUUID(),
        displayName: 'Cliente MyCupid',
      });
      uid = newUser.uid;
      isNewAccount = true;
    }

    await db.collection('users').doc(uid).set(
      { email, createdAt: Timestamp.now(), isGuest: true },
      { merge: true }
    );

    await db.collection('users').doc(uid).collection('love_pages').doc(pageId).set(
      { pageId, createdAt: Timestamp.now() },
      { merge: true }
    );

    await db.collection('lovepages').doc(pageId).update({ userId: uid });

    // Envia email de reset de senha pelo próprio Firebase (sem serviço externo)
    if (isNewAccount) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
        });
      } catch (emailErr) {
        console.warn('[GuestAccount] Falha ao enviar email de senha:', emailErr);
      }
    }

    console.log(`[GuestAccount] Conta criada/vinculada: ${email} → ${uid}`);
    return uid;
  } catch (err) {
    console.error('[GuestAccount] Erro ao criar conta:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
type CreateIntentResult =
  | { success: true; intentId: string }
  | { success: false; error: string; details?: any };

type FinalizePageResult =
  | { success: true; pageId: string }
  | { success: false; error: string; details?: any };

type PaymentVerificationResult =
  | { status: 'approved'; pageId: string }
  | { status: 'error'; error: string; details?: any }
  | { status: 'pending' | 'in_process' | 'authorized' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' };

type StripeSessionResult =
  | { success: true; url: string }
  | { success: false; error: string; details?: any };

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function ensureTimestamp(dateValue: any): any {
  if (!dateValue) return null;
  if (typeof dateValue === 'object' && (dateValue.seconds || dateValue._seconds)) {
    return Timestamp.fromMillis((dateValue.seconds || dateValue._seconds) * 1000);
  }
  if (dateValue instanceof Date) return Timestamp.fromDate(dateValue);
  const parsedDate = new Date(dateValue);
  return isNaN(parsedDate.getTime()) ? null : Timestamp.fromDate(parsedDate);
}

function sanitizeForFirebase(obj: any): any {
  if (obj === undefined || obj === null) return null;
  if (obj instanceof Date || (typeof obj === 'object' && (obj.seconds || obj._seconds))) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = sanitizeForFirebase(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// ─────────────────────────────────────────────
// SALVAR RASCUNHO — aceita guest IDs (guest_UUID)
// ─────────────────────────────────────────────
export async function createOrUpdatePaymentIntent(fullPageData: any): Promise<CreateIntentResult> {
  const { intentId, _uploadingCount, ...restOfPageData } = fullPageData;

  if (!restOfPageData.userId) {
    return { success: false, error: 'ID de usuário não encontrado.', details: 'userId missing' };
  }

  try {
    const db = getAdminFirestore();
    const dataToSave = {
      ...sanitizeForFirebase(restOfPageData),
      updatedAt: Timestamp.now(),
      expireAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
    };

    if (intentId) {
      const intentRef = db.collection('payment_intents').doc(intentId);
      const docSnap = await intentRef.get();
      if (docSnap.exists && docSnap.data()?.status === 'completed') {
        return { success: true, intentId };
      }
      // When updating an existing intent, don't overwrite file fields with
      // empty arrays. This prevents a browser reload (which restores the form
      // from localStorage without file data) from wiping previously uploaded
      // file references.
      const FILE_FIELDS = ['galleryImages', 'timelineEvents', 'memoryGameImages', 'puzzleImage', 'audioRecording', 'backgroundVideo'] as const;
      if (docSnap.exists) {
        for (const field of FILE_FIELDS) {
          const val = dataToSave[field];
          const isEmpty = val === undefined || val === null || (Array.isArray(val) && val.length === 0);
          if (isEmpty) delete dataToSave[field];
        }
      }
      await intentRef.set(dataToSave, { merge: true });
      return { success: true, intentId };
    } else {
      const intentDoc = await db.collection('payment_intents').add({
        ...dataToSave,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      return { success: true, intentId: intentDoc.id };
    }
  } catch (error: any) {
    return { success: false, error: error.message, details: error };
  }
}

// ─────────────────────────────────────────────
// VALIDAR DESCONTO NO BANCO (server-trusted)
// ─────────────────────────────────────────────
async function getValidatedDiscountAmount(
  db: FirebaseFirestore.Firestore,
  code: string | null | undefined,
  email: string | null | undefined,
): Promise<number> {
  if (!code || typeof code !== 'string') return 0;
  const normalized = code.toUpperCase().trim();
  if (!normalized) return 0;
  try {
    const snap = await db.collection('discount_codes').doc(normalized).get();
    if (!snap.exists) return 0;
    const d = snap.data()!;
    if (!d.active) return 0;
    if ((d.usedCount ?? 0) >= (d.maxUses ?? 0)) return 0;
    const cleanEmail = (email || '').toLowerCase().trim();
    if (cleanEmail && Array.isArray(d.usedEmails) && d.usedEmails.includes(cleanEmail)) return 0;
    const amount = Number(d.discount ?? 0);
    return isFinite(amount) && amount > 0 ? amount : 0;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────
// GERAR PIX
// ─────────────────────────────────────────────
export async function processPixPayment(
  intentId: string,
  clientClaimedTotal?: number,
  discountCode?: string | null,
  contact?: { whatsapp?: string; email?: string } | null,
) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { error: 'Token Mercado Pago não configurado.' };

  try {
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) return { error: 'Rascunho não encontrado.' };

    const intentData = intentDoc.data();
    // Prioriza contato passado na chamada — evita race condition onde o
    // merge-save ainda não visível nesta leitura do Firestore.
    // sanitizeEmail: lower, trim, remove chars invisíveis/zero-width/BOM que usuários
    // às vezes colam junto (quebra validação do MP silenciosamente).
    const sanitizeEmail = (v: string) =>
      v.normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\s]/g, '').toLowerCase();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const contactWhatsapp = (contact?.whatsapp || '').replace(/\D/g, '');
    const contactEmail = sanitizeEmail(contact?.email || '');
    const docWhatsapp = (intentData?.whatsappNumber || '').replace(/\D/g, '');
    const docEmail = sanitizeEmail(intentData?.guestEmail || intentData?.userEmail || '');

    const rawWhatsapp = contactWhatsapp.length >= 10 ? contactWhatsapp : docWhatsapp;
    if (rawWhatsapp.length < 10) {
      console.log('[PIX DEBUG] whatsappNumber inválido', {
        intentId,
        contactWhatsapp,
        docWhatsapp,
        docWhatsappRaw: intentData?.whatsappNumber,
      });
      return { error: 'WhatsApp obrigatório. Preencha seu número com DDD antes de gerar o PIX.' };
    }
    // Email é obrigatório pro MP. NÃO usar fallback — MP rejeita emails genéricos
    // e fica dando "payer.email must be a valid email" sem a pessoa entender por quê.
    const rawEmail = EMAIL_RE.test(contactEmail) ? contactEmail : docEmail;
    if (!EMAIL_RE.test(rawEmail)) {
      console.log('[PIX DEBUG] email inválido', { intentId, contactEmail, docEmail });
      return { error: 'Email obrigatório. Preenche um email válido antes de gerar o PIX.' };
    }
    const cleanEmail = rawEmail;

    // Se o contact veio diferente do doc, persiste pra próximas leituras
    if (contactWhatsapp.length >= 10 && contactWhatsapp !== docWhatsapp) {
      await intentDoc.ref.set({ whatsappNumber: contactWhatsapp }, { merge: true });
    }
    if (contactEmail && contactEmail !== docEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      await intentDoc.ref.set({ guestEmail: contactEmail }, { merge: true });
    }
    const rawName = intentData?.userName || 'Cliente MyCupid';
    const firstName = rawName.split(' ')[0];
    const lastName = rawName.split(' ').slice(1).join(' ') || 'Cliente';

    // ── PRE-PAYMENT FILE CHECK ──
    // Verifica se todos os arquivos temp/ do intent existem no Storage ANTES
    // de gerar o PIX. Se algum sumiu, bloqueia — melhor o user re-enviar agora
    // do que pagar e ficar com página quebrada.
    const bucket = getAdminStorage();
    const collectPaths = (v: any, paths: string[] = []): string[] => {
      if (Array.isArray(v)) { v.forEach(it => collectPaths(it, paths)); return paths; }
      if (v && typeof v === 'object') {
        if (typeof v.path === 'string' && v.path.startsWith('temp/')) paths.push(v.path);
        for (const k in v) if (k !== 'path') collectPaths(v[k], paths);
      }
      return paths;
    };
    const tempPaths = [
      ...collectPaths(intentData?.galleryImages),
      ...collectPaths(intentData?.timelineEvents),
      ...collectPaths(intentData?.memoryGameImages),
      ...collectPaths(intentData?.puzzleImage),
      ...collectPaths(intentData?.audioRecording),
      ...collectPaths(intentData?.backgroundVideo),
    ];
    if (tempPaths.length > 0) {
      let missingFiles: string[] = [];
      for (let round = 0; round < 2; round++) {
        const pathsToCheck = round === 0 ? tempPaths : missingFiles;
        const checks = await Promise.all(
          pathsToCheck.map(async (p) => {
            try { const [exists] = await bucket.file(p).exists(); return exists; } catch { return false; }
          }),
        );
        missingFiles = pathsToCheck.filter((_, i) => !checks[i]);
        if (missingFiles.length === 0) break;
        if (round === 0) await new Promise(r => setTimeout(r, 2000));
      }
      if (missingFiles.length > 0) {
        console.error(`[PIX] ${missingFiles.length} files missing in Storage before payment:`, missingFiles);
        return { error: 'Algumas imagens não foram encontradas no servidor. Tente remover e enviar novamente as imagens antes de pagar.' };
      }
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);

    // ── SERVER-TRUSTED PRICE ──
    // Recompute price from the saved intent data. Client-sent total is only
    // used for logging/mismatch detection, never trusted.
    //
    // Discount is idempotent per intent: if this intent already has an
    // appliedDiscount from a previous (failed) PIX attempt, reuse that
    // value instead of re-validating (the coupon was already consumed).
    let validatedDiscount: number;
    const existingDiscount = Number(intentData?.appliedDiscount);
    if (isFinite(existingDiscount) && existingDiscount > 0) {
      validatedDiscount = existingDiscount;
    } else {
      validatedDiscount = await getValidatedDiscountAmount(db, discountCode, cleanEmail);
    }
    const serverAmount = computeTotalBRL({
      plan: intentData?.plan,
      qrCodeDesign: intentData?.qrCodeDesign,
      enableWordGame: intentData?.enableWordGame,
      wordGameQuestions: intentData?.wordGameQuestions,
      introType: intentData?.introType,
      audioRecording: intentData?.audioRecording,
      discountAmount: validatedDiscount,
    });

    // ── MARK DISCOUNT AS USED SERVER-SIDE ──
    // Must happen BEFORE PIX generation to prevent race condition where
    // user refreshes and generates multiple PIX codes with the same coupon.
    // Previously this was done client-side after PIX gen — easy to bypass.
    // Idempotent: only marks if not already applied to this intent.
    if (validatedDiscount > 0 && discountCode && !intentData?.appliedDiscount) {
      try {
        const normalized = discountCode.toUpperCase().trim();
        const discountRef = db.collection('discount_codes').doc(normalized);
        await discountRef.update({
          usedCount: FieldValue.increment(1),
          usedEmails: FieldValue.arrayUnion(cleanEmail),
          lastUsedAt: Timestamp.now(),
        });
        // Save discount info on the intent for audit trail + retry idempotency
        await db.collection('payment_intents').doc(intentId).update({
          discountCode: normalized,
          appliedDiscount: validatedDiscount,
        });
      } catch (e) {
        console.warn('[PIX] Failed to mark discount as used (non-blocking):', e);
      }
    }
    const amount = Number(serverAmount.toFixed(2));
    if (!amount || amount < 1 || isNaN(amount)) {
      return { error: `Valor inválido: R$${amount}. Tente novamente.` };
    }
    if (
      typeof clientClaimedTotal === 'number' &&
      isFinite(clientClaimedTotal) &&
      Math.abs(clientClaimedTotal - amount) > 0.01
    ) {
      // Don't push-notify here — expired coupons are a normal race and
      // flood the admin with alerts on every retry. Just log to console.
      console.warn(
        `[PIX] Price mismatch — client=${clientClaimedTotal} server=${amount} intent=${intentId}`,
      );

      // If the server price is HIGHER than what the client showed (discount
      // expired, cupom esgotado, etc), refuse the PIX instead of silently
      // charging more. The user must refresh/retry so they see the real price.
      // If the server is LOWER we let it through — charging less is safe.
      if (amount > clientClaimedTotal + 0.01) {
        return {
          error:
            'O valor mudou desde que você começou a compra (desconto expirado ou esgotado). Atualize a página para ver o novo valor.',
        };
      }
    }

    const body = {
      transaction_amount: amount,
      description: `MyCupid - Plano ${intentData?.plan || 'Premium'}`,
      payment_method_id: 'pix',
      payer: {
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        identification: { type: 'CPF', number: '19100000000' },
      },
      external_reference: intentId,
    };

    // Tenta até 2x em caso de erro de rede
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await payment.create({ body });
        const responseData = result as any;
        const transactionData = responseData.point_of_interaction?.transaction_data;
        const qrCode = transactionData?.qr_code;
        const qrCodeBase64 = transactionData?.qr_code_base64;
        const paymentId = responseData.id;

        if (qrCode && qrCodeBase64 && paymentId) {
          await db.collection('payment_intents').doc(intentId).update({
            paymentId: paymentId.toString(),
            status: 'waiting_payment',
            paidAmount: amount,
            updatedAt: Timestamp.now(),
          });
          // Notify admin: PIX generated (non-blocking)
          const title = (intentData?.title as string) || 'Sem título';
          const plan = intentData?.plan === 'vip' ? 'VIP' : intentData?.plan === 'avancado' ? 'Avançado' : 'Básico';
          notifyAdmins(
            `🔔 PIX gerado — R$${amount.toFixed(2).replace('.', ',')}`,
            `${title} — Plano ${plan} — aguardando pagamento`,
            'https://mycupid.com.br/admin',
          ).catch(() => {});
          return { qrCode, qrCodeBase64, paymentId: paymentId.toString() };
        }

        console.error(`[MP] PIX gerado mas sem QR (attempt ${attempt}):`, JSON.stringify(result, null, 2));
        lastError = `Resposta inesperada: ${responseData?.status || 'sem status'}`;
      } catch (err: any) {
        console.error(`[MP] Erro attempt ${attempt}:`, err?.message, err?.cause);
        lastError = err?.message || 'erro desconhecido';
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
      }
    }

    await logCriticalError('payment', `PIX falhou: ${lastError}`, { intentId, amount });
    return { error: `Erro ao gerar PIX: ${lastError}. Tente novamente.`, details: lastError };
  } catch (error: any) {
    console.error('[MP] ERRO CRÍTICO:', error?.message);
    await logCriticalError('payment', `PIX erro crítico: ${error?.message}`, { intentId, stack: error?.stack });
    return { error: `Erro ao gerar PIX: ${error?.message || 'desconhecido'}. Tente novamente.`, details: error?.message };
  }
}

// ─────────────────────────────────────────────
// PAYPAL
// ─────────────────────────────────────────────
export async function capturePaypalOrder(orderId: string, intentId: string): Promise<FinalizePageResult> {
  if (!intentId) return { success: false, error: 'ID do rascunho não encontrado.' };

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return { success: false, error: 'Credenciais do PayPal não configuradas.' };
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  try {
    const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    });
    const data = await response.json();
    if (data.status === 'COMPLETED') return await finalizeLovePage(intentId, orderId);
    return { success: false, error: 'Captura PayPal falhou.', details: data };
  } catch (error: any) {
    return { success: false, error: `Erro PayPal: ${error.message}`, details: error };
  }
}

// ─────────────────────────────────────────────
// MOVER ARQUIVO NO STORAGE
// ─────────────────────────────────────────────
//
// HISTÓRICO DO BUG:
// Muitos clientes estavam com fotos faltando nas páginas finalizadas. Causa
// raiz descoberta: o Cloud Storage faz rate limiting/throttle quando várias
// operações de copy+metadata acontecem em paralelo no mesmo bucket. Com
// Promise.all disparando 10-20 `copy`s simultâneos (galeria grande + timeline
// + memory game), algumas chamadas recebiam 429/503 em burst e o retry com
// backoff fixo não dava conta porque TODAS estavam no mesmo backoff window.
//
// FIXES APLICADOS:
// 1. Paralelismo CONTROLADO via `mapWithLimit` (default 3 simultâneos).
// 2. Retries mais agressivos: 6 tentativas (era 4) com backoff exponencial
//    + jitter aleatório (evita thundering herd de retries batendo juntos).
// 3. Se o source não existe, NÃO dá break — tenta de novo após pequeno
//    delay. Em Cloud Storage, eventual consistency pode fazer `exists()` dar
//    false mesmo com o arquivo lá (leitura que caiu em replica atrasado).
// 4. Delete do temp/ é SOFT — se falhar, nem loga como erro (é cleanup
//    opcional; ninguém reclama de arquivo temp duplicado).
// 5. Retorna flag `_moveFailed` no fileObject pro caller poder distinguir
//    sucesso de fallback (permite recuperação automática mais adiante).

async function moveFileWithRetry(bucket: any, db: any, fileObject: any, targetFolder: string, newPageId: string, maxRetries = 8): Promise<any> {
  if (!fileObject || !fileObject.path || !fileObject.path.startsWith('temp/')) return fileObject;

  const oldPath = fileObject.path;
  const fileName = oldPath.split('/').pop();
  if (!fileName) return fileObject;

  const newPath = `lovepages/${newPageId}/${targetFolder}/${fileName}`;
  let lastError: any = null;
  let source404Count = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sourceFile = bucket.file(oldPath);
      const targetFile = bucket.file(newPath);

      const [targetExists] = await targetFile.exists();
      if (!targetExists) {
        // Pre-check: verifica se source existe antes de tentar copy.
        // Evita copy cego que retorna 404 ambíguo (source vs target).
        const [sourceExists] = await sourceFile.exists();
        if (!sourceExists) {
          source404Count++;
          // Eventual consistency: exists() pode dar false em replica atrasada.
          // Só confirma missing após 5 checks negativos consecutivos com delays
          // de ~3-8s entre cada (total ~20-40s de espera).
          if (source404Count >= 5) {
            console.warn(`[moveFile] Source confirmed missing after ${source404Count} checks: ${oldPath}`);
            lastError = new Error(`source_missing: ${oldPath}`);
            break;
          }
          throw new Error(`source_not_found_attempt_${attempt}`);
        }
        await sourceFile.copy(targetFile);
      }

      const [metadata] = await targetFile.getMetadata();
      let token: string | undefined = metadata?.metadata?.firebaseStorageDownloadTokens;

      if (!token) {
        token = randomUUID();
        try {
          await targetFile.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
        } catch {
          try {
            const [retry] = await targetFile.getMetadata();
            const existing = retry?.metadata?.firebaseStorageDownloadTokens;
            if (existing) token = existing;
          } catch { /* usa o randomUUID gerado */ }
        }
      }

      const encodedPath = encodeURIComponent(newPath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

      (async () => {
        try { await sourceFile.delete(); } catch { /* silencioso */ }
      })();

      return { url: publicUrl, path: newPath };
    } catch (error: any) {
      lastError = error;
      console.warn(`[moveFile] Attempt ${attempt}/${maxRetries} failed for ${oldPath}:`, error?.message);
      if (attempt < maxRetries) {
        const isRateLimit = error?.code === 429 || error?.code === 503
          || error?.message?.includes('429') || error?.message?.includes('503')
          || error?.message?.includes('rate') || error?.message?.includes('Too Many');
        const isSourceNotFound = error?.message?.includes('source_not_found');
        const base = isRateLimit ? 2000 * Math.pow(2, attempt - 1)
          : isSourceNotFound ? 3000 * Math.pow(1.5, attempt - 1)
          : 500 * Math.pow(2, attempt - 1);
        const cap = isRateLimit ? 15_000 : isSourceNotFound ? 10_000 : 8_000;
        const jitter = base * (0.8 + Math.random() * 0.4);
        await new Promise(r => setTimeout(r, Math.min(jitter, cap)));
      }
    }
  }

  // Todas as tentativas falharam — loga APENAS em `failed_file_moves` pra
  // tracking técnico. NÃO dispara `logCriticalError` por arquivo (isso gerava
  // 55 logs pra uma página com 10 arquivos quebrados — inflava o painel de
  // erros sem utilidade, já que 1 página = 1 problema). O finalizeLovePage
  // faz UM ÚNICO log agregado com total pós-loop.
  try {
    await db.collection('failed_file_moves').add({
      pageId: newPageId, oldPath, newPath, targetFolder,
      error: lastError?.message || 'unknown',
      createdAt: Timestamp.now(), resolved: false,
    });
  } catch (e) {
    console.error('[moveFile] CRITICAL: could not log failure:', { oldPath, newPath, lastError });
  }

  // Retorna fileObject com flag pro caller saber que falhou — usado na
  // recuperação automática pós-finalize e pro log agregado.
  return { ...fileObject, _moveFailed: true, _moveError: lastError?.message || 'unknown', _targetFolder: targetFolder };
}

// Helper: processa items com concurrency limit. Sem isso, Promise.all com 20
// arquivos estoura rate-limit do Storage e uns retornam 429/503 em burst.
async function mapWithLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (true) {
      const current = idx++;
      if (current >= items.length) break;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────
// FINALIZAR PÁGINA (core)
// ─────────────────────────────────────────────
export async function finalizeLovePage(intentId: string, paymentId: string): Promise<FinalizePageResult> {
  const db = getAdminFirestore();
  const intentRef = db.collection('payment_intents').doc(intentId);

  // ── 1. Read intent OUTSIDE transaction (no timeout risk) ──────────────────
  const intentDoc = await intentRef.get();
  if (!intentDoc.exists) return { success: false, error: 'Rascunho não encontrado.' };
  const data = intentDoc.data();
  if (!data) return { success: false, error: 'Dados do rascunho inválidos.' };

  // ── 2. Idempotency: already finalized? ────────────────────────────────────
  if (data.status === 'completed' && data.lovePageId) {
    return { success: true, pageId: data.lovePageId as string };
  }

  // ── 3. Admin check OUTSIDE transaction ────────────────────────────────────
  const adminEmails = ADMIN_EMAILS;
  const isGuestUser = (data.userId as string)?.startsWith('guest_');
  let isCreatorAdmin = false;
  if (data.userId && !isGuestUser) {
    try {
      const userDoc = await db.collection('users').doc(data.userId).get();
      if (userDoc.exists) {
        const userEmail = userDoc.data()?.email;
        if (userEmail && adminEmails.includes(userEmail)) isCreatorAdmin = true;
      }
    } catch (e) {
      console.warn(`Could not verify admin status for user ${data.userId}`, e);
    }
  }

  // ── 4. Move ALL files OUTSIDE transaction (no 30s timeout, no retry side-effects) ──
  const bucket = getAdminStorage();
  const newPageId = db.collection('lovepages').doc().id;
  const sanitizedData = sanitizeForFirebase(data);

  // ── PRE-FLIGHT: quick check for GCS eventual consistency ──
  // Wait up to ~15s for files to appear. If still missing, strip them and
  // proceed — the customer paid, we MUST create the page. Missing images
  // are recoverable (self-heal cron); a missing page is not.
  const collectTempPaths = (v: any, paths: string[] = []): string[] => {
    if (Array.isArray(v)) { v.forEach(it => collectTempPaths(it, paths)); return paths; }
    if (v && typeof v === 'object') {
      if (typeof v.path === 'string' && v.path.startsWith('temp/')) paths.push(v.path);
      for (const k in v) if (k !== 'path') collectTempPaths(v[k], paths);
    }
    return paths;
  };
  const allTempPaths = [
    ...collectTempPaths(sanitizedData.galleryImages),
    ...collectTempPaths(sanitizedData.timelineEvents),
    ...collectTempPaths(sanitizedData.memoryGameImages),
    ...collectTempPaths(sanitizedData.puzzleImage),
    ...collectTempPaths(sanitizedData.audioRecording),
    ...collectTempPaths(sanitizedData.backgroundVideo),
  ];
  let strippedFiles: string[] = [];
  if (allTempPaths.length > 0) {
    const MAX_WAIT_ROUNDS = 3;
    const WAIT_DELAY = 5_000;
    let missingPaths: string[] = [];
    for (let round = 0; round < MAX_WAIT_ROUNDS; round++) {
      const checks = await Promise.all(
        allTempPaths.map(async (p) => {
          try { const [exists] = await bucket.file(p).exists(); return exists; }
          catch { return false; }
        }),
      );
      missingPaths = allTempPaths.filter((_, i) => !checks[i]);
      if (missingPaths.length === 0) break;
      if (round < MAX_WAIT_ROUNDS - 1) {
        console.log(`[finalize] Pre-flight round ${round + 1}: ${missingPaths.length}/${allTempPaths.length} files not yet visible, waiting ${WAIT_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, WAIT_DELAY));
      }
    }
    if (missingPaths.length > 0) {
      strippedFiles = missingPaths;
      console.warn(`[finalize] ${missingPaths.length}/${allTempPaths.length} files missing after ${MAX_WAIT_ROUNDS * WAIT_DELAY / 1000}s — stripping and proceeding. Intent: ${intentId}`, missingPaths);
      const missingSet = new Set(missingPaths);
      if (Array.isArray(sanitizedData.galleryImages)) {
        sanitizedData.galleryImages = sanitizedData.galleryImages.filter((img: any) => img?.path && !missingSet.has(img.path));
      }
      if (Array.isArray(sanitizedData.timelineEvents)) {
        sanitizedData.timelineEvents = sanitizedData.timelineEvents.map((ev: any) => {
          if (ev?.image && missingSet.has(ev.image.path)) return { ...ev, image: undefined };
          return ev;
        });
      }
      if (Array.isArray(sanitizedData.memoryGameImages)) {
        sanitizedData.memoryGameImages = sanitizedData.memoryGameImages.filter((img: any) => img?.path && !missingSet.has(img.path));
      }
      if (sanitizedData.puzzleImage && missingSet.has(sanitizedData.puzzleImage.path)) sanitizedData.puzzleImage = undefined;
      if (sanitizedData.audioRecording && missingSet.has(sanitizedData.audioRecording.path)) sanitizedData.audioRecording = undefined;
      if (sanitizedData.backgroundVideo && missingSet.has(sanitizedData.backgroundVideo.path)) sanitizedData.backgroundVideo = undefined;
    }
  }

  const CONCURRENCY = 2;
  if (sanitizedData.galleryImages?.length) {
    sanitizedData.galleryImages = await mapWithLimit(
      sanitizedData.galleryImages,
      CONCURRENCY,
      (img: any) => moveFileWithRetry(bucket, db, img, 'gallery', newPageId),
    );
  }
  if (sanitizedData.timelineEvents?.length) {
    sanitizedData.timelineEvents = await mapWithLimit(
      sanitizedData.timelineEvents,
      CONCURRENCY,
      async (event: any) => {
        if (event.image) event.image = await moveFileWithRetry(bucket, db, event.image, 'timeline', newPageId);
        return { ...event, date: ensureTimestamp(event.date) };
      },
    );
  } else if (sanitizedData.timelineEvents) {
    sanitizedData.timelineEvents = sanitizedData.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
  }
  if (sanitizedData.puzzleImage) sanitizedData.puzzleImage = await moveFileWithRetry(bucket, db, sanitizedData.puzzleImage, 'puzzle', newPageId);
  if (sanitizedData.audioRecording) sanitizedData.audioRecording = await moveFileWithRetry(bucket, db, sanitizedData.audioRecording, 'audio', newPageId);
  if (sanitizedData.backgroundVideo) sanitizedData.backgroundVideo = await moveFileWithRetry(bucket, db, sanitizedData.backgroundVideo, 'video', newPageId);
  if (sanitizedData.memoryGameImages?.length) {
    sanitizedData.memoryGameImages = await mapWithLimit(
      sanitizedData.memoryGameImages,
      CONCURRENCY,
      (img: any) => moveFileWithRetry(bucket, db, img, 'memory-game', newPageId),
    );
  }

  // ── LOG AGREGADO: 1 entrada por página (não por arquivo) ────────────────
  // Antes: `moveFileWithRetry` disparava logCriticalError() por ARQUIVO — uma
  // página com 10 fotos quebradas gerava 10 logs. Painel ficava com "55 erros"
  // que eram 5-8 páginas. Agora contamos aqui e emitimos 1 log com totais +
  // breakdown por folder — fácil de ação no admin.
  const collectFailures = (v: any, failures: Array<{ folder: string; error: string; path: string }> = []): typeof failures => {
    if (Array.isArray(v)) { v.forEach(it => collectFailures(it, failures)); return failures; }
    if (v && typeof v === 'object') {
      if (v._moveFailed) {
        failures.push({ folder: v._targetFolder || 'unknown', error: v._moveError || 'unknown', path: v.path || 'unknown' });
      }
      for (const k in v) collectFailures(v[k], failures);
    }
    return failures;
  };
  const allFailures = [
    ...collectFailures(sanitizedData.galleryImages),
    ...collectFailures(sanitizedData.timelineEvents),
    ...collectFailures(sanitizedData.memoryGameImages),
    ...collectFailures(sanitizedData.puzzleImage),
    ...collectFailures(sanitizedData.audioRecording),
    ...collectFailures(sanitizedData.backgroundVideo),
  ];
  if (allFailures.length > 0) {
    const byFolder: Record<string, number> = {};
    const byError: Record<string, number> = {};
    allFailures.forEach(f => {
      byFolder[f.folder] = (byFolder[f.folder] || 0) + 1;
      const errType = f.error.includes('source_missing') ? 'source_missing'
        : f.error.includes('429') || f.error.includes('503') || f.error.includes('rate') ? 'rate_limit'
        : f.error.includes('not_found') ? 'not_found'
        : f.error;
      byError[errType] = (byError[errType] || 0) + 1;
    });
    const folderSummary = Object.entries(byFolder).map(([k, v]) => `${k}:${v}`).join(', ');
    const errorSummary = Object.entries(byError).map(([k, v]) => `${k}(${v})`).join(', ');
    const pageTitle = (data.title as string) || 'Sem título';
    const pageEmail = (data.guestEmail || data.userEmail || '') as string;
    try {
      await logCriticalError('page_creation',
        `"${pageTitle}" (${pageEmail || 'sem email'}) — ${allFailures.length} arquivos quebrados [${folderSummary}] — Causa: ${errorSummary}`, {
        pageId: newPageId,
        intentId,
        title: pageTitle,
        email: pageEmail,
        totalFailed: allFailures.length,
        byFolder,
        byError,
        files: allFailures.slice(0, 30).map(f => `${f.folder}: ${f.path} → ${f.error}`),
      });
    } catch { /* best effort */ }
  }

  // Flag _moveFailed/_moveError/_targetFolder são internos — tira antes de
  // salvar no Firestore (não polui o doc). O sweep scan do /admin/pages
  // detecta via `path` começar com temp/ que é o que sobra se o move falhou.
  const stripMoveFlag = (v: any): any => {
    if (Array.isArray(v)) return v.map(stripMoveFlag);
    if (v && typeof v === 'object') {
      if ('_moveFailed' in v || '_moveError' in v || '_targetFolder' in v) {
        const { _moveFailed, _moveError, _targetFolder, ...rest } = v;
        return stripMoveFlag(rest);
      }
      const out: any = {};
      for (const k in v) out[k] = stripMoveFlag(v[k]);
      return out;
    }
    return v;
  };
  sanitizedData.galleryImages = stripMoveFlag(sanitizedData.galleryImages);
  sanitizedData.timelineEvents = stripMoveFlag(sanitizedData.timelineEvents);
  sanitizedData.memoryGameImages = stripMoveFlag(sanitizedData.memoryGameImages);
  sanitizedData.puzzleImage = stripMoveFlag(sanitizedData.puzzleImage);
  sanitizedData.audioRecording = stripMoveFlag(sanitizedData.audioRecording);
  sanitizedData.backgroundVideo = stripMoveFlag(sanitizedData.backgroundVideo);
  sanitizedData.specialDate = ensureTimestamp(sanitizedData.specialDate);

  // ── 5. Build final page data ───────────────────────────────────────────────
  const { payment, guestEmail: _ge, ...finalData } = sanitizedData;
  finalData.id = newPageId;
  finalData.createdAt = Timestamp.now();
  finalData.filesMovedAt = Timestamp.now();
  finalData.paymentId = paymentId;
  finalData.status = 'paid';
  finalData.componentVersion = 'v2';
  // Propaga locale do intent pro doc final — pageData.locale fica imutável,
  // garantindo que a página seja renderizada no idioma em que foi criada.
  if (!finalData.locale) finalData.locale = (data?.locale === 'en' ? 'en' : 'pt');
  if (data.paidAmount) finalData.paidAmount = data.paidAmount;

  // introType vem do formulário (ex: 'love') e é preservado no finalData automaticamente

  if (isCreatorAdmin) {
    finalData.plan = 'avancado';
    delete finalData.expireAt;
  } else if (finalData.plan === 'pascoa') {
    // backward compat: páginas antigas com plan=pascoa
    if (!finalData.introType) finalData.introType = 'love';
    finalData.plan = 'avancado';
    delete finalData.expireAt;
  } else if (finalData.plan === 'basico') {
    finalData.expireAt = Timestamp.fromMillis(Date.now() + 25 * 60 * 60 * 1000);
  } else {
    delete finalData.expireAt;
  }

  // ── 6. Firestore transaction — ONLY Firestore writes, no Storage calls ────
  await db.runTransaction(async (transaction) => {
    // Re-read inside transaction for consistency
    const freshIntent = await transaction.get(intentRef);
    if (freshIntent.data()?.status === 'completed') return; // race condition guard

    transaction.set(db.collection('lovepages').doc(newPageId), finalData);

    if (data.userId && !isGuestUser) {
      transaction.set(
        db.collection('users').doc(data.userId).collection('love_pages').doc(newPageId),
        { title: finalData.title, pageId: newPageId, createdAt: Timestamp.now() }
      );
    }

    transaction.update(intentRef, { status: 'completed', lovePageId: newPageId });
  });

  // ── 7. Post-finalization side-effects ─────────────────────────────────────
  const userEmail = (data.guestEmail || data.userEmail) as string | undefined;
  if (data.guestEmail) {
    await createGuestAccount(data.guestEmail, data.userId as string, newPageId);
  }
  // Skip server-side pixel for free finalizations (gift/credit/admin) — esses
  // viram CompleteRegistration no client, não Purchase, e não alimentam ROAS.
  const isFreePixelSkip = paymentId.startsWith('credit_') || paymentId.startsWith('gift_') || paymentId.startsWith('admin_');
  if (!isFreePixelSkip) {
    await sendServerSidePurchaseEvent({
      plan: finalData.plan as 'basico' | 'avancado' | 'vip',
      pageId: newPageId,
      userEmail,
      userPhone: data.whatsappNumber,
      paidAmount: typeof data.paidAmount === 'number' ? data.paidAmount : undefined,
      locale: data.locale === 'en' ? 'en' : 'pt',
      fbp: data.fbp,
      fbc: data.fbc,
      ttclid: data.ttclid,
      ttp: data.ttp,
      eventSourceUrl: data.eventSourceUrl,
    });
  }

  // ── Notify admin via Realtime DB + Push ──────────────────────────────────
  // Use the amount that was actually charged (stored on the intent when PIX
  // was generated). Falling back to the plan base price is WRONG when the
  // user applied a coupon or paid for add-ons — it was showing "venda R$24,90"
  // on sales that actually went through at R$19,90 (or vice-versa).
  const rawPaid = Number(data.paidAmount);
  const saleValue = isFinite(rawPaid) && rawPaid > 0
    ? rawPaid
    : (finalData.plan === 'vip' ? 34.99 : finalData.plan === 'avancado' ? 24.90 : 19.90);
  const saleTitle = (finalData.title as string) || 'Sem título';
  const salePlan = finalData.plan === 'vip' ? 'VIP' : finalData.plan === 'avancado' ? 'Avançado' : 'Básico';

  // Sanity check: every PAID intent should have paidAmount saved by
  // processPixPayment. If it's missing, we're falling back to the plan base
  // price — log it so we can find and fix the broken code path.
  // Skip for free pages (gift/credit) where paidAmount is explicitly 0.
  const isFreeFinalization = paymentId.startsWith('credit_') || paymentId.startsWith('gift_') || paymentId.startsWith('admin_');
  if (!isFreeFinalization && (!isFinite(rawPaid) || rawPaid <= 0)) {
    logCriticalError('payment', 'Intent finalizado sem paidAmount, usando fallback', {
      intentId,
      paymentId,
      plan: finalData.plan,
      fallbackValue: saleValue,
    }).catch(() => {});
  }
  try {
    const rtdb = getAdminDatabase();
    await rtdb.ref('sales_feed').push({
      pageId: newPageId,
      title: saleTitle,
      plan: finalData.plan || 'basico',
      value: saleValue,
      ts: Date.now(),
    });
  } catch (e) {
    console.warn('[RTDB] Failed to push sale notification:', e);
  }
  // Push notification to admin devices (non-blocking)
  notifyAdmins(
    `💰 Nova venda! R$${saleValue.toFixed(2).replace('.', ',')}`,
    `${saleTitle} — Plano ${salePlan}`,
    `https://mycupid.com.br/admin`,
  ).catch(() => {});
  // If files were stripped during pre-flight, log + alert so admin can investigate.
  if (strippedFiles.length > 0) {
    logCriticalError('page_creation', `Página criada com ${strippedFiles.length} arquivos faltando (removidos automaticamente)`, {
      pageId: newPageId,
      intentId,
      strippedFiles,
      totalFiles: allTempPaths.length,
    }).catch(() => {});
    notifyAdmins(
      `⚠️ Página criada com ${strippedFiles.length} imagem(ns) faltando`,
      `${(finalData.title as string) || 'Sem título'} — ${strippedFiles.length}/${allTempPaths.length} arquivos não encontrados no Storage`,
      `https://mycupid.com.br/admin`,
    ).catch(() => {});
  }

  revalidatePath(`/p/${newPageId}`);
  revalidatePath('/minhas-paginas');
  // Bust the cached admin dashboard snapshot so new sales show up within
  // seconds instead of waiting up to 5 min for the unstable_cache revalidate.
  revalidateTag('admin-dashboard');

  return { success: true, pageId: newPageId };
}

// ─────────────────────────────────────────────
// VERIFICAR PAGAMENTO MERCADO PAGO
// ─────────────────────────────────────────────
// Cache in-memory dos logs já emitidos por (paymentId) — o cliente pollea a
// cada 3s durante 15 min. Sem dedup, uma falha persistente gera ~300 logs
// duplicados do mesmo paymentId. Cache TTL de 5min cobre o ciclo inteiro.
const _verifyErrorLogged = new Map<string, number>();
const VERIFY_LOG_DEDUP_MS = 5 * 60 * 1000;

export async function verifyPaymentWithMercadoPago(paymentId: string, intentId: string): Promise<PaymentVerificationResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { status: 'error', error: 'Token do Mercado Pago não configurado.' };

  try {
    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    if (paymentInfo.status === 'approved') {
      const result = await finalizeLovePage(intentId, paymentId);
      if (!result.success) {
        // Finalize falhou — log só uma vez por paymentId (até 5min).
        const key = `fin:${paymentId}`;
        const last = _verifyErrorLogged.get(key) || 0;
        if (Date.now() - last > VERIFY_LOG_DEDUP_MS) {
          _verifyErrorLogged.set(key, Date.now());
          await logCriticalError('page_creation', `Página não criada após PIX aprovado: ${result.error}`, { intentId, paymentId });
        }
        return { status: 'error', error: result.error || 'Falha ao finalizar.' };
      }
      return { status: 'approved', pageId: result.pageId };
    }

    const currentStatus = paymentInfo.status || 'pending';
    const known = ['pending','in_process','authorized','in_mediation','rejected','cancelled','refunded','charged_back'];
    if (known.includes(currentStatus)) return { status: currentStatus as any };
    return { status: 'pending' };
  } catch (error: any) {
    // Dedup: evita 300+ logs idênticos durante polling de 15min. Loga a
    // primeira ocorrência, silencia as repetições do mesmo paymentId.
    const key = `verify:${paymentId}`;
    const last = _verifyErrorLogged.get(key) || 0;
    if (Date.now() - last > VERIFY_LOG_DEDUP_MS) {
      _verifyErrorLogged.set(key, Date.now());
      await logCriticalError('payment', `Verificação PIX falhou: ${error.message}`, { paymentId, intentId, stack: error.stack });
    }
    return { status: 'error', error: error.message, details: error };
  }
}

// ─────────────────────────────────────────────
// ADMIN FINALIZE (teste/admin bypass)
// ─────────────────────────────────────────────
export async function adminFinalizePage(intentId: string, userId: string): Promise<FinalizePageResult> {
  try {
    return await finalizeLovePage(intentId, `admin_finalize_${userId}_${Date.now()}`);
  } catch (error: any) {
    return { success: false, error: error.message, details: error };
  }
}

// ─────────────────────────────────────────────
// FINALIZAR COM CRÉDITO DE CORTESIA
// Verifica crédito, finaliza página e incrementa usedCredits atomicamente
// ─────────────────────────────────────────────
export async function finalizeWithCredit(
  intentId: string,
  userId: string,
  userEmail: string
): Promise<FinalizePageResult> {
  const db = getAdminFirestore();
  const creditRef = db.collection('user_credits').doc(userEmail.toLowerCase().trim());

  // 1. Verifica crédito disponível
  const creditSnap = await creditRef.get();
  if (!creditSnap.exists) {
    return { success: false, error: 'Nenhum crédito encontrado para este usuário.' };
  }

  const creditData = creditSnap.data()!;
  const totalCredits = creditData.totalCredits ?? 0;
  const usedCredits = creditData.usedCredits ?? 0;
  const available = totalCredits - usedCredits;

  if (available <= 0) {
    return { success: false, error: 'Sem créditos disponíveis.' };
  }

  // 2. Usa o plano definido no crédito (admin escolhe ao dar crédito)
  const creditPlan = creditData.plan || 'avancado';
  const intentSnap = await db.collection('payment_intents').doc(intentId).get();
  const originalPlan = intentSnap.data()?.plan;
  try {
    const updateData: any = { plan: creditPlan, paidAmount: 0, updatedAt: Timestamp.now() };
    if (originalPlan === 'pascoa') updateData.introType = 'love';
    if (creditPlan === 'vip' || creditPlan === 'avancado') updateData.expireAt = null;
    await db.collection('payment_intents').doc(intentId).update(updateData);
  } catch (e) {
    console.warn('[finalizeWithCredit] Não conseguiu forçar plan no intent:', e);
  }

  // 3. Finaliza a página
  const result = await finalizeLovePage(intentId, `credit_${userId}_${Date.now()}`);

  if (!result.success) return result;

  // 4. Incrementa usedCredits atomicamente
  try {
    await creditRef.update({
      usedCredits: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
      lastUsedPageId: result.pageId,
    });
    console.log(`[Credit] 1 crédito consumido para ${userEmail}. PageId: ${result.pageId}`);
  } catch (err) {
    // Não falha o fluxo — página já foi criada, só loga o erro
    console.error('[Credit] Falha ao incrementar usedCredits:', err);
  }

  return { success: true, pageId: result.pageId };
}

// ─────────────────────────────────────────────
// FINALIZAR COM LINK DE PRESENTE (gift token)
// ─────────────────────────────────────────────
export async function finalizeWithGiftToken(
  intentId: string,
  userId: string,
  giftToken: string,
  email: string,
): Promise<FinalizePageResult> {
  const db = getAdminFirestore();
  const tokenRef = db.collection('gift_tokens').doc(giftToken);

  // ── 1. Claim atômico do token ─────────────────────────────────────────────
  // Lê + marca `used: true` numa transação só. Dois clicks simultâneos (ex:
  // user dá double-tap, ou abre o link em duas abas) não conseguem ambos
  // resgatar — Firestore aborta a segunda transação com conflict. Sem isso,
  // o check `if (used)` + o `update` depois tinham uma janela de ~200ms de
  // race pra gerar duas páginas grátis com o mesmo token.
  // Marcamos `claimedAt` antes da página existir; `pageId` é preenchido no passo 4.
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(tokenRef);
      if (!snap.exists) throw new Error('GIFT_NOT_FOUND');
      const d = snap.data() as any;
      if (d?.used) throw new Error('GIFT_ALREADY_USED');
      tx.update(tokenRef, {
        used: true,
        claimedAt: Timestamp.now(),
        claimedByUserId: userId,
        claimedByEmail: email,
      });
    });
  } catch (err: any) {
    if (err?.message === 'GIFT_NOT_FOUND') return { success: false, error: 'Link de presente inválido.' };
    if (err?.message === 'GIFT_ALREADY_USED') return { success: false, error: 'Este presente já foi utilizado.' };
    console.error('[Gift] Transação falhou:', err);
    return { success: false, error: 'Não foi possível resgatar o presente. Tente novamente.' };
  }

  // ── 2. Atualiza o intent com plano do gift, guestEmail e flag isGift ──────
  const tokenSnap = await tokenRef.get();
  const giftPlan = tokenSnap.data()?.plan || 'avancado';
  const intentSnap = await db.collection('payment_intents').doc(intentId).get();
  const originalPlan = intentSnap.data()?.plan;
  try {
    const updateData: any = { plan: giftPlan, guestEmail: email, isGift: true, paidAmount: 0, updatedAt: Timestamp.now() };
    if (originalPlan === 'pascoa') updateData.introType = 'love';
    if (giftPlan === 'vip' || giftPlan === 'avancado') updateData.expireAt = null;
    await db.collection('payment_intents').doc(intentId).update(updateData);
  } catch (e) {
    console.warn('[finalizeWithGiftToken] Falha ao atualizar intent:', e);
  }

  // ── 3. Finaliza a página ──────────────────────────────────────────────────
  const result = await finalizeLovePage(intentId, `gift_${giftToken}`);
  if (!result.success) {
    // Rollback: finalize falhou, devolve o token pro pool pra user tentar de novo.
    // Sem isso, o user perde o gift pra sempre por um erro transitório no move de arquivos.
    try {
      await tokenRef.update({ used: false, claimedAt: FieldValue.delete(), claimedByUserId: FieldValue.delete(), claimedByEmail: FieldValue.delete() });
    } catch (rollbackErr) {
      console.error('[Gift] Rollback falhou — token fica marcado como usado:', rollbackErr);
      logCriticalError('payment', 'Gift token stuck as used after finalize failure', {
        giftToken, intentId, userId, email, finalizeError: result.error,
      }).catch(() => {});
    }
    return result;
  }

  // ── 4. Persiste metadata final do claim + marca page como gift ────────────
  try {
    await Promise.all([
      tokenRef.update({ usedAt: Timestamp.now(), usedByEmail: email, pageId: result.pageId }),
      db.collection('lovepages').doc(result.pageId).update({ isGift: true, giftToken }),
    ]);
  } catch (err) {
    console.error('[Gift] Falha ao marcar metadata pós-finalize:', err);
  }

  return { success: true, pageId: result.pageId };
}

// ─────────────────────────────────────────────
// STRIPE (placeholder)
// ─────────────────────────────────────────────
export async function createStripeCheckoutSession(intentId: string, plan: 'basico' | 'avancado', domain: string): Promise<StripeSessionResult> {
  return { success: false, error: 'Stripe integration is not fully configured on the backend.' };
}

// ─────────────────────────────────────────────
// EDITAR PÁGINA (VIP only)
// ─────────────────────────────────────────────
// Atualiza uma página já publicada. Só VIP tem acesso a essa feature — é o
// diferencial principal do plano. Auth gate triple-check:
//   1. userId do request tem que bater com pageData.userId
//   2. plano tem que ser VIP (previne upgrade-without-paying)
//   3. campos bloqueados (plan, userId, paidAmount, isGift, lovePageId) são
//      explicitamente removidos do update pra evitar privilege escalation
//      (ex: user mandando plan=vip num update de uma página Básico).

const BLOCKED_UPDATE_KEYS = new Set([
  'plan', 'userId', 'lovePageId', 'pageId', 'id',
  'paidAmount', 'paymentId', 'isGift', 'giftToken',
  'createdAt', 'status', 'expireAt',
]);

export interface UpdatePageResult {
  success: boolean;
  error?: string;
}

export async function updateLovePage(
  pageId: string,
  userId: string,
  partialData: any,
): Promise<UpdatePageResult> {
  if (!pageId) return { success: false, error: 'Missing pageId.' };

  const db = getAdminFirestore();
  const pageRef = db.collection('lovepages').doc(pageId);
  const pageSnap = await pageRef.get();
  if (!pageSnap.exists) return { success: false, error: 'Página não encontrada.' };
  const existing = pageSnap.data()!;

  // ── AUTH: 3 caminhos aceitos ─────────────────────────────────────────────
  // 1. Admin (ADMIN_EMAILS) → bypass total
  // 2. Dono logado (user.uid === pageData.userId + session cookie válido)
  // 3. Edit token por email (cookie edit_token_{pageId} HMAC-assinado, setado
  //    via requestEditAccess depois do user digitar o email correto)
  //
  // Caminho 3 foi adicionado porque a maioria dos VIPs criou como guest
  // anônimo — userId do doc é um UID anônimo único do device original, então
  // em outro navegador user.uid nunca bate. Email é a referência acessível.
  let isAdmin = false;
  let authorized = false;

  // Check admin bypass
  if (userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const email = userDoc.data()?.email;
      if (email && ADMIN_EMAILS.includes(email)) {
        isAdmin = true;
        authorized = true;
      }
    } catch { /* ignore */ }
  }

  // Check session cookie (dono logado tradicional)
  if (!authorized && userId) {
    try {
      const sessionCookie = cookies().get('__session')?.value;
      if (sessionCookie) {
        const { getAdminApp } = await import('@/lib/firebase/admin/config');
        const decoded = await getAuth(getAdminApp()).verifySessionCookie(sessionCookie, true);
        if (decoded.uid === userId && existing.userId === userId) {
          authorized = true;
        }
      } else if (existing.userId === userId) {
        // Fallback sem cookie (ex: SSR dev) — ainda exige userId bater no doc
        authorized = true;
      }
    } catch (e: any) {
      console.warn('[updateLovePage] Session verify skipped:', e?.message);
    }
  }

  // Check edit token cookie (email-validado via requestEditAccess)
  if (!authorized) {
    try {
      const editToken = cookies().get('edit_token_' + pageId)?.value;
      if (editToken) {
        const { verifyEditToken } = await import('@/app/editar/[pageId]/auth');
        const r = await verifyEditToken(pageId);
        if (r.ok && r.email) {
          // Confirma que o email do token ainda bate com o doc (defesa extra)
          const pageEmails = [existing.guestEmail, existing.ownerEmail, existing.userEmail]
            .filter(Boolean)
            .map((e: string) => e.toLowerCase().trim());
          if (pageEmails.includes(r.email)) authorized = true;
        }
      }
    } catch (e: any) {
      console.warn('[updateLovePage] Edit token verify skipped:', e?.message);
    }
  }

  if (!authorized) {
    return { success: false, error: 'Você não tem permissão para editar esta página.' };
  }
  if (!isAdmin && existing.plan !== 'vip') {
    return { success: false, error: 'Edição disponível apenas no plano VIP.' };
  }

  // Strip campos bloqueados e sanitize. Isso é a defesa principal contra
  // privilege escalation — mesmo que o cliente mande "plan": "vip", ignoramos.
  const cleaned: Record<string, any> = {};
  for (const k in partialData) {
    if (BLOCKED_UPDATE_KEYS.has(k)) continue;
    cleaned[k] = sanitizeForFirebase(partialData[k]);
  }

  // Move arquivos temp/ pra lovepages/{pageId}/... (novos uploads durante edit).
  // Arquivos já persistidos em lovepages/... não se movem (moveFileWithRetry
  // tem guard `startsWith('temp/')`).
  const bucket = getAdminStorage();

  try {
    if (Array.isArray(cleaned.galleryImages)) {
      cleaned.galleryImages = await mapWithLimit(
        cleaned.galleryImages, 2,
        (img: any) => moveFileWithRetry(bucket, db, img, 'gallery', pageId),
      );
    }
    if (Array.isArray(cleaned.timelineEvents)) {
      cleaned.timelineEvents = await mapWithLimit(
        cleaned.timelineEvents, 2,
        async (event: any) => {
          if (event?.image) event.image = await moveFileWithRetry(bucket, db, event.image, 'timeline', pageId);
          return { ...event, date: ensureTimestamp(event.date) };
        },
      );
    }
    if (cleaned.puzzleImage) cleaned.puzzleImage = await moveFileWithRetry(bucket, db, cleaned.puzzleImage, 'puzzle', pageId);
    if (cleaned.audioRecording) cleaned.audioRecording = await moveFileWithRetry(bucket, db, cleaned.audioRecording, 'audio', pageId);
    if (cleaned.backgroundVideo) cleaned.backgroundVideo = await moveFileWithRetry(bucket, db, cleaned.backgroundVideo, 'video', pageId);
    if (Array.isArray(cleaned.memoryGameImages)) {
      cleaned.memoryGameImages = await mapWithLimit(
        cleaned.memoryGameImages, 2,
        (img: any) => moveFileWithRetry(bucket, db, img, 'memory-game', pageId),
      );
    }
    if (cleaned.specialDate) cleaned.specialDate = ensureTimestamp(cleaned.specialDate);
  } catch (err) {
    console.error('[updateLovePage] File move failed:', err);
    return { success: false, error: 'Falha ao subir arquivos novos. Tente de novo.' };
  }

  cleaned.updatedAt = Timestamp.now();

  try {
    await pageRef.update(cleaned);
  } catch (err: any) {
    console.error('[updateLovePage] Update failed:', err);
    return { success: false, error: err?.message || 'Falha ao salvar edição.' };
  }

  // ── Cleanup de arquivos órfãos ────────────────────────────────────────────
  // User removeu fotos da galeria/timeline durante edit? Os arquivos velhos
  // ficariam no Storage pra sempre, gastando quota. Compara paths antigos vs
  // novos e deleta os que foram descartados. Best-effort: falha aqui não
  // quebra o update — já foi salvo com sucesso no Firestore.
  try {
    const collectPaths = (obj: any): string[] => {
      const paths: string[] = [];
      if (!obj) return paths;
      const walk = (x: any) => {
        if (!x) return;
        if (Array.isArray(x)) { x.forEach(walk); return; }
        if (typeof x === 'object') {
          if (typeof x.path === 'string' && x.path.startsWith('lovepages/')) paths.push(x.path);
          Object.values(x).forEach(walk);
        }
      };
      walk(obj);
      return paths;
    };
    const oldPaths = new Set(collectPaths(existing));
    const newPaths = new Set(collectPaths(cleaned));
    const orphans = [...oldPaths].filter((p) => !newPaths.has(p));
    if (orphans.length > 0) {
      await Promise.all(
        orphans.map((p) =>
          bucket.file(p).delete().catch((e) => {
            console.warn('[updateLovePage] Orphan cleanup failed for', p, e?.message);
          }),
        ),
      );
    }
  } catch (e) {
    console.warn('[updateLovePage] Orphan sweep failed (non-critical):', e);
  }

  // Revalida caches: página pública + listagem do user.
  try {
    revalidatePath(`/p/${pageId}`);
    revalidatePath('/minhas-paginas');
  } catch { /* ignore */ }

  return { success: true };
}
