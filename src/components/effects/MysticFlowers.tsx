'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- PALETA DE CORES ROXA OTIMIZADA ---
const COLORS = {
  bgDeep: '#0a0015',
  bgMid: '#1a0033',
  bgLight: '#2d0059',
  stem: '#3c096c', // Roxo escuro para os caules
  leaf: '#5a189a', // Roxo médio para as folhas
  petalLight: '#e0aaff', // Roxo neon clarinho
  petalMid: '#9d4edd',  // Roxo vibrante
  glow: '#c77dff',     // Brilho violeta
};

// --- Partículas de Brilho (Sparkles) ---
const Sparkle = React.memo(({ index }: { index: number }) => {
  const duration = useMemo(() => Math.random() * 3 + 4, []);
  const delay = useMemo(() => Math.random() * 5, []);
  const left = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => Math.random() * 2 + 1, []);

  return (
    <motion.div
      className="absolute top-[-10px]"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        backgroundColor: '#e0aaff',
        borderRadius: '50%',
        boxShadow: `0 0 8px #9d4edd`,
      }}
      initial={{ y: '-5vh', opacity: 0 }}
      animate={{ y: '105vh', opacity: [0, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
});
Sparkle.displayName = 'Sparkle';

// --- Componente da Flor ---
const Flower = ({ flowerClass, height, delay }: { flowerClass: string, height: number, delay: number }) => {
  return (
    <motion.div
      className={`flower ${flowerClass}`}
      style={{ bottom: 0, transformOrigin: 'bottom center' }}
    >
        {/* Pétalas e Miolo */}
        <motion.div
          className="flower__leafs"
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 2, delay: delay + 1.5, type: 'spring' }}
        >
            <div className="flower__leaf flower__leaf--1" />
            <div className="flower__leaf flower__leaf--2" />
            <div className="flower__leaf flower__leaf--3" />
            <div className="flower__leaf flower__leaf--4" />
            <div className="flower__white-circle" />
        </motion.div>
        
        {/* Caule (Cresce de baixo para cima) */}
        <motion.div
            className="flower__line"
            initial={{ height: 0 }}
            animate={{ height: `${height}vmin` }}
            transition={{ duration: 3, delay: delay, ease: "easeOut" }}
            style={{ originY: 1 }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
             <motion.div 
                key={i} 
                className={`flower__line__leaf flower__line__leaf--${i}`}
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 0.8, delay: delay + 1 + i * 0.2 }}
              />
          ))}
        </motion.div>
    </motion.div>
  );
};

