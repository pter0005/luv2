import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { localeFromHost, isLocale, type Locale } from '@/i18n/config';

// Rotas que precisam de login
const protectedRoutes = ['/minhas-paginas'];
// Rotas de admin
const adminRoutes = ['/admin'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // LOCALE DETECTION — baseado em hostname + override dev.
  // Injeta header x-locale (server components) e cookie NEXT_LOCALE
  // (client components). Tudo antes da lógica de auth pra não
  // afetar redirects.
  // ─────────────────────────────────────────────────────────────
  const host = request.headers.get('host') || '';
  let locale: Locale = localeFromHost(host);

  // Dev override: ?locale=en força EN em localhost pra testar sem DNS.
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const q = request.nextUrl.searchParams.get('locale');
    if (isLocale(q)) locale = q;
    // Cookie existente também override dev (persistência entre navegações)
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (isLocale(cookieLocale) && !q) locale = cookieLocale;
  }

  // Request headers mutáveis pra passar x-locale aos server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-host', host);

  // --- LÓGICA DE PROTEÇÃO DE ROTAS ---
  const userSession = request.cookies.get('__session')?.value;
  const adminSession = request.cookies.get('session_admin')?.value;

  // 1. Se tentar acessar rota protegida de usuário sem cookie -> Manda pro Login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !userSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
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
    return res;
  }

  // Response normal: propaga locale via cookie + headers mutados
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
  response.headers.set('x-locale', locale);
  return response;
}

// Configuração para rodar em tudo, menos arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
