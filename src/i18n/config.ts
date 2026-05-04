export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export function isLocale(v: unknown): v is Locale {
  return v === 'pt' || v === 'en';
}

// ─────────────────────────────────────────────────────────────
// MARKET — dimensão ortogonal a Locale.
// Locale = idioma da UI (pt/en). Market = moeda + gateway + preço.
// PT-PT lê PT-BR sem fricção (locale='pt'), mas paga em EUR via
// Stripe (market='PT'). Manter separado evita refatorar 25+ call
// sites de Locale e ainda permite override manual via cookie.
// ─────────────────────────────────────────────────────────────
export const markets = ['BR', 'PT', 'US'] as const;
export type Market = (typeof markets)[number];
export const defaultMarket: Market = 'BR';

export function isMarket(v: unknown): v is Market {
  return v === 'BR' || v === 'PT' || v === 'US';
}

/**
 * Locale do market — mapping fixo, sem ambiguidade.
 * BR/PT → 'pt' (mesma língua, copy 95% igual).
 * US    → 'en'.
 */
export function localeFromMarket(market: Market): Locale {
  return market === 'US' ? 'en' : 'pt';
}

/**
 * Market do locale (fallback quando só Locale é conhecido).
 * Conservador: 'pt' → BR (mercado primário), 'en' → US.
 */
export function marketFromLocale(locale: Locale): Market {
  return locale === 'en' ? 'US' : 'BR';
}

// Detecta locale pelo hostname. `mycupid.net` serve US/PT (en/pt),
// qualquer outro domínio (mycupid.com.br, preview, localhost) serve BR (pt).
// Mantido pra backward compat — código novo prefere marketFromRequest.
export function localeFromHost(host: string | null | undefined): Locale {
  if (!host) return defaultLocale;
  return host.endsWith('mycupid.net') ? 'en' : 'pt';
}

/**
 * Detecta market a partir do request com regras ESTRITAS.
 *
 *   mycupid.com.br        → BR (sempre, ignora geo — domínio é a verdade)
 *   mycupid.net + geo=PT  → PT (português de Portugal, EUR + Stripe)
 *   mycupid.net + geo=US  → US (americano, USD + Stripe)
 *   mycupid.net + geo=??  → US (fallback default — .net é mercado US primary)
 *
 * Override (cookie/query `market`) tem prioridade máxima — escape hatch
 * pra VPN/viajante. Validado contra `isMarket` pra não aceitar lixo.
 *
 * IMPORTANTE: geoCountry NUNCA decide pra mycupid.com.br. BR é
 * domínio nacional, geo é irrelevante (brasileiro viajando continua BR).
 */
export function marketFromRequest(input: {
  host: string | null | undefined;
  geoCountry?: string | null | undefined;
  override?: string | null | undefined;
}): Market {
  const { host, geoCountry, override } = input;

  if (override && isMarket(override)) return override;

  if (!host) return defaultMarket;

  // .com.br = BR sempre
  if (host.endsWith('mycupid.com.br')) return 'BR';

  // .net = US ou PT por geo
  if (host.endsWith('mycupid.net')) {
    const cc = (geoCountry || '').toUpperCase();
    if (cc === 'PT') return 'PT';
    return 'US';
  }

  // Preview/localhost/qualquer outro → BR (mercado primário)
  return defaultMarket;
}
