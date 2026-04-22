'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFormContext } from 'react-hook-form';
import { Loader2, Smartphone } from 'lucide-react';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';

const PreviewContent = dynamic(
  () => import('@/app/criar/fazer-eu-mesmo/PreviewContent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    ),
  }
);

const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

export default function DesktopPreviewPane() {
  const [isClient, setIsClient] = useState(false);
  const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const locale = useLocale();
  const isEN = locale === 'en';

  const { watch } = useFormContext<PageData>();
  const introType = watch('introType');
  const enablePuzzle = watch('enablePuzzle' as any);
  const puzzleImage = watch('puzzleImage' as any);
  const timelineEventsRaw = watch('timelineEvents');

  const showEasterPreview = introType === 'love';
  const showPoemaPreview = introType === 'poema';
  const showPuzzlePreview = !!enablePuzzle && !!(puzzleImage && (typeof puzzleImage === 'string' ? puzzleImage : puzzleImage.url));

  // Mesma normalização da página final — sem isso, timeline some na prévia
  const timelineEventsForDisplay = useMemo(() => {
    if (!Array.isArray(timelineEventsRaw)) return [];
    return timelineEventsRaw
      .filter((event: any) => event && event.image && typeof event.image.url === 'string')
      .map((event: any) => {
        let dateObj: Date | undefined;
        if (event.date) {
          try {
            let d: Date;
            if (typeof event.date === 'object' && event.date !== null && (event.date.seconds !== undefined || event.date._seconds !== undefined)) {
              d = new Date((event.date.seconds || event.date._seconds) * 1000);
            } else {
              d = new Date(event.date);
            }
            if (!isNaN(d.getTime())) dateObj = d;
          } catch { /* ignore */ }
        }
        return {
          id: event.id || Math.random().toString(),
          imageUrl: event.image!.url,
          alt: 'Imagem da linha do tempo',
          title: event.description || '',
          date: dateObj,
        };
      });
  }, [timelineEventsRaw]);

  const hasValidTimelineEvents = timelineEventsForDisplay.length > 0;

  useEffect(() => { setIsClient(true); }, []);

  return (
    <div className="sticky top-24 flex flex-col items-center">
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/50">
        <Smartphone className="w-3 h-3" />
        <span>{isEN ? 'live preview' : 'prévia ao vivo'}</span>
      </div>
      <div
        className="relative w-full max-w-[360px] aspect-[9/19] rounded-[36px] overflow-hidden bg-black ring-1 ring-white/15"
        style={{
          boxShadow:
            '0 40px 120px -40px rgba(168,85,247,0.55), 0 20px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.04)',
        }}
      >
        <div
          aria-hidden
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-24 h-5 rounded-full bg-black/90 ring-1 ring-white/10"
        />
        <div
          className="absolute inset-0 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <PreviewContent
            bare
            isClient={isClient}
            onShowTimeline={() => setShowTimeline(true)}
            hasValidTimelineEvents={hasValidTimelineEvents}
            showPuzzlePreview={showPuzzlePreview}
            showEasterPreview={showEasterPreview}
            showPoemaPreview={showPoemaPreview}
            previewPuzzleRevealed={previewPuzzleRevealed}
            setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
          />
        </div>

        {showTimeline && hasValidTimelineEvents && (
          <div className="absolute inset-0 z-40 bg-black rounded-[36px] overflow-hidden">
            <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] text-white/40">{isEN ? 'updates as you type' : 'atualiza conforme você preenche'}</p>
    </div>
  );
}
