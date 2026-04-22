'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';

interface MessageFieldProps {
  placeholder?: string;
}

// Tailwind classes válidas — batem com as que o PageClientComponent consome via
// className. Ordem: do menor pro maior, pra slider virar natural.
const FONT_SIZES: { value: string; label: { pt: string; en: string } }[] = [
  { value: 'text-sm',  label: { pt: 'Pequeno', en: 'Small'  } },
  { value: 'text-base', label: { pt: 'Normal', en: 'Normal' } },
  { value: 'text-lg',  label: { pt: 'Médio',   en: 'Medium' } },
  { value: 'text-xl',  label: { pt: 'Grande',  en: 'Large'  } },
  { value: 'text-2xl', label: { pt: 'Gigante', en: 'Huge'   } },
];

export default function MessageField({
  placeholder = 'Desde o dia que te conheci...',
}: MessageFieldProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PageData>();
  const value = watch('message');
  const fontSize = watch('messageFontSize') || 'text-base';
  const formatting = (watch('messageFormatting') || []) as string[];
  const err = errors.message?.message;
  const locale = useLocale();
  const isEN = locale === 'en';

  const toggleFormat = (f: 'bold' | 'italic' | 'strikethrough') => {
    const next = formatting.includes(f) ? formatting.filter((x) => x !== f) : [...formatting, f];
    setValue('messageFormatting', next, { shouldDirty: true });
  };

  const isBold = formatting.includes('bold');
  const isItalic = formatting.includes('italic');
  const isStrike = formatting.includes('strikethrough');

  return (
    <div className="space-y-4">
      {/* Toolbar: bold / italic / strike */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 font-semibold mr-1">
          {isEN ? 'Style' : 'Estilo'}
        </span>
        {([
          { k: 'bold' as const, icon: Bold, label: isEN ? 'Bold' : 'Negrito', active: isBold },
          { k: 'italic' as const, icon: Italic, label: isEN ? 'Italic' : 'Itálico', active: isItalic },
          { k: 'strikethrough' as const, icon: Strikethrough, label: isEN ? 'Strike' : 'Riscado', active: isStrike },
        ]).map(({ k, icon: Icon, label, active }) => (
          <button
            key={k}
            type="button"
            onClick={() => toggleFormat(k)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'w-9 h-9 rounded-lg transition active:scale-95 flex items-center justify-center ring-1',
              active
                ? 'bg-pink-500/25 ring-pink-400/60 text-white shadow-[0_0_12px_-2px_rgba(236,72,153,0.5)]'
                : 'bg-white/[0.04] ring-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Textarea — preview das escolhas em tempo real (fontSize + formatting aplicados no class) */}
      <div className="space-y-2">
        <textarea
          {...register('message')}
          placeholder={placeholder}
          autoFocus
          maxLength={2000}
          className={cn(
            'w-full min-h-[200px] px-4 py-3 rounded-xl leading-relaxed text-white placeholder:text-white/35',
            'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur resize-none',
            'focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/50 focus:outline-none',
            'transition-all',
            fontSize,
            isBold && 'font-bold',
            isItalic && 'italic',
            isStrike && 'line-through',
            err && 'ring-red-500/60 focus:ring-red-500/70'
          )}
        />
        <div className="flex justify-between items-center text-[11px] px-1 min-h-[14px]">
          <span className="text-red-400/90">{err}</span>
          <span className="text-white/40 tabular-nums">{(value?.length ?? 0)}/2000</span>
        </div>
      </div>

      {/* Font size selector — pills clicáveis com preview do tamanho */}
      <div className="rounded-xl p-3 bg-white/[0.03] ring-1 ring-white/10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-semibold mb-2.5">
          {isEN ? 'Text size' : 'Tamanho do texto'}
        </div>
        <div className="flex flex-wrap gap-2">
          {FONT_SIZES.map((s) => {
            const selected = fontSize === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setValue('messageFontSize', s.value, { shouldDirty: true })}
                aria-pressed={selected}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition ring-1 font-medium',
                  s.value, // preview: botão renderiza com a própria classe de tamanho
                  selected
                    ? 'bg-pink-500/20 ring-pink-400/60 text-white'
                    : 'bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                {s.label[isEN ? 'en' : 'pt']}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
