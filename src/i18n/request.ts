import { getRequestConfig } from 'next-intl/server';
import { headers, cookies } from 'next/headers';
import {
  defaultLocale,
  defaultMarket,
  isLocale,
  isMarket,
  localeFromHost,
  localeFromMarket,
  marketFromRequest,
  type Locale,
  type Market,
} from './config';

/**
 * Resolve o locale da request no server:
 * 1. Cookie `NEXT_LOCALE` (setado pelo middleware a cada request)
 * 2. Header `x-locale` (também injetado pelo middleware)
 * 3. Host do request (fallback se middleware não rodou)
 * 4. defaultLocale (último fallback, nunca crasha)
 */
export async function resolveLocale(): Promise<Locale> {
  try {
    const h = headers();
    const c = cookies();
    const fromCookie = c.get('NEXT_LOCALE')?.value;
    if (isLocale(fromCookie)) return fromCookie;
    const fromHeader = h.get('x-locale');
    if (isLocale(fromHeader)) return fromHeader;
    const host = h.get('host');
    return localeFromHost(host);
  } catch {
    return defaultLocale;
  }
}

/**
 * Resolve market server-side. Mesma cascata que resolveLocale, mas pra
 * a dimensão moeda/gateway. Header > cookie > derivação host+geo > default.
 */
export async function resolveMarket(): Promise<Market> {
  try {
    const h = headers();
    const c = cookies();
    const fromHeader = h.get('x-market');
    if (isMarket(fromHeader)) return fromHeader;
    const fromCookie = c.get('MARKET')?.value;
    if (isMarket(fromCookie)) return fromCookie;
    const override = c.get('MARKET_OVERRIDE')?.value;
    return marketFromRequest({
      host: h.get('host'),
      geoCountry: h.get('x-geo-country'),
      override,
    });
  } catch {
    return defaultMarket;
  }
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`./messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: locale === 'en' ? 'America/New_York' : 'America/Sao_Paulo',
    now: new Date(),
  };
});
