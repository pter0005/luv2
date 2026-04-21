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
    <div
      key={text}
      className={cn(
        'relative flex-1 min-h-[52px] px-5 py-3.5 rounded-[22px] rounded-tl-md',
        'bg-white/[0.06] ring-1 ring-white/12',
        'text-[15px] leading-[1.45] text-white/95',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        className
      )}
      aria-live="polite"
    >
      {/* Tail apontando pro Cupido */}
      <span
        aria-hidden
        className="absolute -left-1.5 top-4 w-3 h-3 rotate-45 bg-white/[0.06] ring-1 ring-white/12 rounded-[3px]"
        style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
      />

      {phase === 'typing' ? (
        <TypingDots />
      ) : (
        <span>
          {revealed}
          {phase === 'revealing' && (
            <span className="inline-block w-[2px] h-[1em] ml-[2px] align-middle bg-white/70 animate-pulse" />
          )}
        </span>
      )}
    </div>
  );
}
