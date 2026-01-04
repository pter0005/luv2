
'use client';

import type { Metadata } from 'next';
import './globals.css';
import 'swiper/css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Poppins, Playfair_Display, Dancing_Script } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { usePathname } from 'next/navigation';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-dancing-script',
  display: 'swap',
});

// Metadata can't be dynamically generated in a client component,
// but we can define the static parts here.
// export const metadata: Metadata = {
//   title: 'b2gether',
//   description: 'Declare seu amor de forma única',
//   icons: {
//     icon: 'https://imgur.com/UoVzjfJ.png',
//   }
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLovePage = pathname.startsWith('/p/');

  return (
    <html lang="pt" className="dark scroll-smooth">
       <head>
        <title>b2gether</title>
        <meta name="description" content="Declare seu amor de forma única" />
        <link rel="icon" href="https://imgur.com/UoVzjfJ.png" />
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
          <div className="relative w-full h-full">
              <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                  <div className="mystic-fog-1"></div>
                  <div className="mystic-fog-2"></div>
              </div>
            <div className="relative z-10 flex flex-col min-h-screen">
              {!isLovePage && <Header />}
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
