import QRCode from 'qrcode';

interface TemplateConfig {
  bgUrl: string;
  qrColor: string;
  // posições em pixels no canvas de saída
  qrX: number;
  qrY: number;
  qrSize: number;
  pad: number;
  transparent?: boolean;
  chocolateBorder?: boolean;
  canvasW?: number;
  canvasH?: number;
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
  'gato': {
    bgUrl: '/qr-templates/gato-te-amo.png',
    qrColor: '#CC2200',
    qrX: 240,
    qrY: 322,
    qrSize: 320,
    pad: 10,
  },
  'surpresa': {
    bgUrl: '/qr-templates/surpresa-pra-voce.png',
    qrColor: '#fabedb',
    qrX: 205,
    qrY: 430,
    qrSize: 388,
    pad: 0,
    transparent: true,
  },
  'qrcode-chocolate': {
    bgUrl: '/qr-templates/qrcode-chocolate.png',
    qrColor: '#3d1a00',
    qrX: 211,
    qrY: 427,
    qrSize: 330,
    pad: 11,
    chocolateBorder: true,
  },
  'qrcode-coelho': {
    bgUrl: '/qr-templates/qrcode-coelho .png',
    qrColor: '#000000',
    qrX: 233,
    qrY: 393,
    qrSize: 333,
    pad: 15,
    canvasW: 800,
    canvasH: 1000,
  },
};

export async function downloadQrCard(
  pageId: string,
  design: string,
  filename = 'mycupid-qrcode.png'
): Promise<void> {
  const cfg = TEMPLATES[design];
  if (!cfg) throw new Error(`Template "${design}" não encontrado.`);

  const W = cfg.canvasW || 800;
  const H = cfg.canvasH || 1143;
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

  // 5. Desenha card com padding (+ borda de chocolate opcional)
  const { qrX, qrY, qrSize, pad } = cfg;
  if (!cfg.transparent) {
    const r = 10;
    const cx = qrX - pad, cy = qrY - pad, cw = qrSize + pad * 2, ch = qrSize + pad * 2;

    if (cfg.chocolateBorder) {
      // camada externa: chocolate escuro
      const b1 = 18;
      ctx.fillStyle = '#3d1a00';
      ctx.beginPath();
      ctx.moveTo(cx - b1 + r, cy - b1);
      ctx.lineTo(cx - b1 + cw + b1 - r, cy - b1); ctx.arcTo(cx - b1 + cw + b1, cy - b1, cx - b1 + cw + b1, cy - b1 + r, r);
      ctx.lineTo(cx - b1 + cw + b1, cy - b1 + ch + b1 - r); ctx.arcTo(cx - b1 + cw + b1, cy - b1 + ch + b1, cx - b1 + cw + b1 - r, cy - b1 + ch + b1, r);
      ctx.lineTo(cx - b1 + r, cy - b1 + ch + b1); ctx.arcTo(cx - b1, cy - b1 + ch + b1, cx - b1, cy - b1 + ch + b1 - r, r);
      ctx.lineTo(cx - b1, cy - b1 + r); ctx.arcTo(cx - b1, cy - b1, cx - b1 + r, cy - b1, r);
      ctx.closePath(); ctx.fill();

      // camada interna: chocolate mais claro (milk chocolate)
      const b2 = 9;
      ctx.fillStyle = '#7b3f00';
      ctx.beginPath();
      ctx.moveTo(cx - b2 + r, cy - b2);
      ctx.lineTo(cx - b2 + cw + b2 - r, cy - b2); ctx.arcTo(cx - b2 + cw + b2, cy - b2, cx - b2 + cw + b2, cy - b2 + r, r);
      ctx.lineTo(cx - b2 + cw + b2, cy - b2 + ch + b2 - r); ctx.arcTo(cx - b2 + cw + b2, cy - b2 + ch + b2, cx - b2 + cw + b2 - r, cy - b2 + ch + b2, r);
      ctx.lineTo(cx - b2 + r, cy - b2 + ch + b2); ctx.arcTo(cx - b2, cy - b2 + ch + b2, cx - b2, cy - b2 + ch + b2 - r, r);
      ctx.lineTo(cx - b2, cy - b2 + r); ctx.arcTo(cx - b2, cy - b2, cx - b2 + r, cy - b2, r);
      ctx.closePath(); ctx.fill();

      // bolinhas decorativas nos cantos (estilo chocolate)
      ctx.fillStyle = '#5c2e00';
      const dots = [[cx - b1 + 5, cy - b1 + 5], [cx + cw + b1 - 5, cy - b1 + 5], [cx - b1 + 5, cy + ch + b1 - 5], [cx + cw + b1 - 5, cy + ch + b1 - 5]];
      for (const [dx, dy] of dots) {
        ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // fundo branco do QR
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

  // 6. Desenha QR
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 7. Download
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
