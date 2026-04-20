import { ref as storageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import type { FileWithPreview } from './wizard-schema';

export async function uploadFile(
  storage: FirebaseStorage,
  userId: string,
  file: File | Blob,
  folderName: string
): Promise<FileWithPreview> {
  if (!userId) throw new Error("Usuário não identificado para upload.");
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = (file instanceof File ? file.name : 'audio.webm').replace(/[^a-zA-Z0-9.]/g, "_");
  const fileName = `${timestamp}-${random}-${safeName}`;
  const fullPath = `temp/${userId}/${folderName}/${fileName}`;
  const fileRef = storageRef(storage, fullPath);
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  return { url: downloadURL, path: fullPath };
}
