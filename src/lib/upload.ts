import { getAuth } from 'firebase/auth';
import type { FileWithPreview } from './wizard-schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Upload UNIFICADO via servidor.
 *
 * Filosofia: UM caminho só. Sem fallback SDK, sem 2 estratégias paralelas,
 * sem retries empilhados em 3 camadas. Servidor é fonte da verdade — se
 * ele retorna 200 com path/url, o byte ESTÁ no Storage (validation crc32c +
 * getMetadata confirmam). Se retorna erro, throw com mensagem clara.
 *
 * Cliente faz no máximo 3 tentativas com backoff e refresh de token em 401.
 * Não inventa fallback — se 3 tentativas via servidor falham, o problema
 * é real (rede do user, GCS down, etc.) e usuário precisa saber.
 */
export async function uploadFile(
  storage: any,
  userId: string,
  file: File | Blob,
  folderName: string,
): Promise<FileWithPreview> {
  if (!userId) throw new Error('Usuário não identificado.');
  if (!file || file.size === 0) throw new Error('Arquivo vazio.');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`file_too_large:${Math.round(file.size / 1024 / 1024)}MB`);
  }

  const auth = getAuth(storage.app);
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão não iniciada. Recarregue a página.');

  const fileName = file instanceof File ? file.name : 'audio.webm';
  let idToken = await currentUser.getIdToken();

  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const fd = new FormData();
      fd.append('file', file as Blob, fileName);
      fd.append('folder', folderName);
      fd.append('idToken', idToken);

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 45_000);
      let res: Response;
      try {
        res = await fetch('/api/upload-image', { method: 'POST', body: fd, signal: ctrl.signal });
      } finally {
        clearTimeout(timeout);
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok && data.path && data.url) {
        return { url: data.url, path: data.path };
      }

      // 413 — arquivo grande demais. Não retenta.
      if (res.status === 413) {
        throw new Error(`file_too_large:${data.sizeMB || '?'}MB`);
      }

      // 401 — token expirou. Refresh e retenta UMA vez.
      if (res.status === 401 && attempt === 1) {
        idToken = await currentUser.getIdToken(true);
        lastErr = new Error('auth_refreshing');
        continue;
      }

      // 400 com error específico — geralmente arquivo malformado
      if (res.status === 400) {
        const e = String(data?.error || 'invalid');
        // empty_file: pode ser FormData corrompido (mobile) — vale 1 retry
        if (e === 'empty_file' && attempt < 3) {
          lastErr = new Error('empty_file_retrying');
          await sleep(800);
          continue;
        }
        throw new Error(`invalid:${e}`);
      }

      // 5xx, 429, network — retryable
      lastErr = new Error(data?.error || `server_${res.status}`);
      if (attempt < 3) await sleep(1000 * attempt);
    } catch (err: any) {
      const msg = String(err?.message || err);
      // Erros fatais não retentam
      if (msg.startsWith('file_too_large') || msg.startsWith('invalid:')) throw err;
      lastErr = err;
      if (attempt < 3) await sleep(1000 * attempt);
    }
  }

  throw lastErr || new Error('upload_failed');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
