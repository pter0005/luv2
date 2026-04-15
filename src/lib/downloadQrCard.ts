import QRCode from 'qrcode';

export async function downloadQrCard(
  pageId: string,
  _design?: string,
  filename = 'mycupid-qrcode.png',
): Promise<void> {
  const pageUrl = `https://mycupid.com.br/p/${pageId}`;

  const W = 600;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a0533');
  grad.addColorStop(1, '#3b0764');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // QR code
  const QR_SIZE = 380;
  const QR_X = (W - QR_SIZE) / 2;
  const QR_Y = (H - QR_SIZE) / 2 + 20;

  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: QR_SIZE * 2,
    margin: 2,
    color: { dark: '#1a0533', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  await new Promise<void>((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      // White rounded card behind QR
      const pad = 20;
      const r = 24;
      const cx = QR_X - pad, cy = QR_Y - pad;
      const cw = QR_SIZE + pad * 2, ch = QR_SIZE + pad * 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + cw - r, cy); ctx.arcTo(cx + cw, cy, cx + cw, cy + r, r);
      ctx.lineTo(cx + cw, cy + ch - r); ctx.arcTo(cx + cw, cy + ch, cx + cw - r, cy + ch, r);
      ctx.lineTo(cx + r, cy + ch); ctx.arcTo(cx, cy + ch, cx, cy + ch - r, r);
      ctx.lineTo(cx, cy + r); ctx.arcTo(cx, cy, cx + r, cy, r);
      ctx.closePath();
      ctx.fill();

      ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
      resolve();
    };
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // Branding top
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200,150,255,0.95)';
  ctx.fillText('MyCupid 💜', W / 2, 55);

  // Label below QR
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Escaneie para ver a surpresa 💝', W / 2, QR_Y + QR_SIZE + 40 + 20);

  // Download
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('toBlob failed')); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename.replace(/\s+/g, '-');
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve();
    }, 'image/png');
  });
}
