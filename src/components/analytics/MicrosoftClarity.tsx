'use client';

import Script from 'next/script';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '';

/**
 * Microsoft Clarity — session replay grátis, sem limite de sessões.
 * Loadeado em produção só (evita poluir os recordings com sessões de dev).
 * Descobre bugs de UX que pixel puro não mostra (ex: "usuário clicou 5× no
 * botão e não acontece nada"). Zero custo, setup em 30s.
 */
export default function MicrosoftClarity() {
  if (!CLARITY_ID) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Clarity] NEXT_PUBLIC_CLARITY_PROJECT_ID not set — session replay disabled.');
    }
    return null;
  }
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <Script id="microsoft-clarity" strategy="lazyOnload">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  );
}
