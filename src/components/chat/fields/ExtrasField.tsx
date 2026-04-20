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
                  enabled ? 'bg-purple-50 ring-2 ring-purple-300' : 'bg-white ring-1 ring-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center',
                    enabled ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              </div>
            )}
          />
        );
      })}

      <p className="text-xs text-center text-muted-foreground pt-1">
        Tudo opcional — liga só o que você quiser. Dá pra configurar os detalhes depois.
      </p>
    </div>
  );
}
