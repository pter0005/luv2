export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export function isLocale(v: unknown): v is Locale {
  return v === 'pt' || v === 'en';
}

// Detecta locale pelo hostname. `mycupid.net` serve US (en),
// qualquer outro domínio (mycupid.com.br, preview, localhost) serve BR (pt).
export function localeFromHost(host: string | null | undefined): Locale {
  if (!host) return defaultLocale;
  return host.endsWith('mycupid.net') ? 'en' : 'pt';
}
