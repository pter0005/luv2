/**
 * Fetch que NUNCA pendura. Default 15s timeout, AbortController nativo.
 * Usar em qualquer fetch crítico do funil (discount, page-heal, intent save).
 *
 * Sem isso: iOS Safari em 2G/3G às vezes deixa promise pendente pra
 * sempre, spinner gira, user fecha aba — venda perdida.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 15_000, signal: externalSignal, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error(`timeout_${timeoutMs}ms`)), timeoutMs);

  // Combina com signal externo se houver
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...rest, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
