'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FlowerPoemIntroProps {
  onReveal: () => void;
  gender?: 'fem' | 'mas';
  fontFamily?: 'cormorant' | 'playfair' | 'dancing';
}

export default function FlowerPoemIntro({ onReveal, gender = 'fem', fontFamily = 'cormorant' }: FlowerPoemIntroProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const calledRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'poema:ready') setLoaded(true);
      if (data.type === 'poema:done' && !calledRef.current) {
        calledRef.current = true;
        onReveal();
      }
      if (data.type === 'poema:error' && !calledRef.current) {
        calledRef.current = true;
        onReveal();
      }
    };
    window.addEventListener('message', handler);
    const failsafe = window.setTimeout(() => {
      if (!calledRef.current) { calledRef.current = true; onReveal(); }
    }, 45000);
    return () => { window.removeEventListener('message', handler); window.clearTimeout(failsafe); };
  }, [onReveal]);

  const src = `/poema-assets/index.html?embed=1&gender=${gender}&font=${fontFamily}`;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0510]">
      <iframe
        ref={iframeRef}
        src={src}
        title="Poema das Flores"
        allow="autoplay"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.45s ease',
          background: '#0a0510',
        }}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white/55 text-[15px] italic font-serif flex items-center gap-2">
            preparando sua surpresa
            <span className="inline-block w-3 h-3 rounded-full border-2 border-white/20 border-t-pink-400 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
