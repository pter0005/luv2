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
      <div className="h-[3px] w-full rounded-full bg-white/[0.07] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-white/80"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
}
