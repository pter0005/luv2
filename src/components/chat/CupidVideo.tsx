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
    <div className={cn('relative shrink-0 rounded-full overflow-hidden bg-black/40', SIZE_MAP[size], className)}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          <span role="img" aria-label="Cupido">🏹</span>
        </div>
      ) : (
        <video
          key={src}
          className="absolute inset-0 w-full h-full object-cover"
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
  );
}
