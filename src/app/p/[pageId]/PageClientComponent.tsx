'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import dynamic from 'next/dynamic';

import Countdown from '@/app/criar/fazer-eu-mesmo/Countdown';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import { Button } from '@/components/ui/button';
import { Pause, Play, View } from 'lucide-react';

const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);

  // CORREÇÃO AQUI: puzzleImage agora é a própria string Base64
  const hasPuzzle = pageData.enablePuzzle && !!pageData.puzzleImage;

  useEffect(() => {
    setIsClient(true);
    if (!hasPuzzle) setPuzzleRevealed(true);
  }, [hasPuzzle]);

  const handleReveal = useCallback(() => {
    console.log("REVELAÇÃO AUTORIZADA PELO PUZZLE!");
    setPuzzleRevealed(true);
  }, []);

  if (showTimeline) {
    return <Timeline events={pageData.timelineEvents} onClose={() => setShowTimeline(false)} />;
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen w-full bg-background relative">
      
      {/* CAMADA 1: FUNDO ANIMADO */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
      </div>

      {/* CAMADA 2: CONTEÚDO PRINCIPAL (VISÍVEL E DESFOCADO) */}
      <motion.main 
        className="relative z-10 w-full min-h-screen"
        initial={false}
        animate={{ 
          opacity: puzzleRevealed ? 1 : 0.6, 
          scale: puzzleRevealed ? 1 : 0.96,
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(15px)'
        }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ 
          pointerEvents: puzzleRevealed ? 'auto' : 'none' 
        }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center gap-y-16 relative z-20">
          <div className="space-y-6 text-center pt-20">
            <h1 className="text-5xl md:text-7xl font-handwriting" style={{ color: pageData.titleColor }}>
              {pageData.title}
            </h1>
            <p className={cn("text-white/80 whitespace-pre-wrap text-lg max-w-2xl mx-auto", pageData.messageFontSize)}>
              {pageData.message}
            </p>
          </div>

          {pageData.specialDate && (
            <Countdown targetDate={pageData.specialDate} style={pageData.countdownStyle} color={pageData.countdownColor} />
          )}

          {pageData.galleryImages?.length > 0 && (
            <div className="w-full max-w-md">
              <Swiper
                key={pageData.galleryStyle}
                effect={(pageData.galleryStyle || 'Cube').toLowerCase() as any}
                grabCursor modules={[EffectCoverflow, Pagination, Autoplay, EffectCards, EffectFlip, EffectCube]}
                pagination={{ clickable: true }}
                className="rounded-3xl shadow-2xl"
              >
                {pageData.galleryImages.map((img: any, i: number) => (
                  <SwiperSlide key={i}><div className="relative aspect-square"><Image src={img.url} alt="foto" fill className="object-cover" unoptimized /></div></SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      </motion.main>

      {/* CAMADA 3: PUZZLE OVERLAY (SÓ SUMIRÁ QUANDO RESOLVIDO) */}
      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && (
          <motion.div
            key="puzzle-overlay-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white font-headline">Um enigma para você...</h2>
                <p className="text-white/70">Encaixe as peças para ver a surpresa.</p>
              </div>
              <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                <RealPuzzle
                  imageSrc={pageData.puzzleImage} // PASSANDO A STRING BASE64 DIRETO
                  onReveal={handleReveal}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
