
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rotas que precisam de login
const protectedRoutes = ['/minhas-paginas'];
// Rotas de admin
const adminRoutes = ['/admin', '/chat'];
// Rotas que usuário logado não deve acessar
const authRoutes = ['/login'];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // --- LÓGICA DE PROTEÇÃO DE ROTAS ---
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
      // If token is invalid, redirect to login and clear the bad cookie.
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session_admin'); // Correct way to delete a cookie
      return response;
    }
  }


  // 3. Se já tem cookie e tenta acessar login -> Redireciona, respeitando o ?redirect
  if (authRoutes.includes(pathname) && userSession) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    // Se houver um parâmetro de redirecionamento, use-o
    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.includes('..')) {
        return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    // Caso contrário, manda para a página padrão de usuário logado
    return NextResponse.redirect(new URL('/minhas-paginas', request.url));
  }

  return NextResponse.next();
}

// Configuração para rodar em tudo, menos arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
