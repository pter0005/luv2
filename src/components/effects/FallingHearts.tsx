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
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    setPageHeight(document.documentElement.scrollHeight);
    
    const generateHearts = () => {
      const newHearts = Array.from({ length: heartCount }, (_, i) => {
        const size = Math.random() * 2 + 1; // 1rem to 3rem
        const duration = Math.random() * 20 + 30; // Slower: 30s to 50s
        const delay = Math.random() * 5; // Reduced Delay: 0s to 5s
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
    <div className="absolute top-0 left-0 w-full pointer-events-none overflow-hidden z-0" style={{ height: `${pageHeight}px` }}>
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
