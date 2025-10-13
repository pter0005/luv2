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
import FallingHearts from '@/components/effects/FallingHearts';

export const metadata: Metadata = {
  title: 'Amore Pages',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Playfair+Display:wght@700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'font-body antialiased overflow-x-hidden bg-background min-h-screen'
        )}
      >
        <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="mystic-fog-1"></div>
                <div className="mystic-fog-2"></div>
            </div>
            <FallingHearts />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
