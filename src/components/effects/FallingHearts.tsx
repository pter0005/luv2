"use client";

import { useState, useEffect } from "react";
import HeartIcon from "@/components/icons/HeartIcon";

interface Heart {
  id: number;
  style: React.CSSProperties;
}

const heartCount = 20;

export default function FallingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const generateHearts = () => {
      const newHearts = Array.from({ length: heartCount }, (_, i) => {
        const size = Math.random() * 4 + 2; // 2rem to 6rem
        const duration = Math.random() * 15 + 15; // 15s to 30s
        const delay = Math.random() * 5; // Start at different delays
        const rotation = Math.random() * 90 - 45; // -45deg to 45deg
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
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
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <div className="relative w-full h-full">
        {hearts.map((heart) => (
          <div key={heart.id} className="heart heart-rise" style={heart.style}>
            <HeartIcon />
          </div>
        ))}
      </div>
    </div>
  );
}
