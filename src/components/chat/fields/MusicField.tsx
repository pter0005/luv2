'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Music, SkipForward } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PageData } from '@/lib/wizard-schema';

export default function MusicField() {
  const { control, setValue, watch } = useFormContext<PageData>();
  const option = watch('musicOption');

  return (
    <div className="space-y-3">
      {option === 'youtube' ? (
        <>
          <Controller
            control={control}
            name="youtubeUrl"
            render={({ field }) => (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Music className="w-4 h-4 text-purple-500" />
                  Link do YouTube
                </div>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-11"
                  autoFocus
                />
              </div>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => { setValue('musicOption', 'none'); setValue('youtubeUrl', ''); }}
          >
            <SkipForward className="w-4 h-4 mr-1" /> Pular, não quero música
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full h-14"
            onClick={() => setValue('musicOption', 'youtube')}
          >
            <Music className="w-4 h-4 mr-2 text-purple-500" />
            Colar link do YouTube
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Se quiser, você pode pular e deixar sem música também
          </p>
        </>
      )}
    </div>
  );
}
