
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
import { Pause, Play, View } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { FileWithPreview } from '@/app/criar/fazer-eu-mesmo/CreatePageWizard';

// Dynamically import client-side components
const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />,
});
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });

// =================================================================
// Main Client Component
// =================================================================
export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  
  // Puzzle State
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  
  const puzzleImageUrl = pageData.puzzleImage?.url;
  const isPuzzleActive = useMemo(() => {
    return isClient && pageData.enablePuzzle && puzzleImageUrl;
  }, [isClient, pageData.enablePuzzle, puzzleImageUrl]);

  useEffect(() => {
    setIsClient(true);
    // If puzzle is not enabled, consider it "revealed" from the start
    if (!isPuzzleActive) {
      setPuzzleRevealed(true);
    }
  }, [isPuzzleActive]);

  useEffect(() => {
    if (cloudsVideoRef.current) {
      cloudsVideoRef.current.playbackRate = 0.6;
    }
  }, [pageData.backgroundAnimation]);

  const backgroundVideoUrl = pageData.backgroundVideo?.url;
  useEffect(() => {
    if (customVideoRef.current && backgroundVideoUrl) {
      customVideoRef.current.src = backgroundVideoUrl;
    }
  }, [backgroundVideoUrl]);

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

  const hasTimeline = timelineEventsForDisplay.length > 0;

  if (showTimeline && hasTimeline) {
    return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full z-0">
        {isClient && pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {isClient && pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {isClient && pageData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
        {isClient && pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {isClient && pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
        {isClient && pageData.backgroundAnimation === 'clouds' && (
          <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
          </video>
        )}
        {isClient && pageData.backgroundAnimation === 'custom-video' && backgroundVideoUrl && (
          <video key={backgroundVideoUrl} ref={customVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={backgroundVideoUrl} type="video/mp4" />
          </video>
        )}
      </div>

      {/* Puzzle Overlay */}
      <AnimatePresence>
        {isPuzzleActive && !puzzleRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-8 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 md:gap-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-2 text-white">Um enigma para você...</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Resolva o quebra-cabeça para revelar a <span className="text-primary font-semibold">surpresa</span>.
                </p>
              </div>
              <RealPuzzle
                imageSrc={puzzleImageUrl}
                showControls={false}
                onReveal={() => setPuzzleRevealed(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div 
        className="min-h-screen w-full"
        animate={{ 
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(8px)', 
          scale: puzzleRevealed ? 1 : 1.05 
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ pointerEvents: puzzleRevealed ? 'auto' : 'none' }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center gap-y-16 md:gap-y-24 relative z-10">
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

          {hasTimeline && (
            <Button onClick={() => setShowTimeline(true)}><View className="mr-2 h-4 w-4" /> Nossa Linha do Tempo</Button>
          )}

          {pageData.galleryImages && pageData.galleryImages.length > 0 && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto">
              <Swiper
                key={pageData.galleryStyle}
                effect={(pageData.galleryStyle || 'Cube').toLowerCase() as 'coverflow' | 'cards' | 'flip' | 'cube'}
                grabCursor={true}
                centeredSlides={pageData.galleryStyle === 'Coverflow'}
                slidesPerView={'auto'}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                coverflowEffect={{
                  rotate: 50,
                  stretch: 0,
                  depth: 100,
                  modifier: 1,
                  slideShadows: true,
                }}
                cardsEffect={{
                  perSlideRotate: 2,
                  perSlideOffset: 8,
                  slideShadows: true,
                }}
                cubeEffect={{
                  shadow: true,
                  slideShadows: true,
                  shadowOffset: 20,
                  shadowScale: 0.94,
                }}
                pagination={{ clickable: true }}
                modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
                className="mySwiper"
              >
                {pageData.galleryImages.map((image: FileWithPreview, index: number) => (
                  <SwiperSlide key={index} className="bg-transparent">
                    <div className="relative w-full aspect-square">
                      <Image src={image.url} alt={`Imagem da galeria ${index + 1}`} layout="fill" className="object-cover rounded-lg shadow-2xl" unoptimized loading="lazy" />
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
    </div>
  );
};


const CustomAudioPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
      <audio ref={audioRef} src={src} className="hidden" />
      <Button onClick={togglePlayPause} size="icon" variant="ghost" className="text-primary-foreground bg-primary/80 hover:bg-primary">
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>
      <p className="text-sm text-primary-foreground font-semibold">Sua mensagem de voz</p>
    </div>
  );
};
