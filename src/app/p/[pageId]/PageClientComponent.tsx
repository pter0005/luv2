// ESTE ARQUIVO AGORA É A VERSÃO 2 (V2)
// As páginas antigas usarão PageClientComponentV1.tsx
// Todas as suas novas alterações devem ser feitas aqui.

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

import Countdown from '@/app/criar/fazer-eu-mesmo/Countdown';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import { Button } from '@/components/ui/button';
import { View, Puzzle, Loader2, Play, CheckCircle, Instagram, Mail, MessageSquare, Gamepad2, BrainCircuit, ArrowLeft, X, HelpCircle, Clock, AlertTriangle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import NebulaBackground from '@/components/effects/NebulaBackground';
import PurpleExplosion from '@/components/effects/PurpleExplosion';
import MysticFlowers from '@/components/effects/MysticFlowers';
import { Skeleton } from '@/components/ui/skeleton';


// Imports Dinâmicos
const YoutubePlayer = dynamic(() => import('@/components/ui/YoutubePlayer'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });
const CustomAudioPlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/CustomAudioPlayer'), { ssr: false });
const MemoryGame = dynamic(() => import('@/components/memory-game/MemoryGame'), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />,
});
const QuizGame = dynamic(() => import('@/components/quiz/QuizGame'), { ssr: false, loading: () => <Skeleton className="w-full aspect-square" />, });


const GalleryImage = React.memo(({ img, index }: { img: any, index: number }) => {
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
});
GalleryImage.displayName = 'GalleryImage';

