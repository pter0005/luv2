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
 * Cupido circular — limpo. Nada de vinheta ou highlight por cima do personagem.
 * Só: glow externo + anel gradient + círculo com fundo neutro + vídeo.
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
      {/* Glow externo discreto */}
      <div
        aria-hidden
        className="absolute -inset-2 rounded-full blur-xl opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.3), rgba(168,85,247,0.2) 55%, transparent 75%)',
        }}
      />

      {/* Anel fino gradient — borda elegante */}
      <div
        aria-hidden
        className="absolute -inset-[1px] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(168,85,247,0.7), rgba(236,72,153,0.7), rgba(244,114,182,0.7), rgba(168,85,247,0.7))',
          animation: 'cupid-ring-spin 10s linear infinite',
        }}
      />
      <style>{`@keyframes cupid-ring-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Círculo — fundo claro neutro pra personagem aparecer bem */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #f3e8ff 0%, #fce7f3 100%)',
        }}
      >
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            <span role="img" aria-label="Cupido">🏹</span>
          </div>
        ) : (
          // screen blend: preto do vídeo vira transparente, personagem por cima do fundo claro
          <div className="absolute inset-0" style={{ mixBlendMode: 'screen' }}>
            <video
              ref={idleRef}
              className={cn(
                'absolute inset-0 w-full h-full object-cover scale-[1.02] transition-opacity duration-300',
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
                'absolute inset-0 w-full h-full object-cover scale-[1.02] transition-opacity duration-300',
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
      </div>
    </div>
  );
}
