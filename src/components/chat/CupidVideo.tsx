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
  md: 'w-28 h-28 md:w-32 md:h-32',
  lg: 'w-36 h-36 md:w-44 md:h-44',
};

const SRC_MAP: Record<CupidVariant, string> = {
  idle: '/chat-assets/cupid-idle.mp4',
  asking: '/chat-assets/cupid-asking.mp4',
};

export default function CupidVideo({ className, size = 'md', variant = 'idle' }: CupidVideoProps) {
  const [failed, setFailed] = useState(false);
  const src = SRC_MAP[variant];

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-rose-500/20',
        'ring-1 ring-white/50 shadow-[0_8px_32px_rgba(168,85,247,0.25)]',
        SIZE_MAP[size],
        className
      )}
    >
      {!failed ? (
        <video
          key={src}
          className="w-full h-full object-cover"
          src={src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">
          <span role="img" aria-label="Cupido">🏹</span>
        </div>
      )}
    </div>
  );
}
