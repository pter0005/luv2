
'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function TikTokPixel() {
  const [isBrazilDomain, setIsBrazilDomain] = useState<boolean | null>(null);

  useEffect(() => {
    // This effect runs only on the client, where window is available.
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // The pixel should only run on the Brazilian production domain.
      setIsBrazilDomain(hostname === 'www.mycupid.com.br' || hostname === 'mycupid.com.br');
    }
  }, []);

  // Return null if it's not the brazil domain or if the check hasn't run yet
  if (isBrazilDomain !== true) {
    return null;
  }

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
        var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=document.createElement("script")
        ;s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
        
          ttq.load('D67EUBBC77UAT3NT58EG');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  );
}
