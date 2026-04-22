import type { MetadataRoute } from 'next';
import { resolveLocale } from '@/i18n/request';
import { getSiteConfig } from '@/lib/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = await resolveLocale();
  const { baseUrl } = getSiteConfig(locale);
  const now = new Date();

  const common = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${baseUrl}/chat`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: `${baseUrl}/presente`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  if (locale === 'en') {
    return [
      ...common,
      { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 },
      { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 },
      { url: `${baseUrl}/refunds`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 },
    ];
  }

  return [
    ...common,
    { url: `${baseUrl}/criar`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/criar/fazer-eu-mesmo`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/como-funciona`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/termos`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/privacidade`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 },
  ];
}
