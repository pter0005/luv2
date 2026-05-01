import { getAuth } from 'firebase/auth';
import type { FileWithPreview } from './wizard-schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 2;

/**
 * Upload via servidor — substitui o upload direto cliente→Storage que perdia
 * bytes silenciosamente. Cliente envia FormData pra /api/upload-image que valida
 * auth com Admin SDK, salva o byte e retorna {path, url} confirmados.
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

  const fd = new FormData();
  fd.append('file', file as Blob, file instanceof File ? file.name : 'audio.webm');
  fd.append('folder', folderName);
  fd.append('idToken', idToken);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
      lastErr = err;
      const msg = String(err?.message || '');
      if (msg.startsWith('file_too_large') || msg === 'auth_failed' || msg.startsWith('invalid:')) break;
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}
