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
    qrX: number;   // posição X na imagem original (1400px)
    qrY: number;   // posição Y na imagem original (2000px)
    qrSize: number; // tamanho do QR na imagem original
    pad: number;    // padding do card branco
    outputW: number;
    outputH: number;
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

    // Card branco com padding
    const cardW = cfg.qrSize + cfg.pad * 2;
    const cardH = cfg.qrSize + cfg.pad * 2;
    const cardX = cfg.qrX - cfg.pad;
    const cardY = cfg.qrY - cfg.pad;

    // Fundo branco arredondado
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const r = 16;
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

    return new NextResponse(buffer, {
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
