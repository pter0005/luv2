'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import type { PageData } from '@/lib/wizard-schema';

interface MessageFieldProps {
  placeholder?: string;
}

export default function MessageField({
  placeholder = 'Desde o dia que te conheci, cada momento ao seu lado é...',
}: MessageFieldProps) {
  const { register, watch, formState: { errors } } = useFormContext<PageData>();
  const value = watch('message');
  const err = errors.message?.message;

  return (
    <div className="space-y-2">
      <Textarea
        {...register('message')}
        placeholder={placeholder}
        autoFocus
        maxLength={2000}
        className="min-h-[200px] text-[15px] leading-relaxed resize-none"
      />
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span className="text-destructive">{err}</span>
        <span>{(value?.length ?? 0)}/2000</span>
      </div>
    </div>
  );
}
