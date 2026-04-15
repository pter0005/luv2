import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get('pageId');
  if (!pageId) return NextResponse.json({ error: 'missing pageId' }, { status: 400 });

  try {
    const db = getAdminFirestore();
    const doc = await db.collection('lovepages').doc(pageId).get();
    if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const d = doc.data()!;
    // First gallery image, falling back to puzzle image
    const images: any[] = Array.isArray(d.galleryImages) ? d.galleryImages : [];
    const firstImage = images.find(i => i?.url)?.url || d.puzzleImage?.url || null;

    return NextResponse.json({
      title: (d.title as string) || '',
      imageUrl: firstImage,
      plan: d.plan || 'basico',
    });
  } catch (e: any) {
    console.error('[lovepage-meta]', e?.message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
