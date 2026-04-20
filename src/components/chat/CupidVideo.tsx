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
  md: 'w-28 h-28 md:w-32 md:h-32',
  lg: 'w-36 h-36 md:w-44 md:h-44',
};

const SRC_IDLE = '/chat-assets/cupid-idle.mp4';
const SRC_ASKING = '/chat-assets/cupid-asking.mp4';

/**
 * Vídeo tem fundo preto sólido. Sobre o tema escuro do site usamos
 * `mix-blend-mode: screen` — pixel preto vira transparente (screen(0,x)=x),
 * pixels claros do personagem passam quase intactos. Sem re-encode.
 *
 * O halo atrás fica FORA do stacking context afetado pelo blend
 * (via `isolation: isolate` no wrapper interno), então o glow continua sólido.
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

  if (failed) {
    return (
      <div className={cn('relative shrink-0 flex items-center justify-center text-5xl', SIZE_MAP[size], className)}>
        <span role="img" aria-label="Cupido">🏹</span>
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0', SIZE_MAP[size], className)}>
      {/* Halo roxo atrás — renderizado SEM blend */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.55), rgba(236,72,153,0.25) 55%, transparent 72%)' }}
      />
      {/* Container dos vídeos com mix-blend — o halo acima fica fora porque o blend só afeta o backdrop DENTRO deste stacking context */}
      <div className="relative w-full h-full" style={{ mixBlendMode: 'screen' }}>
        <video
          ref={idleRef}
          className={cn(
            'absolute inset-0 w-full h-full object-contain transition-opacity duration-300',
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
            'absolute inset-0 w-full h-full object-contain transition-opacity duration-300',
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
    </div>
  );
}
