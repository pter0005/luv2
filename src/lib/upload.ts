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

/**
 * Upload em 2 estratégias:
 * 1) /api/upload-image (server-side, fonte da verdade)
 * 2) FALLBACK: SDK direto + HEAD-loop confirmando visibilidade real
 *
 * Sem o fallback, qualquer falha do server (Netlify lambda timeout, body too
 * large, instabilidade) quebraria o produto inteiro. Com fallback, a venda
 * sempre passa.
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
  const idToken = await currentUser.getIdToken();

  // ── ESTRATÉGIA 1: server-side ──
  const fd = new FormData();
  fd.append('file', file as Blob, file instanceof File ? file.name : 'audio.webm');
  fd.append('folder', folderName);
  fd.append('idToken', idToken);

  let serverErr: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 413) throw new Error(`file_too_large:${data.sizeMB || '?'}MB`);
        if (res.status === 401) throw new Error('auth_failed');
        if (res.status === 400) throw new Error(`invalid:${data.error || 'unknown'}`);
        throw new Error(data?.error || `http_${res.status}`);
      }
      if (!data.ok || !data.path || !data.url) throw new Error('invalid_response');
      return { url: data.url, path: data.path };
    } catch (err: any) {
      serverErr = err;
      const msg = String(err?.message || '');
      if (msg.startsWith('file_too_large') || msg === 'auth_failed' || msg.startsWith('invalid:')) throw err;
      if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ── ESTRATÉGIA 2 (FALLBACK): SDK direto + HEAD-loop ──
  console.warn('[uploadFile] /api/upload-image falhou, usando fallback SDK:', serverErr);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = (file instanceof File ? file.name : 'audio.webm').replace(/[^a-zA-Z0-9.]/g, "_");
  const fileName = `${timestamp}-${random}-${safeName}`;
  const fullPath = `temp/${userId}/${folderName}/${fileName}`;
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
  throw lastSdkErr || serverErr;
}
