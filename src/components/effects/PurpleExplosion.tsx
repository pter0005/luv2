'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PARTICLE_COUNT = 30;

export default function PurpleExplosion() {
  // Gera posições aleatórias em círculo para as partículas
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
    const distance = Math.random() * 120 + 80; // Distância da explosão
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: Math.random() * 0.1,
      size: Math.random() * 4 + 2,
    };
  });

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-visible">
      {/* Onda de Choque Central (Ring) */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8, borderWidth: '40px' }}
        animate={{ scale: 2.5, opacity: 0, borderWidth: '0px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute w-32 h-32 rounded-full border-violet-500 box-content"
        style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))' }}
      />

      {/* Partículas Explosivas */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1], // Easing 'Expo' para sensação de 'Pop' rápido
          }}
          className="absolute rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-300"
          style={{
            width: p.size,
            height: p.size,
            boxShadow: '0 0 8px 1px rgba(192, 38, 211, 0.6)', // Glow profissional
          }}
        />
      ))}

      {/* Flash Central de Luz */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute w-20 h-20 bg-white rounded-full blur-xl"
      />
    </div>
  );
}
