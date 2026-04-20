'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

export default function DateField() {
  const { control } = useFormContext<PageData>();
  return (
    <div className="space-y-2">
      <Controller
        control={control}
        name="specialDate"
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-12 w-full justify-start gap-2 text-base font-normal',
                  !field.value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {field.value
                  ? format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Escolher a data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
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
      <p className="text-xs text-muted-foreground px-1">
        Vamos usar essa data pra montar um contador de tempo juntos na página 💝
      </p>
    </div>
  );
}
