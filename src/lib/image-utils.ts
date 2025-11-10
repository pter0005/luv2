// Helper to convert file to Base64
export const fileToBase64 = (file: File): Promise<string> => {
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

// Helper to convert Base64 to File object
export const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    if (arr.length < 2) throw new Error('Invalid Base64 string');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('MIME type not found in Base64 string');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};
