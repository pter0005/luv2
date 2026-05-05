/**
 * Auth pra API externa — Bearer token via env var.
 *
 * Por que env var (e não tokens em Firestore):
 *   - Setup imediato (1 linha no Netlify).
 *   - 1 consumer só por enquanto (o sistema pessoal do dono).
 *   - Sem UI pra revogar — basta trocar a env var.
 *
 * Quando expandir pra múltiplos consumers (ex.: dar acesso pra sócios,
 * Looker, ChatGPT/Claude actions diferentes), migra pra coleção `api_tokens`
 * em Firestore com `name`, `createdAt`, `lastUsedAt`, `revoked`.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function getExternalApiToken(): string | null {
  const token = process.env.EXTERNAL_API_TOKEN;
  if (!token || token.length < 24) return null;
  return token;
}

export function authenticateExternalRequest(req: NextRequest): { ok: boolean; reason?: string } {
  const expected = getExternalApiToken();
  if (!expected) return { ok: false, reason: 'EXTERNAL_API_TOKEN not configured on server' };

  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, reason: 'missing Bearer token' };

  const provided = match[1].trim();

  // Comparação constant-time (resistente a timing attacks). Em Edge Runtime
  // não tem crypto.timingSafeEqual, então emulamos: percorre TODO o tamanho
  // do maior, com XOR — não pode short-circuit em mismatch.
  if (provided.length !== expected.length) return { ok: false, reason: 'invalid token' };
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, reason: 'invalid token' };

  return { ok: true };
}

export function unauthorized(reason?: string) {
  return NextResponse.json(
    { error: 'unauthorized', reason: reason || 'authentication required' },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="mycupid-external-api"',
      },
    },
  );
}

/**
 * CORS leve — só pra esse domínio se precisar chamar do browser.
 * Por padrão, API externa é server-to-server (sem CORS necessário).
 * Se vc for chamar de um browser (frontend separado), seta
 * EXTERNAL_API_ALLOWED_ORIGIN com o origin permitido.
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = process.env.EXTERNAL_API_ALLOWED_ORIGIN;
  if (!allowed) return {};
  if (origin && origin === allowed) {
    return {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '600',
    };
  }
  return {};
}
