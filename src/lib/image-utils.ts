
// Helper to convert file to Base64
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result);
        } else {
            reject(new Error('FileReader did not return a string.'));
        }
        };
        reader.onerror = error => reject(error);
    });
};

// Helper to convert Base64 to Blob object
export const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    if (parts.length !== 2) throw new Error('Invalid Base64 string format');
    const contentType = parts[0].split(':')[1];
    const byteCharacters = atob(parts[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};


// Helper to compress and resize an image file.
//
// Estratégia de velocidade:
// 1. createImageBitmap() decodifica nativo (GPU quando possível) — muito mais
//    rápido que new Image + data URL, que passa pela string base64.
// 2. OffscreenCanvas + convertToBlob quando disponível (Chrome/Android) —
//    não bloqueia o main thread.
// 3. SEMPRE sai JPEG — mesmo PNG/HEIC/WebP vira JPEG. PNG é 3-5x maior e não
//    precisamos de transparência em fotos de galeria.
// 4. Se a foto já é menor que o limite, não redimensiona — só re-comprime.
export const compressImage = async (
  file: File,
  maxWidthOrHeight = 1280,
  quality = 0.75
): Promise<File> => {
  // Usa createImageBitmap — nativo, sem passar por data URL.
  const bitmap = await createImageBitmap(file);

  const { width: srcW, height: srcH } = bitmap;
  let width = srcW;
  let height = srcH;
  if (width > height && width > maxWidthOrHeight) {
    height = Math.round((height * maxWidthOrHeight) / width);
    width = maxWidthOrHeight;
  } else if (height >= width && height > maxWidthOrHeight) {
    width = Math.round((width * maxWidthOrHeight) / height);
    height = maxWidthOrHeight;
  }

  // Preferir OffscreenCanvas.convertToBlob — sem bloquear main thread.
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const off = new OffscreenCanvas(width, height);
      const ctx = off.getContext('2d');
      if (!ctx) throw new Error('No 2d context');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      const blob = await (off as any).convertToBlob({ type: 'image/jpeg', quality });
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      // Cai pro fallback
    }
  }

  // Fallback: canvas normal no DOM (Safari não tem OffscreenCanvas.convertToBlob em todas versões).
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close?.();
    throw new Error('Could not get canvas context');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas to Blob conversion failed.'));
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        resolve(new File([blob], name, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      quality
    );
  });
};
