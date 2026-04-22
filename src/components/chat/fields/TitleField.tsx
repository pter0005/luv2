'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';

interface TitleFieldProps {
  placeholder?: string;
}

// Paleta curada — escolhidas pra contrastar em fundos escuros (default do site)
// e dark-mode pages. Ordem segue: branco, pastéis, vibrantes, acento dourado.
const COLOR_SWATCHES: { hex: string; label: { pt: string; en: string } }[] = [
  { hex: '#FFFFFF', label: { pt: 'Branco', en: 'White' } },
  { hex: '#FFD6E7', label: { pt: 'Rosé', en: 'Blush' } },
  { hex: '#F472B6', label: { pt: 'Rosa', en: 'Pink' } },
  { hex: '#EF4444', label: { pt: 'Vermelho', en: 'Red' } },
  { hex: '#FB923C', label: { pt: 'Laranja', en: 'Orange' } },
  { hex: '#FDE047', label: { pt: 'Amarelo', en: 'Yellow' } },
  { hex: '#86EFAC', label: { pt: 'Verde', en: 'Green' } },
  { hex: '#60A5FA', label: { pt: 'Azul', en: 'Blue' } },
  { hex: '#A78BFA', label: { pt: 'Lilás', en: 'Lilac' } },
  { hex: '#D4AF37', label: { pt: 'Dourado', en: 'Gold' } },
];

export default function TitleField({ placeholder = 'Ex: Para o amor da minha vida' }: TitleFieldProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PageData>();
  const value = watch('title');
  const titleColor = watch('titleColor') || '#FFFFFF';
  const err = errors.title?.message;
  const locale = useLocale();
  const isEN = locale === 'en';

  return (
    <div className="space-y-4">
      {/* Input do título — preview da cor escolhida via style inline */}
      <div className="space-y-2">
        <div className="relative">
          <input
            {...register('title')}
            placeholder={placeholder}
            autoFocus
            maxLength={60}
            style={{ color: titleColor }}
            className={cn(
              'w-full h-14 px-4 rounded-xl text-[15px] placeholder:text-white/35',
              'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur',
              'focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/50 focus:outline-none',
              'transition-all font-semibold',
              err && 'ring-red-500/60 focus:ring-red-500/70'
            )}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] px-1 min-h-[14px]">
          <span className="text-red-400/90">{err}</span>
          <span className="text-white/40 tabular-nums">{(value?.length ?? 0)}/60</span>
        </div>
      </div>

      {/* Color picker: swatches + custom wheel */}
      <div className="rounded-xl p-3 bg-white/[0.03] ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-semibold">
            {isEN ? 'Title color' : 'Cor do título'}
          </span>
          {/* Custom color via native <input type=color> — user pode escolher qualquer tom */}
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <span className="text-[11px] text-white/50 group-hover:text-white/80 transition">
              {isEN ? 'Custom' : 'Personalizada'}
            </span>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setValue('titleColor', e.target.value, { shouldDirty: true })}
              className="w-7 h-7 rounded-md cursor-pointer border border-white/20 bg-transparent appearance-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
              aria-label={isEN ? 'Custom color' : 'Cor personalizada'}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((c) => {
            const selected = titleColor.toUpperCase() === c.hex.toUpperCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setValue('titleColor', c.hex, { shouldDirty: true })}
                title={c.label[isEN ? 'en' : 'pt']}
                className={cn(
                  'w-8 h-8 rounded-full transition-all active:scale-90',
                  selected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                    : 'ring-1 ring-white/20 hover:ring-white/60 hover:scale-105'
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={c.label[isEN ? 'en' : 'pt']}
                aria-pressed={selected}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
