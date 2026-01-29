import { NextResponse, type NextRequest } from 'next/server';

function redirectToLogin(request: NextRequest) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Preserve the original path for redirection after login
    url.search = `redirect=${request.nextUrl.pathname}`;
    return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  // 1. If no cookie, definitely not logged in.
  if (!sessionCookie) {
    return redirectToLogin(request);
  }

  // 2. There's a cookie, but is it valid?
  // We call a dedicated API route that runs in a Node.js environment
  // and can use the firebase-admin SDK to verify the cookie.
  const response = await fetch(`${request.nextUrl.origin}/api/auth/verify`, {
    headers: {
      'Cookie': `__session=${sessionCookie}`,
    },
  });

  // 3. If the verification API returns anything other than 200,
  // the cookie is invalid or expired. Redirect to login.
  if (response.status !== 200) {
    return redirectToLogin(request);
  }

  // 4. Session is valid. Allow the user to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/criar/:path*', '/minhas-paginas/:path*'],
};
