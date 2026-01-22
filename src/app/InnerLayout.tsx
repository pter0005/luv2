
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DiscountBanner from '@/components/layout/DiscountBanner';
import React from 'react';

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLovePage = pathname.startsWith('/p/');

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="mystic-fog-1"></div>
        <div className="mystic-fog-2"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isLovePage && <DiscountBanner />}
        {!isLovePage && <Header />}
        <main className="flex-grow pt-20">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
