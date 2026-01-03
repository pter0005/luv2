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

// Imports dinâmicos
const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />,
});
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-xl border border-white/10">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
      <p className="text-sm text-white/50">Carregando desafio...</p>
    </div>
  )
});

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);

  // 1. Só ativa o puzzle se ele estiver habilitado E tiver imagem
  const hasPuzzle = pageData.enablePuzzle && pageData.puzzleImage?.url;

  useEffect(() => {
    setIsClient(true);
    // Se não tem puzzle, já revela a página de cara
    if (!hasPuzzle) {
      setPuzzleRevealed(true);
    }
  }, [hasPuzzle]);

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

  // Função disparada quando o quebra-cabeça é resolvido
  const handleReveal = () => {
    console.log("Revelando surpresa...");
    setPuzzleRevealed(true);
  };

  if (showTimeline && timelineEventsForDisplay.length > 0) {
    return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />;
  }

  // Previne erros de hidratação (SSR)
  if (!isClient) return null;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      
      {/* CAMADA 1: Efeitos de Fundo (Sempre visíveis) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {pageData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
        {pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
        {pageData.backgroundAnimation === 'clouds' && (
          <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* CAMADA 2: Conteúdo Principal (A página em si) */}
      <motion.div 
        className={cn(
            "relative z-10 w-full min-h-screen flex flex-col items-center",
            !puzzleRevealed && hasPuzzle && "bg-black/30 backdrop-blur-lg" // Fundo borrado permanente
        )}
        initial={{ opacity: hasPuzzle ? 0 : 1, scale: hasPuzzle ? 0.9 : 1 }}
        animate={{ 
            opacity: puzzleRevealed ? 1 : (hasPuzzle ? 0 : 1),
            scale: puzzleRevealed ? 1 : (hasPuzzle ? 0.9 : 1),
        }}
        transition={{ duration: 1, ease: "easeOut", delay: hasPuzzle ? 0.5 : 0 }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center gap-y-12 md:gap-y-20 relative z-20">
          {/* Título e Mensagem */}
          <div className="space-y-6 text-center pt-16">
            <h1 className="text-4xl sm:text-6xl font-handwriting" style={{ color: pageData.titleColor }}>
              {pageData.title}
            </h1>
            <p className={cn(
              "text-white/80 whitespace-pre-wrap break-words max-w-2xl mx-auto text-lg",
              pageData.messageFontSize,
              pageData.messageFormatting?.includes("bold") && "font-bold",
              pageData.messageFormatting?.includes("italic") && "italic"
            )}>
              {pageData.message}
            </p>
          </div>

          {/* Contador */}
          {pageData.specialDate && (
            <Countdown
              targetDate={pageData.specialDate}
              style={pageData.countdownStyle as any}
              color={pageData.countdownColor}
            />
          )}

          {/* Botão da Timeline */}
          {timelineEventsForDisplay.length > 0 && (
            <Button onClick={() => setShowTimeline(true)} variant="secondary" className="backdrop-blur-md bg-white/10 border border-white/20">
              <View className="mr-2 h-4 w-4" /> Nossa Linha do Tempo
            </Button>
          )}

          {/* Galeria Swiper */}
          {pageData.galleryImages?.length > 0 && (
            <div className="w-full max-w-md mx-auto">
              <Swiper
                key={pageData.galleryStyle}
                effect={(pageData.galleryStyle || 'Cube').toLowerCase() as any}
                grabCursor={true}
                centeredSlides={pageData.galleryStyle === 'Coverflow'}
                slidesPerView={'auto'}
                autoplay={{ delay: 3000 }}
                modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
                pagination={{ clickable: true }}
                className="rounded-2xl overflow-hidden"
              >
                {pageData.galleryImages.map((img: any, i: number) => (
                  <SwiperSlide key={i}>
                    <div className="relative aspect-square">
                      <Image src={img.url} alt="foto" fill className="object-cover" unoptimized />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* Música/Áudio */}
          {pageData.musicOption === 'youtube' && pageData.youtubeUrl && <YoutubePlayer url={pageData.youtubeUrl} />}
          {pageData.musicOption === 'record' && pageData.audioRecording && <CustomAudioPlayer src={pageData.audioRecording} />}
        </div>
      </motion.div>

      {/* CAMADA 3: O QUEBRA-CABEÇA (Senta por cima de tudo) */}
      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60"
          >
            <div className="w-full max-w-lg space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white font-headline">Um enigma para você...</h2>
                <p className="text-white/60">Resolva o desafio para abrir seu presente.</p>
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
