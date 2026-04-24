import 'server-only';
import { isAdminRequest } from '@/lib/admin-guard';

/**
 * Lança se o caller não for admin. Usar no TOPO de toda server action de
 * `src/app/admin/*` — tanto mutation quanto read. Sem isso, qualquer visitante
 * do site consegue chamar a action via fetch direto nos IDs internos do
 * Next.js (padrão /_next/actions/<hash>), bypassing a UI.
 *
 * Fail-closed: em qualquer erro de verificação, lança como se fosse não-admin.
 */
export async function requireAdmin(): Promise<void> {
  const ok = await isAdminRequest();
  if (!ok) {
    // Erro genérico pra não vazar estrutura interna. Logs server-side já
    // registram tentativas via o middleware/guard quando aplicável.
    throw new Error('Unauthorized');
  }
}
