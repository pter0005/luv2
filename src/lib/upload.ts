import { getAuth } from 'firebase/auth';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, getMetadata } from 'firebase/storage';
import type { FileWithPreview } from './wizard-schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Confirma que o byte tá no Storage chamando o servidor (que faz
// bucket.file().exists()). HEAD direto na URL pública não dá porque
// o CORS do bucket bloqueia o browser — deu falso negativo no test-upload
// mesmo com upload OK. /api/storage-check usa Admin SDK, fonte da verdade.
async function confirmStorageVisible(path: string, idToken: string): Promise<boolean> {
  const MAX_TRIES = 6;
  const DELAY = 2000;
  for (let i = 0; i < MAX_TRIES; i++) {
    try {
      const res = await fetch('/api/storage-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.exists && Number(data.size) > 0) return true;
    } catch { /* retenta */ }
    if (i < MAX_TRIES - 1) await new Promise(r => setTimeout(r, DELAY));
  }
  return false;
}

// Best-effort log pro admin enxergar quando o upload falha completamente.
// Sem isso, o erro só aparece no console do user — invisível pra gente.
async function logUploadFailure(reason: string, fileName: string, fileSize: number, folder: string, serverErr?: unknown, sdkErr?: unknown) {
  try {
    await fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Upload falhou completamente: ${reason}`,
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        extra: {
          fileName, fileSize, folder,
          serverErr: serverErr instanceof Error ? serverErr.message : String(serverErr || ''),
          sdkErr: sdkErr instanceof Error ? sdkErr.message : String(sdkErr || ''),
        },
      }),
    });
  } catch { /* best effort */ }
}

/**
 * Upload em 2 estratégias com retry inteligente:
 * 1) /api/upload-image (server-side, fonte da verdade)
 * 2) FALLBACK: SDK direto + confirma server-side
 *
 * Robustez:
 * - Token refresh em caso de 401 (sessão velha)
 * - Empty file/network errors são retryable
 * - Fallback SDK quando server falha
 * - Log central quando AMBOS falham (observabilidade)
 */
export async function uploadFile(
  storage: any,
  userId: string,
  file: File | Blob,
  folderName: string
): Promise<FileWithPreview> {
  if (!userId) throw new Error("Usuário não identificado para upload.");
  if (file.size > MAX_FILE_SIZE) throw new Error(`file_too_large:${Math.round(file.size / 1024 / 1024)}MB`);

  const auth = getAuth(storage.app);
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('no_auth_user');

  const fileName = file instanceof File ? file.name : 'audio.webm';
  const fileSize = file.size;

  // ── ESTRATÉGIA 1: server-side com retry inteligente ──
  let serverErr: unknown;
  let idToken = await currentUser.getIdToken();

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const fd = new FormData();
      fd.append('file', file as Blob, fileName);
      fd.append('folder', folderName);
      fd.append('idToken', idToken);

      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (!data.ok || !data.path || !data.url) throw new Error('invalid_response');
        return { url: data.url, path: data.path };
      }

      // 413 (too large) é fatal, não retenta nem cai no fallback (rule do bucket também rejeita).
      if (res.status === 413) throw new Error(`file_too_large:${data.sizeMB || '?'}MB`);

      // 401 (auth) — força refresh do token e retenta UMA vez.
      if (res.status === 401) {
        if (attempt === 0) {
          idToken = await currentUser.getIdToken(true); // force refresh
          serverErr = new Error(`auth_refreshing (was ${data.error || res.status})`);
          continue;
        }
        throw new Error('auth_failed');
      }

      // 400 com error específico — algumas são retryable
      if (res.status === 400) {
        const e = String(data?.error || '');
        // empty_file pode ser corrupção transitória de FormData no mobile, retenta
        if (e === 'empty_file' && attempt < 2) {
          serverErr = new Error('empty_file_retry');
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        throw new Error(`invalid:${e || 'unknown'}`);
      }

      // 429 (rate limit), 5xx — retryable
      throw new Error(data?.error || `http_${res.status}`);
    } catch (err: any) {
      serverErr = err;
      const msg = String(err?.message || '');
      // Erros fatais não vão pro fallback SDK também (já sabemos que vai falhar)
      if (msg.startsWith('file_too_large') || msg === 'auth_failed' || msg.startsWith('invalid:')) throw err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  // ── ESTRATÉGIA 2 (FALLBACK): SDK direto + storage-check ──
  console.warn('[uploadFile] /api/upload-image falhou após 3 tentativas, usando fallback SDK:', serverErr);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
  const sdkFileName = `${timestamp}-${random}-${safeName}`;
  const fullPath = `temp/${userId}/${folderName}/${sdkFileName}`;
  const fileRef = storageRef(storage, fullPath);
  let lastSdkErr: unknown;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);
        task.on('state_changed', null, (err) => reject(err), () => resolve());
      });
      await getMetadata(fileRef);
      const downloadURL = await getDownloadURL(fileRef);
      const visible = await confirmStorageVisible(fullPath, idToken);
      if (!visible) throw new Error('upload_not_visible_after_polling');
      return { url: downloadURL, path: fullPath };
    } catch (err) {
      lastSdkErr = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  // AMBAS estratégias falharam — loga central pra eu ver no widget de admin.
  // Sem isso, eu nunca saberia que algum cliente perdeu upload.
  await logUploadFailure(
    'server + fallback SDK falharam',
    fileName, fileSize, folderName,
    serverErr, lastSdkErr,
  );
  throw lastSdkErr || serverErr;
}
