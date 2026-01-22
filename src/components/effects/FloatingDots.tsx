"use client";
import React, { useState, useEffect } from 'react';

const FloatingDots = () => {
    const [dots, setDots] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const generateDots = () => {
            const newDots = Array.from({ length: 150 }, () => {
                const size = Math.random() * 3.5 + 1.5; // Um pouco maiores em média
                const duration = Math.random() * 15 + 10; // Duração entre 10s e 25s
                const delay = Math.random() * 5; // Atraso máximo de 5s para começar rápido
                const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--primary-foreground))', 'white'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                return {
                    left: `${Math.random() * 100}%`,
                    top: '-5%',
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    boxShadow: `0 0 8px 1px ${color}`, // Brilho mais intenso
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
