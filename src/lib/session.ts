import 'server-only';
import { getAdminApp } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';

export async function createSessionCookie(idToken: string) {
  try {
    const adminAuth = getAuth(getAdminApp());
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return { success: false, error: 'Failed to create session.' };
  }
}

export async function revokeSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}
