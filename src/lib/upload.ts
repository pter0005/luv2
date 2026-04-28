import { ref as storageRef, uploadBytesResumable, getDownloadURL, getMetadata, type FirebaseStorage } from 'firebase/storage';
import type { FileWithPreview } from './wizard-schema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file);
    task.on('state_changed', null, (err) => reject(err), () => resolve());
  });
  await getMetadata(fileRef);
  const downloadURL = await getDownloadURL(fileRef);
  return { url: downloadURL, path: fullPath };
}
