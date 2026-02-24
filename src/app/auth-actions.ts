
'use server';

import { getAdminApp } from '@/lib/firebase/admin/config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';

export async function createSession(idToken: string) {
  try {
    const adminAuth = getAuth(getAdminApp());
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Set the secure, server-side session cookie.
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'none', // Allow cross-site cookie usage, necessary for iframed environments
    });

  } catch (error) {
    console.error('Error creating session cookie:', error);
    // This error will be propagated to the client, which should handle it.
    throw new Error('Failed to create session.');
  }
}

export async function removeSession() {
  // Delete the session cookie.
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  // Helper to get the session cookie if needed server-side.
  const session = cookies().get(SESSION_COOKIE_NAME)?.value;
  return session || null;
}
