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
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Music className="w-4 h-4 text-purple-300" />
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
            className="w-full text-white/60 hover:text-white hover:bg-white/[0.06]"
            onClick={() => { setValue('musicOption', 'none'); setValue('youtubeUrl', ''); }}
          >
            <SkipForward className="w-4 h-4 mr-1" /> Pular, não quero música
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            className="w-full h-14 bg-white/[0.05] hover:bg-white/[0.1] text-white ring-1 ring-white/10 backdrop-blur"
            onClick={() => setValue('musicOption', 'youtube')}
          >
            <Music className="w-4 h-4 mr-2 text-purple-300" />
            Colar link do YouTube
          </Button>
          <p className="text-xs text-center text-white/50">
            Se quiser, você pode pular e deixar sem música também
          </p>
        </>
      )}
    </div>
  );
}
