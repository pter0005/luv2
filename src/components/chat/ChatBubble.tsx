'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  className?: string;
  /** ms médio por caractere. 0 = instantâneo. */
  charInterval?: number;
  /** ms de "typing dots" antes das letras começarem a aparecer. */
  typingDelay?: number;
}

type Phase = 'typing' | 'revealing' | 'done';

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '900ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '900ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '900ms' }} />
    </div>
  );
}

export default function ChatBubble({
  text,
  className,
  charInterval = 32,
  typingDelay = 500,
}: ChatBubbleProps) {
  const [phase, setPhase] = useState<Phase>('typing');
  const [revealed, setRevealed] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    setPhase('typing');
    setRevealed('');

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || charInterval <= 0) {
      setPhase('done');
      setRevealed(text);
      return;
    }

    const start = window.setTimeout(() => {
      if (cancelled) return;
      setPhase('revealing');
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i++;
        setRevealed(text.slice(0, i));
        if (i < text.length) {
          const ch = text[i - 1];
          const extra = /[.,!?:;…—–]/.test(ch) ? 160 : 0;
          const t = window.setTimeout(tick, charInterval + extra);
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

  return (
    <div className="relative flex-1 min-w-0">
      {/* Label "cupido" — hierarquia sutil */}
      <div className="flex items-center gap-1.5 mb-1.5 pl-1">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/40">
          cupido
        </span>
        <span className="inline-block w-1 h-1 rounded-full bg-fuchsia-400/60 animate-pulse" />
      </div>

      <div
        key={text}
        className={cn(
          'relative min-h-[56px] px-5 py-4 rounded-[24px]',
          'bg-gradient-to-b from-white/[0.09] to-white/[0.03]',
          'ring-1 ring-white/15',
          'shadow-[0_8px_28px_-12px_rgba(236,72,153,0.35),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
          // Tipografia: serif italic com caráter
          'font-serif italic',
          'text-[17px] leading-[1.5] text-white',
          'animate-in fade-in slide-in-from-bottom-1 duration-300',
          className
        )}
        style={{
          fontFamily:
            'var(--font-instrument-serif), "Fraunces", ui-serif, Georgia, "Times New Roman", serif',
        }}
        aria-live="polite"
      >
        {phase === 'typing' ? (
          <TypingDots />
        ) : (
          <span>
            {revealed}
            {phase === 'revealing' && (
              <span className="inline-block w-[2px] h-[1em] ml-[2px] align-middle bg-fuchsia-300/80 animate-pulse" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
