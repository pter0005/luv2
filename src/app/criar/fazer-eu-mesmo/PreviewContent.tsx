
'use client';

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import dynamic from 'next/dynamic';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import Countdown from './Countdown';

const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });


const YoutubePlayer = dynamic(() => import('./YoutubePlayer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-video rounded-lg" />,
});

const CustomAudioPlayer = dynamic(() => import('./CustomAudioPlayer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-20 rounded-lg" />,
});

type PreviewContentProps = {
    formData: any;
    isClient: boolean;
    onShowTimeline: () => void;
    hasValidTimelineEvents: boolean;
    showPuzzlePreview: boolean;
};

export default function PreviewContent({ formData, isClient, onShowTimeline, hasValidTimelineEvents, showPuzzlePreview }: PreviewContentProps) {
    const cloudsVideoRef = useRef<HTMLVideoElement>(null);
    const customVideoRef = useRef<HTMLVideoElement>(null);

    const backgroundVideoPreview = useMemo(() => {
        if (formData.backgroundVideo?.url && typeof formData.backgroundVideo.url === 'string') {
            return formData.backgroundVideo.url;
        }
        return null;
    }, [isClient, formData.backgroundVideo]);

    React.useEffect(() => {
        if (cloudsVideoRef.current) {
          cloudsVideoRef.current.playbackRate = 0.6;
        }
    }, [formData.backgroundAnimation]);
    
    if (showPuzzlePreview) {
        return (
             <div className="relative w-full h-full max-w-md aspect-square flex items-center justify-center">
                 <RealPuzzle
                    imageSrc={formData.puzzleImage?.url}
                    showControls={false}
                    onReveal={() => {}} // Add a dummy onReveal to satisfy the component
                 />
             </div>
        );
    }

    return (
        <div className="relative w-full h-full max-w-2xl sm:aspect-video bg-card rounded-xl border border-border/50 shadow-2xl shadow-primary/10 flex flex-col overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
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
                {isClient && formData.backgroundAnimation === 'custom-video' && backgroundVideoPreview && (
                <video key={backgroundVideoPreview} ref={customVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src={backgroundVideoPreview} type={backgroundVideoPreview.startsWith('data:video/webm') ? 'video/webm' : 'video/mp4'} />
                </video>
                )}
            </div>

            {/* Main Content */}
            <div className={cn("relative z-10 w-full h-full flex flex-col")}>
                {/* Browser Chrome */}
                <div className="bg-zinc-800 rounded-t-lg p-2 flex items-center gap-1.5 border-b border-zinc-700 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-grow bg-zinc-700 rounded-sm px-2 py-1 text-xs text-zinc-400 text-center truncate">
                        https://b2gether.com/p/pagina
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-grow rounded-b-lg overflow-hidden relative">
                     <div className="w-full h-full flex flex-col relative overflow-y-auto z-20 browser-scrollbar">
                        <div className="w-full max-w-4xl mx-auto p-6 md:p-8 space-y-12 md:space-y-16">
                            <div className="relative z-10 space-y-6 text-center">
                            <h1
                                className="text-3xl md:text-4xl font-handwriting break-words pt-8 md:pt-12"
                                style={{ color: formData.titleColor }}
                            >
                                {formData.title || 'Seu Título Aqui'}
                            </h1>
                            <p className={cn(
                                "text-white/80 whitespace-pre-wrap break-words text-sm md:text-base",
                                formData.messageFontSize,
                                formData.messageFormatting?.includes("bold") && "font-bold",
                                formData.messageFormatting?.includes("italic") && "italic",
                                formData.messageFormatting?.includes("strikethrough") && "line-through"
                            )}>
                                {formData.message || 'Sua mensagem de amor...'}
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
                                    <Button onClick={onShowTimeline}><View className="mr-2 h-4 w-4" />Nossa Linha do Tempo</Button>
                                </div>
                            )}

                            {formData.galleryImages.length > 0 && (
                            <div className="w-full max-w-sm mx-auto">
                                
                                <Swiper
                                    key={formData.galleryStyle}
                                    effect={(formData.galleryStyle || 'Cube').toLowerCase() as 'coverflow' | 'cards' | 'flip' | 'cube'}
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
                                    className="mySwiper-small"
                                >
                                    {formData.galleryImages.map((image: any, index: number) => (
                                        <SwiperSlide key={index} className="bg-transparent">
                                            <div className="relative w-full aspect-square">
                                                <Image src={image.url} alt={`Pré-visualização da imagem ${index + 1}`} fill className="object-cover" unoptimized />
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
            </div>
        </div>
    )
}
