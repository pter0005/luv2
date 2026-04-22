'use client';

import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { PageData } from '@/lib/wizard-schema';

const PreviewContent = dynamic(
  () => import('@/app/criar/fazer-eu-mesmo/PreviewContent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-white/70">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ),
  }
);

const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

// Guarda na sessão que a intro já foi vista — evita forçar a pessoa a montar
// o quebra-cabeça toda vez que ela clica em "ver como está ficando".
const INTRO_SEEN_KEY = 'chat-preview-intro-seen-v1';

export default function PreviewModal({ open, onClose }: PreviewModalProps) {
  const { watch } = useFormContext<PageData>();
  const [isClient, setIsClient] = React.useState(false);
  // previewPuzzleRevealed=true significa "pular a intro, mostrar a página final".
  // Começamos true e só setamos false se for a primeira vez nessa sessão.
  const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = React.useState(true);
  const [showTimeline, setShowTimeline] = React.useState(false);

  const introType = watch('introType');
  const enablePuzzle = watch('enablePuzzle' as any);
  const puzzleImage = watch('puzzleImage' as any);
  const timelineEventsRaw = watch('timelineEvents');

  // Mesma normalização usada na página final (PageClientComponent).
  // Sem isso, a timeline aparece vazia no preview mesmo com eventos salvos.
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

  const showEasterPreview = introType === 'love';
  const showPoemaPreview = introType === 'poema';
  const showPuzzlePreview = !!enablePuzzle && !!(puzzleImage && (typeof puzzleImage === 'string' ? puzzleImage : puzzleImage.url));
  const hasAnyIntro = showEasterPreview || showPoemaPreview || showPuzzlePreview;

  // Ao abrir: se a pessoa nunca viu a intro nessa sessão e tem intro configurada,
  // dispara. Caso contrário, vai direto pra página final — mas com botão de replay.
  useEffect(() => {
    if (!open) return;
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch {}
    setPreviewPuzzleRevealed(seen || !hasAnyIntro);
  }, [open, hasAnyIntro]);

  // Quando a intro é revelada (finalizada), marca como vista.
  useEffect(() => {
    if (previewPuzzleRevealed && hasAnyIntro) {
      try { sessionStorage.setItem(INTRO_SEEN_KEY, '1'); } catch {}
    }
  }, [previewPuzzleRevealed, hasAnyIntro]);

  const replayIntro = React.useCallback(() => {
    try { sessionStorage.removeItem(INTRO_SEEN_KEY); } catch {}
    setPreviewPuzzleRevealed(false);
  }, []);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  // Só mostra o botão "ver intro" quando a página final tá visível E existe intro
  // — não faz sentido oferecer replay se não tem o que replayar.
  const showReplayButton = hasAnyIntro && previewPuzzleRevealed;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-sm h-[85vh] max-h-[820px] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 ring-1 ring-white/20"
          aria-label="Fechar pré-visualização"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute top-3 left-3 z-50 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] uppercase tracking-widest ring-1 ring-white/20">
          Prévia
        </div>

        {showReplayButton && (
          <button
            type="button"
            onClick={replayIntro}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[11.5px] font-semibold shadow-lg ring-1 ring-white/20 active:scale-[0.97] transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ver intro de novo
          </button>
        )}

        <div className="w-full h-full">
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
          <div className="absolute inset-0 z-[60] bg-black">
            <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}
