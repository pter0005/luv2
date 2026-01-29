'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DiscountBanner from '@/components/layout/DiscountBanner';
import React from 'react';
import { cn } from '@/lib/utils';
import CookieConsent from '@/components/layout/CookieConsent';

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLovePage = pathname.startsWith('/p/');

  return (
    <div className="relative w-full min-h-screen">
      {/* BACKGROUND GRADIENTE PROFISSIONAL E PERFORMANTE */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0313]" />
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/30 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light" />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isLovePage && <DiscountBanner />}
        {!isLovePage && <Header />}
        <main className={cn("flex-grow", !isLovePage && "pt-20")}>{children}</main>
        <Footer />
      </div>
      <CookieConsent />
    </div>
  );
}
