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
import { Pause, Play, View, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);

  const hasPuzzle = pageData.enablePuzzle && pageData.puzzleImage?.url;

  useEffect(() => {
    setIsClient(true);
    if (!hasPuzzle) {
      setPuzzleRevealed(true);
    }
  }, [hasPuzzle]);

  const handleReveal = useCallback(() => {
    setPuzzleRevealed(true);
  }, []);

  const timelineEventsForDisplay = useMemo(() => {
    if (!pageData.timelineEvents) return [];
    return pageData.timelineEvents
        .filter((event: any) => event && event.image?.url)
        .map((event: any) => ({
            id: event.id || Math.random().toString(),
            imageUrl: event.image.url,
            alt: event.description || "Timeline Image",
            title: event.description,
            date: event.date ? new Date(event.date) : new Date(),
        }));
  }, [pageData.timelineEvents]);

  if (showTimeline) {
    return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />;
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      
      {/* CAMADA 1: FUNDO */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
        {pageData.backgroundAnimation === 'clouds' && (
          <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* CAMADA 2: CONTEÚDO */}
      <motion.div 
        className="relative z-10 w-full min-h-screen"
        initial={false}
        animate={{ 
          opacity: 1, 
          scale: puzzleRevealed ? 1 : 0.95,
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(15px)'
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
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

           {timelineEventsForDisplay.length > 0 && (
                <Button onClick={() => setShowTimeline(true)} variant="secondary" className="backdrop-blur-md bg-white/10 border border-white/20">
                    <View className="mr-2 h-4 w-4" /> Nossa Linha do Tempo
                </Button>
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
      </motion.div>

      {/* CAMADA 3: PUZZLE OVERLAY */}
      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && (
          <motion.div
            key="puzzle-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white font-headline">Um enigma para você...</h2>
                <p className="text-white/60">Resolva para ver a surpresa.</p>
              </div>
              <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                <RealPuzzle
                  imageSrc={pageData.puzzleImage.url}
                  showControls={false}
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

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const toggle = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <div className="flex items-center gap-4 p-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
      <Button onClick={toggle} size="icon" className="rounded-full bg-primary h-12 w-12 text-white">
        {isPlaying ? <Pause /> : <Play className="ml-1" />}
      </Button>
      <span className="text-white font-medium">Ouvir Mensagem</span>
    </div>
  );
}
