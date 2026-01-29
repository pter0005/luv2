'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-flip';
import 'swiper/css/effect-cube';
import dynamic from 'next/dynamic';
import { setCookie, hasCookie } from 'cookies-next';

import Countdown from '@/app/criar/fazer-eu-mesmo/Countdown';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import { Button } from '@/components/ui/button';
import { View, Puzzle, Loader2, Play, CheckCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import NebulaBackground from '@/components/effects/NebulaBackground';
import PurpleExplosion from '@/components/effects/PurpleExplosion';

// Imports Dinâmicos
const YoutubePlayer = dynamic(() => import('@/components/ui/YoutubePlayer'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });
const CustomAudioPlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/CustomAudioPlayer'), { ssr: false });

const GalleryImage = ({ img, index }: { img: any, index: number }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div className="relative w-full h-full bg-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                   <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                </div>
            )}
            <Image 
                src={img.url} 
                alt={`Imagem da galeria ${index + 1}`} 
                fill 
                className={cn(
                    "object-cover transition-opacity duration-700 ease-in-out z-10", 
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                sizes="(max-width: 768px) 90vw, 448px" 
                priority={index === 0}
                onLoadingComplete={() => setIsLoaded(true)}
            />
        </div>
    )
}

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [isPuzzleComplete, setIsPuzzleComplete] = useState(false);
  
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const playerRef = useRef<{ play: () => void }>(null);

  const headerLogoUrl = PlaceHolderImages.find((p) => p.id === 'lovePageLogo')?.imageUrl || '';

  const cookieName = `puzzle_solved_${pageData.id}`;

  const hasPuzzle = useMemo(() => {
    if (!pageData.enablePuzzle || !pageData.puzzleImage?.url) return false;
    return !pageData.puzzleImage.path.includes('temp/');
  }, [pageData.enablePuzzle, pageData.puzzleImage]);

  const timelineEventsForDisplay = useMemo(() => {
    if (!pageData.timelineEvents) return [];
    return pageData.timelineEvents
      .filter((event: any) => event.image?.url && !event.image.path.includes('temp/'))
      .map((event: any) => ({
        id: event.id || Math.random().toString(),
        imageUrl: event.image!.url,
        alt: event.description || 'Timeline image',
        title: event.description || '',
        date: event.date ? new Date(event.date._seconds ? event.date._seconds * 1000 : event.date) : undefined,
      }));
  }, [pageData.timelineEvents]);
  
  const hasValidTimelineEvents = timelineEventsForDisplay.length > 0;

  const handleReveal = useCallback(() => {
    setShowExplosion(true);
    setPuzzleRevealed(true);
    playerRef.current?.play();
    setCookie(cookieName, 'true', { maxAge: 60 * 60 * 24 * 30, path: '/' }); 

    setTimeout(() => {
        setShowExplosion(false);
    }, 2000); // Allow remnants to fade
  }, [cookieName]);

  useEffect(() => {
    setIsClient(true);
    if (hasCookie(cookieName)) {
      setPuzzleRevealed(true);
    } else if (!hasPuzzle) {
      setPuzzleRevealed(true);
    }
  }, [hasPuzzle, cookieName]);

  useEffect(() => {
    if (isPuzzleComplete) {
      const timer = setTimeout(() => {
        handleReveal();
      }, 700); // Wait for user to see the checkmark
      return () => clearTimeout(timer);
    }
  }, [isPuzzleComplete, handleReveal]);
  
  const targetDateIso = useMemo(() => {
    if (!pageData.specialDate) return null;
    const d = pageData.specialDate;
    const ms = d?._seconds ? d._seconds * 1000 : (d?.seconds ? d.seconds * 1000 : new Date(d).getTime());
    return new Date(ms).toISOString();
  }, [pageData.specialDate]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden">
      
      {/* CAMADA DE EFEITOS ESPECIAIS */}
      <AnimatePresence>
        {showExplosion && (
            <motion.div 
                initial={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[999] pointer-events-none"
            >
                <PurpleExplosion />
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* CAMADA 0: CABEÇALHO */}
      <header className="top-0 left-0 w-full pt-8 pb-4 flex justify-center z-30 relative pointer-events-none">
        <Image
          src={headerLogoUrl}
          alt="Amore Pages"
          width={220}
          height={220}
          className="w-48 h-48 md:w-56 md:h-56 object-contain"
          priority
        />
      </header>
      
      {/* CAMADA 1: FUNDO ANIMADO */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none translate-z-0">
        {pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {pageData.backgroundAnimation === 'nebula' && <NebulaBackground />}
        {pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
      </div>

      {/* CAMADA 2: CONTEÚDO PRINCIPAL (COM MUITO ESPAÇO) */}
      <motion.main 
        className="relative z-10 w-full min-h-screen pb-32" // pb-32 garante espaço extra no final
        initial={false}
        animate={{ 
          opacity: puzzleRevealed ? 1 : 0.4, 
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(15px)',
        }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center gap-y-20 relative z-20">
          
          <div className="space-y-8 text-center mt-4">
            <h1 className="text-4xl md:text-7xl font-handwriting leading-tight drop-shadow-lg px-2" style={{ color: pageData.titleColor }}>
              {pageData.title}
            </h1>
            <p className={cn("text-white/90 whitespace-pre-wrap text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md px-4", pageData.messageFontSize, pageData.messageFormatting?.includes("bold") && "font-bold", pageData.messageFormatting?.includes("italic") && "italic", pageData.messageFormatting?.includes("strikethrough") && "line-through")}>
              {pageData.message}
            </p>
          </div>

          {targetDateIso && (
            <div className="w-full">
                <Countdown targetDate={targetDateIso} style={pageData.countdownStyle} color={pageData.countdownColor} />
            </div>
          )}
          
          {hasValidTimelineEvents && (
            <div className="text-center w-full">
                <Button 
                    type="button"
                    onClick={() => setShowTimeline(true)} 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-8 py-6 text-lg rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 w-full max-w-xs"
                >
                    <View className="mr-2 h-5 w-5" /> Nossa Linha do Tempo
                </Button>
            </div>
          )}

          {pageData.galleryImages?.length > 0 && (
            <div className="w-full max-w-[90vw] md:max-w-md mx-auto relative z-10">
              <Swiper
                effect={(pageData.galleryStyle || 'coverflow').toLowerCase() as any}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'} 
                spaceBetween={30}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                coverflowEffect={{ rotate: 30, stretch: 0, depth: 100, modifier: 1, slideShadows: true }}
                cubeEffect={{ shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 }}
                pagination={{ clickable: true, dynamicBullets: true }}
                modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
                className="mySwiper w-full aspect-square !overflow-visible py-8"
              >
                {pageData.galleryImages.map((img: any, i: number) => (
                  <SwiperSlide key={img.url || i} className='!w-full !h-full rounded-2xl'>
                      <GalleryImage img={img} index={i} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* ÁREA DO PLAYER (ISOLADA E COM ESPAÇO) */}
          <div className="w-full max-w-[95vw] md:max-w-sm z-10 mt-12 mb-12 flex justify-center">
             {pageData.musicOption === 'youtube' && pageData.youtubeUrl && (
                <YoutubePlayer 
                  ref={playerRef}
                  url={pageData.youtubeUrl}
                  songName={pageData.songName}
                  artistName={pageData.artistName}
                  volume={0.6}
                />
             )}
             
             {pageData.musicOption === 'record' && pageData.audioRecording?.url && (
                <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl w-full">
                    <CustomAudioPlayer src={pageData.audioRecording.url} />
                </div>
             )}
          </div>

        </div>
      </motion.main>

      {/* OVERLAYS MANTIDOS IGUAIS... */}
      <AnimatePresence>
        {showTimeline && (
          <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && pageData.puzzleImage?.url && (
          <motion.div
            key="puzzle-overlay-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center space-y-3">
                 <div className="inline-block p-3 bg-white/5 rounded-full mb-2">
                    <Puzzle className="w-8 h-8 text-purple-400" />
                 </div>
                <h2 className="text-3xl font-bold text-white font-headline">
                    Um enigma para você...
                </h2>
                <p className="text-white/60 text-sm">Monte o quebra-cabeça para desbloquear sua surpresa.</p>
              </div>

               <AnimatePresence mode="wait">
                {!isPuzzleComplete ? (
                   <motion.div key="puzzle-view" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                        <RealPuzzle
                            imageSrc={pageData.puzzleImage.url}
                            onReveal={() => setIsPuzzleComplete(true)}
                        />
                        </div>
                   </motion.div>
                ) : (
                    <motion.div
                        key="reveal-button-view"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex flex-col items-center gap-6 pt-4"
                    >
                        <div className="p-4 bg-green-500/10 rounded-full border-2 border-green-500/20">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Desafio Concluído!</h3>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
