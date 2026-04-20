'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, HelpCircle, Puzzle, Wand2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

const EXTRAS = [
  {
    key: 'enablePuzzle' as const,
    icon: Puzzle,
    label: 'Quebra-cabeça',
    desc: 'Ele(a) precisa montar pra ver a surpresa',
  },
  {
    key: 'enableMemoryGame' as const,
    icon: Gamepad2,
    label: 'Jogo da memória',
    desc: 'Pares de cartas com fotos de vocês',
  },
  {
    key: 'enableQuiz' as const,
    icon: HelpCircle,
    label: 'Quiz do casal',
    desc: 'Perguntas que só ele(a) saberia',
  },
  {
    key: 'enableWordGame' as const,
    icon: Wand2,
    label: 'Adivinhe a palavra',
    desc: 'Jogo de palavras temáticas',
  },
];

export default function ExtrasField() {
  const { control, watch } = useFormContext<PageData>();

  return (
    <div className="space-y-2">
      {EXTRAS.map(({ key, icon: Icon, label, desc }) => {
        const enabled = watch(key);
        return (
          <Controller
            key={key}
            control={control}
            name={key}
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl p-3 transition',
                  enabled
                    ? 'bg-purple-500/15 ring-2 ring-purple-400 shadow-[0_8px_24px_-10px_rgba(168,85,247,0.6)]'
                    : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center',
                    enabled ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-white/[0.08] text-white/60 ring-1 ring-white/10'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{label}</div>
                    <div className="text-xs text-white/60">{desc}</div>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              </div>
            )}
          />
        );
      })}

      <p className="text-xs text-center text-white/50 pt-1">
        Tudo opcional — liga só o que você quiser. Dá pra configurar os detalhes depois.
      </p>
    </div>
  );
}
