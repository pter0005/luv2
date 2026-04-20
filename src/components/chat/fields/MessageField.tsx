'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

interface MessageFieldProps {
  placeholder?: string;
}

export default function MessageField({
  placeholder = 'Desde o dia que te conheci...',
}: MessageFieldProps) {
  const { register, watch, formState: { errors } } = useFormContext<PageData>();
  const value = watch('message');
  const err = errors.message?.message;

  return (
    <div className="space-y-2">
      <textarea
        {...register('message')}
        placeholder={placeholder}
        autoFocus
        maxLength={2000}
        className={cn(
          'w-full min-h-[200px] px-4 py-3 rounded-xl text-[15px] leading-relaxed text-white placeholder:text-white/35',
          'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur resize-none',
          'focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/50 focus:outline-none',
          'transition-all',
          err && 'ring-red-500/60 focus:ring-red-500/70'
        )}
      />
      <div className="flex justify-between items-center text-[11px] px-1 min-h-[14px]">
        <span className="text-red-400/90">{err}</span>
        <span className="text-white/40 tabular-nums">{(value?.length ?? 0)}/2000</span>
      </div>
    </div>
  );
}
