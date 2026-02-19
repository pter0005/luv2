
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Admin credentials should be set as environment variables for security.
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

export async function createAdminSession(prevState: { error: string }, data: FormData) {
  const username = data.get('username');
  const password = data.get('password');

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error("Admin credentials (ADMIN_USER, ADMIN_PASS) are not set in environment variables.");
    return { error: 'Server configuration error.' };
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    cookies().set('session_admin', 'true', {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'none', // Allow cross-site cookie usage
    });
    redirect('/admin');
  }

  return { error: 'Invalid credentials.' };
}

export async function removeAdminSession() {
  cookies().delete('session_admin');
  redirect('/admin/login');
}
