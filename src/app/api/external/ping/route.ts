import { NextRequest, NextResponse } from 'next/server';
import { authenticateExternalRequest, unauthorized, getExternalApiToken, corsHeaders } from '@/lib/external-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/ping
 *   - sem token: retorna { ok: true, configured: <bool> } pra debugar se a env var tá no servidor
 *   - com token válido: retorna { ok: true, authenticated: true }
 *   - com token inválido: 401
 */
export async function GET(req: NextRequest) {
  const hasHeader = !!req.headers.get('authorization');
  const configured = !!getExternalApiToken();

  if (!hasHeader) {
    return NextResponse.json(
      {
        ok: true,
        configured,
        message: configured
          ? 'API ready. Send Authorization: Bearer <token> to authenticate.'
          : 'EXTERNAL_API_TOKEN not configured on server.',
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  }

  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason);

  return NextResponse.json(
    { ok: true, authenticated: true, serverTime: new Date().toISOString() },
    { headers: corsHeaders(req.headers.get('origin')) },
  );
}
