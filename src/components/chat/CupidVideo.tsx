'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface CupidVideoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'w-20 h-20',
  md: 'w-28 h-28 md:w-32 md:h-32',
  lg: 'w-36 h-36 md:w-44 md:h-44',
};

export default function CupidVideo({ className, size = 'md' }: CupidVideoProps) {
  const [failed, setFailed] = useState(false);

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
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        >
          <source src="/chat-assets/0420.mov" type="video/mp4" />
          <source src="/chat-assets/0420(1).mov" type="video/mp4" />
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">
          <span role="img" aria-label="Cupido">🏹</span>
        </div>
      )}
    </div>
  );
}
