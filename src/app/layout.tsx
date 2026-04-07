import './globals.css';
import 'swiper/css';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import InnerLayout from './InnerLayout';
import TikTokPixel from '@/components/analytics/TikTokPixel';
import FacebookPixel from '@/components/analytics/FacebookPixel';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { Suspense } from 'react';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '700', '900'],
  variable: '--font-poppins',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '900'],
  variable: '--font-playfair-display',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: '700',
  variable: '--font-dancing-script',
});

const headerLogoUrl = 'https://i.imgur.com/InmbjFb.png';
const ogImage = 'https://res.cloudinary.com/dncoxm1it/image/upload/v1771041578/puzzle_ula9hb.png';

const metadata = {
  title: 'MyCupid - Presente Digital Criativo Para Namorada e Namorado',
  description: 'Crie uma declaração de amor digital personalizada com fotos, vídeos, música e mensagens. Presente criativo, barato e inesquecível para namorada, namorado, aniversário de namoro, Dia dos Namorados e datas especiais. A partir de R$2!',
};

const seoKeywords = [
  'presente digital',
  'presente criativo namorada',
  'presente criativo namorado',
  'presente barato namorada',
  'presente barato namorado',
  'ideia de presente barato',
  'presente online personalizado',
  'declaração de amor',
  'página de amor personalizada',
  'presente dia dos namorados',
  'presente aniversário namoro',
  'presente aniversário de namoro',
  'presente virtual namorada',
  'presente surpresa namorado',
  'presente romântico barato',
  'presente personalizado online',
  'cartão digital namorada',
  'site de amor personalizado',
  'homenagem namorada',
  'homenagem namorado',
  'presente criativo e barato',
  'presente último minuto namorada',
  'presente de páscoa namorada',
  'presente de páscoa namorado',
  'mycupid',
  'presente digital namoro',
  'ideia presente namoro',
  'página personalizada amor',
  'site presente namorada',
  'declaração de amor online',
  'presente fotos e música',
].join(', ');

export function generateMetadata() {
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: seoKeywords,
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
      canonical: 'https://www.mycupid.com.br',
    },
    icons: {
      icon: [{ url: headerLogoUrl, sizes: 'any', type: 'image/png' }],
      apple: { url: headerLogoUrl, sizes: '180x180', type: 'image/png' },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      url: 'https://www.mycupid.com.br/',
      siteName: 'MyCupid',
      locale: 'pt_BR',
      images: [
        {
          url: ogImage,
          width: 1800,
          height: 945,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [ogImage],
    },
    category: 'presente digital',
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
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
              name: 'MyCupid',
              url: 'https://www.mycupid.com.br',
              description: metadata.description,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'All',
              offers: {
                '@type': 'Offer',
                price: '2.00',
                priceCurrency: 'BRL',
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
          dancingScript.variable
        )}
      >
        <FirebaseClientProvider>
          <InnerLayout>{children}</InnerLayout>
          <Toaster />
        </FirebaseClientProvider>
        <TikTokPixel />
        <FacebookPixel />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
