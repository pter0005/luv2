'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

const OPTIONS = [
  {
    value: undefined,
    emoji: '✨',
    label: 'Sem abertura',
    desc: 'Página abre direto',
  },
  {
    value: 'love',
    emoji: '🐰',
    label: 'Coelhinho Kawaii',
    desc: 'Uma animação fofinha pra começar',
  },
  {
    value: 'poema',
    emoji: '🌸',
    label: 'Poema das Flores',
    desc: 'Abertura cinematográfica com flores',
  },
] as const;

export default function IntroField() {
  const { control, watch } = useFormContext<PageData>();
  const currentType = watch('introType');

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="introType"
        render={({ field }) => (
          <div className="space-y-2">
            {OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              return (
                <button
                  key={String(opt.value ?? 'none')}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl p-3 text-left transition',
                    selected
                      ? 'bg-purple-50 ring-2 ring-purple-400'
                      : 'bg-white ring-1 ring-border hover:ring-purple-200'
                  )}
                >
                  <div className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-muted">
                    {opt.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                  {selected && <Check className="w-5 h-5 text-purple-500 shrink-0" />}
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
                        field.value === 'fem' ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-muted hover:bg-muted/70'
                      )}
                    >
                      Para Ela 💝
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('mas')}
                      className={cn(
                        'flex-1 h-10 rounded-full text-sm font-medium transition',
                        field.value === 'mas' ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-muted hover:bg-muted/70'
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
