'use client';
import { motion } from 'framer-motion';

export default function NebulaBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#05010a] z-0">
      {/* Mancha Roxa Principal */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #5c1d8f 0%, transparent 70%)' }}
      />

      {/* Mancha Rosa Vibrante */}
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -60, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #D14D72 0%, transparent 70%)' }}
      />

      {/* Brilho Central Azulado/Violeta */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full opacity-20 blur-[150px]"
        style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 60%)' }}
      />

      {/* Camada de Ruído (Efeito de poeira estelar) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')` }}></div>
    </div>
  );
}
