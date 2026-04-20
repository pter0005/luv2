'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  className?: string;
  /** ms por caractere. 0 = instantâneo. */
  charInterval?: number;
  /** ms mostrando "..." antes do texto começar a aparecer. */
  typingDelay?: number;
}

/** Três bolinhas pulsando estilo iMessage. */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1.5 px-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background:
              'linear-gradient(135deg, rgb(216, 180, 254), rgb(249, 168, 212))',
          }}
          animate={{
            opacity: [0.35, 1, 0.35],
            scale: [0.8, 1.15, 0.8],
            y: [0, -3, 0],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.18,
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
  charInterval = 28,
  typingDelay = 600,
}: ChatBubbleProps) {
  const [phase, setPhase] = useState<'typing' | 'revealing' | 'done'>('typing');
  const [revealed, setRevealed] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPhase('typing');
    setRevealed('');
    if (timerRef.current) clearTimeout(timerRef.current);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
          // Pequena pausa extra em pontuação pra parecer mais natural
          const lastChar = text[i - 1];
          const extra = /[.,!?:;—–]/.test(lastChar) ? 140 : 0;
          timerRef.current = setTimeout(step, charInterval + extra);
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
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative flex-1 min-h-[52px] px-5 py-3.5',
          'rounded-[22px] rounded-tl-md',
          'bg-gradient-to-br from-white/[0.1] via-white/[0.06] to-white/[0.04]',
          'backdrop-blur-xl ring-1 ring-white/15',
          'shadow-[0_10px_40px_-12px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]',
          'text-[15px] leading-[1.45] text-white/95',
          className
        )}
        aria-live="polite"
      >
        {/* Tail apontando pro Cupido (esquerda) */}
        <span
          aria-hidden
          className="absolute -left-1.5 top-4 w-4 h-4 rotate-45"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
            borderLeft: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {phase === 'typing' ? (
          <TypingDots />
        ) : (
          <span>
            {revealed}
            {phase === 'revealing' && (
              <motion.span
                aria-hidden
                className="inline-block w-[2px] h-[1.1em] -mb-[2px] ml-[2px] align-middle rounded-full"
                style={{
                  background:
                    'linear-gradient(180deg, rgb(216, 180, 254), rgb(249, 168, 212))',
                }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
