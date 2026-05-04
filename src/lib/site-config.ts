import { ptBR, enUS, pt as ptPT, type Locale as DateFnsLocale } from 'date-fns/locale';
import type { Locale, Market } from '@/i18n/config';
import { marketFromLocale } from '@/i18n/config';

export type Currency = 'BRL' | 'USD' | 'EUR';
export type Gateway = 'mercadopago' | 'stripe';
export type PhoneFormat = 'br' | 'us' | 'pt';

export interface SiteConfig {
  /** Base URL absoluta do site naquele market (sem barra no final). */
  baseUrl: string;
  /** Domínio apex (sem protocolo). */
  domain: string;
  /** Moeda canônica do mercado. */
  currency: Currency;
  /** Símbolo monetário (pra UI onde Intl.NumberFormat é overkill). */
  currencySymbol: string;
  /** Gateway primário pra esse mercado. */
  gateway: Gateway;
  /** Formato de telefone (BR = DDD + 10-11 díg, US = 10 díg, PT = 9 díg). */
  phoneFormat: PhoneFormat;
  /** Locale do date-fns pra format/parse. */
  dateLocale: DateFnsLocale;
  /** Timezone IANA canônico pro formatter de analytics/relatórios. */
  timeZone: string;
  /** BCP 47 tag (pra <html lang> e Intl.NumberFormat). */
  htmlLang: string;
  /** Tag OpenGraph (underline). */
  ogLocale: string;
  /** Nome do produto legível (pode divergir por mercado no futuro). */
  siteName: string;
  /** Métodos de pagamento Stripe habilitados (vazio se gateway != stripe). */
  stripePaymentMethods?: ('card' | 'multibanco' | 'link')[];
}

const BR: SiteConfig = {
  baseUrl: 'https://www.mycupid.com.br',
  domain: 'mycupid.com.br',
  currency: 'BRL',
  currencySymbol: 'R$',
  gateway: 'mercadopago',
  phoneFormat: 'br',
  dateLocale: ptBR,
  timeZone: 'America/Sao_Paulo',
  htmlLang: 'pt-BR',
  ogLocale: 'pt_BR',
  siteName: 'MyCupid',
};

const US: SiteConfig = {
  baseUrl: 'https://mycupid.net',
  domain: 'mycupid.net',
  currency: 'USD',
  currencySymbol: '$',
  gateway: 'stripe',
  phoneFormat: 'us',
  dateLocale: enUS,
  timeZone: 'America/New_York',
  htmlLang: 'en-US',
  ogLocale: 'en_US',
  siteName: 'MyCupid',
  stripePaymentMethods: ['card', 'link'],
};

// PT compartilha domínio com US (mycupid.net) — geo decide. Currency
// EUR + Multibanco (referência bancária instantânea, padrão em PT).
// MB Way não é exposto direto pelo Stripe Checkout hoje; multibanco
// cobre o mesmo nicho de "não-cartão" e é nativo no Checkout.
const PT: SiteConfig = {
  baseUrl: 'https://mycupid.net',
  domain: 'mycupid.net',
  currency: 'EUR',
  currencySymbol: '€',
  gateway: 'stripe',
  phoneFormat: 'pt',
  dateLocale: ptPT,
  timeZone: 'Europe/Lisbon',
  htmlLang: 'pt-PT',
  ogLocale: 'pt_PT',
  siteName: 'MyCupid',
  stripePaymentMethods: ['card', 'multibanco'],
};

const CONFIGS: Record<Market, SiteConfig> = { BR, PT, US };

/**
 * Resolve config pelo Market — entry point preferido pra código novo.
 */
export function getSiteConfigByMarket(market: Market): SiteConfig {
  return CONFIGS[market];
}

/**
 * Resolve config pelo Locale — backward compat.
 * `pt` cai em BR (mercado primário pt). Pra PT-EUR use getSiteConfigByMarket('PT').
 */
export function getSiteConfig(locale: Locale): SiteConfig {
  return CONFIGS[marketFromLocale(locale)];
}

export function getAllSiteConfigs(): Record<Market, SiteConfig> {
  return CONFIGS;
}
