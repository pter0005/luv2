export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, registerFont } from 'canvas';
import QRCode from 'qrcode';

// Registrar fontes se disponíveis (opcional)
// registerFont('path/to/font.ttf', { family: 'MyFont' });

async function generateQRMatrix(url: string): Promise<boolean[][]> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  // Retorna dataURL — vamos usar QRCode.toCanvas approach via buffer
  return [];
}

async function getQRBuffer(url: string, dark: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    width: 320,
    margin: 1,
    color: { dark, light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

function rr(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hrt(ctx: any, cx: number, cy: number, sz: number) {
  ctx.save();
  ctx.translate(cx, cy - sz * 0.42);
  ctx.beginPath();
  ctx.moveTo(0, sz * 0.42);
  ctx.bezierCurveTo(0, 0, -sz * 0.95, 0, -sz * 0.95, sz * 0.52);
  ctx.bezierCurveTo(-sz * 0.95, sz * 0.95, -sz * 0.1, sz * 1.38, 0, sz * 1.55);
  ctx.bezierCurveTo(sz * 0.1, sz * 1.38, sz * 0.95, sz * 0.95, sz * 0.95, sz * 0.52);
  ctx.bezierCurveTo(sz * 0.95, 0, 0, 0, 0, sz * 0.42);
  ctx.closePath();
  ctx.restore();
}

async function drawCosmos(ctx: any, W: number, H: number, qrImg: any, date: string) {
  // Deep space bg
  const bg = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.5, 750);
  bg.addColorStop(0, '#1e0a38');
  bg.addColorStop(0.3, '#120525');
  bg.addColorStop(0.65, '#0a0418');
  bg.addColorStop(1, '#050110');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Nebulas
  const nebulas = [
    [150, 250, 320, [120, 30, 200], 0.1],
    [640, 380, 280, [30, 60, 200], 0.08],
    [400, 750, 350, [200, 30, 120], 0.06],
    [310, 110, 250, [50, 140, 220], 0.07],
  ] as any[];
  nebulas.forEach(([x, y, r, c, a]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(0.5, `rgba(${c},${a * 0.25})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });

  // Stars
  for (let i = 0; i < 200; i++) {
    const x = (Math.abs(Math.sin(i * 137.508 + 1)) * W);
    const y = (Math.abs(Math.cos(i * 97.31 + 2)) * H);
    const r = (0.2 + Math.abs(Math.sin(i * 53)) * 0.9);
    const a = 0.1 + Math.abs(Math.sin(i * 0.7)) * 0.65;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ccd4f5';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Brand
  ctx.fillStyle = 'rgba(196,181,253,.4)';
  ctx.font = '300 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MYCUPID', W / 2, 80);

  ctx.strokeStyle = 'rgba(167,139,250,.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 70, 100);
  ctx.lineTo(W / 2 + 70, 100);
  ctx.stroke();

  // Headline
  ctx.fillStyle = '#e9d5ff';
  ctx.font = 'italic 300 38px serif';
  ctx.fillText('uma surpresa especial', W / 2, H * 0.17);

  ctx.fillStyle = '#d8b4fe';
  ctx.font = '500 72px serif';
  ctx.fillText('para você', W / 2, H * 0.17 + 88);

  // Stardust
  for (let a = -2.55; a < -0.55; a += 0.1) {
    const rad = 195;
    const px = W * 0.5 + Math.cos(a) * rad;
    const py = H * 0.3 + Math.sin(a) * rad;
    ctx.fillStyle = `rgba(200,180,255,${0.04 + Math.abs(Math.sin(a * 3)) * 0.18})`;
    ctx.beginPath();
    ctx.arc(px, py, 0.4 + Math.random() * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // QR frame
  const qrSz = 340;
  const qrX = (W - qrSz) / 2;
  const qrY = H * 0.35;
  const pp = 28;

  // Glow
  ctx.globalAlpha = 0.08;
  const qrGlow = ctx.createRadialGradient(W / 2, qrY + qrSz / 2, 0, W / 2, qrY + qrSz / 2, qrSz * 0.72);
  qrGlow.addColorStop(0, 'rgba(120,60,200,1)');
  qrGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = qrGlow;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // Outer glow frame
  ctx.fillStyle = 'rgba(255,255,255,.07)';
  rr(ctx, qrX - pp - 8, qrY - pp - 8, qrSz + pp * 2 + 16, qrSz + pp * 2 + 16, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(167,139,250,.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // White QR bg
  ctx.fillStyle = '#fff';
  rr(ctx, qrX - pp, qrY - pp, qrSz + pp * 2, qrSz + pp * 2, 24);
  ctx.fill();

  // Draw QR image
  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrSz, qrSz);
  }

  // Corner brackets
  ctx.strokeStyle = 'rgba(180,140,255,.35)';
  ctx.lineWidth = 3;
  const cl = 48;
  const cs = [
    [qrX - pp - 10, qrY - pp - 10],
    [qrX + qrSz + pp + 10, qrY - pp - 10],
    [qrX - pp - 10, qrY + qrSz + pp + 10],
    [qrX + qrSz + pp + 10, qrY + qrSz + pp + 10],
  ];
  ctx.beginPath(); ctx.moveTo(cs[0][0], cs[0][1] + cl); ctx.lineTo(cs[0][0], cs[0][1]); ctx.lineTo(cs[0][0] + cl, cs[0][1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cs[1][0] - cl, cs[1][1]); ctx.lineTo(cs[1][0], cs[1][1]); ctx.lineTo(cs[1][0], cs[1][1] + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cs[2][0], cs[2][1] - cl); ctx.lineTo(cs[2][0], cs[2][1]); ctx.lineTo(cs[2][0] + cl, cs[2][1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cs[3][0] - cl, cs[3][1]); ctx.lineTo(cs[3][0], cs[3][1]); ctx.lineTo(cs[3][0], cs[3][1] - cl); ctx.stroke();

  // Bottom
  ctx.fillStyle = 'rgba(180,160,225,.5)';
  ctx.font = '200 24px sans-serif';
  ctx.fillText(date.toUpperCase(), W / 2, H * 0.87);

  ctx.strokeStyle = 'rgba(180,140,255,.1)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 12]);
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.89);
  ctx.lineTo(W * 0.7, H * 0.89);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(180,140,255,.22)';
  ctx.font = '300 28px sans-serif';
  ctx.fillText('MYCUPID', W / 2, H * 0.93);

  // Floating hearts
  [[W * 0.88, H * 0.1, 18, 'rgba(192,132,252,.5)'], [W * 0.06, H * 0.14, 14, 'rgba(167,139,250,.4)'], [W * 0.82, H * 0.6, 12, 'rgba(232,121,249,.3)']].forEach(([x, y, sz, c]: any) => {
    ctx.fillStyle = c;
    hrt(ctx, x, y, sz);
    ctx.fill();
  });

  // Grain
  try {
    const id = ctx.getImageData(0, 0, W, H);
    const dd = id.data;
    for (let i = 0; i < dd.length; i += 4) {
      const n = (Math.random() - 0.5) * 8;
      dd[i] += n; dd[i + 1] += n; dd[i + 2] += n;
    }
    ctx.putImageData(id, 0, 0);
  } catch (e) { /* skip grain if fails */ }
}

async function drawEscarlate(ctx: any, W: number, H: number, qrImg: any, date: string) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a0008');
  bg.addColorStop(0.4, '#3b000f');
  bg.addColorStop(1, '#0d0004');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.75);
  vg.addColorStop(0, 'transparent');
  vg.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Petals
  const petals = [[0.08, 0.08, 50, 26, 0.3, '#9f1239', 0.5], [0.85, 0.12, 44, 25, -0.4, '#be123c', 0.4], [0.12, 0.72, 55, 30, 0.5, '#881337', 0.45], [0.82, 0.68, 48, 28, -0.3, '#9f1239', 0.4], [0.5, 0.03, 40, 22, 0.1, '#e11d48', 0.3], [0.04, 0.42, 34, 20, 0.6, '#be123c', 0.35], [0.9, 0.45, 36, 22, -0.5, '#9f1239', 0.3]];
  petals.forEach(([x, y, rx, ry, a, c, op]: any) => {
    ctx.save();
    ctx.translate(x * W, y * H);
    ctx.rotate(a);
    ctx.globalAlpha = op;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // Gold frame
  ctx.strokeStyle = 'rgba(212,175,55,.2)';
  ctx.lineWidth = 1.5;
  rr(ctx, 28, 28, W - 56, H - 56, 42);
  ctx.stroke();

  // Brand
  ctx.fillStyle = 'rgba(252,165,165,.35)';
  ctx.font = '300 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MYCUPID', W / 2, 80);

  // Headline
  ctx.fillStyle = '#fecdd3';
  ctx.font = 'italic 300 40px serif';
  ctx.fillText('Abra e se surpreenda', W / 2, H * 0.15);

  ctx.fillStyle = '#fca5a5';
  ctx.font = '80px serif';
  ctx.fillText('com amor', W / 2, H * 0.15 + 96);

  // QR
  const qrSz = 340;
  const qrX = (W - qrSz) / 2;
  const qrY = H * 0.36;
  const pp = 28;

  ctx.fillStyle = 'rgba(255,255,255,.07)';
  rr(ctx, qrX - pp - 8, qrY - pp - 8, qrSz + pp * 2 + 16, qrSz + pp * 2 + 16, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,38,38,.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  rr(ctx, qrX - pp, qrY - pp, qrSz + pp * 2, qrSz + pp * 2, 24);
  ctx.fill();

  if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSz, qrSz);

  ctx.strokeStyle = 'rgba(220,38,38,.2)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 12]);
  ctx.beginPath();
  ctx.moveTo(W * 0.28, H * 0.84);
  ctx.lineTo(W * 0.72, H * 0.84);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(254,205,211,.65)';
  ctx.font = 'italic 300 32px serif';
  ctx.fillText(date, W / 2, H * 0.84 + 52);

  ctx.fillStyle = 'rgba(252,165,165,.2)';
  ctx.font = '24px sans-serif';
  ctx.fillText('MYCUPID.COM.BR', W / 2, H - 40);
}

const DESIGNS: Record<string, (ctx: any, W: number, H: number, qr: any, date: string) => Promise<void>> = {
  cosmos: drawCosmos,
  escarlate: drawEscarlate,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') || 'exemplo';
  const design = searchParams.get('design') || 'cosmos';
  const date = searchParams.get('date') || '';

  const pageUrl = `https://mycupid.com.br/p/${pageId}`;
  const W = 800, H = 1143;

  try {
    const { createCanvas, loadImage } = await import('canvas');
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Gera QR buffer
    const qrBuffer = await getQRBuffer(pageUrl, design === 'escarlate' ? '#7f1d1d' : '#1a0040');
    const qrImg = await loadImage(qrBuffer);

    const drawFn = DESIGNS[design] || drawCosmos;
    await drawFn(ctx, W, H, qrImg, date);

    const buffer = canvas.toBuffer('image/png');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="mycupid-qrcode-${design}.png"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[QR Card] Erro ao gerar imagem:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar o QR code personalizado.', details: error.message },
      { status: 500 }
    );
  }
}
