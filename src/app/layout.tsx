import type { Metadata } from 'next';
import './globals.css';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-flip';
import 'swiper/css/effect-cube';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-dancing-script',
});


export const metadata: Metadata = {
  title: 'b2gether',
  description: 'Declare seu amor de forma única',
  icons: {
    icon: 'https://i.imgur.com/EMwsRdt.png',
  }
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
        <FirebaseClientProvider>
          <div className="relative w-full h-full">
              <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                  <div className="mystic-fog-1"></div>
                  <div className="mystic-fog-2"></div>
              </div>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
