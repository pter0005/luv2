
import './globals.css';
import 'swiper/css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import InnerLayout from './InnerLayout';

const title = 'MyCupid - Crie Declarações de Amor Únicas';
const description = 'Transforme seus sentimentos em uma obra de arte digital. Crie páginas de amor personalizadas com fotos, vídeos, música e muito mais.';
const ogImage = 'https://i.imgur.com/95LkhhY.png';
const headerLogoUrl = PlaceHolderImages.find((p) => p.id === 'headerLogo')?.imageUrl || '';

export const metadata = {
  title: title,
  description: description,
  icons: {
    icon: headerLogoUrl,
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
          'font-sans' // Fallback font family
        )}
      >
        <FirebaseClientProvider>
          <InnerLayout>{children}</InnerLayout>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
