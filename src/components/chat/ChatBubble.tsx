'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  className?: string;
  /** ms médio por caractere (há jitter ±8ms). 0 = instantâneo. */
  charInterval?: number;
  /** ms exibindo dots antes do texto começar. */
  typingDelay?: number;
}

type Phase = 'typing' | 'revealing' | 'done';

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background:
              'linear-gradient(135deg, rgb(216,180,254), rgb(249,168,212))',
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.75, 1.2, 0.75],
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

function BlinkingCursor() {
  return (
    <motion.span
      aria-hidden
      className="inline-block w-[2px] h-[1.1em] -mb-[2px] ml-[2px] align-middle rounded-full"
      style={{
        background:
          'linear-gradient(180deg, rgb(216,180,254), rgb(249,168,212))',
      }}
      animate={{ opacity: [1, 0.15, 1] }}
      transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function ChatBubble({
  text,
  className,
  charInterval = 38,
  typingDelay = 650,
}: ChatBubbleProps) {
  const [phase, setPhase] = useState<Phase>('typing');
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    setPhase('typing');
    setRevealedCount(0);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || charInterval <= 0) {
      setPhase('done');
      setRevealedCount(text.length);
      return;
    }

    const start = window.setTimeout(() => {
      if (cancelled) return;
      setPhase('revealing');
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i++;
        setRevealedCount(i);
        if (i < text.length) {
          const ch = text[i - 1];
          const punctuationExtra = /[.,!?:;…—–]/.test(ch) ? 220 : 0;
          const wordGapExtra = ch === ' ' ? 20 : 0;
          const jitter = Math.floor(Math.random() * 16) - 8; // ±8ms humano
          const delay = Math.max(12, charInterval + punctuationExtra + wordGapExtra + jitter);
          const t = window.setTimeout(tick, delay);
          timers.push(t);
        } else {
          setPhase('done');
        }
      };
      tick();
    }, typingDelay);
    timers.push(start);

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [text, charInterval, typingDelay]);

  const isTypingOrRevealing = phase === 'typing' || phase === 'revealing';

  return (
    <motion.div
      layout
      key={text}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'relative flex-1 min-h-[52px] px-5 py-3.5',
        'rounded-[22px] rounded-tl-md',
        'bg-gradient-to-br from-white/[0.1] via-white/[0.06] to-white/[0.04]',
        'backdrop-blur-xl ring-1 ring-white/15',
        'shadow-[0_10px_40px_-12px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
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

      {/* Pulse sutil nas bordas enquanto digita */}
      {isTypingOrRevealing && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[22px] rounded-tl-md"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(236,72,153,0.0)',
              '0 0 0 2px rgba(236,72,153,0.15)',
              '0 0 0 0 rgba(236,72,153,0.0)',
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {phase === 'typing' ? (
        <TypingDots />
      ) : (
        <span>
          {/* Letras já escritas — estáticas */}
          {text.slice(0, Math.max(0, revealedCount - 1))}
          {/* Última letra — entra com fade+y sutil */}
          {revealedCount > 0 && (
            <motion.span
              key={revealedCount}
              initial={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >
              {text[revealedCount - 1]}
            </motion.span>
          )}
          {phase === 'revealing' && <BlinkingCursor />}
        </span>
      )}
    </motion.div>
  );
}
