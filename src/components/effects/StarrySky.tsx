"use client";
import React, { useState, useEffect } from 'react';

const StarrySky = () => {
    const [stars, setStars] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const generateStars = () => {
            const newStars = Array.from({ length: 150 }, () => {
                const size = Math.random() * 1.5 + 0.5;
                const duration = Math.random() * 2 + 1.5;
                const delay = Math.random() * 3;
                const colors = ['#FFFFFF', '#FFFFFF', '#ADD8E6', '#F0E68C'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                return {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    boxShadow: `0 0 2px 0.5px ${color}`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                } as React.CSSProperties;
            });
            setStars(newStars);
        };

        generateStars();
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden bg-black">
            {stars.map((style, index) => (
                <div key={index} className="star" style={style}></div>
            ))}
        </div>
    );
};

export default StarrySky;
