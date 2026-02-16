
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- SUB-COMPONENTES OTIMIZADOS ---

// Partícula de brilho que sobe
const Firefly = React.memo(({ style }: { style: React.CSSProperties }) => (
    <div className="firefly" style={style}></div>
));
Firefly.displayName = 'Firefly';

// Lâmina de grama individual (SVG)
const GrassBlade = React.memo(({ d, delay }: { d: string, delay: number }) => (
    <motion.path
        className="grass-blade"
        d={d}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay }}
    />
));
GrassBlade.displayName = 'GrassBlade';

// Componente completo de uma Flor
const Flower = React.memo(({ scale, delay, xPos }: { scale: number, xPos: string, delay: number }) => {
    const curveX = useMemo(() => (Math.random() - 0.5) * 40, []);
    const flowerHeight = useMemo(() => (40 + Math.random() * 20), []);

    return (
        <motion.div
            className="flower-wrapper"
            style={{ left: xPos, height: `${flowerHeight}vh`, zIndex: Math.floor(scale * 10) }}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay }}
        >
            <motion.div
                className="sway-anim"
                style={{ transform: `scale(${scale})` }}
                animate={{ rotate: [-3, 3] }}
                transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', delay: delay + 2 }}
            >
                <svg viewBox="0 0 100 400" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <motion.path
                        d={`M 50 400 Q ${50 + curveX} 200 50 50`}
                        fill="none"
                        stroke="url(#stemGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeOut", delay: delay + 0.5 }}
                    />
                    
                    <motion.path
                        d="M 0 0 Q -20 -10 -30 -30 Q -10 -20 0 0"
                        fill="url(#leafGradient)"
                        style={{ transform: `translate(50px, 250px) rotate(-45deg)` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: delay + 1.5 }}
                    />

                    <motion.path
                        d="M 0 0 Q 20 -10 30 -30 Q 10 -20 0 0"
                        fill="url(#leafGradient)"
                        style={{ transform: `translate(50px, 300px) rotate(45deg)` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: delay + 1.8 }}
                    />

                    <motion.g
                        style={{ transform: 'translate(50px, 50px)', transformOrigin: 'center center' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 150, damping: 12, delay: delay + 2 }}
                    >
                        <path d="M 0 0 C -30 -10, -50 -40, -30 -60 C -10 -40, 0 0, 0 0" fill="url(#petalGradient)" filter="url(#glow)" />
                        <path d="M 0 0 C 30 -10, 50 -40, 30 -60 C 10 -40, 0 0, 0 0" fill="url(#petalGradient)" filter="url(#glow)" />
                        <path d="M 0 0 C -20 30, 20 30, 0 0" fill="url(#petalGradient)" filter="url(#glow)" style={{transform: "translateY(-40px) rotate(180deg) scale(1.2)"}} />
                        <circle cx="0" cy="-15" r="5" fill="url(#centerGradient)" filter="url(#centerGlow)" />
                    </motion.g>
                </svg>
            </motion.div>
        </motion.div>
    );
});
Flower.displayName = 'Flower';

// --- COMPONENTE PRINCIPAL ---

export default function MysticFlowers() {

    // Gerar dados aleatórios para os elementos, memoizado para performance
    const fireflies = useMemo(() => Array.from({ length: 25 }, (_, i) => {
        const size = Math.random() * 4 + 2;
        return {
            key: `fly-${i}`,
            style: {
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 8}s`,
                animationDelay: `${Math.random() * 8}s`,
            } as React.CSSProperties
        };
    }), []);

    const grassBlades = useMemo(() => Array.from({ length: 60 }, (_, i) => {
        const x = Math.random() * 1000;
        const h = 30 + Math.random() * 70;
        const w = 5 + Math.random() * 10;
        const curve = (Math.random() - 0.5) * 20;
        return {
            key: `grass-${i}`,
            d: `M ${x} 100 Q ${x + curve} ${100 - h / 2} ${x + curve * 2} ${100 - h} Q ${x + curve} ${100 - h / 2} ${x + w} 100 Z`,
            delay: Math.random() * 1
        };
    }), []);

    const flowers = useMemo(() => [
        { key: 'flower-1', xPos: '50%', scale: 1.2, delay: 0 },
        { key: 'flower-2', xPos: '25%', scale: 0.9, delay: 0.5 },
        { key: 'flower-3', xPos: '75%', scale: 0.95, delay: 0.8 },
        { key: 'flower-4', xPos: '10%', scale: 0.7, delay: 1.2 },
        { key: 'flower-5', xPos: '90%', scale: 0.75, delay: 1.5 },
    ], []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0d021f] to-[#240b36]">
            
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="stemGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#2a001a" />
                        <stop offset="100%" stopColor="#ff0055" />
                    </linearGradient>
                    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#880044" />
                        <stop offset="100%" stopColor="#ff0066" />
                    </linearGradient>
                    <radialGradient id="petalGradient">
                        <stop offset="0%" stopColor="#ff3388" />
                        <stop offset="100%" stopColor="#660033" />
                    </radialGradient>
                    <radialGradient id="centerGradient">
                        <stop offset="0%" stopColor="#ffeea7" />
                        <stop offset="100%" stopColor="#ffc107" />
                    </radialGradient>
                    <filter id="glow">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(255, 0, 85, 0.5)" />
                    </filter>
                    <filter id="centerGlow">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ffeba7" />
                    </filter>
                </defs>
            </svg>

            <div className="relative w-full h-full">
                {fireflies.map(fly => <Firefly key={fly.key} style={fly.style} />)}

                <div className="grass-layer">
                    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100">
                        {grassBlades.map(blade => <GrassBlade key={blade.key} d={blade.d} delay={blade.delay} />)}
                    </svg>
                </div>

                {flowers.map(flower => <Flower key={flower.key} {...flower} />)}
            </div>
        </div>
    );
};
