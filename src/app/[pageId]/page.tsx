import { redirect } from 'next/navigation';

/**
 * Catch-all redirect das URLs raiz pra rota canônica /p/[pageId].
 *
 * Existe pra cobrir um bug que ficou em produção: confirmation.ts mandava
 * URLs sem o /p/ por algumas horas, e clientes caíam em 404. Esse redirect
 * pega esses links antigos e leva pra página certa sem o cliente perceber
 * o erro.
 *
 * Next.js prioriza rotas estáticas (admin, criar, desconto, etc) sobre
 * segmento dinâmico raiz, então este page.tsx só é acionado para slugs
 * que NÃO batem em nenhuma outra rota — exatamente o caso de pageIds.
 *
 * Se o pageId não existir em /p/[pageId], o cliente verá o 404 da rota
 * canônica (mesmo comportamento que ele teria visto sem este redirect).
 */
export default function CatchAllPageIdRedirect({ params }: { params: { pageId: string } }) {
  redirect(`/p/${params.pageId}`);
}
