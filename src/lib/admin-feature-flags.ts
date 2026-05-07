/**
 * SEGURANÇA — ações destrutivas no admin.
 *
 * Apenas deleção de PÁGINAS DE CLIENTES é bloqueada por padrão. Essa é a
 * ação mais grave em caso de senha vazada (perda de dados de cliente real,
 * impacto direto em vendas/reputação).
 *
 * Cupons e créditos podem ser deletados normalmente — são dados gerenciáveis
 * e fáceis de recriar se algo der errado.
 *
 * Pra reativar TEMPORARIAMENTE deleção de páginas:
 *   1. Mude `ADMIN_DELETE_PAGES_ENABLED` pra `true`
 *   2. Commit + deploy
 *   3. Execute a deleção pelo admin
 *   4. Volte pra `false`
 *   5. Commit + deploy
 *
 * Defesa em camadas: UI esconde + server action rejeita.
 */
export const ADMIN_DELETE_PAGES_ENABLED = false;

export const DELETES_DISABLED_MSG =
  'Deleção de páginas está desabilitada por segurança. Para apagar uma página, contate o desenvolvedor.';
