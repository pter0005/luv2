import './globals.css';
import 'swiper/css';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import InnerLayout from './InnerLayout';
import { LanguageProvider } from '@/lib/i18n';
import TikTokPixel from '@/components/analytics/TikTokPixel';
import FacebookPixel from '@/components/analytics/FacebookPixel';
import { headers } from 'next/headers';

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


const ptMetadata = {
  title: 'MyCupid - Crie Declarações de Amor Únicas',
  description: 'Transforme seus sentimentos em uma obra de arte digital. Crie páginas de amor personalizadas com fotos, vídeos, música e muito mais.',
};

const enMetadata = {
  title: 'MyCupid - Create Unique Love Declarations',
  description: 'Turn your feelings into a digital work of art. Create personalized love pages with photos, videos, music, and more.',
};

const esMetadata = {
  title: 'MyCupid - Crea Declaraciones de Amor Únicas',
  description: 'Transforma tus sentimientos en una obra de arte digital. Crea páginas de amor personalizadas con fotos, vídeos, música y más.',
};


export async function generateMetadata() {
  const host = headers().get('host') || '';
  const acceptLanguage = headers().get('accept-language');
  
  let metadata;
  let url;

  if (host.includes('mycupid.com.br')) {
    metadata = ptMetadata;
    url = 'https://www.mycupid.com.br/';
  } else if (host.includes('mycupid.net')) {
    if (acceptLanguage?.startsWith('es')) {
        metadata = esMetadata;
        url = 'https://www.mycupid.net/'; 
    } else {
        metadata = enMetadata;
        url = 'https://www.mycupid.net/';
    }
  } else {
    // Default to PT for all dev/preview environments
    metadata = ptMetadata;
    url = 'https://www.mycupid.com.br/';
  }

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
      url: url,
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
  const host = headers().get('host') || '';
  const acceptLanguage = headers().get('accept-language');

  let lang = 'en'; // Default to English
  // If the domain is NOT mycupid.net, default to Portuguese (covers .com.br and all dev environments)
  if (!host.includes('mycupid.net')) {
    lang = 'pt';
  } else if (acceptLanguage?.startsWith('es')) {
    // Only for .net, check if we should serve Spanish
    lang = 'es';
  }


  return (
    <html lang={lang} className="dark scroll-smooth">
      <body
        className={cn(
          'font-body antialiased overflow-x-hidden bg-background min-h-screen',
          poppins.variable,
          playfairDisplay.variable,
          dancingScript.variable
        )}
      >
        <LanguageProvider initialLocale={lang as any}>
          <FirebaseClientProvider>
            <InnerLayout>{children}</InnerLayout>
            <Toaster />
          </FirebaseClientProvider>
        </LanguageProvider>
        <TikTokPixel />
        <FacebookPixel />
      </body>
    </html>
  );
}
