import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rotas que precisam de login
const protectedRoutes = ['/criar', '/minhas-paginas'];
// Rotas de admin
const adminRoutes = ['/admin'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const hostname = request.headers.get('host') || '';
  
  // --- LÓGICA DE REDIRECIONAMENTO DE DOMÍNIO ---
  const isProdBr = hostname.endsWith('mycupid.com.br');
  const isProdIntl = hostname.endsWith('mycupid.net');
  
  // Only perform geo-redirects on production domains
  if (isProdBr || isProdIntl) {
    const country = request.geo?.country || 'BR';
    const url = request.nextUrl.clone();

    // CASE 1: Brazilian user on international site -> redirect to .com.br
    if (country === 'BR' && isProdIntl) {
        url.hostname = 'mycupid.com.br';
        url.port = '';
        return NextResponse.redirect(url);
    }
    // CASE 2: International user on Brazilian site -> redirect to .net
    if (country !== 'BR' && isProdBr) {
        url.hostname = 'mycupid.net';
        url.port = '';
        return NextResponse.redirect(url);
    }
  }


  // --- LÓGICA DE PROTEÇÃO DE ROTAS (JÁ EXISTENTE) ---
  const userSession = request.cookies.get('__session')?.value;
  const adminSession = request.cookies.get('session_admin')?.value;

  // 1. Se tentar acessar rota protegida de usuário sem cookie -> Manda pro Login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !userSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Salva onde ele queria ir
    return NextResponse.redirect(loginUrl);
  }
  
  // 2. Se tentar acessar rota de admin -> Valida o JWT
  const isTryingToAccessAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isTryingToAccessAdminLogin = pathname === '/admin/login';

  if (isTryingToAccessAdminRoute && !isTryingToAccessAdminLogin) {
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      if (!process.env.ADMIN_JWT_SECRET) throw new Error('JWT Secret not configured');
      const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
      await jwtVerify(adminSession, secret);
    } catch (error) {
      console.error("Admin session verification failed:", error);
      // If token is invalid, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      request.cookies.delete('session_admin');
      return NextResponse.redirect(loginUrl);
    }
  }


  // 3. Se já tem cookie e tenta acessar login -> Manda direto para as páginas do usuário
  if (authRoutes.includes(pathname) && userSession) {
    return NextResponse.redirect(new URL('/minhas-paginas', request.url));
  }

  return NextResponse.next();
}

// Configuração para rodar em tudo, menos arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
