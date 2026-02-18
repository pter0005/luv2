
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Admin credentials are hardcoded for simplicity.
// For a real production environment, it's highly recommended to use environment variables.
const ADMIN_USER = 'admin123';
const ADMIN_PASS = '123admin';

export async function createAdminSession(prevState: { error: string }, data: FormData) {
  const username = data.get('username');
  const password = data.get('password');

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    cookies().set('session_admin', 'true', {
      httpOnly: true,
      secure: true, // Forçar cookie seguro para ambientes de dev HTTPS
      maxAge: 60 * 60 * 8, // 8 hours
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
