"use client";

import React, { useState, useEffect, useMemo } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  style: React.CSSProperties;
  glow: string;
}

export default function FallingHearts({ count = 28, color = 'hsl(var(--primary))' }: { count?: number, color?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hearts = useMemo<Heart[]>(() => {
    if (!isClient) return [];

    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 1.6 + 1.6;
      const duration = Math.random() * 8 + 14;
      const delay = -Math.random() * duration;
      const rotation = Math.random() * 60 - 30;
      const opacity = Math.random() * 0.4 + 0.55;

      return {
        id: i,
        glow: `drop-shadow(0 0 8px ${color}cc) drop-shadow(0 0 18px ${color}99) drop-shadow(0 0 30px ${color}55)`,
        style: {
          left: `${Math.random() * 100}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}rem`,
          height: `${size}rem`,
          ['--heart-rot' as any]: `${rotation}deg`,
          ['--heart-opacity' as any]: opacity,
        },
      };
    });
  }, [count, isClient, color]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <div className="relative w-full h-full">
        {hearts.map((heart) => (
          <div key={heart.id} className="heart-rain" style={heart.style}>
            <HeartIcon style={{ color, filter: heart.glow, width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
