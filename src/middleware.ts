import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin/config';

async function verifySessionCookie(req: NextRequest) {
    const sessionCookie = req.cookies.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const adminAuth = getAuth(getAdminApp());
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch (error) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const user = await verifySessionCookie(request);
  
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `redirect=${request.nextUrl.pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/criar/:path*', '/minhas-paginas/:path*'],
};
