import { ptBR, enUS, type Locale as DateFnsLocale } from 'date-fns/locale';
import type { Locale } from '@/i18n/config';

export type Currency = 'BRL' | 'USD';
export type Gateway = 'mercadopago' | 'stripe';
export type PhoneFormat = 'br' | 'us';

export interface SiteConfig {
  /** Base URL absoluta do site naquele locale (sem barra no final). */
  baseUrl: string;
  /** Domínio apex (sem protocolo). */
  domain: string;
  /** Moeda canônica do mercado. */
  currency: Currency;
  /** Símbolo monetário (pra UI onde Intl.NumberFormat é overkill). */
  currencySymbol: string;
  /** Gateway primário pra esse mercado. */
  gateway: Gateway;
  /** Formato de telefone (BR = DDD + 10-11 díg, US = 10 díg). */
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
};

export function getSiteConfig(locale: Locale): SiteConfig {
  return locale === 'en' ? US : BR;
}

export function getAllSiteConfigs(): Record<Locale, SiteConfig> {
  return { pt: BR, en: US };
}