// --- Grama Curta ---
const Grass = ({ className, delay } : { className: string, delay: number }) => (
    <motion.div
      className={`flower__grass ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2, delay }}
      style={{ originY: 1, bottom: 0 }}
    >
        <div className="flower__grass--top" />
        <div className="flower__grass--bottom" />
    </motion.div>
);

// --- Grama Longa (Fundo) ---
const LongGrass = ({ className, delay }: { className: string, delay: number }) => (
    <motion.div 
        className={`long-g ${className}`}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 3, delay }}
        style={{ originY: 1, bottom: 0 }}
    >
        <div className="leaf" />
    </motion.div>
);

export default function MysticFlowers() {
  return (
    <>
    <style jsx global>{`
      :root {
        --p-dark: ${COLORS.bgDeep};
        --p-mid: ${COLORS.leaf};
        --p-light: ${COLORS.petalMid};
        --p-neon: ${COLORS.petalLight};
        --p-stem: ${COLORS.stem};
      }

      .night {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center bottom, ${COLORS.bgLight} 0%, ${COLORS.bgMid} 40%, ${COLORS.bgDeep} 100%);
        z-index: 0;
      }

      .flowers {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%) scale(0.85);
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        pointer-events: none;
        z-index: 10;
      }

      /* Estilo da Flor */
      .flower {
        position: absolute;
        bottom: 0;
        z-index: 10;
      }
      .flower--1 { left: 45%; }
      .flower--2 { left: 35%; transform: rotate(-15deg); }
      .flower--3 { left: 55%; transform: rotate(15deg); }

      .flower__line {
        width: 1.2vmin;
        background-image: linear-gradient(to top, var(--p-dark), var(--p-stem));
        border-radius: 1vmin;
      }

      .flower__leaf {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 8vmin;
        height: 11vmin;
        border-radius: 51% 49% 47% 53% / 44% 45% 55% 69%;
        background: linear-gradient(to top, var(--p-mid), var(--p-neon));
        transform-origin: bottom center;
        box-shadow: inset 0 0 2vmin rgba(255, 255, 255, 0.3);
        filter: drop-shadow(0 0 1vmin var(--p-light));
      }
      
      .flower__leaf--1 { transform: translate(-10%, 1%) rotateY(40deg) rotateX(-50deg); }
      .flower__leaf--2 { transform: translate(-50%, -4%) rotateX(40deg); }
      .flower__leaf--3 { transform: translate(-90%, 0%) rotateY(45deg) rotateX(50deg); }
      .flower__leaf--4 {
        width: 8vmin; height: 8vmin;
        transform: translate(0%, 18%) rotateX(70deg) rotate(-43deg);
        background: linear-gradient(to top, #240046, var(--p-mid));
        z-index: -1;
        opacity: 0.8;
      }

      .flower__white-circle {
        position: absolute;
        left: -3.5vmin; top: -3vmin;
        width: 9vmin; height: 4vmin;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 15px #fff;
      }

      .flower__line__leaf {
        width: 6vmin; height: 8vmin;
        position: absolute;
        background: linear-gradient(to top, #240046, var(--p-mid));
        border-radius: 10vmin 0 10vmin 0;
      }
      .flower__line__leaf--1 { left: 100%; top: 20%; transform: rotate(45deg); }
      .flower__line__leaf--2 { left: -500%; top: 40%; transform: rotate(-45deg) scaleX(-1); }

      /* Gramas */
      .flower__grass {
        position: absolute;
        bottom: 0;
        display: flex;
        flex-direction: column;
        z-index: 15;
      }
      .flower__grass--top {
        width: 5vmin; height: 8vmin;
        border-right: 1.2vmin solid var(--p-mid);
        border-radius: 0 100% 0 0;
      }
      .flower__grass--bottom {
        width: 1.2vmin; height: 15vmin;
        background: linear-gradient(to top, transparent, var(--p-mid));
      }

      .long-g {
        position: absolute;
        bottom: 0;
        z-index: 5;
      }
      .long-g .leaf {
        width: 10vmin; height: 35vmin;
        border-left: 1.5vmin solid #1a0033;
        border-radius: 100% 0 0 0;
        background: linear-gradient(to top, transparent, rgba(90, 24, 154, 0.2));
      }

      /* Animação de Balanço Suave */
      @keyframes sway {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2deg); }
      }
      .flower { animation: sway 4s ease-in-out infinite; }
    `}</style>

    <div className="relative w-full h-full overflow-hidden"> 
        <div className="night" />
        
        {/* Camada de Brilhos */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
                <Sparkle key={i} index={i} />
            ))}
        </div>

        {/* Camada das Flores e Plantas */}
        <div className="flowers">
            {/* Flores Principais */}
            <Flower flowerClass="flower--1" height={65} delay={0.2} />
            <Flower flowerClass="flower--2" height={50} delay={0.5} />
            <Flower flowerClass="flower--3" height={55} delay={0.8} />

            {/* Gramas Curtas na frente */}
            <Grass className="left-[40%]" delay={1.2} />
            <Grass className="left-[55%] scale-x-[-1]" delay={1.4} />
            
            {/* Gramas Longas ao fundo */}
            <LongGrass className="left-[20%] opacity-40" delay={1} />
            <LongGrass className="left-[70%] opacity-40 scale-x-[-1]" delay={1.2} />
            <LongGrass className="left-[10%] scale-[0.7] opacity-20" delay={1.5} />
            <LongGrass className="left-[85%] scale-[0.7] opacity-20 scale-x-[-1]" delay={1.7} />
        </div>
    </div>
    </>
  );
}
