'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';

interface PreviewButtonProps {
  onClick: () => void;
  visible?: boolean;
}

export default function PreviewButton({ onClick, visible = true }: PreviewButtonProps) {
  const locale = useLocale();
  const isEN = locale === 'en';
  const label = isEN ? 'See how it\'s looking' : 'Ver como está ficando';
  if (!visible) return null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.9 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      aria-label={label}
      className="group fixed bottom-24 right-4 z-40 active:scale-95"
      style={{ filter: 'drop-shadow(0 10px 28px rgba(236,72,153,0.45))' }}
    >
      {/* Halo pulsante por trás — chama atenção sem ficar escandaloso */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 opacity-60 blur-md"
        animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white text-[13px] font-bold ring-1 ring-white/20 shadow-[0_6px_22px_-6px_rgba(217,70,239,0.7)]">
        <motion.span
          aria-hidden
          animate={{ rotate: [0, 14, -10, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <Eye className="w-[18px] h-[18px] drop-shadow" strokeWidth={2.5} />
        </motion.span>
        <span className="drop-shadow-sm">{label}</span>
        <Sparkles className="w-[14px] h-[14px] text-yellow-200/90 drop-shadow" strokeWidth={2.4} />
      </span>
    </motion.button>
  );
}
