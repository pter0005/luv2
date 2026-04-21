import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * Returns true iff the request carries a valid `session_admin` JWT cookie
 * signed with ADMIN_JWT_SECRET. Used by /api/admin/* routes and any server
 * action that bypasses the middleware (e.g., fetch-based API handlers).
 *
 * Defaults to false on any error so leaks fail closed.
 */
export async function isAdminRequest(): Promise<boolean> {
  // Em dev, todo mundo é admin — facilita iterar no /chat sem login.
  if (process.env.NODE_ENV !== 'production') return true;
  try {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) return false;
    const token = cookies().get('session_admin')?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload?.role === 'admin';
  } catch {
    return false;
  }
}
