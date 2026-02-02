'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createSession(uid: string) {
  // Define o cookie de sessão
  cookies().set('session_user', uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 5, // 5 dias
    path: '/',
    sameSite: 'lax',
  });
}

export async function removeSession() {
  cookies().delete('session_user');
  redirect('/login');
}

export async function getSession() {
  const session = cookies().get('session_user')?.value;
  return session || null;
}
