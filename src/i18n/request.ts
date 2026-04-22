import { getRequestConfig } from 'next-intl/server';
import { headers, cookies } from 'next/headers';
import { defaultLocale, isLocale, localeFromHost, type Locale } from './config';

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
