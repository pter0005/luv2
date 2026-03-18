import './globals.css';
import 'swiper/css';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import InnerLayout from './InnerLayout';
import TikTokPixel from '@/components/analytics/TikTokPixel';
import FacebookPixel from '@/components/analytics/FacebookPixel';
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
  title: 'MyCupid - Crie Declarações de Amor Únicas',
  description: 'Transforme seus sentimentos em uma obra de arte digital. Crie páginas de amor personalizadas com fotos, vídeos, música e muito mais.',
};

export function generateMetadata() {
  return {
    title: metadata.title,
    description: metadata.description,
    icons: {
      icon: [{ url: headerLogoUrl, sizes: 'any', type: 'image/png' }],
      apple: { url: headerLogoUrl, sizes: '180x180', type: 'image/png' },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      url: 'https://www.mycupid.com.br/',
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
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="dark scroll-smooth">
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
      </body>
    </html>
  );
}
