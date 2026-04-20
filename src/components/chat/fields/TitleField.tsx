'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { PageData } from '@/lib/wizard-schema';

interface TitleFieldProps {
  placeholder?: string;
}

export default function TitleField({ placeholder = 'Ex: Para o amor da minha vida 💜' }: TitleFieldProps) {
  const { register, watch, formState: { errors } } = useFormContext<PageData>();
  const value = watch('title');
  const err = errors.title?.message;

  return (
    <div className="space-y-2">
      <Input
        {...register('title')}
        placeholder={placeholder}
        autoFocus
        maxLength={60}
        className="h-12 text-base"
      />
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span className="text-destructive">{err}</span>
        <span>{(value?.length ?? 0)}/60</span>
      </div>
    </div>
  );
}
