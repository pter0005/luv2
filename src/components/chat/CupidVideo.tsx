'use client';

import React, { useState } from 'react';
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

/** Vídeo do Cupido — só renderiza o variant ativo (evita decodificar 2 streams). */
export default function CupidVideo({ className, size = 'md', variant = 'idle' }: CupidVideoProps) {
  const [failed, setFailed] = useState(false);
  const src = variant === 'asking' ? SRC_ASKING : SRC_IDLE;

  return (
    <div className={cn('relative shrink-0', SIZE_MAP[size], className)}>
      {/* Glow roxo/rosa pulsante atrás do Cupido — integra ele no ambiente */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-70 animate-cupid-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.45) 0%, rgba(168,85,247,0.35) 40%, rgba(168,85,247,0) 70%)',
        }}
      />
      {/* Breathing wrapper — scale sutil em loop de ~4s */}
      <div className="absolute inset-0 animate-cupid-breathe">
        {failed ? (
          <div
            className="absolute inset-0 flex items-center justify-center text-4xl"
            style={{
              WebkitMaskImage:
                'radial-gradient(circle at 50% 50%, #000 55%, transparent 80%)',
              maskImage:
                'radial-gradient(circle at 50% 50%, #000 55%, transparent 80%)',
            }}
          >
            <span role="img" aria-label="Cupido">🏹</span>
          </div>
        ) : (
          <video
            key={src}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              WebkitMaskImage:
                'radial-gradient(circle at 50% 50%, #000 58%, transparent 82%)',
              maskImage:
                'radial-gradient(circle at 50% 50%, #000 58%, transparent 82%)',
            }}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <style jsx global>{`
        @keyframes cupid-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes cupid-glow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        .animate-cupid-breathe { animation: cupid-breathe 4.5s ease-in-out infinite; }
        .animate-cupid-glow { animation: cupid-glow 4.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
