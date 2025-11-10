

"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
import RealPuzzle from '@/components/puzzle/Puzzle';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const YoutubePlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/YoutubePlayer'), { 
    ssr: false,
    loading: () => <Skeleton className="aspect-video w-full" />
});
const Timeline = dynamic(() => import('@/app/criar/fazer-eu-mesmo/Timeline'), { ssr: false });

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


export default function GeneratedPage() {
    const params = useParams();
    const pageId = params.pageId as string;
    const { firestore } = useFirebase();

    const pageRef = useMemo(() => {
        if (!firestore || !pageId) return null;
        return doc(firestore, 'lovepages', pageId);
    }, [firestore, pageId]);

    const { data: formData, isLoading: loading, error } = useDoc<any>(pageRef);
    
    const [isClient, setIsClient] = useState(false);
    const cloudsVideoRef = useRef<HTMLVideoElement>(null);
    const customVideoRef = useRef<HTMLVideoElement>(null);
    const [puzzleRevealed, setPuzzleRevealed] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [puzzleDimension, setPuzzleDimension] = useState(360);

    useEffect(() => {
        setIsClient(true);
        if (formData && (!formData.enablePuzzle || !formData.puzzleImage)) {
            setPuzzleRevealed(true);
        }

        const handleResize = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth < 640) {
                setPuzzleDimension(screenWidth * 0.8);
            } else {
                setPuzzleDimension(450);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [formData]);


    useEffect(() => {
        if (cloudsVideoRef.current) {
            cloudsVideoRef.current.playbackRate = 0.6;
        }
    }, [formData?.backgroundAnimation]);

    useEffect(() => {
        if (customVideoRef.current && formData?.backgroundVideo) {
            customVideoRef.current.src = formData.backgroundVideo;
        }
    }, [formData?.backgroundVideo]);

    const isPuzzleActive = useMemo(() => {
        return isClient && formData?.enablePuzzle && formData?.puzzleImage;
    }, [isClient, formData]);
    
    const timelineEventsForDisplay = useMemo(() => {
        if (!formData?.timelineEvents) return [];
        return formData.timelineEvents
            .filter((event: any) => event && event.image) // Ensure event and image URL exist
            .map((event: any) => ({
                id: event.id || Math.random().toString(),
                imageUrl: event.image, // The image URL is now directly on `image`
                alt: event.description,
                title: event.description,
                date: event.date?.toDate ? event.date.toDate() : new Date(event.date), // Convert timestamp to Date
            }));
    }, [formData?.timelineEvents]);


    if (loading) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4">Carregando sua surpresa...</p>
            </div>
        );
    }
    
    if (!formData || error) {
        return (
             <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Página não encontrada</h1>
                    <p className="text-muted-foreground mt-2">O link que você acessou pode estar quebrado ou a página foi removida.</p>
                     {error && <p className="text-destructive text-sm mt-4">{error.message}</p>}
                </div>
            </div>
        )
    }
    
    if (showTimeline) {
      return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />;
    }

    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 w-full h-full z-0">
                {isClient && formData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={formData.heartColor} />}
                {isClient && formData.backgroundAnimation === 'starry-sky' && <StarrySky />}
                {isClient && formData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
                {isClient && formData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                {isClient && formData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
                {isClient && formData.backgroundAnimation === 'clouds' && (
                    <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                        <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
                    </video>
                )}
                {isClient && formData.backgroundAnimation === 'custom-video' && formData.backgroundVideo && (
                <video key={formData.backgroundVideo} ref={customVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                </video>
                )}
            </div>

            {/* Puzzle Overlay */}
             <AnimatePresence>
                {isPuzzleActive && !puzzleRevealed && formData.puzzleImage && (
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
                                imageSrc={formData.puzzleImage}
                                showControls={false}
                                onReveal={() => setPuzzleRevealed(true)}
                                dimension={puzzleDimension}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn("min-h-screen w-full transition-all duration-500", isPuzzleActive && !puzzleRevealed && "blur-md scale-105 pointer-events-none")}>
                <div className="w-full max-w-4xl mx-auto p-6 md:p-12 space-y-8 md:space-y-12 relative z-10">
                     <div className="space-y-6 text-center pt-16 md:pt-24">
                        <h1
                            className="text-4xl md:text-6xl font-handwriting break-words"
                            style={{ color: formData.titleColor }}
                        >
                            {formData.title}
                        </h1>
                        <p className={cn(
                            "text-white/80 whitespace-pre-wrap break-words max-w-2xl mx-auto",
                            formData.messageFontSize,
                            formData.messageFormatting?.includes("bold") && "font-bold",
                            formData.messageFormatting?.includes("italic") && "italic",
                            formData.messageFormatting?.includes("strikethrough") && "line-through"
                        )}>
                            {formData.message}
                        </p>
                    </div>

                    {formData.specialDate && (
                        <Countdown 
                            targetDate={formData.specialDate?.toDate ? formData.specialDate.toDate().toISOString() : new Date(formData.specialDate).toISOString()} 
                            style={formData.countdownStyle as "Padrão" | "Clássico" | "Simples"}
                            color={formData.countdownColor}
                        />
                    )}
                    
                    {timelineEventsForDisplay.length > 0 && (
                        <div className="text-center">
                             <Button
                                onClick={() => setShowTimeline(true)}
                                variant="outline"
                                className="bg-transparent backdrop-blur-sm shadow-lg shadow-primary/50 hover:bg-primary/10"
                            >
                                Nossa Linha do Tempo
                            </Button>
                        </div>
                    )}

                    {formData.galleryImages && formData.galleryImages.length > 0 && (
                        <div className="w-full max-w-md mx-auto py-8">
                            <Swiper
                                key={formData.galleryStyle}
                                effect={formData.galleryStyle.toLowerCase() as 'coverflow' | 'cards' | 'flip' | 'cube'}
                                grabCursor={true}
                                centeredSlides={formData.galleryStyle === 'Coverflow'}
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
                                modules={[EffectCoverflow, EffectCards, EffectFlip, EffectCube, Pagination, Autoplay]}
                                className="mySwiper"
                            >
                                {formData.galleryImages.map((preview: string, index: number) => (
                                    <SwiperSlide key={index} className="bg-transparent">
                                        <div className="relative w-full aspect-square">
                                            <Image src={preview} alt={`Imagem da galeria ${index + 1}`} layout="fill" className="object-cover rounded-lg shadow-2xl" unoptimized/>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    )}
                    
                    {isClient && formData.musicOption === 'youtube' && formData.youtubeUrl && (
                        <YoutubePlayer url={formData.youtubeUrl} />
                    )}

                    {isClient && formData.musicOption === 'record' && formData.audioRecording && (
                        <CustomAudioPlayer src={formData.audioRecording} />
                    )}
                </div>
            </div>
        </div>
    );
}
