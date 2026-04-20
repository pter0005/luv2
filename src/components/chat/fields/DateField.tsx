'use client';

import React, { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

type Preset = { label: string; compute: () => Date };

const PRESETS: Preset[] = [
  { label: 'Hoje', compute: () => new Date() },
  {
    label: 'Mês passado',
    compute: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; },
  },
  {
    label: '6 meses',
    compute: () => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; },
  },
  {
    label: 'Ano passado',
    compute: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; },
  },
];

function combineDateAndTime(date: Date, time: string): Date {
  const [hh, mm] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(hh || 0, mm || 0, 0, 0);
  return next;
}

export default function DateField() {
  const { control, watch, setValue } = useFormContext<PageData>();
  const currentDate = watch('specialDate');

  const [addTime, setAddTime] = useState<boolean>(() => {
    if (!currentDate) return false;
    return currentDate.getHours() !== 0 || currentDate.getMinutes() !== 0;
  });

  const [time, setTime] = useState<string>(() => {
    if (!currentDate) return '12:00';
    return format(currentDate, 'HH:mm');
  });

  const applyTime = (t: string) => {
    setTime(t);
    if (currentDate) {
      setValue('specialDate', combineDateAndTime(currentDate, t), { shouldDirty: true });
    }
  };

  const applyPreset = (p: Preset) => {
    const base = p.compute();
    const finalDate = addTime ? combineDateAndTime(base, time) : base;
    setValue('specialDate', finalDate, { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      {/* Data principal */}
      <Controller
        control={control}
        name="specialDate"
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'w-full h-14 px-4 rounded-xl text-[15px] flex items-center gap-3',
                  'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur',
                  'hover:bg-white/[0.06] hover:ring-white/20 transition',
                  'focus:outline-none focus:ring-2 focus:ring-pink-500/40',
                  !field.value && 'text-white/45'
                )}
              >
                <CalendarIcon className="w-4 h-4 text-white/60" />
                <span className={cn('flex-1 text-left', field.value && 'text-white')}>
                  {field.value
                    ? format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Escolher a data'}
                </span>
                {addTime && field.value && (
                  <span className="text-white/70 text-sm tabular-nums">
                    {format(field.value, 'HH:mm')}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#1a0f24] border-white/10" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(d) => {
                  if (!d) return field.onChange(d);
                  field.onChange(addTime ? combineDateAndTime(d, time) : d);
                }}
                disabled={(date) => date > new Date() || date < new Date('1950-01-01')}
                locale={ptBR}
                captionLayout="dropdown-buttons"
                fromYear={1960}
                toYear={new Date().getFullYear()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      />

      {/* Presets rápidos */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/75 ring-1 ring-white/10 hover:ring-white/20 transition active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sub-opção: adicionar horário */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            const next = !addTime;
            setAddTime(next);
            if (next && currentDate) {
              setValue('specialDate', combineDateAndTime(currentDate, time), { shouldDirty: true });
            } else if (!next && currentDate) {
              const reset = new Date(currentDate);
              reset.setHours(0, 0, 0, 0);
              setValue('specialDate', reset, { shouldDirty: true });
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition',
            'bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.06]'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition',
              addTime
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                : 'bg-white/[0.06] text-white/60'
            )}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/90 font-medium">Adicionar horário</div>
            <div className="text-[11.5px] text-white/50">Opcional — bom pra momentos específicos</div>
          </div>
          <div
            className={cn(
              'relative w-9 h-5 rounded-full transition shrink-0',
              addTime ? 'bg-pink-500' : 'bg-white/15'
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                addTime ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {addTime && (
            <motion.div
              key="time-picker"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="pt-2.5">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => applyTime(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl text-[15px] text-white bg-white/[0.04] ring-1 ring-white/10 backdrop-blur focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/40 focus:outline-none transition tabular-nums"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[11.5px] text-white/45 px-1 leading-relaxed">
        A gente usa essa data pra criar um contador de tempo juntos na página 💫
      </p>
    </div>
  );
}
