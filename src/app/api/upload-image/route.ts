import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin/config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logCriticalError } from '@/lib/log-critical-error';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FOLDERS = new Set(['gallery', 'timeline', 'memory-game', 'puzzle', 'audio', 'video']);
const ALLOWED_CONTENT_TYPES = /^(image|video|audio)\//;

/**
 * Upload via servidor — substitui o upload direto cliente→Storage que estava
 * perdendo arquivos silenciosamente (token expirava, rede caía sem o SDK
 * detectar, eventual consistency entre cliente/servidor).
 *
 * Cliente envia FormData(file, folder, idToken) → servidor verifica auth,
 * faz upload com Admin SDK, retorna {path, url} SÓ depois de confirmar com
 * getMetadata. Quando retorna sucesso, o byte ESTÁ no Storage — sem mistério.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`upload-image:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') || '');
    const idToken = String(formData.get('idToken') || '');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'missing_file' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'invalid_folder' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'file_too_large', sizeMB: Math.round(file.size / 1024 / 1024) }, { status: 413 });
    }
    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_CONTENT_TYPES.test(contentType)) {
      return NextResponse.json({ error: 'invalid_content_type', contentType }, { status: 400 });
    }
    if (!idToken) {
      return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    }

    // Verifica idToken com Admin SDK — fonte da verdade pro userId.
    let userId: string;
    try {
      const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
      userId = decoded.uid;
    } catch (e: any) {
      return NextResponse.json({ error: 'invalid_token', message: e?.message }, { status: 401 });
    }

    // Sanitiza nome do arquivo
    const originalName = (file instanceof File ? file.name : 'audio.webm') || 'file';
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_').slice(0, 80);
    const timestamp = Date.now();
    const random = randomUUID().slice(0, 8);
    const fileName = `${timestamp}-${random}-${safeName}`;
    const fullPath = `temp/${userId}/${folder}/${fileName}`;

    // Upload com Admin SDK + token público
    const bucket = getAdminStorage();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'empty_file' }, { status: 400 });
    }

    const downloadToken = randomUUID();
    const targetFile = bucket.file(fullPath);

    // Retry com backoff exponencial — "socket hang up" do GCS é transient,
    // acontece quando lambda em cold start ou TCP keep-alive expira mid-upload.
    // 4 tentativas × backoff (500ms, 1.5s, 3.5s) cobre 99% dos casos.
    let saveErr: any = null;
    let saved = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await targetFile.save(buffer, {
          contentType,
          metadata: {
            contentType,
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
          resumable: false, // arquivos < 10MB fazem upload single-shot, mais rápido
          // Validation: força checksum check no GCS — se passar, byte tá íntegro.
          validation: 'crc32c',
          timeout: 30_000,
        } as any);
        saved = true;
        break;
      } catch (e: any) {
        saveErr = e;
        const msg = String(e?.message || '').toLowerCase();
        const isRetryable = msg.includes('socket hang up')
          || msg.includes('econnreset')
          || msg.includes('etimedout')
          || msg.includes('eai_again')
          || msg.includes('network')
          || (e?.code >= 500 && e?.code < 600);
        if (!isRetryable) break;
        if (attempt < 3) {
          const delay = 500 * Math.pow(2, attempt);
          console.warn(`[upload-image] save attempt ${attempt + 1} falhou (${msg}), retry em ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    if (!saved) {
      throw saveErr || new Error('save_failed_no_error');
    }

    // CONFIRMA — getMetadata só retorna se o byte está realmente persistido.
    // Pequeno retry pra cobrir transient eventual consistency do GCS logo após save.
    let meta: any = null;
    let metaErr: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        const [m] = await targetFile.getMetadata();
        meta = m;
        if (meta && Number(meta.size) === buffer.length) break;
      } catch (e) { metaErr = e; }
      if (i < 2) await new Promise(r => setTimeout(r, 500));
    }
    if (!meta || Number(meta.size) !== buffer.length) {
      return NextResponse.json({
        error: 'upload_size_mismatch',
        expected: buffer.length,
        got: Number(meta?.size) || 0,
        metaErr: metaErr?.message,
      }, { status: 500 });
    }

    const encodedPath = encodeURIComponent(fullPath);
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ ok: true, path: fullPath, url: downloadURL, size: buffer.length });
  } catch (err: any) {
    // Log centralizado pra aparecer no /admin/diagnostico-uploads e a gente
    // saber exatamente em que ponto o upload via servidor tá quebrando.
    console.error('[upload-image] error:', err);
    try {
      await logCriticalError('api', `Upload via servidor falhou: ${err?.message}`, {
        stack: err?.stack,
        name: err?.name,
        code: err?.code,
      });
    } catch { /* best effort */ }
    return NextResponse.json({ error: 'upload_failed', message: err?.message }, { status: 500 });
  }
}
