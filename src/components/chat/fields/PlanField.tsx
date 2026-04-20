'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeTotalBRL } from '@/lib/price';
import type { PageData } from '@/lib/wizard-schema';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PlanField() {
  const { control } = useFormContext<PageData>();
  const [plan, introType, audioRecording, musicOption] = useWatch({
    control,
    name: ['plan', 'introType', 'audioRecording', 'musicOption'] as const,
  }) as [PageData['plan'], PageData['introType'], PageData['audioRecording'], PageData['musicOption']];

  const total = useMemo(
    () => computeTotalBRL({ plan, introType, audioRecording, musicOption } as any),
    [plan, introType, audioRecording, musicOption]
  );

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="plan"
        render={({ field }) => (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => field.onChange('basico')}
              className={cn(
                'w-full rounded-xl p-4 text-left transition',
                field.value === 'basico'
                  ? 'bg-purple-500/15 ring-2 ring-purple-400 shadow-[0_8px_24px_-10px_rgba(168,85,247,0.6)]'
                  : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">Básico</span>
                {field.value === 'basico' && <Check className="w-4 h-4 text-purple-300" />}
              </div>
              <p className="text-xs text-white/60">Tudo o que você precisa pra emocionar</p>
            </button>
            <button
              type="button"
              onClick={() => field.onChange('avancado')}
              className={cn(
                'w-full rounded-xl p-4 text-left transition relative',
                field.value === 'avancado'
                  ? 'bg-purple-500/15 ring-2 ring-purple-400 shadow-[0_8px_24px_-10px_rgba(168,85,247,0.6)]'
                  : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]'
              )}
            >
              <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wider ring-1 ring-white/30">
                Mais popular
              </span>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">Avançado</span>
                {field.value === 'avancado' && <Check className="w-4 h-4 text-purple-300" />}
              </div>
              <p className="text-xs text-white/60">Tudo do Básico + jogos, voz, intros especiais e mais</p>
            </button>
          </div>
        )}
      />

      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-90">Total</span>
          <span className="text-2xl font-bold">{BRL.format(total)}</span>
        </div>
        <p className="text-xs opacity-80 mt-1">Pagamento único · sem mensalidade</p>
      </div>
    </div>
  );
}
