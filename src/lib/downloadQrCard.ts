import QRCode from 'qrcode';

interface TemplateConfig {
  bgUrl: string;
  qrColor: string;
  // posições em pixels no canvas de saída (800x1143)
  qrX: number;
  qrY: number;
  qrSize: number;
  pad: number;
}

const TEMPLATES: Record<string, TemplateConfig> = {
  juntos: {
    bgUrl: '/qr-templates/juntos-sempre.png',
    qrColor: '#8B0000',
    qrX: 228,
    qrY: 519,
    qrSize: 343,
    pad: 12,
  },
};

export async function downloadQrCard(
  pageId: string,
  design: string,
  filename = 'mycupid-qrcode.png'
): Promise<void> {
  const cfg = TEMPLATES[design];
  if (!cfg) throw new Error(`Template "${design}" não encontrado.`);

  const W = 800;
  const H = 1143;
  const pageUrl = `https://mycupid.com.br/p/${pageId}`;

  // 1. Cria canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 2. Carrega imagem de fundo
  await new Promise<void>((resolve, reject) => {
    const bg = new Image();
    bg.onload = () => { ctx.drawImage(bg, 0, 0, W, H); resolve(); };
    bg.onerror = reject;
    bg.src = cfg.bgUrl;
  });

  // 3. Gera QR code como dataURL
  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: cfg.qrSize * 2, // alta resolução
    margin: 2,
    color: { dark: cfg.qrColor, light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  // 4. Carrega QR como imagem
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  // 5. Desenha card branco com padding
  const { qrX, qrY, qrSize, pad } = cfg;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const r = 8;
  const cx = qrX - pad, cy = qrY - pad, cw = qrSize + pad * 2, ch = qrSize + pad * 2;
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + cw - r, cy); ctx.arcTo(cx + cw, cy, cx + cw, cy + r, r);
  ctx.lineTo(cx + cw, cy + ch - r); ctx.arcTo(cx + cw, cy + ch, cx + cw - r, cy + ch, r);
  ctx.lineTo(cx + r, cy + ch); ctx.arcTo(cx, cy + ch, cx, cy + ch - r, r);
  ctx.lineTo(cx, cy + r); ctx.arcTo(cx, cy, cx + r, cy, r);
  ctx.closePath();
  ctx.fill();

  // 6. Desenha QR
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 7. Download
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
