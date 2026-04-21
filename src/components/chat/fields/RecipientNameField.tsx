'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

interface RecipientNameFieldProps {
  placeholder?: string;
}

export default function RecipientNameField({ placeholder = 'Ex: Ana, João, mãe…' }: RecipientNameFieldProps) {
  const { register, watch, formState: { errors } } = useFormContext<PageData>();
  const value = watch('recipientName');
  const err = errors.recipientName?.message;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          {...register('recipientName')}
          placeholder={placeholder}
          autoFocus
          maxLength={40}
          className={cn(
            'w-full h-14 px-4 rounded-xl text-[15px] text-white placeholder:text-white/35',
            'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur',
            'focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/50 focus:outline-none',
            'transition-all',
            err && 'ring-red-500/60 focus:ring-red-500/70'
          )}
        />
      </div>
      <div className="flex justify-between items-center text-[11px] px-1 min-h-[14px]">
        <span className="text-red-400/90">{err}</span>
        <span className="text-white/40 tabular-nums">{(value?.length ?? 0)}/40</span>
      </div>
      <p className="text-[11.5px] text-white/45 px-1 leading-relaxed">
        Só o primeiro nome — eu vou chamar ele(a) assim durante nossa conversa 💌
      </p>
    </div>
  );
}