// ─────────────────────────────────────────────────────────────
// EXPIRY BANNER — mostra quando plano basico está quase expirando
// ─────────────────────────────────────────────────────────────
function ExpiryBanner({ expireAt }: { expireAt: any }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const getExpiryDate = () => {
            if (!expireAt) return null;
            if (typeof expireAt === 'object' && (expireAt.seconds || expireAt._seconds)) {
                return new Date((expireAt.seconds || expireAt._seconds) * 1000);
            }
            const d = new Date(expireAt);
            return isNaN(d.getTime()) ? null : d;
        };

        const expiryDate = getExpiryDate();
        if (!expiryDate) return;

        const tick = () => {
            const diff = expiryDate.getTime() - Date.now();
            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft(null);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expireAt]);

    // Não mostrar se não tiver expiração (plano avançado)
    if (!expireAt) return null;
    // Não mostrar se ainda falta mais de 5 horas
    if (timeLeft && timeLeft.hours >= 5) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-[200] px-4 py-3 text-center text-sm font-bold",
                isExpired
                    ? "bg-red-600 text-white"
                    : "bg-amber-500 text-black"
            )}
        >
            {isExpired ? (
                <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Esta página expirou.</span>
                    <a href="https://mycupid.com.br" className="underline ml-2">Criar nova página →</a>
                </div>
            ) : timeLeft ? (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Clock size={16} className="animate-pulse" />
                    <span>
                        Esta página expira em{' '}
                        <span className="tabular-nums font-black">
                            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
                            {String(timeLeft.minutes).padStart(2, '0')}m{' '}
                            {String(timeLeft.seconds).padStart(2, '0')}s
                        </span>
                    </span>
                    <a
                        href="https://mycupid.com.br"
                        className="ml-3 px-3 py-1 bg-black/20 hover:bg-black/30 rounded-full text-xs transition-all"
                    >
                        Tornar permanente →
                    </a>
                </div>
            ) : null}
        </motion.div>
    );
}

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [isPuzzleComplete, setIsPuzzleComplete] = useState(false);
  
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const playerRef = useRef<{ play: () => void }>(null);

  const puzzleImageSrc = useMemo(() => {
    if (!pageData.puzzleImage) return null;
    if (typeof pageData.puzzleImage === 'object' && pageData.puzzleImage.url) {
        return pageData.puzzleImage.url;
    }
    if (typeof pageData.puzzleImage === 'string') {
        return pageData.puzzleImage;
    }
    return null;
  }, [pageData.puzzleImage]);

  const hasPuzzle = useMemo(() => {
    return !!(pageData.enablePuzzle && puzzleImageSrc);
  }, [pageData.enablePuzzle, puzzleImageSrc]);

  const hasMemoryGame = useMemo(() => {
    return !!(pageData.enableMemoryGame && pageData.memoryGameImages?.length > 0);
  }, [pageData.enableMemoryGame, pageData.memoryGameImages]);

  const hasQuiz = useMemo(() => !!(pageData.enableQuiz && pageData.quizQuestions?.length > 0), [pageData.enableQuiz, pageData.quizQuestions]);

  const timelineEventsForDisplay = useMemo(() => {
    if (!Array.isArray(pageData.timelineEvents)) return [];
    return pageData.timelineEvents
      .filter((event: any) => event && event.image && typeof event.image.url === 'string')
      .map((event: any) => {
        let dateObj;
        if (event.date) {
            try {
                let d: Date;
                if (typeof event.date === 'object' && event.date !== null && (event.date.seconds !== undefined || event.date._seconds !== undefined)) {
                    d = new Date((event.date.seconds || event.date._seconds) * 1000);
                } else {
                    d = new Date(event.date);
                }
                if (!isNaN(d.getTime())) dateObj = d;
            } catch {
                dateObj = undefined;
            }
        }
        return {
            id: event.id || Math.random().toString(),
            imageUrl: event.image!.url,
            alt: 'Imagem da linha do tempo',
            title: event.description || '',
            date: dateObj,
        };
      });
  }, [pageData.timelineEvents]);
  
  const hasValidTimelineEvents = timelineEventsForDisplay.length > 0;

  const handleReveal = useCallback(() => {
    setShowExplosion(true);
    setPuzzleRevealed(true);
    playerRef.current?.play();
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (!hasPuzzle) {
      setPuzzleRevealed(true);
    }
  }, [hasPuzzle]);

  useEffect(() => {
    if (isPuzzleComplete) {
      const timer = setTimeout(() => { handleReveal(); }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPuzzleComplete, handleReveal]);
  
  const targetDateIso = useMemo(() => {
    if (!pageData.specialDate) return null;
    const d = pageData.specialDate;
    try {
        let date: Date | null = null;
        if (d && typeof d === 'object') {
            const seconds = (d as any)._seconds || (d as any).seconds;
            if (seconds) date = new Date(seconds * 1000);
        } else if (d) {
            date = new Date(d);
        }
        if (date && !isNaN(date.getTime())) return date.toISOString();
    } catch {
        return null;
    }
    return null;
  }, [pageData.specialDate]);

  if (!isClient) return null;

  const isFormattingArray = Array.isArray(pageData.messageFormatting);

  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden">
      
      {/* BANNER DE EXPIRAÇÃO — plano basico próximo de expirar */}
      <ExpiryBanner expireAt={pageData.expireAt} />
      
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] pointer-events-none"
          >
            <PurpleExplosion onComplete={() => setShowExplosion(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="top-0 left-0 w-full pt-8 pb-4 flex justify-center z-30 relative pointer-events-none">
        <Image
          src="https://i.imgur.com/3jk3dFB.png"
          alt="MyCupid Logo"
          width={600}
          height={171}
          className="w-auto h-28 object-contain"
          priority
        />
      </header>
      
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none translate-z-0">
        {puzzleRevealed && pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {puzzleRevealed && pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {puzzleRevealed && pageData.backgroundAnimation === 'nebula' && <NebulaBackground />}
        {puzzleRevealed && pageData.backgroundAnimation === 'mystic-flowers' && <MysticFlowers />}
        {puzzleRevealed && pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {puzzleRevealed && pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
      </div>

      <motion.main 
        className="relative z-10 w-full min-h-screen pb-24"
        initial={false}
        animate={{ 
          opacity: puzzleRevealed ? 1 : 0.4, 
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(15px)',
        }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center gap-y-16 relative z-20">
          
          <div className="space-y-8 text-center mt-4">
            <h1 className="text-4xl md:text-7xl font-handwriting leading-tight drop-shadow-lg px-2" style={{ color: pageData.titleColor }}>
              {pageData.title}
            </h1>
            <p className={cn("text-white/90 whitespace-pre-wrap text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md px-4", 
                pageData.messageFontSize,
                isFormattingArray && pageData.messageFormatting.includes("bold") && "font-bold",
                isFormattingArray && pageData.messageFormatting.includes("italic") && "italic",
                isFormattingArray && pageData.messageFormatting.includes("strikethrough") && "line-through"
              )}>
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
          
          {(hasMemoryGame || hasQuiz) && (
              <div className="text-center w-full">
                  <Button 
                      type="button"
                      onClick={() => setShowGames(true)} 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-8 py-6 text-lg rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 w-full max-w-xs"
                  >
                      <Gamepad2 className="mr-2 h-5 w-5" /> Vamos Jogar?
                  </Button>
              </div>
          )}

          <div className="w-full max-w-[95vw] md:max-w-sm z-10 mt-8 mb-8 flex justify-center">
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
        <footer className="relative z-10 w-full mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">Siga-nos</p>
            <div className="flex items-center justify-center gap-4">
            <a href="https://www.instagram.com/mycupid.oficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-purple-500 hover:text-white transition-all duration-300">
                <Instagram size={24} />
            </a>
            <a href="https://api.whatsapp.com/message/E3AOU6LPGW7GO1?autoload=1&app_absent=0" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-purple-500 hover:text-white transition-all duration-300">
                <MessageSquare size={24} />
            </a>
            <a href="mailto:contatomycupid@gmail.com" aria-label="Email" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-purple-500 hover:text-white transition-all duration-300">
                <Mail size={24} />
            </a>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-8">
              Criado com <a href="https://mycupid.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">MyCupid</a>
            </p>
        </footer>
      </motion.main>

      <AnimatePresence>
        {showTimeline && (
          <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showGames && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <AnimatePresence mode="wait">
              {activeGame === null ? (
                <motion.div
                  key="game-selection"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-2xl text-center"
                >
                  <h2 className="text-4xl font-bold font-headline text-white mb-8">Escolha um Jogo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hasMemoryGame && (
                        <div
                        onClick={() => setActiveGame('memory')}
                        className="card-glow p-6 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center bg-white/5 border-white/10"
                        >
                        <BrainCircuit className="w-10 h-10 text-primary" />
                        <h3 className="font-bold text-lg text-white">Jogo da Memória</h3>
                        <p className="text-sm text-muted-foreground">Encontre os pares de suas fotos especiais.</p>
                        </div>
                    )}
                    {hasQuiz && (
                        <div
                        onClick={() => setActiveGame('quiz')}
                        className="card-glow p-6 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center bg-white/5 border-white/10"
                        >
                        <HelpCircle className="w-10 h-10 text-primary" />
                        <h3 className="font-bold text-lg text-white">Quiz do Casal</h3>
                        <p className="text-sm text-muted-foreground">Crie um quiz divertido sobre vocês.</p>
                        </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active-game-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setActiveGame(null)}
                    className="absolute top-4 left-4 text-white z-20"
                  >
                    <ArrowLeft className="mr-2" /> Voltar
                  </Button>
                  {activeGame === 'memory' && pageData.memoryGameImages && <MemoryGame images={pageData.memoryGameImages.map((img: any) => img.url)} />}
                  {activeGame === 'quiz' && pageData.quizQuestions && <QuizGame questions={pageData.quizQuestions} />}
                </motion.div>
              )}
            </AnimatePresence>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowGames(false); setActiveGame(null); }}
                className="absolute top-4 right-4 text-white rounded-full bg-white/10 z-20"
              >
                <X className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && puzzleImageSrc && (
          <motion.div
            key="puzzle-overlay-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-50">
                {pageData.puzzleBackgroundAnimation === 'starry-sky' && <StarrySky />}
                {pageData.puzzleBackgroundAnimation === 'nebula' && <NebulaBackground />}
                {pageData.puzzleBackgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                {pageData.puzzleBackgroundAnimation === 'floating-dots' && <FloatingDots />}
            </div>
            <div className="relative z-10 w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-primary/10 rounded-full border-2 border-primary/20 shadow-lg shadow-primary/20">
                      <Puzzle className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-4xl md:text-5xl font-bold text-white font-headline tracking-tighter">
                          Um Enigma de{' '}
                          <span className="gradient-text">Amor</span>
                      </h2>
                      <p className="text-white/70 text-sm max-w-xs mx-auto">
                          Resolva o quebra-cabeça para revelar uma surpresa especial.
                      </p>
                  </div>
              </div>

               <AnimatePresence mode="wait">
                {!isPuzzleComplete ? (
                   <motion.div key="puzzle-view" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                        <RealPuzzle
                            imageSrc={puzzleImageSrc}
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
```

