'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Wifi, Signal, BatteryFull } from 'lucide-react';

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

export default function DesktopPreviewPane() {
  const [isClient, setIsClient] = useState(false);
  const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = useState(true);
  const [nowLabel, setNowLabel] = useState('9:41');

  useEffect(() => {
    setIsClient(true);
    const update = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setNowLabel(`${hh}:${mm}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-24 flex flex-col items-center">
      <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
        <span>prévia ao vivo</span>
      </div>

      {/* Chassi do iPhone — mais grosso, com detalhes */}
      <div
        className="relative"
        style={{
          width: 'min(460px, 100%)',
          aspectRatio: '9 / 19.2',
          filter: 'drop-shadow(0 60px 80px rgba(168,85,247,0.28)) drop-shadow(0 30px 60px rgba(0,0,0,0.5))',
        }}
      >
        {/* Botões laterais do aparelho */}
        <div
          aria-hidden
          className="absolute -left-[3px] top-[16%] w-[3px] h-[5%] rounded-l-sm"
          style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
        />
        <div
          aria-hidden
          className="absolute -left-[3px] top-[26%] w-[3px] h-[8%] rounded-l-sm"
          style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
        />
        <div
          aria-hidden
          className="absolute -left-[3px] top-[36%] w-[3px] h-[8%] rounded-l-sm"
          style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
        />
        <div
          aria-hidden
          className="absolute -right-[3px] top-[22%] w-[3px] h-[12%] rounded-r-sm"
          style={{ background: 'linear-gradient(90deg, #2a2a2a, #1a1a1a)' }}
        />

        {/* Frame externo do aparelho (titânio escuro) */}
        <div
          className="absolute inset-0 rounded-[52px] p-[10px]"
          style={{
            background:
              'linear-gradient(155deg, #2a2530 0%, #15131a 35%, #0a0910 65%, #1c1a22 100%)',
            boxShadow:
              'inset 0 0 0 1.5px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',
          }}
        >
          {/* Bisel interno */}
          <div
            className="relative w-full h-full rounded-[44px] overflow-hidden bg-black"
            style={{
              boxShadow:
                'inset 0 0 0 2px #000, inset 0 0 0 3px rgba(255,255,255,0.04)',
            }}
          >
            {/* Dynamic Island */}
            <div
              aria-hidden
              className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-[32%] h-[22px] rounded-full bg-black"
              style={{
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 2px rgba(255,255,255,0.02)',
              }}
            >
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a] ring-1 ring-white/10" />
            </div>

            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-30 h-[38px] flex items-center justify-between px-7 text-white text-[12px] font-semibold tabular-nums pointer-events-none">
              <span>{nowLabel}</span>
              <div className="flex items-center gap-1 text-white/90">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <BatteryFull className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Viewport com scroll */}
            <div className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <PreviewContent
                isClient={isClient}
                onShowTimeline={() => { /* noop na prévia */ }}
                hasValidTimelineEvents={false}
                showPuzzlePreview={false}
                showEasterPreview={false}
                showPoemaPreview={false}
                previewPuzzleRevealed={previewPuzzleRevealed}
                setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
              />
            </div>

            {/* Home indicator */}
            <div
              aria-hidden
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 w-[34%] h-[5px] rounded-full bg-white/80"
            />

            {/* Reflexo sutil no topo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[30%] z-20"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 80%)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-1">
        <p className="text-[12px] text-white/55 font-medium">é assim que vai ficar</p>
        <p className="text-[10.5px] text-white/35">atualiza enquanto você preenche</p>
      </div>
    </div>
  );
}
