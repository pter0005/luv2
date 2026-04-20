'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  className?: string;
}

export default function ChatBubble({ text, className }: ChatBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-purple-100',
          'text-[15px] leading-snug text-foreground',
          className
        )}
      >
        <span
          aria-hidden
          className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white ring-1 ring-purple-100"
          style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
        />
        {text}
      </motion.div>
    </AnimatePresence>
  );
}
