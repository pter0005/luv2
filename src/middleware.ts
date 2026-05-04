import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  isLocale,
  isMarket,
  marketFromRequest,
  localeFromMarket,
  type Locale,
  type Market,
} from '@/i18n/config';

// Rotas que precisam de login
const protectedRoutes = ['/minhas-paginas'];
// Rotas de admin
const adminRoutes = ['/admin'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // LOCALE + MARKET DETECTION
  //   Locale = idioma da UI (pt/en).
  //   Market = moeda + gateway + preço (BR/PT/US).
  // mycupid.com.br → BR sempre. mycupid.net → US ou PT por geo-IP
  // (Vercel x-vercel-ip-country). Override via cookie MARKET_OVERRIDE
  // ou query ?market= (escape hatch pra VPN/viajante).
  // ─────────────────────────────────────────────────────────────
  const host = request.headers.get('host') || '';
  const isDev = process.env.NODE_ENV !== 'production';

  // Geo do edge. Suporta múltiplas plataformas porque o header muda:
  //   Netlify: x-country (ISO-3166-1 alpha-2, ex: "PT")
  //   Netlify: x-nf-geo (JSON base64 com country.code)
  //   Vercel:  x-vercel-ip-country (legado, fallback)
  //   Cloudflare: cf-ipcountry (caso passe por CF antes)
  // Em dev, simula via x-test-country pra teste local sem deploy.
  const readGeo = (): string | null => {
    const direct =
      request.headers.get('x-country') ||
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      (isDev ? request.headers.get('x-test-country') : null);
    if (direct) return direct.toUpperCase();

    // Netlify x-nf-geo é JSON base64
    const nfGeo = request.headers.get('x-nf-geo');
    if (nfGeo) {
      try {
        const decoded = JSON.parse(
          typeof atob === 'function' ? atob(nfGeo) : Buffer.from(nfGeo, 'base64').toString('utf-8'),
        );
        const cc = decoded?.country?.code;
        if (typeof cc === 'string' && cc.length === 2) return cc.toUpperCase();
      } catch {
        // base64/JSON malformado — ignora silenciosamente, cai pro default market
      }
    }

    return (request as unknown as { geo?: { country?: string } }).geo?.country?.toUpperCase() || null;
  };
  const geoCountry = readGeo();

  // Override: query (?market=PT, dev only) ou cookie MARKET_OVERRIDE (sempre)
  const queryMarket = isDev ? request.nextUrl.searchParams.get('market') : null;
  const cookieOverride = request.cookies.get('MARKET_OVERRIDE')?.value;
  const overrideRaw = queryMarket || cookieOverride;
  const override = isMarket(overrideRaw) ? overrideRaw : null;

  let market: Market = marketFromRequest({ host, geoCountry, override });
  let locale: Locale = localeFromMarket(market);

  // Dev override de locale isolado (?locale=en) — útil pra testar copy
  // sem trocar gateway/moeda. NEXT_LOCALE cookie respeita o mesmo escape.
  if (isDev) {
    const qLocale = request.nextUrl.searchParams.get('locale');
    if (isLocale(qLocale)) locale = qLocale;
    else {
      const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
      if (isLocale(cookieLocale)) locale = cookieLocale;
    }
  }

  // Request headers mutáveis pra passar x-locale/x-market aos server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-market', market);
  requestHeaders.set('x-host', host);
  if (geoCountry) requestHeaders.set('x-geo-country', geoCountry);

  // --- LÓGICA DE PROTEÇÃO DE ROTAS ---
  const userSession = request.cookies.get('__session')?.value;
  const adminSession = request.cookies.get('session_admin')?.value;

  // 1. Se tentar acessar rota protegida de usuário sem cookie -> Manda pro Login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !userSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
    res.cookies.set('MARKET', market, { path: '/', sameSite: 'lax' });
    return res;
  }

  // 2. Se tentar acessar rota de admin -> Valida o JWT
  const isTryingToAccessAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isTryingToAccessAdminLogin = pathname === '/admin/login';

  if (isTryingToAccessAdminRoute && !isTryingToAccessAdminLogin && !isDev) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    if (!adminSession) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
      res.cookies.set('MARKET', market, { path: '/', sameSite: 'lax' });
      return res;
    }
    try {
      if (!process.env.ADMIN_JWT_SECRET) throw new Error('JWT Secret not configured');
      const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
      await jwtVerify(adminSession, secret);
    } catch (error) {
      console.error("Admin session verification failed:", error);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session_admin');
      response.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
      response.cookies.set('MARKET', market, { path: '/', sameSite: 'lax' });
      return response;
    }
  }


  // 3. Se já tem cookie e tenta acessar login -> Redireciona, respeitando o ?redirect
  if (authRoutes.includes(pathname) && userSession) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const target = (redirectParam && redirectParam.startsWith('/') && !redirectParam.includes('..'))
      ? new URL(redirectParam, request.url)
      : new URL('/minhas-paginas', request.url);
    const res = NextResponse.redirect(target);
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
    res.cookies.set('MARKET', market, { path: '/', sameSite: 'lax' });
    return res;
  }

  // Response normal: propaga locale + market via cookie + headers mutados
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
  response.cookies.set('MARKET', market, { path: '/', sameSite: 'lax' });
  response.headers.set('x-locale', locale);
  response.headers.set('x-market', market);
  return response;
}

// Configuração para rodar em tudo, menos arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
