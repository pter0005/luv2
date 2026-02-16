'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- CONFIGURAÇÃO VISUAL ---
const COLORS = {
    bgTop: '#0f021f',      // Roxo quase preto
    bgBottom: '#2d0a31',   // Roxo ameixa
    stem: '#4a042e',       // Caule escuro
    leafDark: '#5e0b35',   // Folha escura
    leafLight: '#940f5a',  // Folha clara
    petalDark: '#700046',  // Pétala fundo
    petalLight: '#ff0066', // Pétala frente (Neon)
    glow: '#ffccff',       // Brilho central
};

// --- COMPONENTE: PARTICULA CAINDO (Otimizado) ---
const Sparkle = React.memo(({ index }: { index: number }) => {
    const randomLeft = useMemo(() => Math.random() * 100, []);
    const randomDuration = useMemo(() => 3 + Math.random() * 4, []);
    const randomDelay = useMemo(() => Math.random() * 5, []);
    const size = useMemo(() => Math.random() * 3 + 1, []);

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: -10,
                left: `${randomLeft}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: Math.random() > 0.5 ? '#fff' : '#d8b4fe', // Branco ou Lilás
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
                zIndex: 5,
            }}
            animate={{
                y: ['-10vh', '110vh'],
                opacity: [0, 1, 0],
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: 'linear',
            }}
        />
    );
});
Sparkle.displayName = 'Sparkle';

// --- COMPONENTE: FLOR CENTRAL (SVG Complexo) ---
const Flower = ({ 
    x, height, scale, delay, rotationOffset 
}: { x: string, height: number, scale: number, delay: number, rotationOffset: number }) => {
    
    return (
        <motion.div
            className="absolute bottom-0"
            style={{ 
                left: x, 
                height: `${height}%`, 
                width: '120px', 
                marginLeft: '-60px', // Centralizar
                zIndex: 10,
                transformOrigin: 'bottom center',
                willChange: 'transform' // Dica para o navegador usar GPU
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
        >
            {/* Animação de balanço suave */}
            <motion.div
                className="w-full h-full"
                animate={{ rotate: [rotationOffset - 2, rotationOffset + 2] }}
                transition={{ 
                    duration: 4 + Math.random(), 
                    repeat: Infinity, 
                    repeatType: "mirror", 
                    ease: "easeInOut",
                    delay: delay 
                }}
            >
                <svg viewBox="0 0 100 400" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="petalGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor={COLORS.petalDark} />
                            <stop offset="100%" stopColor={COLORS.petalLight} />
                        </linearGradient>
                        <radialGradient id="centerGlow">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="50%" stopColor="#ffeb3b" />
                            <stop offset="100%" stopColor="#ff0066" stopOpacity="0" />
                        </radialGradient>
                        <filter id="blurGlow">
                            <feGaussianBlur stdDeviation="2" />
                        </filter>
                    </defs>

                    {/* Caule Suavemente Curvado */}
                    <path 
                        d="M 50 400 Q 50 250 50 100" 
                        fill="none" 
                        stroke={COLORS.stem} 
                        strokeWidth="4" 
                        strokeLinecap="round"
                    />

                    {/* Folhas Largas (Estilo da imagem) */}
                    <motion.path 
                        d="M 50 300 Q 10 280 0 240 Q 30 260 50 280" 
                        fill={COLORS.leafDark}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.5 }}
                    />
                    <motion.path 
                        d="M 50 220 Q 90 200 100 160 Q 70 180 50 200" 
                        fill={COLORS.leafLight}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.7 }}
                    />

                    {/* A Cabeça da Flor (Tulipa/Copo) */}
                    <motion.g 
                        initial={{ scale: 0 }} 
                        animate={{ scale: scale }} 
                        transition={{ delay: delay + 1, type: "spring", stiffness: 50 }}
                        style={{ transformOrigin: "50px 100px" }}
                    >
                        {/* Pétala de Trás (Mais escura) */}
                        <path d="M 20 80 Q 50 140 80 80 L 50 110 Z" fill="#4a002e" />

                        {/* Corpo Principal da Flor */}
                        <path 
                            d="M 15 80 C 5 40, 30 20, 50 30 C 70 20, 95 40, 85 80 Q 50 120 15 80" 
                            fill="url(#petalGrad)" 
                            stroke="#ff3388" 
                            strokeWidth="1"
                        />

                        {/* O Centro Brilhante (Boca da flor) */}
                        <ellipse cx="50" cy="65" rx="18" ry="8" fill="#590033" /> {/* Fundo da boca */}
                        <ellipse cx="50" cy="68" rx="14" ry="5" fill="url(#centerGlow)" filter="url(#blurGlow)" opacity="0.9" />
                    </motion.g>
                </svg>
            </motion.div>
        </motion.div>
    );
};

// --- COMPONENTE: GRAMA DECORATIVA (Fundo) ---
const GrassLayer = React.memo(() => {
    // Gerar caminhos aleatórios apenas uma vez
    const blades = useMemo(() => Array.from({ length: 60 }, (_, i) => {
        const x = Math.random() * 100;
        const h = 20 + Math.random() * 30; // Altura em %
        const bend = (Math.random() - 0.5) * 20;
        return (
            <path
                key={i}
                d={`M ${x}% 100% Q ${x + bend}% ${100 - h / 2}% ${x + bend * 2}% ${100 - h}%`}
                stroke={Math.random() > 0.5 ? COLORS.leafDark : '#380220'}
                strokeWidth={Math.random() * 4 + 2}
                strokeLinecap="round"
                fill="none"
            />
        );
    }), []);

    return (
        <svg className="absolute bottom-0 left-0 w-full h-[30vh] z-0 opacity-80" preserveAspectRatio="none">
            {blades}
        </svg>
    );
});
GrassLayer.displayName = 'GrassLayer';


// --- COMPONENTE PRINCIPAL ---
export default function MysticFlowers() {
    
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#000]">
            
            {/* 1. Fundo Gradiente Otimizado */}
            <div 
                className="absolute inset-0 w-full h-full"
                style={{
                    background: `radial-gradient(circle at center bottom, ${COLORS.bgBottom} 0%, ${COLORS.bgTop} 80%)`
                }}
            />

            {/* 2. Partículas/Brilhos (Quantidade controlada para 60fps) */}
            {Array.from({ length: 40 }).map((_, i) => (
                <Sparkle key={i} index={i} />
            ))}

            {/* 3. Grama de Fundo (Estática para performance) */}
            <GrassLayer />

            {/* 4. Camada das Flores (Interativas/Animadas) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center items-end pb-[5vh]">
                
                {/* Flor Esquerda */}
                <Flower 
                    x="25%" 
                    height={65} 
                    scale={0.85} 
                    delay={0.2} 
                    rotationOffset={-5} 
                />

                {/* Flor Direita */}
                <Flower 
                    x="75%" 
                    height={70} 
                    scale={0.9} 
                    delay={0.4} 
                    rotationOffset={5} 
                />

                {/* Flor Principal (Centro - Maior) */}
                <Flower 
                    x="50%" 
                    height={85} 
                    scale={1.2} 
                    delay={0} 
                    rotationOffset={0} 
                />

                 {/* Flores Menores Extras para volume */}
                 <Flower x="10%" height={45} scale={0.6} delay={0.8} rotationOffset={-10} />
                 <Flower x="90%" height={50} scale={0.65} delay={1.0} rotationOffset={10} />
            </div>

            {/* 5. Vinheta e Brilho Global (Post-Processing simulado) */}
            <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-gradient-to-t from-transparent via-transparent to-purple-900/20" />
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent z-20" />
            
        </div>
    );
}