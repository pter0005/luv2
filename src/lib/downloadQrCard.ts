import QRCode from 'qrcode';

interface TemplateConfig {
  bgUrl: string;
  qrColor: string;
  qrXPct: number;
  qrYPct: number;
  qrSizePct: number;
  transparent?: boolean;
}

const TEMPLATES: Record<string, TemplateConfig> = {
  juntos: {
    bgUrl: '/qr-templates/juntos-sempre.png',
    qrColor: '#8B0000',
    qrXPct: 0.286,
    qrYPct: 0.454,
    qrSizePct: 0.429,
  },
  gato: {
    bgUrl: '/qr-templates/gato-te-amo.png',
    qrColor: '#CC2200',
    qrXPct: 0.300,
    qrYPct: 0.282,
    qrSizePct: 0.400,
  },
  surpresa: {
    bgUrl: '/qr-templates/surpresa-pra-voce.png',
    qrColor: '#fabedb',
    qrXPct: 0.256,
    qrYPct: 0.376,
    qrSizePct: 0.485,
    transparent: true,
  },
  'qrcode-coelho': {
    bgUrl: '/qr-templates/qrcode-coelho%20.png',
    qrColor: '#000000',
    qrXPct: 0.292,
    qrYPct: 0.393,
    qrSizePct: 0.417,
  },
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
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

async function renderTemplateCard(pageId: string, cfg: TemplateConfig, filename: string): Promise<void> {
  const pageUrl = `https://mycupid.com.br/p/${pageId}`;

  const bg = await loadImg(cfg.bgUrl);
  const W = bg.naturalWidth;
  const H = bg.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(bg, 0, 0, W, H);

  const qrSize = Math.round(W * cfg.qrSizePct);
  const qrX = Math.round(W * cfg.qrXPct);
  const qrY = Math.round(H * cfg.qrYPct);

  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: cfg.qrColor, light: cfg.transparent ? '#00000000' : '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  const qrImg = await loadImg(qrDataUrl);

  if (!cfg.transparent) {
    const pad = Math.round(qrSize * 0.035);
    const r = Math.round(qrSize * 0.04);
    const cx = qrX - pad, cy = qrY - pad;
    const cw = qrSize + pad * 2, ch = qrSize + pad * 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cw - r, cy); ctx.arcTo(cx + cw, cy, cx + cw, cy + r, r);
    ctx.lineTo(cx + cw, cy + ch - r); ctx.arcTo(cx + cw, cy + ch, cx + cw - r, cy + ch, r);
    ctx.lineTo(cx + r, cy + ch); ctx.arcTo(cx, cy + ch, cx, cy + ch - r, r);
    ctx.lineTo(cx, cy + r); ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();
    ctx.fill();
  }

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  await downloadCanvas(canvas, filename);
}

async function renderClassicCard(pageId: string, filename: string): Promise<void> {
  const pageUrl = `https://mycupid.com.br/p/${pageId}`;

  const W = 600;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a0533');
  grad.addColorStop(1, '#3b0764');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const QR_SIZE = 380;
  const QR_X = (W - QR_SIZE) / 2;
  const QR_Y = (H - QR_SIZE) / 2 + 20;

  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    width: QR_SIZE * 2,
    margin: 2,
    color: { dark: '#1a0533', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  const qrImg = await loadImg(qrDataUrl);

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

  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(200,150,255,0.95)';
  ctx.fillText('MyCupid 💜', W / 2, 55);

  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Escaneie para ver a surpresa 💝', W / 2, QR_Y + QR_SIZE + 60);

  await downloadCanvas(canvas, filename);
}

export async function downloadQrCard(
  pageId: string,
  design?: string,
  filename = 'mycupid-qrcode.png',
): Promise<void> {
  const cfg = design ? TEMPLATES[design] : undefined;
  if (cfg) {
    await renderTemplateCard(pageId, cfg, filename);
  } else {
    await renderClassicCard(pageId, filename);
  }
}
