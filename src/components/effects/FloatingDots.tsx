"use client";
import React, { useState, useEffect } from 'react';

const FloatingDots = () => {
    const [dots, setDots] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const generateDots = () => {
            const newDots = Array.from({ length: 50 }, () => {
                const size = Math.random() * 3 + 1;
                const duration = Math.random() * 20 + 15;
                const delay = Math.random() * 15;
                const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', 'white'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                return {
                    left: `${Math.random() * 100}%`,
                    top: '-5%', // Start above the viewport
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    boxShadow: `0 0 6px ${color}`,
                    borderRadius: '50%',
                    position: 'absolute',
                } as React.CSSProperties;
            });
            setDots(newDots);
        };

        generateDots();
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            {dots.map((style, index) => (
                <div key={index} className="dot-fall" style={style}></div>
            ))}
        </div>
    );
};

export default FloatingDots;
