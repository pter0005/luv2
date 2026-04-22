import type { MetadataRoute } from 'next';
import { resolveLocale } from '@/i18n/request';
import { getSiteConfig } from '@/lib/site-config';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const locale = await resolveLocale();
  const { baseUrl } = getSiteConfig(locale);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/p/', '/api/', '/admin/', '/criando-pagina/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  };
}
