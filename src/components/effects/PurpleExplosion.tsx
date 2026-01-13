'use client';
import { motion } from 'framer-motion';

const PARTICLE_COUNT = 40; // Quantidade de brilhos

export default function PurpleExplosion() {
  const particles = Array.from({ length: PARTICLE_COUNT });

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center">
      {particles.map((_, i) => {
        // Direções aleatórias para a explosão
        const angle = (i * (360 / PARTICLE_COUNT)) * (Math.PI / 180);
        const distance = Math.random() * 300 + 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ 
              x: x, 
              y: y, 
              opacity: 0, 
              scale: Math.random() * 1.5 + 0.5 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#A855F7', // Roxo principal
              boxShadow: '0 0 10px #D8B4FE, 0 0 20px #A855F7', // Brilho neon
            }}
          />
        );
      })}
    </div>
  );
}
