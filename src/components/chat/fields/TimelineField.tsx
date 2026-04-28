'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { CalendarIcon, ImagePlus, Loader2, X } from 'lucide-react';
import { useLocale } from 'next-intl';
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
  const { control, setValue, getValues } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'timelineEvents' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();
  const locale = useLocale();
  const isEN = locale === 'en';
  const dateLocale = isEN ? enUS : ptBR;

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_TIMELINE_IMAGES - fields.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: isEN ? 'Limit reached' : 'Limite atingido', description: isEN ? `Max ${MAX_TIMELINE_IMAGES} moments.` : `Máximo de ${MAX_TIMELINE_IMAGES} momentos.` });
      return;
    }
    if (files.length > selected.length) {
      toast({ title: isEN ? `${selected.length} of ${files.length} moments` : `${selected.length} de ${files.length} momentos`, description: isEN ? `Max ${MAX_TIMELINE_IMAGES} reached.` : `Limite de ${MAX_TIMELINE_IMAGES} atingido.` });
    }

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      try {
        const cred = await signInAnonymously(firebase.auth);
        activeUser = cred.user;
      } catch {
        toast({ variant: 'destructive', title: isEN ? 'Error' : 'Erro', description: isEN ? 'Couldn\'t start the session.' : 'Não foi possível iniciar a sessão.' });
        return;
      }
    }
    if (!activeUser) return;

    setValue('_uploadingCount' as any, ((getValues as any)('_uploadingCount') || 0) + 1);
    setPendingCount(selected.length);
    let failed = 0;

    // Processa em paralelo limitado pra não saturar rede — mas os append()
    // acontecem sequencialmente depois, pra não dar race no useFieldArray.
    const CONCURRENCY = 6;
    const uploadOne = async (file: File) => {
      try {
        let toUpload: File | Blob = file;
        try {
          // Timeline é miniatura de 80x80 na lista — 1100px basta.
          toUpload = await compressImage(file, 1100, 0.76);
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

    setValue('_uploadingCount' as any, Math.max(0, ((getValues as any)('_uploadingCount') || 0) - 1));

    if (failed > 0) {
      toast({ variant: 'destructive', title: isEN ? `${failed} ${failed === 1 ? 'moment failed' : 'moments failed'}` : `${failed} ${failed === 1 ? 'momento falhou' : 'momentos falharam'}`, description: isEN ? 'Try again.' : 'Tenta de novo.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [fields.length, user, firebase, append, toast, setValue, getValues]);

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
                        {field.value ? format(field.value, 'dd MMM yyyy', { locale: dateLocale }) : (isEN ? 'Moment date' : 'Data do momento')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={dateLocale}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1960}
                        toYear={new Date().getFullYear()}
                      />
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
                    placeholder={isEN ? 'Tell what happened...' : 'Conta o que rolou...'}
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
              aria-label={isEN ? 'Remove' : 'Remover'}
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
            <span className="text-[12px] text-white/50">{isEN ? 'Uploading moment…' : 'Enviando momento…'}</span>
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
                {isEN
                  ? `Uploading ${pendingCount} ${pendingCount === 1 ? 'moment' : 'moments'}…`
                  : `Enviando ${pendingCount} ${pendingCount === 1 ? 'momento' : 'momentos'}…`}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-pink-300" />
                <span className="text-[13px] font-semibold text-white">
                  {isEN ? `Add moments (${fields.length}/${MAX_TIMELINE_IMAGES})` : `Adicionar momentos (${fields.length}/${MAX_TIMELINE_IMAGES})`}
                </span>
              </div>
              <span className="text-[10.5px] text-white/50">{isEN ? 'you can pick multiple photos at once' : 'pode escolher várias fotos de uma vez'}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
