'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * Autenticação de edição por email. Em vez de exigir login Firebase +
 * userId do dono (que falha quando user criou como guest em outro device),
 * validamos que o email informado bate com `guestEmail` da página. Se bater,
 * setamos um cookie HMAC-assinado específico pra esse pageId que o
 * EditPageClient consome.
 *
 * O cookie tem escopo de 1 pageId só (não é session geral) — mesmo que
 * vazasse, só liberaria edição daquela página.
 */

const COOKIE_PREFIX = 'edit_token_';
const COOKIE_MAX_AGE = 60 * 60 * 6; // 6 horas

function getSecret(): string {
  // Fallback seguro — em prod o ideal é setar EDIT_TOKEN_SECRET separado.
  // Se ADMIN_JWT_SECRET existir, reusa (rotacionando junto é desejável).
  return process.env.EDIT_TOKEN_SECRET || process.env.ADMIN_JWT_SECRET || 'fallback-change-me';
}

function signToken(pageId: string, email: string): string {
  const payload = `${pageId}:${email}:${Math.floor(Date.now() / 1000)}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  // Base64url do payload + sig — formato compacto
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export async function verifyEditToken(pageId: string): Promise<{ ok: boolean; email?: string }> {
  try {
    const token = cookies().get(COOKIE_PREFIX + pageId)?.value;
    if (!token) return { ok: false };
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return { ok: false };
    const payload = Buffer.from(b64, 'base64url').toString('utf-8');
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
    // Timing-safe compare
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
    const [pid, email, tsStr] = payload.split(':');
    if (pid !== pageId) return { ok: false };
    const ts = Number(tsStr);
    if (!isFinite(ts)) return { ok: false };
    // Cookie max-age cobre expiração, mas checamos aqui também pra defesa extra
    if (Date.now() / 1000 - ts > COOKIE_MAX_AGE) return { ok: false };
    return { ok: true, email };
  } catch {
    return { ok: false };
  }
}

/**
 * Valida email+pageId e, se bater, grava o cookie. Retorna {ok:true} pro
 * cliente redirecionar pro form de edição. Não vaza se o email existe no
 * sistema — resposta genérica "não encontrado" previne enumeração.
 */
export async function requestEditAccess(
  pageId: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!pageId || typeof pageId !== 'string') return { ok: false, error: 'ID inválido.' };
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return { ok: false, error: 'Email inválido.' };
  }

  // Rate limit por IP — previne brute-force de emails
  const h = headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  if (!rateLimit(`edit-access:${ip}`, 8, 60_000).ok) {
    return { ok: false, error: 'Muitas tentativas. Espere 1 minuto.' };
  }

  try {
    const db = getAdminFirestore();
    const snap = await db.collection('lovepages').doc(pageId).get();
    if (!snap.exists) return { ok: false, error: 'Página não encontrada.' };
    const data = snap.data()!;

    if (data.plan !== 'vip') {
      return { ok: false, error: 'Edição disponível apenas no plano VIP.' };
    }

    // Emails possíveis salvos: guestEmail (checkout via guest) ou ownerEmail
    // (se migrou pra conta). Normaliza tudo lowercase.
    const pageEmails: string[] = [data.guestEmail, data.ownerEmail, data.userEmail]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase().trim());

    if (pageEmails.length === 0) {
      // Sem email registrado (ex: página admin/test). Só permite via userId logado,
      // que fica no fluxo antigo. Retornamos erro genérico.
      return { ok: false, error: 'Email não confere.' };
    }

    if (!pageEmails.includes(cleanEmail)) {
      return { ok: false, error: 'Email não confere.' };
    }

    // Bateu — grava cookie HMAC-assinado
    const token = signToken(pageId, cleanEmail);
    cookies().set(COOKIE_PREFIX + pageId, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return { ok: true };
  } catch (e: any) {
    console.error('[requestEditAccess]', e);
    return { ok: false, error: 'Erro interno. Tente de novo.' };
  }
}
