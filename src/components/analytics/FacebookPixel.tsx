'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect } from 'react'

// This is needed to make TypeScript happy about the window.fbq property.
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

// This component is needed to call `fbq('track', 'PageView')` on client-side navigation.
function FacebookPixelEvents() {
  const pathname = usePathname()
  useEffect(() => {
    // The first 'PageView' is fired by the script itself.
    // This hook is needed to track subsequent page views on client-side navigation.
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname])
  return null
}

export default function FacebookPixel() {
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
          fbq('init', '791416833992288');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=791416833992288&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <FacebookPixelEvents />
      </Suspense>
    </>
  );
}
