import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'font-body antialiased overflow-x-hidden bg-background min-h-screen'
        )}
      >
        <div className="relative w-full h-full">
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
