
'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { View, Puzzle, Play, CheckCircle, Gamepad2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import dynamic from 'next/dynamic';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import Countdown from './Countdown';
import { AnimatePresence, motion } from 'framer-motion';
import NebulaBackground from '@/components/effects/NebulaBackground';
import PurpleExplosion from '@/components/effects/PurpleExplosion'; // Importação do novo efeito
import { useTranslation } from '@/lib/i18n';
import MysticFlowers from '@/components/effects/MysticFlowers';
import { useFormContext } from 'react-hook-form';
import { PageData } from './CreatePageWizard';

// Dynamic imports
const YoutubePlayer = dynamic(() => import('@/components/ui/YoutubePlayer'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-square" />,
});
const CustomAudioPlayer = dynamic(() => import('./CustomAudioPlayer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-20 rounded-lg" />,
});
const MemoryGame = dynamic(() => import('@/components/memory-game/MemoryGame'), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />,
});


type PreviewContentProps = {
    isClient: boolean;
    onShowTimeline: () => void;
    hasValidTimelineEvents: boolean;
    showPuzzlePreview: boolean;
    previewPuzzleRevealed: boolean;
    setPreviewPuzzleRevealed: (revealed: boolean) => void;
    locale: 'pt' | 'en' | 'es';
};

const MemoizedSwiper = React.memo(({ galleryImages, galleryStyle }: { galleryImages: any[], galleryStyle: string }) => {
    return (
        <Swiper
            key={galleryStyle}
            effect={(galleryStyle || 'coverflow').toLowerCase() as 'coverflow' | 'cards' | 'flip' | 'cube'}
            grabCursor={true}
            centeredSlides={galleryStyle === 'Coverflow'}
            slidesPerView={'auto'}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
            className="mySwiper-small"
        >
            {galleryImages.map((image: any, index: number) => (
                <SwiperSlide key={image.path || index} className="bg-transparent">
                    <div className="relative w-full aspect-square">
                        <Image src={image.url} alt={`Pré-visualização da imagem ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 90vw, 384px"/>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
});
MemoizedSwiper.displayName = 'MemoizedSwiper';

export default function PreviewContent({
    isClient,
    onShowTimeline,
    hasValidTimelineEvents,
    showPuzzlePreview,
    previewPuzzleRevealed,
    setPreviewPuzzleRevealed,
    locale,
}: PreviewContentProps) {
    const { watch } = useFormContext<PageData>();
    const formData = watch();
    const { t } = useTranslation();
    const cloudsVideoRef = useRef<HTMLVideoElement>(null);
    const customVideoRef = useRef<HTMLVideoElement>(null);
    const youtubePlayerRef = useRef<{ play: () => void }>(null);

    const [isPreviewPuzzleComplete, setIsPreviewPuzzleComplete] = useState(false);
    const [showExplosion, setShowExplosion] = useState(false);

    const handlePreviewReveal = useCallback(() => {
        setShowExplosion(true);
        setPreviewPuzzleRevealed(true);
        youtubePlayerRef.current?.play();
        
        setTimeout(() => {
            setShowExplosion(false);
        }, 2000);
    }, [setPreviewPuzzleRevealed]);

    useEffect(() => {
        if (!showPuzzlePreview) {
            setIsPreviewPuzzleComplete(false);
        }
    }, [showPuzzlePreview]);

    useEffect(() => {
        if (isPreviewPuzzleComplete) {
            const timer = setTimeout(() => {
                handlePreviewReveal();
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [isPreviewPuzzleComplete, handlePreviewReveal]);
    

    const backgroundVideoPreview = useMemo(() => {
        if (formData.backgroundVideo?.url && typeof formData.backgroundVideo.url === 'string') {
            return formData.backgroundVideo.url;
        }
        return null;
    }, [formData.backgroundVideo]);

    React.useEffect(() => {
        if (cloudsVideoRef.current) {
          cloudsVideoRef.current.playbackRate = 0.6;
        }
    }, [formData.backgroundAnimation]);

    const puzzleImageSrc = typeof formData.puzzleImage === 'string' 
      ? formData.puzzleImage 
      : formData.puzzleImage?.url;
    const shouldBeBlurred = showPuzzlePreview && !previewPuzzleRevealed;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className={cn(
                "relative w-full max-w-lg h-[85vh] bg-zinc-800 rounded-[2.5rem] p-3 border-[6px] border-zinc-700 shadow-2xl shadow-primary/20 flex flex-col overflow-hidden"
            )}>
                 {/* CAMADA DE EFEITOS ESPECIAIS (ACIMA DE TUDO) */}
                 <AnimatePresence>
                    {showExplosion && (
                        <motion.div 
                            initial={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 z-[999] pointer-events-none"
                        >
                            <PurpleExplosion />
                        </motion.div>
                    )}
                 </AnimatePresence>

                 <motion.div 
                    className="relative z-10 w-full flex-grow flex flex-col rounded-[2rem] overflow-hidden bg-background"
                    animate={{
                        filter: shouldBeBlurred ? 'blur(15px) brightness(0.7)' : 'blur(0px) brightness(1)',
                    }}
                    transition={{ filter: { duration: 1.0, ease: "easeOut" } }}
                 >
                    {/* ... (Todo o código do background permanece igual) ... */}
                    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                        {isClient && formData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={50} color={formData.heartColor} />}
                        {isClient && formData.backgroundAnimation === 'starry-sky' && <StarrySky />}
                        {isClient && formData.backgroundAnimation === 'nebula' && <NebulaBackground />}
                        {isClient && formData.backgroundAnimation === 'mystic-flowers' && <MysticFlowers />}
                        {isClient && formData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
                        {isClient && formData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                        {isClient && formData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
                        {isClient && formData.backgroundAnimation === 'clouds' && (
                            <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                                <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
                            </video>
                        )}
                        {isClient && formData.backgroundAnimation === 'custom-video' && backgroundVideoPreview && (
                        <video key={backgroundVideoPreview} ref={customVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src={backgroundVideoPreview} type={backgroundVideoPreview.startsWith('data:video/webm') ? 'video/webm' : 'video/mp4'} />
                        </video>
                        )}
                    </div>
                    
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-6 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
                    </div>

                    <div className={cn(
                        "flex-grow overflow-y-auto browser-scrollbar transition-all relative z-10",
                        shouldBeBlurred ? "pointer-events-none select-none" : "pointer-events-auto"
                    )}>
                        <div className="w-full max-w-4xl mx-auto p-6 md:p-8 space-y-12 md:space-y-14">
                            <div className="space-y-4 text-center pt-8">
                                <h1
                                    className="text-3xl font-handwriting break-words"
                                    style={{ color: formData.titleColor }}
                                >
                                    {formData.title || (locale === 'pt' ? 'Seu Título Aqui' : 'Your Title Here')}
                                </h1>
                                <p className={cn(
                                    "text-white/80 whitespace-pre-wrap break-words text-base",
                                    formData.messageFontSize,
                                    formData.messageFormatting?.includes("bold") && "font-bold",
                                    formData.messageFormatting?.includes("italic") && "italic",
                                    formData.messageFormatting?.includes("strikethrough") && "line-through"
                                )}>
                                    {formData.message || (locale === 'pt' ? 'Sua mensagem de amor...' : 'Your love message...')}
                                </p>
                            </div>
                            
                            {formData.specialDate && (
                                <Countdown 
                                    targetDate={new Date(formData.specialDate).toISOString()} 
                                    style={formData.countdownStyle as "Padrão" | "Simples"}
                                    color={formData.countdownColor}
                                />
                            )}

                            {hasValidTimelineEvents && (
                                <div className="text-center">
                                    <Button onClick={onShowTimeline}><View className="mr-2 h-4 w-4" />{t('publicpage.timeline.title')}</Button>
                                </div>
                            )}

                            {formData.galleryImages.length > 0 && (
                                <div className="w-full max-w-sm mx-auto">
                                    <MemoizedSwiper galleryImages={formData.galleryImages} galleryStyle={formData.galleryStyle} />
                                </div>
                            )}

                            {isClient && formData.enableMemoryGame && formData.memoryGameImages && formData.memoryGameImages.length > 0 && (
                                <div className="text-center w-full">
                                    <Button 
                                        type="button"
                                        disabled
                                        className="bg-white/10 text-white border border-white/20 backdrop-blur-md px-8 py-6 text-lg rounded-xl shadow-xl w-full max-w-xs"
                                    >
                                        <Gamepad2 className="mr-2 h-5 w-5" /> {t('publicpage.games.title')}
                                    </Button>
                                </div>
                            )}
                            
                            {isClient && formData.musicOption === 'youtube' && formData.youtubeUrl && (
                                <YoutubePlayer 
                                    ref={youtubePlayerRef}
                                    url={formData.youtubeUrl}
                                    songName={formData.songName}
                                    artistName={formData.artistName}
                                    volume={0.5}
                                />
                            )}

                            {isClient && formData.musicOption === 'record' && formData.audioRecording?.url && (
                            <CustomAudioPlayer src={formData.audioRecording.url} />
                            )}
                        </div>
                    </div>
                </motion.div>
                
                <AnimatePresence>
                    {shouldBeBlurred && puzzleImageSrc && (
                        <motion.div
                            key="preview-puzzle-screen"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-lg rounded-[2rem]"
                        >
                             <div className="w-full max-w-lg space-y-8 text-center">
                                <div className="inline-block p-4 bg-primary/10 rounded-full border-2 border-primary/20 shadow-lg shadow-primary/20">
                                    <Puzzle className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-white font-headline tracking-tighter">
                                        {t('publicpage.puzzle.title.part1')}{' '}
                                        <span className="gradient-text">{t('publicpage.puzzle.title.part2')}</span>
                                    </h2>
                                    <p className="text-white/70 text-sm max-w-xs mx-auto">
                                        {t('publicpage.puzzle.description')}
                                    </p>
                                </div>
                                
                                <AnimatePresence mode="wait">
                                    {!isPreviewPuzzleComplete ? (
                                        <motion.div key="puzzle-preview-view" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                            <div className="p-2 bg-white/5 rounded-2xl border border-white/10 shadow-2xl shadow-primary/10">
                                                <RealPuzzle
                                                    imageSrc={puzzleImageSrc}
                                                    onReveal={() => setIsPreviewPuzzleComplete(true)}
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="reveal-button-preview-view"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                                            className="flex flex-col items-center gap-6 pt-4"
                                        >
                                            <div className="p-4 bg-green-500/10 rounded-full border-2 border-green-500/20">
                                                <CheckCircle className="w-12 h-12 text-green-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">{t('publicpage.puzzle.complete')}</h3>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

    
