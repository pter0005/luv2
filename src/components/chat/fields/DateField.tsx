'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

type Preset = { label: string; compute: () => Date };

const PRESETS: Preset[] = [
  {
    label: '1 mês',
    compute: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return stripTime(d); },
  },
  {
    label: '6 meses',
    compute: () => { const d = new Date(); d.setMonth(d.getMonth() - 6); return stripTime(d); },
  },
  {
    label: '1 ano',
    compute: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return stripTime(d); },
  },
  {
    label: '2 anos',
    compute: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return stripTime(d); },
  },
  {
    label: '5 anos',
    compute: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return stripTime(d); },
  },
];

function stripTime(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

// ───── Preview do estilo "Padrão" (grid 6 blocos) ─────
function StylePreviewPadrao({ color = '#FFFFFF' }: { color?: string }) {
  const units = [
    { v: '01', l: 'Anos' },
    { v: '08', l: 'Meses' },
    { v: '14', l: 'Dias' },
    { v: '05', l: 'Hrs' },
  ];
  return (
    <div className="w-full">
      <div className="text-center text-[9px] text-white/45 mb-1.5">Compartilhando momentos há</div>
      <div className="grid grid-cols-4 gap-1">
        {units.map((u) => (
          <div
            key={u.l}
            className="p-1.5 bg-white/5 rounded-md border border-white/10 text-center"
          >
            <div className="text-[13px] font-bold leading-tight tabular-nums" style={{ color }}>
              {u.v}
            </div>
            <div className="text-[8px] text-white/55 leading-tight mt-0.5">{u.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───── Preview do estilo "Simples" (linha de texto) ─────
function StylePreviewSimples({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <div className="w-full text-center px-2 py-2.5 rounded-md bg-black/25">
      <p className="text-[10.5px] leading-[1.5]" style={{ color }}>
        <span className="text-white/45">Compartilhando há</span>
        <br />
        <span className="font-bold">01</span>
        <span className="text-white/55"> anos </span>
        <span className="font-bold">08</span>
        <span className="text-white/55"> meses </span>
        <span className="font-bold">14</span>
        <span className="text-white/55"> dias 💜</span>
      </p>
    </div>
  );
}

const STYLE_OPTIONS: { value: 'Padrão' | 'Simples'; label: string; desc: string }[] = [
  { value: 'Padrão', label: 'Clássico', desc: 'Blocos com números' },
  { value: 'Simples', label: 'Simples', desc: 'Uma linha de texto' },
];

export default function DateField() {
  const { control, watch, setValue } = useFormContext<PageData>();
  const currentDate = watch('specialDate');
  const countdownColor = watch('countdownColor') || '#FFFFFF';

  const togetherFor = currentDate
    ? formatDistanceStrict(currentDate, new Date(), { locale: ptBR, unit: undefined as any })
    : null;

  const applyPreset = (p: Preset) => {
    setValue('specialDate', p.compute(), { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      {/* Presets rápidos — "há quanto tempo" — no TOPO pra facilitar */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/75 ring-1 ring-white/10 hover:ring-white/20 transition active:scale-95"
          >
            há {p.label}
          </button>
        ))}
      </div>

      {/* Calendário INLINE — visual, sem popover */}
      <Controller
        control={control}
        name="specialDate"
        render={({ field }) => (
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-2 flex justify-center">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={(d) => {
                if (!d) return field.onChange(d);
                field.onChange(stripTime(d));
              }}
              disabled={(date) => date > new Date() || date < new Date('1950-01-01')}
              locale={ptBR}
              captionLayout="dropdown-buttons"
              fromYear={1960}
              toYear={new Date().getFullYear()}
            />
          </div>
        )}
      />

      {/* Feedback fofo: há X tempo juntos */}
      {togetherFor && (
        <div className="rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 ring-1 ring-pink-400/20 px-4 py-3 flex items-center gap-2.5">
          <span className="text-lg">💞</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] text-white/55 uppercase tracking-wider font-semibold">Juntos há</div>
            <div className="text-[14px] text-white font-bold">{togetherFor}</div>
            {currentDate && (
              <div className="text-[10.5px] text-white/45 mt-0.5">
                desde {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estilos de contador — com preview visual */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
            estilo do contador
          </span>
        </div>
        <Controller
          control={control}
          name="countdownStyle"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2.5">
              {STYLE_OPTIONS.map((opt) => {
                const selected = field.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      'relative rounded-xl overflow-hidden p-3 transition ring-2 text-left',
                      selected
                        ? 'ring-purple-400 bg-white/[0.06] shadow-[0_10px_28px_-10px_rgba(168,85,247,0.55)]'
                        : 'ring-white/10 bg-white/[0.02] hover:ring-purple-400/50'
                    )}
                  >
                    <div className="min-h-[62px] flex items-center justify-center">
                      {opt.value === 'Padrão' ? (
                        <StylePreviewPadrao color={countdownColor} />
                      ) : (
                        <StylePreviewSimples color={countdownColor} />
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5">
                      <div className="text-[12.5px] font-semibold text-white">{opt.label}</div>
                      <div className="text-[10.5px] text-white/50 mt-0.5">{opt.desc}</div>
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 shadow-md ring-2 ring-white/20">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Cor dos números do contador */}
      <Controller
        control={control}
        name="countdownColor"
        render={({ field }) => (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] ring-1 ring-white/10">
            <label htmlFor="countdown-color" className="text-sm text-white flex items-center gap-1.5">
              <span>🎨</span> Cor dos números
            </label>
            <input
              id="countdown-color"
              type="color"
              {...field}
              value={field.value || '#FFFFFF'}
              className="ml-auto h-9 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
            />
          </div>
        )}
      />

      <p className="text-[11.5px] text-white/45 px-1 leading-relaxed">
        Só o dia — a gente usa pra mostrar o tempo de amor na página ⏳
      </p>
    </div>
  );
}
