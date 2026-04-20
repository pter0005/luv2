'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type CupidVariant = 'idle' | 'asking';

interface CupidVideoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: CupidVariant;
}

const SIZE_MAP = {
  sm: 'w-20 h-20',
  md: 'w-24 h-24 md:w-28 md:h-28',
  lg: 'w-32 h-32 md:w-40 md:h-40',
};

const SRC_IDLE = '/chat-assets/cupid-idle.mp4';
const SRC_ASKING = '/chat-assets/cupid-asking.mp4';

/**
 * Avatar circular do Cupido — inspirado no Lovepanda/Duolingo:
 *   • Recorte circular REAL (overflow-hidden + rounded-full) — não depende de blend.
 *   • Fundo interno com gradiente roxo→rosa pra integrar com o tema.
 *   • Sobre esse fundo, mix-blend-mode: screen no vídeo: pixels pretos somem, o
 *     personagem aparece sobre o gradiente colorido (character + bg harmonizam).
 *   • Anel externo com gradiente animado + glow roxo-rosa.
 */
export default function CupidVideo({ className, size = 'md', variant = 'idle' }: CupidVideoProps) {
  const [failed, setFailed] = useState(false);
  const idleRef = useRef<HTMLVideoElement | null>(null);
  const askingRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const active = variant === 'idle' ? idleRef.current : askingRef.current;
    const inactive = variant === 'idle' ? askingRef.current : idleRef.current;
    inactive?.pause();
    if (active) { active.currentTime = 0; active.play().catch(() => {}); }
  }, [variant]);

  return (
    <div className={cn('relative shrink-0', SIZE_MAP[size], className)}>
      {/* Glow externo pulsante */}
      <div
        aria-hidden
        className="absolute -inset-3 rounded-full blur-2xl opacity-60 animate-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.5), rgba(168,85,247,0.35) 50%, transparent 72%)',
          animationDuration: '3.2s',
        }}
      />

      {/* Anel gradient rotativo */}
      <div
        aria-hidden
        className="absolute -inset-[2px] rounded-full opacity-90"
        style={{
          background:
            'conic-gradient(from 0deg, #a855f7, #ec4899, #f472b6, #a855f7, #ec4899)',
          animation: 'cupid-ring-spin 6s linear infinite',
          filter: 'blur(0.5px)',
        }}
      />
      <style>{`@keyframes cupid-ring-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Círculo principal — recorte REAL */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(168,85,247,0.35), rgba(88,28,135,0.55) 60%, rgba(30,10,50,0.85) 100%)',
          boxShadow:
            'inset 0 0 0 2px rgba(255,255,255,0.08), inset 0 -8px 24px rgba(0,0,0,0.4), 0 10px 30px -10px rgba(168,85,247,0.6)',
        }}
      >
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            <span role="img" aria-label="Cupido">🏹</span>
          </div>
        ) : (
          <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
            <video
              ref={idleRef}
              className={cn(
                'absolute inset-0 w-full h-full object-cover scale-[1.08] transition-opacity duration-300',
                variant === 'idle' ? 'opacity-100' : 'opacity-0'
              )}
              src={SRC_IDLE}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setFailed(true)}
            />
            <video
              ref={askingRef}
              className={cn(
                'absolute inset-0 w-full h-full object-cover scale-[1.08] transition-opacity duration-300',
                variant === 'asking' ? 'opacity-100' : 'opacity-0'
              )}
              src={SRC_ASKING}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setFailed(true)}
            />
          </div>
        )}

        {/* Vinheta leve pra suavizar bordas e esconder qualquer sobra de fundo */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, transparent 55%, rgba(30,10,50,0.55) 85%, rgba(30,10,50,0.9) 100%)',
          }}
        />

        {/* Highlight superior pra dar volume */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/2 rounded-t-full pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22), transparent 60%)',
          }}
        />
      </div>
    </div>
  );
}
