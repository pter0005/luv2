import { format as formatDateFns } from 'date-fns';
import type { Locale, Market } from '@/i18n/config';
import { getSiteConfig, getSiteConfigByMarket } from '@/lib/site-config';

/**
 * Formata valor em moeda do locale.
 * `pt` → "R$ 24,90", `en` → "$24.90"
 */
export function formatCurrency(value: number, locale: Locale): string {
  const cfg = getSiteConfig(locale);
  return new Intl.NumberFormat(cfg.htmlLang, {
    style: 'currency',
    currency: cfg.currency,
  }).format(value);
}

/**
 * Formata por market (preferido — abrange BRL, USD, EUR).
 * BR → "R$ 24,90", PT → "€8,99", US → "$9.99".
 */
export function formatCurrencyForMarket(value: number, market: Market): string {
  const cfg = getSiteConfigByMarket(market);
  return new Intl.NumberFormat(cfg.htmlLang, {
    style: 'currency',
    currency: cfg.currency,
  }).format(value);
}

/**
 * Formato de data legível. Default = "d 'de' MMMM 'de' yyyy" (PT) ou "MMMM d, yyyy" (EN).
 * Passe fmt customizado se quiser sobrescrever (tokens de date-fns).
 */
export function formatDate(date: Date, locale: Locale, fmt?: string): string {
  const cfg = getSiteConfig(locale);
  const pattern =
    fmt ?? (locale === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy");
  return formatDateFns(date, pattern, { locale: cfg.dateLocale });
}

/**
 * Data curta (pra timeline, listagens). "dd MMM yyyy" em ambos locales.
 */
export function formatDateShort(date: Date, locale: Locale): string {
  const cfg = getSiteConfig(locale);
  return formatDateFns(date, 'dd MMM yyyy', { locale: cfg.dateLocale });
}

/**
 * Formata telefone baseado no locale.
 * BR: `(11) 99999-9999` (10-11 díg). US: `(555) 123-4567` (10 díg).
 * (Para PT, use formatPhoneForMarket).
 */
export function formatPhone(rawDigits: string, locale: Locale): string {
  const d = rawDigits.replace(/\D/g, '');
  if (locale === 'en') {
    const n = d.slice(0, 10);
    if (n.length <= 3) return n;
    if (n.length <= 6) return `(${n.slice(0, 3)}) ${n.slice(3)}`;
    return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }
  // BR
  const n = d.slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

/**
 * Formata telefone por market — abrange PT (9 dígitos: "9XX XXX XXX").
 */
export function formatPhoneForMarket(rawDigits: string, market: Market): string {
  const d = rawDigits.replace(/\D/g, '');
  if (market === 'PT') {
    const n = d.slice(0, 9);
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
    return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  if (market === 'US') return formatPhone(d, 'en');
  return formatPhone(d, 'pt');
}

/**
 * Validação mínima de telefone por locale (só conta dígitos válidos).
 * US: 10 díg exatos. BR: 10 ou 11 díg.
 */
export function isValidPhone(rawDigits: string, locale: Locale): boolean {
  const n = rawDigits.replace(/\D/g, '').length;
  return locale === 'en' ? n === 10 : n === 10 || n === 11;
}

/**
 * Validação por market.
 * BR: 10–11. US: 10. PT: 9 (móvel) ou 9 (fixo) — qualquer 9 dígitos é aceitável.
 */
export function isValidPhoneForMarket(rawDigits: string, market: Market): boolean {
  const n = rawDigits.replace(/\D/g, '').length;
  if (market === 'PT') return n === 9;
  if (market === 'US') return n === 10;
  return n === 10 || n === 11;
}

/**
 * YYYY-MM-DD no timezone canônico do locale.
 * Substitui `toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })`
 * espalhado pelos analytics handlers.
 */
export function getDateKey(locale: Locale, date: Date = new Date()): string {
  const cfg = getSiteConfig(locale);
  return date
    .toLocaleDateString('en-CA', { timeZone: cfg.timeZone })
    .replace(/\//g, '-');
}
