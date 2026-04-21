'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MAX_TIMELINE_IMAGES, type PageData } from '@/lib/wizard-schema';

export default function TimelineField() {
  const { control } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'timelineEvents' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_TIMELINE_IMAGES - fields.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Limite atingido', description: `Máximo de ${MAX_TIMELINE_IMAGES} momentos.` });
      return;
    }
    if (files.length > selected.length) {
      toast({ title: `${selected.length} de ${files.length} momentos`, description: `Limite de ${MAX_TIMELINE_IMAGES} atingido.` });
    }

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) return;

    setPendingCount(selected.length);
    let failed = 0;

    // Processa em paralelo limitado pra não saturar rede — mas os append()
    // acontecem sequencialmente depois, pra não dar race no useFieldArray.
    const CONCURRENCY = 3;
    const uploadOne = async (file: File) => {
      try {
        let toUpload: File | Blob = file;
        try {
          toUpload = await compressImage(file, 1400, 0.82);
        } catch (err) {
          console.warn('[timeline] compressImage falhou, enviando original', err);
        }
        const uploaded = await uploadFile(firebase.storage, activeUser!.uid, toUpload, 'timeline');
        return { ok: true as const, uploaded };
      } catch (err) {
        console.error('[timeline] upload falhou', err);
        return { ok: false as const };
      }
    };

    for (let i = 0; i < selected.length; i += CONCURRENCY) {
      const chunk = selected.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(uploadOne));
      for (const r of results) {
        if (r.ok) {
          append({ id: crypto.randomUUID(), image: r.uploaded, description: '', date: undefined });
        } else {
          failed++;
        }
        setPendingCount((n) => Math.max(0, n - 1));
      }
    }

    if (failed > 0) {
      toast({ variant: 'destructive', title: `${failed} ${failed === 1 ? 'momento falhou' : 'momentos falharam'}`, description: 'Tenta de novo.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [fields.length, user, firebase, append, toast]);

  return (
    <div className="space-y-3">
      {fields.map((f, i) => {
        const img = (f as any).image;
        return (
          <div key={f.id} className="flex gap-2 bg-white/[0.04] ring-1 ring-white/10 rounded-lg p-2">
            {img?.url && (
              <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-white/[0.05]">
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <Controller
                control={control}
                name={`timelineEvents.${i}.date`}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('h-8 w-full justify-start font-normal text-xs', !field.value && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {field.value ? format(field.value, 'dd MMM yyyy', { locale: ptBR }) : 'Data do momento'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <Controller
                control={control}
                name={`timelineEvents.${i}.description`}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Conta o que rolou..."
                    className="h-8 text-xs"
                    maxLength={120}
                  />
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="self-start text-white/60 hover:text-red-400 p-1"
              aria-label="Remover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Placeholders enquanto sobe */}
      {Array.from({ length: pendingCount }).map((_, i) => (
        <div key={`pending-${i}`} className="flex gap-2 bg-white/[0.03] ring-1 ring-pink-400/30 rounded-lg p-2">
          <div className="relative w-20 h-20 shrink-0 rounded-md bg-white/[0.05] flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-pink-300" />
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-[12px] text-white/50">Enviando momento…</span>
          </div>
        </div>
      ))}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />

      {fields.length < MAX_TIMELINE_IMAGES && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pendingCount > 0}
          className={cn(
            'w-full h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition active:scale-[0.98]',
            'bg-gradient-to-br from-pink-500/15 to-purple-500/10 hover:from-pink-500/25 hover:to-purple-500/20',
            'ring-1 ring-pink-400/30 hover:ring-pink-400/60',
            'disabled:opacity-60 disabled:cursor-wait'
          )}
        >
          {pendingCount > 0 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-pink-300" />
              <span className="text-[12px] font-semibold text-white">
                Enviando {pendingCount} {pendingCount === 1 ? 'momento' : 'momentos'}…
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-pink-300" />
                <span className="text-[13px] font-semibold text-white">
                  Adicionar momentos ({fields.length}/{MAX_TIMELINE_IMAGES})
                </span>
              </div>
              <span className="text-[10.5px] text-white/50">pode escolher várias fotos de uma vez</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
