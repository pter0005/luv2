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

/** Vídeo do Cupido — cru, sem tratamento. Circular só pra layout. */
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
    <div className={cn('relative shrink-0 rounded-full overflow-hidden', SIZE_MAP[size], className)}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          <span role="img" aria-label="Cupido">🏹</span>
        </div>
      ) : (
        <>
          <video
            ref={idleRef}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
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
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
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
        </>
      )}
    </div>
  );
}
