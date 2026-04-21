'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

type IntroValue = PageData['introType'];

interface IntroOption {
  value: IntroValue;
  emoji: string;
  label: string;
  desc: string;
  highlight?: boolean; // destaque visual — card "estrela"
}

const OPTIONS: IntroOption[] = [
  {
    value: 'poema',
    emoji: '💐',
    label: 'Buquê Digital',
    desc: 'Abertura cinematográfica com flores pra ela(e)',
    highlight: true,
  },
  {
    value: 'love',
    emoji: '🐰',
    label: 'Coelhinho',
    desc: 'Animação fofinha pra começar com graça',
  },
  {
    value: undefined,
    emoji: '✨',
    label: 'Sem abertura',
    desc: 'A página abre direto no conteúdo',
  },
];

function MostLovedBadge() {
  return (
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-md bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 ring-1 ring-white/40 whitespace-nowrap">
      <Heart className="w-3 h-3 fill-white" />
      Mais amado
    </span>
  );
}

// Brilho sutil — sparkles que giram lentamente no card destacado
function CardSparkles() {
  return (
    <>
      <Sparkles className="pointer-events-none absolute top-2 right-2 w-3 h-3 text-pink-200/70 animate-pulse" style={{ animationDuration: '2.4s' }} />
      <Sparkles className="pointer-events-none absolute bottom-2 left-12 w-2.5 h-2.5 text-fuchsia-200/60 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
    </>
  );
}

export default function IntroField() {
  const { control, watch } = useFormContext<PageData>();
  const currentType = watch('introType');

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="introType"
        render={({ field }) => (
          <div className="space-y-4 pt-4">
            {OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              const isHighlight = !!opt.highlight;
              return (
                <button
                  key={String(opt.value ?? 'none')}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'relative w-full flex items-center gap-3 rounded-xl p-3 text-left transition',
                    isHighlight && !selected &&
                      'bg-gradient-to-br from-pink-500/15 via-fuchsia-500/10 to-purple-500/15 ring-2 ring-pink-400/60 shadow-[0_8px_28px_-8px_rgba(236,72,153,0.55)]',
                    isHighlight && selected &&
                      'bg-gradient-to-br from-pink-500/25 via-fuchsia-500/20 to-purple-500/25 ring-2 ring-pink-400 shadow-[0_10px_32px_-8px_rgba(236,72,153,0.7)]',
                    !isHighlight && selected &&
                      'bg-purple-500/15 ring-2 ring-purple-400 shadow-[0_8px_28px_-8px_rgba(168,85,247,0.6)]',
                    !isHighlight && !selected &&
                      'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-purple-400/40'
                  )}
                >
                  {isHighlight && <MostLovedBadge />}
                  {isHighlight && <CardSparkles />}
                  <div
                    className={cn(
                      'text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-full ring-1',
                      isHighlight
                        ? 'bg-gradient-to-br from-pink-500/30 to-fuchsia-500/20 ring-pink-400/40 shadow-inner'
                        : 'bg-white/[0.06] ring-white/10'
                    )}
                  >
                    {opt.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{opt.label}</div>
                    <div className="text-xs text-white/60">{opt.desc}</div>
                  </div>
                  {selected && <Check className={cn('w-5 h-5 shrink-0', isHighlight ? 'text-pink-200' : 'text-purple-300')} />}
                </button>
              );
            })}
          </div>
        )}
      />

      <AnimatePresence>
        {currentType === 'poema' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                Pra quem é o buquê?
              </p>
              <Controller
                control={control}
                name="introGender"
                render={({ field }) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('fem')}
                      className={cn(
                        'flex-1 h-10 rounded-full text-sm font-medium transition',
                        field.value === 'fem' ? 'bg-pink-500/20 ring-2 ring-pink-400 text-white' : 'bg-white/[0.05] ring-1 ring-white/10 text-white/80 hover:bg-white/[0.1]'
                      )}
                    >
                      Para Ela 💝
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('mas')}
                      className={cn(
                        'flex-1 h-10 rounded-full text-sm font-medium transition',
                        field.value === 'mas' ? 'bg-blue-500/25 ring-2 ring-blue-400 text-white' : 'bg-white/[0.05] ring-1 ring-white/10 text-white/80 hover:bg-white/[0.1]'
                      )}
                    >
                      Para Ele 💙
                    </button>
                  </div>
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
