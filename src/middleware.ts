import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que precisam de login
const protectedRoutes = ['/criar', '/minhas-paginas'];
// Rotas de admin
const adminRoutes = ['/admin'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Pega o domínio que o usuário digitou (ex: mycupid.net)
  const hostname = request.headers.get('host') || '';
  
  // Pega o país (Vercel injeta isso automático. No localhost é undefined)
  // Se for undefined (localhost), assumimos 'BR' pra facilitar
  const country = request.geo?.country || 'BR';

  // --- LÓGICA DE REDIRECIONAMENTO DE DOMÍNIO ---
  const url = request.nextUrl.clone();

  // CASO 1: É Brasileiro, mas entrou no .net -> Manda pro .com.br
  // Ignora se estiver em localhost para não quebrar o dev local
  if (country === 'BR' && hostname.includes('mycupid.net') && !hostname.includes('localhost')) {
    url.hostname = 'mycupid.com.br'; // Troca o domínio
    url.port = ''; // Garante que não quebra porta se tiver
    return NextResponse.redirect(url);
  }

  // CASO 2: É Gringo, mas entrou no .com.br -> Manda pro .net
  if (country !== 'BR' && hostname.includes('mycupid.com.br') && !hostname.includes('localhost')) {
    url.hostname = 'mycupid.net';
    url.port = '';
    return NextResponse.redirect(url);
  }

  // --- LÓGICA DE PROTEÇÃO DE ROTAS (JÁ EXISTENTE) ---
  const userSession = request.cookies.get('session_user')?.value;
  const adminSession = request.cookies.get('session_admin')?.value;

  // 1. Se tentar acessar rota protegida de usuário sem cookie -> Manda pro Login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !userSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Salva onde ele queria ir
    return NextResponse.redirect(loginUrl);
  }
  
  // 2. Se tentar acessar rota de admin sem cookie de admin -> Manda pro Login do Admin
  const isTryingToAccessAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isTryingToAccessAdminLogin = pathname === '/admin/login';

  if (isTryingToAccessAdminRoute && !isTryingToAccessAdminLogin && !adminSession) {
    const adminLoginUrl = new URL('/admin/login', request.url);
    adminLoginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(adminLoginUrl);
  }


  // 3. Se já tem cookie e tenta acessar login -> Manda direto pra criar
  if (authRoutes.includes(pathname) && userSession) {
    return NextResponse.redirect(new URL('/criar', request.url));
  }

  return NextResponse.next();
}

// Configuração para rodar em tudo, menos arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
