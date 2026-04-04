export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';

async function getQRBuffer(url: string, darkColor: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    color: { dark: darkColor, light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') || 'exemplo';
  const design = searchParams.get('design') || 'juntos';

  const pageUrl = `https://mycupid.com.br/p/${pageId}`;

  // Configurações por design
  const DESIGNS: Record<string, {
    bgPath: string;
    qrColor: string;
    qrX: number;
    qrY: number;
    qrSize: number;
    pad: number;
    outputW: number;
    outputH: number;
    chocolateBorder?: boolean;
  }> = {
    juntos: {
      bgPath: path.join(process.cwd(), 'public', 'qr-templates', 'juntos-sempre.png'),
      qrColor: '#8B0000',
      qrX: 400,
      qrY: 908,
      qrSize: 600,
      pad: 24,
      outputW: 800,
      outputH: 1143,
    },
    'qrcode-chocolate': {
      bgPath: path.join(process.cwd(), 'public', 'qr-templates', 'qrcode-chocolate.png'),
      qrColor: '#3d1a00',
      qrX: 285,
      qrY: 505,
      qrSize: 445,
      pad: 15,
      outputW: 800,
      outputH: 1000,
      chocolateBorder: true,
    },
  };

  const cfg = DESIGNS[design] || DESIGNS['juntos'];

  try {
    // Carrega imagem de fundo
    const bg = await loadImage(cfg.bgPath);

    // Canvas no tamanho original da imagem (1400x2000)
    const origW = bg.width;
    const origH = bg.height;
    const canvas = createCanvas(origW, origH);
    const ctx = canvas.getContext('2d');

    // Desenha fundo
    ctx.drawImage(bg, 0, 0, origW, origH);

    // Gera QR
    const qrBuffer = await getQRBuffer(pageUrl, cfg.qrColor);
    const qrImg = await loadImage(qrBuffer);

    // Card com padding
    const cardW = cfg.qrSize + cfg.pad * 2;
    const cardH = cfg.qrSize + cfg.pad * 2;
    const cardX = cfg.qrX - cfg.pad;
    const cardY = cfg.qrY - cfg.pad;
    const r = 16;

    if (cfg.chocolateBorder) {
      // camada externa: chocolate escuro
      const b1 = 36;
      ctx.fillStyle = '#3d1a00';
      ctx.beginPath();
      ctx.moveTo(cardX - b1 + r, cardY - b1);
      ctx.lineTo(cardX + cardW + b1 - r, cardY - b1); ctx.arcTo(cardX + cardW + b1, cardY - b1, cardX + cardW + b1, cardY - b1 + r, r);
      ctx.lineTo(cardX + cardW + b1, cardY + cardH + b1 - r); ctx.arcTo(cardX + cardW + b1, cardY + cardH + b1, cardX + cardW + b1 - r, cardY + cardH + b1, r);
      ctx.lineTo(cardX - b1 + r, cardY + cardH + b1); ctx.arcTo(cardX - b1, cardY + cardH + b1, cardX - b1, cardY + cardH + b1 - r, r);
      ctx.lineTo(cardX - b1, cardY - b1 + r); ctx.arcTo(cardX - b1, cardY - b1, cardX - b1 + r, cardY - b1, r);
      ctx.closePath(); ctx.fill();

      // camada interna: milk chocolate
      const b2 = 18;
      ctx.fillStyle = '#7b3f00';
      ctx.beginPath();
      ctx.moveTo(cardX - b2 + r, cardY - b2);
      ctx.lineTo(cardX + cardW + b2 - r, cardY - b2); ctx.arcTo(cardX + cardW + b2, cardY - b2, cardX + cardW + b2, cardY - b2 + r, r);
      ctx.lineTo(cardX + cardW + b2, cardY + cardH + b2 - r); ctx.arcTo(cardX + cardW + b2, cardY + cardH + b2, cardX + cardW + b2 - r, cardY + cardH + b2, r);
      ctx.lineTo(cardX - b2 + r, cardY + cardH + b2); ctx.arcTo(cardX - b2, cardY + cardH + b2, cardX - b2, cardY + cardH + b2 - r, r);
      ctx.lineTo(cardX - b2, cardY - b2 + r); ctx.arcTo(cardX - b2, cardY - b2, cardX - b2 + r, cardY - b2, r);
      ctx.closePath(); ctx.fill();

      // bolinhas decorativas nos cantos
      ctx.fillStyle = '#5c2e00';
      for (const [dx, dy] of [[cardX - b1 + 10, cardY - b1 + 10], [cardX + cardW + b1 - 10, cardY - b1 + 10], [cardX - b1 + 10, cardY + cardH + b1 - 10], [cardX + cardW + b1 - 10, cardY + cardH + b1 - 10]]) {
        ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Fundo branco arredondado
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + r, r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH, r);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - r, r);
    ctx.lineTo(cardX, cardY + r);
    ctx.arcTo(cardX, cardY, cardX + r, cardY, r);
    ctx.closePath();
    ctx.fill();

    // QR em cima
    ctx.drawImage(qrImg, cfg.qrX, cfg.qrY, cfg.qrSize, cfg.qrSize);

    // Redimensiona pra saída final
    const outCanvas = createCanvas(cfg.outputW, cfg.outputH);
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(canvas, 0, 0, origW, origH, 0, 0, cfg.outputW, cfg.outputH);

    const buffer = outCanvas.toBuffer('image/png');

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="mycupid-qrcode-${design}.png"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[QR Card] Erro:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar o QR code.', details: error.message },
      { status: 500 }
    );
  }
}
