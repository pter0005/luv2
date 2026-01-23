'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DiscountBanner from '@/components/layout/DiscountBanner';
import React from 'react';
import { cn } from '@/lib/utils';

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLovePage = pathname.startsWith('/p/');

  return (
    <div className="relative w-full min-h-screen">
      {/* STATIC BACKGROUND FOR THE ENTIRE PAGE */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#05000a]"></div>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[800px] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-0 w-[600px] h-[600px] bg-pink-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isLovePage && <DiscountBanner />}
        {!isLovePage && <Header />}
        <main className={cn("flex-grow", !isLovePage && "pt-20")}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}