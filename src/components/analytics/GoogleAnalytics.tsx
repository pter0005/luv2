'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect } from 'react'

// TODO: Replace G-XXXXXXXXXX with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-LN5WR36L18';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

function GoogleAnalyticsEvents() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname })
    }
  }, [pathname])
  return null
}

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsEvents />
      </Suspense>
    </>
  );
}
