'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useLocale } from 'next-intl';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const FB_PIXEL_BR = '791416833992288';
const FB_PIXEL_US = process.env.NEXT_PUBLIC_META_PIXEL_ID_US || '';

function FacebookPixelEvents() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname])
  return null
}

export default function FacebookPixel() {
  const locale = useLocale();
  const pixelId = locale === 'en' ? FB_PIXEL_US : FB_PIXEL_BR;
  if (!pixelId) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' && locale === 'en') {
      console.warn('[FacebookPixel] NEXT_PUBLIC_META_PIXEL_ID_US is not set — US tracking disabled.');
    }
    return null;
  }

  return (
    <>
      <Script id="fb-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <FacebookPixelEvents />
      </Suspense>
    </>
  );
}
