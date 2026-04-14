'use server';

import { getAdminFirestore, getAdminStorage, getAdminDatabase } from '@/lib/firebase/admin/config';
import { notifyAdmins } from '@/lib/notify-admin';
import { getAuth } from 'firebase-admin/auth';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createHash, randomUUID } from 'crypto';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { logCriticalError } from '@/lib/log-critical-error';
import { computeTotalBRL } from '@/lib/price';

// ─────────────────────────────────────────────
// META CAPI
// ─────────────────────────────────────────────
async function sendServerSidePurchaseEvent(plan: 'basico' | 'avancado', pageId: string, userEmail?: string, paidAmount?: number) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '177.160.0.1';
  const userAgent = headersList.get('user-agent') || 'Mozilla/5.0';
  const value = (typeof paidAmount === 'number' && paidAmount > 0)
    ? paidAmount
    : (plan === 'avancado' ? 24.90 : 19.90);

  const userData: Record<string, any> = { client_ip_address: clientIp, client_user_agent: userAgent };
  if (userEmail) {
    userData.em = [createHash('sha256').update(userEmail.toLowerCase().trim()).digest('hex')];
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          // event_id = pageId permite o Meta deduplicar este CAPI com o pixel do browser
          // (que também usa pageId como eventID). Cada venda real = 1 event_id único.
          event_id: pageId,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: 'https://mycupid.com.br/criar/fazer-eu-mesmo',
          action_source: 'website',
          user_data: userData,
          custom_data: { value, currency: 'BRL', content_ids: [plan], content_type: 'product', order_id: pageId },
        }],
      }),
    });
    const data = await res.json();
    if (!res.ok) console.error('[Meta CAPI] Erro:', data);
    else console.log('[Meta CAPI] Purchase enviado. PageId:', pageId);
  } catch (err) {
    console.error('[Meta CAPI] Exceção:', err);
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
  const { intentId, ...restOfPageData } = fullPageData;

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
) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return { error: 'Token Mercado Pago não configurado.' };

  try {
    const db = getAdminFirestore();
    const intentDoc = await db.collection('payment_intents').doc(intentId).get();
    if (!intentDoc.exists) return { error: 'Rascunho não encontrado.' };

    const intentData = intentDoc.data();
    const rawWhatsapp = (intentData?.whatsappNumber || '').replace(/\D/g, '');
    if (rawWhatsapp.length < 10) {
      return { error: 'WhatsApp obrigatório. Preencha seu número com DDD antes de gerar o PIX.' };
    }
    const cleanEmail = (intentData?.guestEmail || intentData?.userEmail || 'pagamento@mycupid.com.br').trim().toLowerCase();
    const rawName = intentData?.userName || 'Cliente MyCupid';
    const firstName = rawName.split(' ')[0];
    const lastName = rawName.split(' ').slice(1).join(' ') || 'Cliente';

    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);

    // ── SERVER-TRUSTED PRICE ──
    // Recompute price from the saved intent data. Client-sent total is only
    // used for logging/mismatch detection, never trusted.
    const validatedDiscount = await getValidatedDiscountAmount(db, discountCode, cleanEmail);
    const serverAmount = computeTotalBRL({
      plan: intentData?.plan,
      qrCodeDesign: intentData?.qrCodeDesign,
      enableWordGame: intentData?.enableWordGame,
      wordGameQuestions: intentData?.wordGameQuestions,
      introType: intentData?.introType,
      audioRecording: intentData?.audioRecording,
      discountAmount: validatedDiscount,
    });
    const amount = Number(serverAmount.toFixed(2));
    if (!amount || amount < 1 || isNaN(amount)) {
      return { error: `Valor inválido: R$${amount}. Tente novamente.` };
    }
    if (
      typeof clientClaimedTotal === 'number' &&
      isFinite(clientClaimedTotal) &&
      Math.abs(clientClaimedTotal - amount) > 0.01
    ) {
      console.warn(
        `[PIX] Price mismatch — client=${clientClaimedTotal} server=${amount} intent=${intentId}`,
      );
      logCriticalError('payment', 'Price mismatch client vs server', {
        intentId,
        clientClaimedTotal,
        serverAmount: amount,
      }).catch(() => {});

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
          // Notifica admin que um PIX foi gerado (ainda não pago)
          notifyAdmins(
            `PIX gerado · R$${amount.toFixed(2).replace('.', ',')}`,
            `${intentData?.plan === 'avancado' ? 'Avançado' : 'Básico'} · ${cleanEmail}`,
            'https://mycupid.com.br/admin/recuperar-pix',
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
async function moveFileWithRetry(bucket: any, db: any, fileObject: any, targetFolder: string, newPageId: string, maxRetries = 4): Promise<any> {
  if (!fileObject || !fileObject.path || !fileObject.path.startsWith('temp/')) return fileObject;

  const oldPath = fileObject.path;
  const fileName = oldPath.split('/').pop();
  if (!fileName) return fileObject;

  const newPath = `lovepages/${newPageId}/${targetFolder}/${fileName}`;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sourceFile = bucket.file(oldPath);
      const targetFile = bucket.file(newPath);

      // 1. Copy file (idempotent — skip if already copied)
      const [targetExists] = await targetFile.exists();
      if (!targetExists) {
        const [sourceExists] = await sourceFile.exists();
        if (!sourceExists) {
          // Source already gone — check if target was moved in a previous attempt
          console.warn(`[moveFile] Source not found: ${oldPath}`);
          break; // skip retries, will fall through to error path
        }
        await sourceFile.copy(targetFile);
      }

      // 2. Get download token — Cloud Storage copy() preserves metadata including token
      const [metadata] = await targetFile.getMetadata();
      let token: string | undefined = metadata?.metadata?.firebaseStorageDownloadTokens;

      // 3. If no token (e.g. bucket setting strips custom metadata), generate one
      if (!token) {
        token = randomUUID();
        await targetFile.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
      }

      // 4. Construct the public Firebase Storage URL
      const encodedPath = encodeURIComponent(newPath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

      // 5. Delete source ONLY after we have a confirmed working URL
      try {
        const [srcStillExists] = await sourceFile.exists();
        if (srcStillExists) await sourceFile.delete();
      } catch (e) {
        console.warn(`[moveFile] Source cleanup failed (non-critical) for ${oldPath}:`, e);
      }

      return { url: publicUrl, path: newPath };
    } catch (error: any) {
      lastError = error;
      console.warn(`[moveFile] Attempt ${attempt}/${maxRetries} failed for ${oldPath}:`, error?.message);
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  // All retries failed — log and return original (temp URL) so page saves but can be recovered
  try {
    await db.collection('failed_file_moves').add({
      pageId: newPageId, oldPath, newPath, targetFolder,
      error: lastError?.message || 'unknown',
      createdAt: Timestamp.now(), resolved: false,
    });
  } catch (e) {
    console.error('[moveFile] CRITICAL: could not log failure:', { oldPath, newPath, lastError });
  }

  return fileObject; // returns temp URL — page saves, file recovery tool can fix later
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

  if (sanitizedData.galleryImages?.length) {
    sanitizedData.galleryImages = await Promise.all(
      sanitizedData.galleryImages.map((img: any) => moveFileWithRetry(bucket, db, img, 'gallery', newPageId))
    );
  }
  if (sanitizedData.timelineEvents?.length) {
    sanitizedData.timelineEvents = await Promise.all(
      sanitizedData.timelineEvents.map(async (event: any) => {
        if (event.image) event.image = await moveFileWithRetry(bucket, db, event.image, 'timeline', newPageId);
        return { ...event, date: ensureTimestamp(event.date) };
      })
    );
  } else if (sanitizedData.timelineEvents) {
    sanitizedData.timelineEvents = sanitizedData.timelineEvents.map((e: any) => ({ ...e, date: ensureTimestamp(e.date) }));
  }
  if (sanitizedData.puzzleImage) sanitizedData.puzzleImage = await moveFileWithRetry(bucket, db, sanitizedData.puzzleImage, 'puzzle', newPageId);
  if (sanitizedData.audioRecording) sanitizedData.audioRecording = await moveFileWithRetry(bucket, db, sanitizedData.audioRecording, 'audio', newPageId);
  if (sanitizedData.backgroundVideo) sanitizedData.backgroundVideo = await moveFileWithRetry(bucket, db, sanitizedData.backgroundVideo, 'video', newPageId);
  if (sanitizedData.memoryGameImages?.length) {
    sanitizedData.memoryGameImages = await Promise.all(
      sanitizedData.memoryGameImages.map((img: any) => moveFileWithRetry(bucket, db, img, 'memory-game', newPageId))
    );
  }
  sanitizedData.specialDate = ensureTimestamp(sanitizedData.specialDate);

  // ── 5. Build final page data ───────────────────────────────────────────────
  const { payment, guestEmail: _ge, ...finalData } = sanitizedData;
  finalData.id = newPageId;
  finalData.createdAt = Timestamp.now();
  finalData.filesMovedAt = Timestamp.now();
  finalData.paymentId = paymentId;
  finalData.status = 'paid';
  finalData.componentVersion = 'v2';
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
  await sendServerSidePurchaseEvent(
    finalData.plan as 'basico' | 'avancado',
    newPageId,
    userEmail,
    typeof data.paidAmount === 'number' ? data.paidAmount : undefined,
  );

  // ── Notify admin via Realtime DB + Push ──────────────────────────────────
  // Use the amount that was actually charged (stored on the intent when PIX
  // was generated). Falling back to the plan base price is WRONG when the
  // user applied a coupon or paid for add-ons — it was showing "venda R$24,90"
  // on sales that actually went through at R$19,90 (or vice-versa).
  const rawPaid = Number(data.paidAmount);
  const saleValue = isFinite(rawPaid) && rawPaid > 0
    ? rawPaid
    : (finalData.plan === 'avancado' ? 24.90 : 19.90);
  const saleTitle = (finalData.title as string) || 'Sem título';
  const salePlan = finalData.plan === 'avancado' ? 'Avançado' : 'Básico';
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
  try {
    await notifyAdmins(
      `Nova venda! R$${saleValue.toFixed(2).replace('.', ',')}`,
      `${saleTitle} — Plano ${salePlan}`,
      'https://mycupid.com.br/admin',
    );
  } catch (e) {
    console.warn('[Push] Failed to notify admins:', e);
  }
  revalidatePath(`/p/${newPageId}`);
  revalidatePath('/minhas-paginas');

  return { success: true, pageId: newPageId };
}

// ─────────────────────────────────────────────
// VERIFICAR PAGAMENTO MERCADO PAGO
// ─────────────────────────────────────────────
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
        await logCriticalError('page_creation', `Página não criada após PIX aprovado: ${result.error}`, { intentId, paymentId });
        return { status: 'error', error: result.error || 'Falha ao finalizar.' };
      }
      return { status: 'approved', pageId: result.pageId };
    }

    const currentStatus = paymentInfo.status || 'pending';
    const known = ['pending','in_process','authorized','in_mediation','rejected','cancelled','refunded','charged_back'];
    if (known.includes(currentStatus)) return { status: currentStatus as any };
    return { status: 'pending' };
  } catch (error: any) {
    await logCriticalError('payment', `Verificação PIX falhou: ${error.message}`, { paymentId, intentId, stack: error.stack });
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

  // 2. Lê o plano original antes de sobrescrever, para preservar introType de páscoa
  const intentSnap = await db.collection('payment_intents').doc(intentId).get();
  const originalPlan = intentSnap.data()?.plan;
  try {
    const updateData: any = { plan: 'avancado', updatedAt: Timestamp.now() };
    if (originalPlan === 'pascoa') updateData.introType = 'love';
    await db.collection('payment_intents').doc(intentId).update(updateData);
  } catch (e) {
    console.warn('[finalizeWithCredit] Não conseguiu forçar plan=avancado no intent:', e);
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

  // 1. Valida o token
  const tokenRef = db.collection('gift_tokens').doc(giftToken);
  const tokenSnap = await tokenRef.get();
  if (!tokenSnap.exists) return { success: false, error: 'Link de presente inválido.' };
  if (tokenSnap.data()?.used) return { success: false, error: 'Este presente já foi utilizado.' };

  // 2. Atualiza o intent com plan=avancado, guestEmail e flag isGift
  const intentSnap = await db.collection('payment_intents').doc(intentId).get();
  const originalPlan = intentSnap.data()?.plan;
  try {
    const updateData: any = { plan: 'avancado', guestEmail: email, isGift: true, updatedAt: Timestamp.now() };
    if (originalPlan === 'pascoa') updateData.introType = 'love';
    await db.collection('payment_intents').doc(intentId).update(updateData);
  } catch (e) {
    console.warn('[finalizeWithGiftToken] Falha ao atualizar intent:', e);
  }

  // 3. Finaliza a página
  const result = await finalizeLovePage(intentId, `gift_${giftToken}`);
  if (!result.success) return result;

  // 4. Marca token como usado e page como gift
  try {
    await Promise.all([
      tokenRef.update({ used: true, usedAt: Timestamp.now(), usedByEmail: email, pageId: result.pageId }),
      db.collection('lovepages').doc(result.pageId).update({ isGift: true, giftToken }),
    ]);
  } catch (err) {
    console.error('[Gift] Falha ao marcar token como usado:', err);
  }

  return { success: true, pageId: result.pageId };
}

// ─────────────────────────────────────────────
// STRIPE (placeholder)
// ─────────────────────────────────────────────
export async function createStripeCheckoutSession(intentId: string, plan: 'basico' | 'avancado', domain: string): Promise<StripeSessionResult> {
  return { success: false, error: 'Stripe integration is not fully configured on the backend.' };
}
