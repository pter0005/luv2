import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only: verifica se um path existe no Storage do servidor
 * (usado pela página /admin/test-upload pra confirmar que o byte
 * que o cliente acabou de uploadar está visível pro Admin SDK).
 */
export async function POST(req: NextRequest) {
  const ok = await isAdminRequest();
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { path } = await req.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'invalid_path' }, { status: 400 });
    }
    const bucket = getAdminStorage();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    let size: number | null = null;
    let contentType: string | null = null;
    if (exists) {
      try {
        const [meta] = await file.getMetadata();
        size = Number(meta.size);
        contentType = meta.contentType || null;
      } catch { /* ignora */ }
    }
    return NextResponse.json({ exists, size, contentType });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', message: err?.message }, { status: 500 });
  }
}
