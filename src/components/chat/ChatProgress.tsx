'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatProgressProps {
  current: number; // 0-indexed
  total: number;
  className?: string;
}

export default function ChatProgress({ current, total, className }: ChatProgressProps) {
  const pct = Math.max(0, Math.min(100, ((current + 1) / total) * 100));

  return (
    <div className={cn('relative w-full', className)}>
      <div className="h-1.5 w-full rounded-full bg-white/[0.08] ring-1 ring-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 relative"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        >
          {/* Shimmer no topo */}
          <motion.span
            aria-hidden
            className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: [-16, 8, -16] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
