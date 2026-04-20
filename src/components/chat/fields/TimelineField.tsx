'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
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
  const { fields, append, remove, update } = useFieldArray({ control, name: 'timelineEvents' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) return;

    setUploading(true);
    try {
      for (const file of selected) {
        const compressed = await compressImage(file, 1400, 0.82);
        const uploaded = await uploadFile(firebase.storage, activeUser.uid, compressed, 'timeline');
        append({ id: crypto.randomUUID(), image: uploaded, description: '', date: undefined });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err?.message ?? 'Tente de novo.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />

      {fields.length < MAX_TIMELINE_IMAGES && (
        <Button
          type="button"
          className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.08] text-white ring-1 ring-dashed ring-white/20 backdrop-blur"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando…</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Adicionar momento ({fields.length}/{MAX_TIMELINE_IMAGES})</>
          )}
        </Button>
      )}
    </div>
  );
}
