'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

const OPTIONS = [
  { value: 'none', label: 'Nenhum', preview: 'bg-gradient-to-br from-slate-900 to-slate-800' },
  { value: 'falling-hearts', label: 'Corações', preview: 'bg-gradient-to-br from-rose-500 to-pink-600' },
  { value: 'starry-sky', label: 'Céu estrelado', preview: 'bg-gradient-to-br from-indigo-900 to-slate-900' },
  { value: 'nebula', label: 'Nebulosa', preview: 'bg-gradient-to-br from-fuchsia-700 to-purple-900' },
  { value: 'mystic-flowers', label: 'Flores místicas', preview: 'bg-gradient-to-br from-pink-400 to-purple-500' },
  { value: 'floating-dots', label: 'Pontos flutuantes', preview: 'bg-gradient-to-br from-cyan-500 to-blue-700' },
];

export default function BackgroundField() {
  const { control, watch } = useFormContext<PageData>();
  const hearts = watch('backgroundAnimation') === 'falling-hearts';

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="backgroundAnimation"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'relative aspect-[4/3] rounded-xl overflow-hidden transition ring-2',
                    selected ? 'ring-purple-500' : 'ring-transparent hover:ring-purple-200'
                  )}
                >
                  <div className={cn('absolute inset-0', opt.preview)} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-xs font-semibold text-white">{opt.label}</span>
                  </div>
                  {selected && (
                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      />

      {hearts && (
        <Controller
          control={control}
          name="heartColor"
          render={({ field }) => (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <label htmlFor="heart-color" className="text-sm font-medium">Cor dos corações</label>
              <input
                id="heart-color"
                type="color"
                {...field}
                className="h-9 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
              />
            </div>
          )}
        />
      )}
    </div>
  );
}
