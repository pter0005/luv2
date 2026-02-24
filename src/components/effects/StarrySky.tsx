"use client";
import React, { useState, useEffect } from 'react';

const StarrySky = () => {
    const [stars, setStars] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const generateStars = () => {
            const newStars = Array.from({ length: 200 }, () => {
                const size = Math.random() * 2 + 0.5;
                const duration = Math.random() * 3 + 2; // 2-5s twinkle
                const delay = Math.random() * 5;

                return {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
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
                <div key={`star-${index}`} className="star" style={style}></div>
            ))}
        </div>
    );
};

export default StarrySky;
