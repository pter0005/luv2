'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_USER = 'admin123';
const ADMIN_PASS = '12345678a';

export async function createAdminSession(data: FormData) {
  const username = data.get('username');
  const password = data.get('password');

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    cookies().set('session_admin', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
      sameSite: 'lax',
    });
    redirect('/admin');
  }

  return { error: 'Credenciais inválidas.' };
}

export async function removeAdminSession() {
  cookies().delete('session_admin');
  redirect('/admin/login');
}
