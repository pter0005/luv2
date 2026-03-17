import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId');
  const design = searchParams.get('design'); // 'classic' or 'ticket'

  if (!pageId) {
    return new NextResponse('Page ID is required', { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mycupid.com.br';
  const pageUrl = `${siteUrl}/p/${pageId}`;
  
  // NOTE: Server-side canvas composition is complex and requires libraries
  // not available in this environment (e.g., node-canvas).
  // This implementation returns a standard QR code for now.
  // The 'ticket' design would require fetching the background and QR code
  // and composing them on the server.

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pageUrl)}`;

  try {
    const response = await fetch(qrApiUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch QR code from external API');
    }
    const imageBlob = await response.blob();
    
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="mycupid-qrcode.png"`,
      },
    });

  } catch (error: any) {
    return new NextResponse(`Error generating QR code: ${error.message}`, { status: 500 });
  }
}
