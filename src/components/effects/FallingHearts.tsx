"use client";

import { useState, useEffect } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  style: React.CSSProperties;
}

export default function FallingHearts({ count = 20, color = 'hsl(var(--primary))' }: { count?: number, color?: string }) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  useEffect(() => {
    // Run this effect only on the client
    setPageHeight(document.documentElement.scrollHeight);
    
    const generateHearts = () => {
      const newHearts = Array.from({ length: count }, (_, i) => {
        const size = Math.random() * 2 + 1; // 1rem to 3rem
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
    const handleResize = () => setPageHeight(document.documentElement.scrollHeight);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [count, color]);

  return (
    <div 
      className="absolute top-0 left-0 w-full pointer-events-none overflow-hidden z-0" 
      style={{ height: pageHeight ? `${pageHeight}px` : '100vh' }}
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
