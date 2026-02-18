'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createSession(uid: string) {
  cookies().set('session_user', uid, {
    httpOnly: true,
    secure: true, // Forçado para true para funcionar em ambientes de dev HTTPS como o Firebase Studio
    maxAge: 60 * 60 * 24 * 5, // 5 dias
    path: '/',
    sameSite: 'lax',
  });

  // O redirecionamento agora é feito no lado do cliente.
}

export async function removeSession() {
  cookies().delete('session_user');
  // Apenas remove o cookie. O cliente cuidará do redirecionamento.
}

export async function getSession() {
  const session = cookies().get('session_user')?.value;
  return session || null;
}
