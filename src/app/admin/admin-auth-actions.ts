
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function createAdminSession(prevState: { error: string }, data: FormData) {
  const username = data.get('username') as string;
  const password = data.get('password') as string;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

  if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_JWT_SECRET) {
    return { error: 'Server configuration error.' };
  }

  if (safeCompare(username, ADMIN_USER) && safeCompare(password, ADMIN_PASS)) {
    const secret = new TextEncoder().encode(ADMIN_JWT_SECRET);
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);

    cookies().set('session_admin', token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'lax',
    });
    redirect('/admin');
  }

  return { error: 'Invalid credentials.' };
}

export async function removeAdminSession() {
  cookies().delete('session_admin');
  redirect('/admin/login');
}
