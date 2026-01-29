import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin/config';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: No session cookie provided.' }), { status: 401 });
  }

  try {
    const adminAuth = getAuth(getAdminApp());
    // Verify the session cookie. `checkRevoked` is true to ensure the session is still active.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Session is valid.
    return new NextResponse(JSON.stringify({ status: 'success', user: decodedClaims }), { status: 200 });
  } catch (error) {
    // Session cookie is invalid (e.g., expired, revoked, malformed).
    // It's good practice to clear the invalid cookie.
    cookies().delete('__session');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid session cookie.' }), { status: 401 });
  }
}
