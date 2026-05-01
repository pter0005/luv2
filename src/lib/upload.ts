import { ref as storageRef, uploadBytesResumable, getDownloadURL, getMetadata, type FirebaseStorage } from 'firebase/storage';
import type { FileWithPreview } from './wizard-schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 2;

// HEAD na URL pública até confirmar que o byte tá visível pro server. Sem isso,
// SDK retorna URL "fantasma" que dá 404 no Admin SDK depois (causa raiz dos
// "arquivos faltando" que apareciam no widget).
async function confirmStorageVisible(downloadURL: string): Promise<boolean> {
  const MAX_TRIES = 6;
  const DELAY = 1500;
  for (let i = 0; i < MAX_TRIES; i++) {
    try {
      const res = await fetch(downloadURL, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return true;
    } catch { /* retenta */ }
    if (i < MAX_TRIES - 1) await new Promise(r => setTimeout(r, DELAY));
  }
  return false;
}

export async function uploadFile(
  storage: FirebaseStorage,
  userId: string,
  file: File | Blob,
  folderName: string
): Promise<FileWithPreview> {
  if (!userId) throw new Error("Usuário não identificado para upload.");
  if (file.size > MAX_FILE_SIZE) throw new Error(`file_too_large:${Math.round(file.size / 1024 / 1024)}MB`);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = (file instanceof File ? file.name : 'audio.webm').replace(/[^a-zA-Z0-9.]/g, "_");
  const fileName = `${timestamp}-${random}-${safeName}`;
  const fullPath = `temp/${userId}/${folderName}/${fileName}`;
  const fileRef = storageRef(storage, fullPath);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);
        task.on('state_changed', null, (err) => reject(err), () => resolve());
      });
      await getMetadata(fileRef);
      const downloadURL = await getDownloadURL(fileRef);
      const visible = await confirmStorageVisible(downloadURL);
      if (!visible) throw new Error('upload_not_visible_after_polling');
      return { url: downloadURL, path: fullPath };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}
