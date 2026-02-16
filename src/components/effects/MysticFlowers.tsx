'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- CONFIGURAÇÃO DE CORES (PALETA ROXA PROFUNDA) ---
const THEME = {
    bg: 'radial-gradient(circle at center bottom, #2a003b 0%, #05000a 100%)', // Roxo muito escuro
    grassDark: '#1a001a',    // Silhueta quase preta
    grassLight: '#590059',   // Roxo médio
    flowerStem: '#400040',
    flowerLeaf: '#800080',   // Roxo vibrante
    petalBack: '#66004d',    // Roxo avermelhado escuro
    petalFront: '#cc00cc',   // Magenta/Roxo Neon
    glowInner: '#ffcc00',    // O amarelo/dourado de dentro (igual ao GIF)
    firefly: '#ffd700',      // Dourado
};

// --- 1. VAGALUMES (Os pontinhos amarelos do GIF) ---
const Firefly = React.memo(({ index }: { index: number }) => {
    const style = useMemo(() => ({
        left: `${Math.random() * 100}%`,
        bottom: '-10px',
        width: Math.random() * 3 + 2 + 'px',
        height: Math.random() * 3 + 2 + 'px',
        animationDuration: Math.random() * 5 + 5 + 's',
        animationDelay: Math.random() * 5 + 's',
    }), []);

    return (
        <motion.div
            style={{
                position: 'absolute',
                backgroundColor: THEME.firefly,
                borderRadius: '50%',
                boxShadow: `0 0 6px ${THEME.firefly}`,
                opacity: 0,
                zIndex: 20,
                ...style
            }}
            animate={{
                y: ['0vh', '-60vh'],
                x: [0, (Math.random() - 0.5) * 50],
                opacity: [0, 1, 0, 0]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                delay: index * 0.5,
                ease: "easeInOut"
            }}
        />
    );
});
Firefly.displayName = "Firefly";

// --- 2. GRAMA GROSSA LATERAL (As folhas longas do GIF) ---
const ThickGrassBlade = ({ d, delay, color, x, scale }: any) => (
    <motion.path
        d={d}
        fill={color}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, delay, ease: "easeOut" }}
        style={{ transformOrigin: 'bottom center', transformBox: 'fill-box' }}
        transform={`translate(${x}, 0) scale(${scale})`}
    />
);

// --- 3. FOLHAS DA BASE (O arbusto redondinho embaixo) ---
const FernLeaf = ({ x, y, rotate, delay, color }: any) => (
    <motion.ellipse
        cx={x} cy={y} rx="15" ry="8"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, type: "spring" }}
        style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
        transform={`rotate(${rotate} ${x} ${y})`}
    />
);

