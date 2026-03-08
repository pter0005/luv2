
"use client";

import React, { useState, useEffect, useMemo } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  initialStyle: React.CSSProperties;
}

export default function FallingHearts({ count = 50, color = 'hsl(var(--primary))' }: { count?: number, color?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hearts = useMemo<Heart[]>(() => {
    if (!isClient) return [];
    
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 2.5 + 2; // 2rem to 4.5rem
      const duration = Math.random() * 8 + 8; // 8s to 16s
      const delay = Math.random() * count * 0.4;
      const rotation = Math.random() * 90 - 45;
      return {
        id: i,
        initialStyle: {
          left: `${Math.random() * 100}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}rem`,
          height: `${size}rem`,
          transform: `rotate(${rotation}deg)`,
        },
      };
    });
  }, [count, isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0" 
    >
      <div className="relative w-full h-full">
        {hearts.map((heart) => (
          <div key={heart.id} className="heart heart-fall" style={heart.initialStyle}>
            <HeartIcon style={{ color: color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

    