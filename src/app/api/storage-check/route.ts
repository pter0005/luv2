import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin/config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Confirma server-side que um path do Storage existe e tem tamanho > 0.
 * Usado como fallback do `confirmStorageVisible` no client — necessário
 * porque o HEAD direto do browser na URL pública é bloqueado por CORS.
 *
 * Auth: token do Firebase + path tem que pertencer ao próprio user
 * (temp/{uid}/...). Sem isso, qualquer um podia varrer paths alheios.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`storage-check:${ip}`, 120, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  try {
    const { path, idToken } = await req.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'invalid_path' }, { status: 400 });
    }
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'missing_auth' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // Só permite consulta de paths que pertencem ao próprio user.
    if (!path.startsWith(`temp/${userId}/`)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const bucket = getAdminStorage();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return NextResponse.json({ exists: false });

    const [meta] = await file.getMetadata();
    return NextResponse.json({ exists: true, size: Number(meta.size) || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', message: err?.message }, { status: 500 });
  }
}
