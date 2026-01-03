
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import type { FileWithPreview } from '@/app/criar/fazer-eu-mesmo/CreatePageWizard';

// Imports dinâmicos
const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />,
});
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { 
  ssr: false,
  loading: () => <div className="flex flex-col items-center justify-center p-12 bg-card/20 rounded-xl"><Loader2 className="animate-spin" /><p>Carregando enigma...</p></div>
});

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  
  // Controle do Puzzle
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  
  const puzzleImageUrl = pageData.puzzleImage?.url;
  const isPuzzleActive = useMemo(() => {
    return isClient && pageData.enablePuzzle && !!puzzleImageUrl;
  }, [isClient, pageData.enablePuzzle, puzzleImageUrl]);

  useEffect(() => {
    setIsClient(true);
    // Se o puzzle não estiver ativo, revela a página imediatamente
    if (isClient && (!pageData.enablePuzzle || !puzzleImageUrl)) {
      setPuzzleRevealed(true);
    }
  }, [isClient, pageData.enablePuzzle, puzzleImageUrl]);

  useEffect(() => {
    if (cloudsVideoRef.current) {
      cloudsVideoRef.current.playbackRate = 0.6;
    }
  }, [pageData.backgroundAnimation]);

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

  if (showTimeline && timelineEventsForDisplay.length > 0) {
    return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      
      {/* 1. Camada de Fundo (Sempre visível) */}
      <div className="absolute inset-0 w-full h-full z-0">
        {isClient && pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {isClient && pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {isClient && pageData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
        {isClient && pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {isClient && pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
        {isClient && pageData.backgroundAnimation === 'clouds' && (
          <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
            <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* 2. Conteúdo Principal (O que fica desfocado no fundo) */}
      <motion.div 
        className="relative z-10 w-full min-h-screen"
        initial={false}
        animate={{ 
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(12px)',
          scale: puzzleRevealed ? 1 : 1.05,
          opacity: 1
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ 
          pointerEvents: puzzleRevealed ? 'auto' : 'none',
          userSelect: puzzleRevealed ? 'auto' : 'none'
        }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center gap-y-16 md:gap-y-24 relative z-20">
          <div className="space-y-6 text-center pt-16 md:pt-24">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-handwriting break-words"
              style={{ color: pageData.titleColor }}
            >
              {pageData.title}
            </h1>
            <p className={cn(
              "text-white/80 whitespace-pre-wrap break-words max-w-2xl mx-auto text-base sm:text-lg",
              pageData.messageFontSize,
              pageData.messageFormatting?.includes("bold") && "font-bold",
              pageData.messageFormatting?.includes("italic") && "italic",
              pageData.messageFormatting?.includes("strikethrough") && "line-through"
            )}>
              {pageData.message}
            </p>
          </div>

          {pageData.specialDate && (
            <Countdown
              targetDate={pageData.specialDate}
              style={pageData.countdownStyle as "Padrão" | "Simples"}
              color={pageData.countdownColor}
            />
          )}

          {timelineEventsForDisplay.length > 0 && (
            <Button onClick={() => setShowTimeline(true)} variant="secondary" className="shadow-lg backdrop-blur-sm bg-white/10">
              <View className="mr-2 h-4 w-4" /> Nossa Linha do Tempo
            </Button>
          )}

          {pageData.galleryImages?.length > 0 && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto overflow-visible">
              <Swiper
                key={pageData.galleryStyle}
                effect={(pageData.galleryStyle || 'Cube').toLowerCase() as any}
                grabCursor={true}
                centeredSlides={pageData.galleryStyle === 'Coverflow'}
                slidesPerView={'auto'}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
                pagination={{ clickable: true }}
                className="mySwiper"
              >
                {pageData.galleryImages.map((image: FileWithPreview, index: number) => (
                  <SwiperSlide key={index} className="bg-transparent">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <Image 
                        src={image.url} 
                        alt={`Galeria ${index + 1}`} 
                        fill 
                        className="object-cover" 
                        unoptimized 
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {isClient && pageData.musicOption === 'youtube' && pageData.youtubeUrl && (
            <YoutubePlayer url={pageData.youtubeUrl} />
          )}

          {isClient && pageData.musicOption === 'record' && pageData.audioRecording && (
            <CustomAudioPlayer src={pageData.audioRecording} />
          )}
        </div>
      </motion.div>

      {/* 3. Overlay do Puzzle (Senta em cima de tudo, z-40) */}
      <AnimatePresence>
        {isPuzzleActive && !puzzleRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.1,
              filter: "blur(20px)" 
            }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg mx-auto space-y-8">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-3 text-white drop-shadow-lg">
                  Um enigma para você...
                </h2>
                <p className="text-white/70 text-base md:text-lg max-w-xs mx-auto">
                  Resolva o quebra-cabeça para revelar a sua <span className="text-primary font-bold">surpresa</span>.
                </p>
              </motion.div>

              <div className="relative p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                <RealPuzzle
                  imageSrc={puzzleImageUrl}
                  showControls={false}
                  onReveal={() => setPuzzleRevealed(true)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Player de áudio customizado continua igual...
function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const togglePlayPause = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-4 p-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
      <Button onClick={togglePlayPause} size="icon" variant="ghost" className="rounded-full h-12 w-12 bg-primary hover:bg-primary/80 text-white">
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
      </Button>
      <span className="text-sm font-medium text-white">Mensagem de Voz</span>
    </div>
  );
}

    