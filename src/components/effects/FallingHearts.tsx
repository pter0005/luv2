"use client";

import { useState, useEffect } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  style: React.CSSProperties;
}

const heartCount = 25;

export default function FallingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const generateHearts = () => {
      const newHearts = Array.from({ length: heartCount }, (_, i) => {
        const size = Math.random() * 2 + 0.5; // 0.5rem to 2.5rem
        const duration = Math.random() * 15 + 15; // 15s to 30s
        const delay = Math.random() * -30; // Start at different negative delays
        const rotation = Math.random() * 90 - 45; // -45deg to 45deg
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            animationName: 'fall',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            width: `${size}rem`,
            height: `${size}rem`,
            transform: `rotate(${rotation}deg)`,
          },
        };
      });
      setHearts(newHearts);
    };

    generateHearts();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
      <div className="relative w-full h-full">
        {hearts.map((heart) => (
          <div key={heart.id} className="absolute -top-[10%]" style={heart.style}>
            <HeartIcon />
          </div>
        ))}
      </div>
    </div>
  );
}
