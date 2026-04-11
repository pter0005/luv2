'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DiscountBanner from '@/components/layout/DiscountBanner';
import React from 'react';
import { cn } from '@/lib/utils';
import { PresenceTracker } from '@/components/layout/PresenceTracker';
import CreditPopup from '@/components/layout/CreditPopup';
import ExitIntentPopup from '@/components/layout/ExitIntentPopup';
import ScarcityBanner from '@/components/layout/ScarcityBanner';
import PushNotificationPrompt from '@/components/layout/PushNotificationPrompt';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { useUser } from '@/firebase';

const MemoizedBackground = React.memo(() => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0313]" />
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/30 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light" />
    </div>
));
MemoizedBackground.displayName = 'MemoizedBackground';


export default function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  useVisitorTracking(user?.email);
  const isLovePage = pathname.startsWith('/p/');
  const isAdminPage = pathname.startsWith('/admin');

  const showAppHeader = !isLovePage && !isAdminPage;

  return (
    <div className="relative w-full min-h-screen">
      <PresenceTracker userEmail={user?.email} />
      <MemoizedBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="sticky top-0 z-50">
            {showAppHeader && <ScarcityBanner />}
            {showAppHeader && <DiscountBanner />}
            {showAppHeader && <Header />}
        </div>
        <main className={cn("flex-grow")}>{children}</main>
        <Footer />
      </div>
      <CreditPopup />
      {showAppHeader && <ExitIntentPopup />}
      {showAppHeader && <PushNotificationPrompt />}
    </div>
  );
}
