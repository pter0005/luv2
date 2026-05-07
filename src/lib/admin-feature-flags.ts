/**
 * SEGURANÇA — ações destrutivas no admin.
 *
 * Quando `false`, TODAS as funções de delete (páginas, cupons, créditos,
 * etc) ficam desabilitadas tanto na UI (botões escondidos) quanto no
 * backend (server actions retornam erro). Isso protege contra abuso caso
 * a senha admin vaze: o vândalo não consegue apagar nada.
 *
 * Pra reativar TEMPORARIAMENTE quando precisar deletar algo legítimo:
 *   1. Mude `ADMIN_DELETES_ENABLED` pra `true`
 *   2. Commit + deploy
 *   3. Execute a deleção necessária pelo admin
 *   4. Volte pra `false`
 *   5. Commit + deploy de novo
 *
 * Defesa em camadas: a UI esconde, mas se alguém chamar a API direto,
 * o server action também rejeita.
 */
export const ADMIN_DELETES_ENABLED = false;

export const DELETES_DISABLED_MSG =
  'Ações destrutivas estão desabilitadas por segurança. Para apagar algo, contate o desenvolvedor.';
