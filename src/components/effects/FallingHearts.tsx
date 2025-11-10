"use client";

import { useState, useEffect } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  style: React.CSSProperties;
}

export default function FallingHearts({ count = 30, color = 'hsl(var(--primary))' }: { count?: number, color?: string }) {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    // Run this effect only on the client
    const generateHearts = () => {
      const newHearts = Array.from({ length: count }, (_, i) => {
        const size = Math.random() * 2.5 + 1.5; // 1.5rem to 4rem
        const duration = Math.random() * 10 + 10; // 10s to 20s
        const delay = Math.random() * count;
        const rotation = Math.random() * 90 - 45;
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            width: `${size}rem`,
            height: `${size}rem`,
            transform: `rotate(${rotation}deg)`,
            color: color
          },
        };
      });
      setHearts(newHearts);
    };

    generateHearts();
  }, [count, color]);

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0" 
    >
      <div className="relative w-full h-full">
        {hearts.map((heart) => (
          <div key={heart.id} className="heart heart-fall" style={heart.style}>
            <HeartIcon />
          </div>
        ))}
      </div>
    </div>
  );
}
