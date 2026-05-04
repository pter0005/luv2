import './globals.css';
import 'swiper/css';
import { Poppins, Playfair_Display, Dancing_Script, Instrument_Serif } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import InnerLayout from './InnerLayout';
import TikTokPixel from '@/components/analytics/TikTokPixel';
import FacebookPixel from '@/components/analytics/FacebookPixel';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { resolveLocale } from '@/i18n/request';
import { getSiteConfig, getAllSiteConfigs } from '@/lib/site-config';
import type { Locale } from '@/i18n/config';

// Poppins é a fonte principal — preload TRUE pra não dar FOIT no above-the-fold.
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '700', '900'],
  variable: '--font-poppins',
  preload: true,
});

// Fontes secundárias (display fonts pra títulos decorativos) — preload FALSE
// pra não bloquear LCP. Carregam under demand quando o componente renderiza.
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '900'],
  variable: '--font-playfair-display',
  preload: false,
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: '700',
  variable: '--font-dancing-script',
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  preload: false,
});

const headerLogoUrl = 'https://i.imgur.com/InmbjFb.png';
const ogImage = 'https://res.cloudinary.com/dncoxm1it/image/upload/v1771041578/puzzle_ula9hb.png';

// ─────────────────────────────────────────────────────────────
// Metadata PT (existente — preservado 1:1)
// ─────────────────────────────────────────────────────────────
const META_PT = {
  title: 'MyCupid - Presente Digital Criativo Para Namorada e Namorado',
  description: 'Crie uma declaração de amor digital personalizada com fotos, vídeos, música e mensagens. Presente criativo, barato e inesquecível para namorada, namorado, aniversário de namoro, Dia dos Namorados e datas especiais. A partir de R$2!',
  keywords: [
    'presente digital', 'presente criativo namorada', 'presente criativo namorado',
    'presente barato namorada', 'presente barato namorado', 'ideia de presente barato',
    'presente online personalizado', 'declaração de amor', 'página de amor personalizada',
    'presente dia dos namorados', 'presente aniversário namoro', 'presente aniversário de namoro',
    'presente virtual namorada', 'presente surpresa namorado', 'presente romântico barato',
    'presente personalizado online', 'cartão digital namorada', 'site de amor personalizado',
    'homenagem namorada', 'homenagem namorado', 'presente criativo e barato',
    'presente último minuto namorada', 'presente de páscoa namorada', 'presente de páscoa namorado',
    'mycupid', 'presente digital namoro', 'ideia presente namoro',
    'página personalizada amor', 'site presente namorada', 'declaração de amor online',
    'presente fotos e música',
  ].join(', '),
  category: 'presente digital',
  priceCurrency: 'BRL',
  minPrice: '2.00',
};

// ─────────────────────────────────────────────────────────────
// Metadata EN (US launch)
// ─────────────────────────────────────────────────────────────
const META_EN = {
  title: 'MyCupid - Personalized Digital Love Page for Your Special One',
  description: 'Create a custom digital love page with photos, videos, music and a heartfelt message. The most creative, affordable and unforgettable gift for your boyfriend, girlfriend, spouse, anniversary, Valentine\'s Day and every moment that matters. Starts at $19.90.',
  keywords: [
    'digital love page', 'personalized love gift', 'creative gift for girlfriend',
    'creative gift for boyfriend', 'cheap gift for girlfriend', 'cheap gift for boyfriend',
    'online love letter', 'custom love page', 'valentines day gift',
    'anniversary gift online', 'digital anniversary card', 'love surprise for her',
    'love surprise for him', 'romantic gift online', 'personalized love website',
    'digital card girlfriend', 'digital card boyfriend', 'couple memory page',
    'love letter with photos', 'love letter with music', 'creative relationship gift',
    'last minute gift', 'digital valentine', 'mycupid',
    'virtual love gift', 'unique romantic gift', 'love page with countdown',
  ].join(', '),
  category: 'digital gifting',
  priceCurrency: 'USD',
  minPrice: '19.90',
};

function getMetaForLocale(locale: Locale) {
  return locale === 'en' ? META_EN : META_PT;
}

export async function generateMetadata() {
  const locale = await resolveLocale();
  const cfg = getSiteConfig(locale);
  const meta = getMetaForLocale(locale);
  const all = getAllSiteConfigs();

  return {
    metadataBase: new URL(cfg.baseUrl),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: 'MyCupid' }],
    creator: 'MyCupid',
    publisher: 'MyCupid',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large' as const,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: cfg.baseUrl,
      languages: {
        'pt-BR': all.BR.baseUrl,
        'pt-PT': all.PT.baseUrl,
        'en-US': all.US.baseUrl,
        'x-default': all.BR.baseUrl,
      },
    },
    icons: {
      icon: [{ url: headerLogoUrl, sizes: 'any', type: 'image/png' }],
      apple: { url: headerLogoUrl, sizes: '180x180', type: 'image/png' },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: cfg.baseUrl + '/',
      siteName: cfg.siteName,
      locale: cfg.ogLocale,
      images: [
        {
          url: ogImage,
          width: 1800,
          height: 945,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    category: meta.category,
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveLocale();
  const cfg = getSiteConfig(locale);
  const meta = getMetaForLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={cfg.htmlLang} className="dark scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: cfg.siteName,
              url: cfg.baseUrl,
              description: meta.description,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'All',
              offers: {
                '@type': 'Offer',
                price: meta.minPrice,
                priceCurrency: meta.priceCurrency,
                availability: 'https://schema.org/InStock',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '500',
              },
            }),
          }}
        />
      </head>
      <body
        className={cn(
          'font-body antialiased overflow-x-hidden bg-background min-h-screen',
          poppins.variable,
          playfairDisplay.variable,
          dancingScript.variable,
          instrumentSerif.variable
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseClientProvider>
            <InnerLayout>{children}</InnerLayout>
            <Toaster />
          </FirebaseClientProvider>
          <TikTokPixel />
          <FacebookPixel />
          <GoogleAnalytics />
          <MicrosoftClarity />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
