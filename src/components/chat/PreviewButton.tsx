'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

interface PreviewButtonProps {
  onClick: () => void;
  visible?: boolean;
}

export default function PreviewButton({ onClick, visible = true }: PreviewButtonProps) {
  if (!visible) return null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/85 text-white text-xs font-semibold shadow-lg ring-1 ring-white/10 backdrop-blur hover:bg-black"
      aria-label="Ver como está ficando"
    >
      <Eye className="w-4 h-4" />
      <span>Ver como está ficando</span>
    </motion.button>
  );
}
