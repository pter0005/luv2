'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createSession(uid: string, redirectPath: string) {
  cookies().set('session_user', uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 5, // 5 dias
    path: '/',
    sameSite: 'lax',
  });

  // O redirecionamento é feito no lado do servidor, garantindo que o cookie esteja presente na próxima requisição.
  redirect(redirectPath);
}

export async function removeSession() {
  cookies().delete('session_user');
  // Apenas remove o cookie. O cliente cuidará do redirecionamento.
}

export async function getSession() {
  const session = cookies().get('session_user')?.value;
  return session || null;
}