// --- 4. A FLOR ESPECÍFICA (Formato de Boca/Concha) ---
const SpecficFlower = ({ x, height, scale, delay }: any) => {
    return (
        <motion.g
            transform={`translate(${x}, 0)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            {/* O Caule */}
            <motion.path
                d={`M 0 400 L 0 ${400 - height}`}
                stroke={THEME.flowerStem}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay }}
            />

            {/* Folhas no caule (Pares ovais subindo) */}
            {[1, 2, 3].map((i) => (
                <g key={i} transform={`translate(0, ${400 - (height * (i/4))})`}>
                    <motion.ellipse cx="-15" cy="0" rx="12" ry="6" fill={THEME.flowerLeaf} transform="rotate(-30)" 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.5 + (i * 0.2) }} />
                    <motion.ellipse cx="15" cy="0" rx="12" ry="6" fill={THEME.flowerLeaf} transform="rotate(30)"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.6 + (i * 0.2) }} />
                </g>
            ))}

            {/* A CABEÇA DA FLOR (Boca aberta) */}
            <motion.g
                transform={`translate(0, ${400 - height}) scale(${scale})`}
                initial={{ scale: 0 }}
                animate={{ scale: scale }}
                transition={{ delay: delay + 1.2, type: "spring", stiffness: 60 }}
            >
                {/* Animação de balanço da flor */}
                <motion.g
                    animate={{ rotate: [-5, 5] }}
                    transition={{ duration: 5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: Math.random() }}
                >
                    {/* Pétala de Trás (Escura) */}
                    <path d="M -30 -10 Q 0 -40 30 -10 Q 0 10 -30 -10" fill={THEME.petalBack} />
                    
                    {/* O Brilho de dentro (Dourado/Amarelo) */}
                    <ellipse cx="0" cy="-5" rx="15" ry="6" fill={THEME.glowInner} filter="url(#glowBlur)" />
                    <ellipse cx="0" cy="-5" rx="8" ry="3" fill="#fff" opacity="0.8" />

                    {/* Pétala da Frente (Clara/Neon - Formato de 'Copo') */}
                    <path d="M -35 -15 Q 0 15 35 -15 Q 40 -5 30 10 Q 0 35 -30 10 Q -40 -5 -35 -15" fill={THEME.petalFront} />
                </motion.g>
            </motion.g>
        </motion.g>
    );
};

export default function MysticFlowers() {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Fundo Gradiente */}
            <div className="absolute inset-0" style={{ background: THEME.bg }} />

            {/* Filtros SVG para o brilho */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="glowBlur">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            {/* Camada de Vagalumes (Atrás da grama) */}
            {Array.from({ length: 30 }).map((_, i) => <Firefly key={i} index={i} />)}

            {/* CENA PRINCIPAL SVG */}
            <div className="absolute bottom-0 w-full h-[60vh] flex justify-center items-end">
                <svg viewBox="-200 0 400 400" preserveAspectRatio="xMidYMax meet" className="h-full w-full overflow-visible">
                    
                    {/* GRAMA GROSSA DE FUNDO (Lados) */}
                    {/* Esquerda */}
                    <ThickGrassBlade d="M -10 400 Q -30 200 -80 100 Q -40 200 10 400" color={THEME.grassDark} delay={0.1} />
                    <ThickGrassBlade d="M -40 400 Q -80 250 -140 150 Q -90 300 -20 400" color={THEME.grassDark} delay={0.2} />
                    {/* Direita */}
                    <ThickGrassBlade d="M 10 400 Q 30 200 80 100 Q 40 200 -10 400" color={THEME.grassDark} delay={0.1} />
                    <ThickGrassBlade d="M 40 400 Q 80 250 140 150 Q 90 300 20 400" color={THEME.grassDark} delay={0.2} />


                    {/* O ARBUSTO DA BASE (Muitas folhas ovais roxas) */}
                    <g transform="translate(0, 380)">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <FernLeaf 
                                key={i}
                                x={(Math.random() - 0.5) * 140}
                                y={(Math.random() - 0.5) * 40}
                                rotate={(Math.random() - 0.5) * 90}
                                color={Math.random() > 0.5 ? THEME.flowerLeaf : THEME.petalBack}
                                delay={0.5 + Math.random() * 0.5}
                            />
                        ))}
                    </g>

                    {/* AS 3 FLORES PRINCIPAIS */}
                    {/* Esquerda */}
                    <SpecficFlower x={-60} height={250} scale={0.9} delay={0.5} />
                    {/* Direita */}
                    <SpecficFlower x={60} height={280} scale={0.9} delay={0.7} />
                    {/* Centro (Maior) */}
                    <SpecficFlower x={0} height={320} scale={1.2} delay={0.3} />

                    {/* GRAMA DA FRENTE (Para dar profundidade) */}
                    <ThickGrassBlade d="M -150 400 Q -100 300 -50 400" color="#000" delay={0} />
                    <ThickGrassBlade d="M 150 400 Q 100 300 50 400" color="#000" delay={0} />

                </svg>
            </div>
            
            {/* Vinheta escura nas bordas para focar no centro */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_50%,#000_100%)] opacity-80" />
        </div>
    );
}