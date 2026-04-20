'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  className?: string;
  /** ms per character. Set to 0 to render instantly. */
  charInterval?: number;
  /** ms of "typing..." indicator before text starts revealing. */
  typingDelay?: number;
}

function Dots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-purple-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function ChatBubble({
  text,
  className,
  charInterval = 22,
  typingDelay = 450,
}: ChatBubbleProps) {
  const [phase, setPhase] = useState<'typing' | 'revealing' | 'done'>('typing');
  const [revealed, setRevealed] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPhase('typing');
    setRevealed('');
    if (timerRef.current) clearTimeout(timerRef.current);

    // Respeita reduced-motion: mostra tudo direto
    const prefersReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || charInterval <= 0) {
      setPhase('done');
      setRevealed(text);
      return;
    }

    timerRef.current = setTimeout(() => {
      setPhase('revealing');
      let i = 0;
      const step = () => {
        i++;
        setRevealed(text.slice(0, i));
        if (i < text.length) {
          timerRef.current = setTimeout(step, charInterval);
        } else {
          setPhase('done');
        }
      };
      step();
    }, typingDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, charInterval, typingDelay]);

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
          'text-[15px] leading-snug text-foreground min-h-[44px]',
          className
        )}
        aria-live="polite"
      >
        <span
          aria-hidden
          className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white ring-1 ring-purple-100"
          style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
        />
        {phase === 'typing' ? (
          <Dots />
        ) : (
          <span>
            {revealed}
            {phase === 'revealing' && (
              <motion.span
                aria-hidden
                className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[1px] bg-purple-400 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
