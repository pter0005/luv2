import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que precisam de login
const protectedRoutes = ['/criar', '/minhas-paginas'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session_user')?.value;
  const { pathname } = request.nextUrl;

  // 1. Se tentar acessar rota protegida sem cookie -> Manda pro Login
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Salva onde ele queria ir
    return NextResponse.redirect(loginUrl);
  }

  // 2. Se já tem cookie e tenta acessar login -> Manda direto pra criar
  if (authRoutes.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/criar', request.url));
  }

  return NextResponse.next();
}

// Configuração para o middleware rodar apenas nas rotas necessárias
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
