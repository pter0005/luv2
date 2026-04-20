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

export default function CupidVideo({ className, size = 'md', variant = 'idle' }: CupidVideoProps) {
  const [failed, setFailed] = useState(false);
  const idleRef = useRef<HTMLVideoElement | null>(null);
  const askingRef = useRef<HTMLVideoElement | null>(null);

  // Keep only the active variant playing to save CPU/battery; the other stays paused + hidden.
  useEffect(() => {
    const active = variant === 'idle' ? idleRef.current : askingRef.current;
    const inactive = variant === 'idle' ? askingRef.current : idleRef.current;
    inactive?.pause();
    if (active) { active.currentTime = 0; active.play().catch(() => {}); }
  }, [variant]);

  if (failed) {
    return (
      <div
        className={cn(
          'relative shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-rose-500/20',
          'ring-1 ring-white/50 shadow-[0_8px_32px_rgba(168,85,247,0.25)]',
          SIZE_MAP[size],
          className
        )}
      >
        <div className="w-full h-full flex items-center justify-center text-4xl">
          <span role="img" aria-label="Cupido">🏹</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-rose-500/20',
        'ring-1 ring-white/50 shadow-[0_8px_32px_rgba(168,85,247,0.25)]',
        SIZE_MAP[size],
        className
      )}
    >
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
    </div>
  );
}
