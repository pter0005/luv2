
import './globals.css';
import 'swiper/css';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import InnerLayout from './InnerLayout';
import { LanguageProvider } from '@/lib/i18n';

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

const title = 'MyCupid - Crie Declarações de Amor Únicas';
const description = 'Transforme seus sentimentos em uma obra de arte digital. Crie páginas de amor personalizadas com fotos, vídeos, música e muito mais.';
const ogImage = 'https://i.imgur.com/95LkhhY.png';
const headerLogoUrl = 'https://i.imgur.com/InmbjFb.png';

export const metadata = {
  title: title,
  description: description,
  icons: {
    icon: [{ url: headerLogoUrl, sizes: 'any', type: 'image/png' }],
    apple: { url: headerLogoUrl, sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: title,
    description: description,
    type: 'website',
    url: 'https://www.mycupid.com.br/',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'MyCupid - Crie Declarações de Amor Únicas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: title,
    description: description,
    images: [ogImage],
  },
};

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
        <LanguageProvider>
          <FirebaseClientProvider>
            <InnerLayout>{children}</InnerLayout>
            <Toaster />
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
