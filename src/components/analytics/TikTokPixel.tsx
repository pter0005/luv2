'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useLocale } from 'next-intl';

// Pixel BR — já em produção
const TT_PIXEL_BR = 'D67EUBBC77UAT3NT58EG';
// Pixel US — dono precisa criar conta TikTok Ads US e colocar no env
const TT_PIXEL_US = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_US || '';

export default function TikTokPixel() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const pixelId = locale === 'en' ? TT_PIXEL_US : TT_PIXEL_BR;
  if (!pixelId) {
    if (process.env.NODE_ENV !== 'production' && locale === 'en') {
      console.warn('[TikTokPixel] NEXT_PUBLIC_TIKTOK_PIXEL_ID_US is not set — US tracking disabled.');
    }
    return null;
  }

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
          var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=document.createElement("script")
          ;s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};

          ttq.load('${pixelId}');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  );
}
