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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(['gallery', 'timeline', 'memory-game', 'puzzle', 'audio', 'video']);
const ALLOWED_CONTENT_TYPES = /^(image|video|audio)\//;

/**
 * Upload server-side. UM caminho. Validação simples. Retry só do save (transient).
 *
 * Path: temp/{userId}/{folder}/{timestamp}-{rand}-{name} — finalize move pra lovepages/.
 *
 * Retornos:
 *   200 { ok: true, path, url, size } — byte CONFIRMADO no Storage (getMetadata + tamanho)
 *   400 invalid_folder | invalid_content_type | empty_file | missing_file
 *   401 invalid_token | missing_auth
 *   413 file_too_large
 *   429 rate_limited
 *   500 upload_failed | upload_size_mismatch (com detalhes pra diagnóstico)
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
      return NextResponse.json({ error: 'invalid_folder', folder }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'empty_file' }, { status: 400 });
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

    let userId: string;
    try {
      const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
      userId = decoded.uid;
    } catch (e: any) {
      return NextResponse.json({ error: 'invalid_token', message: e?.message }, { status: 401 });
    }

    const originalName = (file instanceof File ? file.name : 'audio.webm') || 'file';
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_').slice(0, 80);
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
    const fullPath = `temp/${userId}/${folder}/${fileName}`;

    const bucket = getAdminStorage();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'empty_file' }, { status: 400 });
    }

    const downloadToken = randomUUID();
    const targetFile = bucket.file(fullPath);

    // Save com retry só pra transient (socket hang up, ECONNRESET).
    let saved = false;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await targetFile.save(buffer, {
          contentType,
          metadata: {
            contentType,
            metadata: { firebaseStorageDownloadTokens: downloadToken },
          },
          resumable: false,
          validation: 'crc32c',
          timeout: 30_000,
        } as any);
        saved = true;
        break;
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message || '').toLowerCase();
        const transient = msg.includes('socket hang up') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('eai_again');
        if (!transient) break;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
    if (!saved) {
      console.error('[upload-image] save falhou:', lastErr?.message);
      try {
        await logCriticalError('api', `Save no Storage falhou: ${lastErr?.message}`, {
          stack: lastErr?.stack, code: lastErr?.code, bucket: bucket.name, path: fullPath,
        });
      } catch { /* best effort */ }
      return NextResponse.json({ error: 'save_failed', message: lastErr?.message, bucket: bucket.name }, { status: 500 });
    }

    // Confirma byte persistido — getMetadata com retry pra eventual consistency
    let meta: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        const [m] = await targetFile.getMetadata();
        if (m && Number(m.size) === buffer.length) { meta = m; break; }
      } catch { /* retenta */ }
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!meta) {
      console.error('[upload-image] getMetadata falhou após save em', fullPath);
      return NextResponse.json({ error: 'verify_failed', path: fullPath, expected: buffer.length, bucket: bucket.name }, { status: 500 });
    }

    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({ ok: true, path: fullPath, url: downloadURL, size: buffer.length, bucket: bucket.name });
  } catch (err: any) {
    console.error('[upload-image] erro:', err);
    try {
      await logCriticalError('api', `Upload via servidor falhou: ${err?.message}`, {
        stack: err?.stack, name: err?.name, code: err?.code,
      });
    } catch { /* best effort */ }
    return NextResponse.json({ error: 'upload_failed', message: err?.message }, { status: 500 });
  }
}
