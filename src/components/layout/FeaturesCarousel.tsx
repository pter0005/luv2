"use client";

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight, Puzzle, Clock, ArrowRight, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- COMPONENTE CELULAR (IPHONE MOCKUP PREMIUM) ---
const IphoneMockup = ({ children, isActive }: { children: React.ReactNode, isActive?: boolean }) => {
    return (
        <div className={cn(
            "relative mx-auto h-[580px] w-[290px] transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] select-none",
            isActive ? "scale-100 z-50 filter-none" : "scale-95 z-0 blur-[1px] brightness-75" // Efeito de foco no central
        )}>
            
            {/* Corações flutuantes (Visíveis apenas no ativo para limpar a visão) */}
            {isActive && (
                <>
                    <MagicHeart className="-left-16 bottom-24" rotate={-45} delay={0} size={80} zIndex={40} />
                    <MagicHeart className="-right-12 top-20" rotate={35} delay={2} size={65} zIndex={40} />
                    <MagicHeart className="-left-10 top-8 opacity-50" rotate={-20} delay={1} size={40} zIndex={0} />
                </>
            )}
            
            {/* Estrutura do Celular */}
            <div className="relative w-full h-full border-zinc-800 bg-zinc-950 border-[8px] rounded-[3.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] flex flex-col justify-start overflow-hidden ring-1 ring-white/20 z-20">
                {/* Botões laterais (Detalhe Realista) */}
                <div className="absolute top-[90px] -left-[10px] h-[35px] w-[4px] bg-zinc-700 rounded-l-lg shadow-lg"></div>
                <div className="absolute top-[140px] -left-[10px] h-[60px] w-[4px] bg-zinc-700 rounded-l-lg shadow-lg"></div>
                <div className="absolute top-[130px] -right-[10px] h-[90px] w-[4px] bg-zinc-700 rounded-r-lg shadow-lg"></div>
                
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 h-[28px] w-[90px] bg-black rounded-full z-30 pointer-events-none flex items-center justify-end pr-2 ring-1 ring-white/5">
                    <div className="w-1.5 h-1.5 bg-zinc-800/80 rounded-full"></div>
                </div>
                
                {/* Tela / Conteúdo */}
                <div className="w-full h-full bg-black relative z-10 overflow-hidden rounded-[3rem] backface-hidden">
                    {children}
                </div>
                
                {/* Reflexo de Vidro Premium */}
                <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-[3.5rem] opacity-80 mix-blend-overlay"></div>
                <div className="absolute inset-0 pointer-events-none z-40 ring-1 ring-inset ring-white/5 rounded-[3.5rem]"></div>
            </div>
        </div>
    );
}

const MagicHeart = ({ className, delay, size, zIndex, rotate }: { className: string, delay: number, size: number, zIndex: number, rotate: number }) => (
    <motion.div
        className={cn("absolute text-purple-500", className)}
        style={{ zIndex: zIndex }}
        initial={{ opacity: 0, y: 30, scale: 0.8, rotate: rotate }}
        animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -40],
            scale: [0.8, 1.1, 0.9],
            rotate: [rotate, rotate + 10, rotate - 10, rotate]
        }}
        transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: delay,
            times: [0, 0.2, 0.8, 1]
        }}
    >
        <Heart fill="currentColor" strokeWidth={2} size={size} className="drop-shadow-[0_4px_20px_rgba(168,85,247,0.6)]" />
    </motion.div>
);


export default function FeaturesCarousel() {
    const { t } = useTranslation();
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const featureSlides = useMemo(() => [
        {
          icon: Calendar,
          title: t('featuresCarousel.slide1.title'),
          description: t('featuresCarousel.slide1.description'),
          type: 'video', 
          media: "https://i.imgur.com/FxHuXVb.mp4" 
        },
        {
          icon: Puzzle,
          title: t('featuresCarousel.slide2.title'),
          description: t('featuresCarousel.slide2.description'),
          type: 'image',
          media: "https://i.imgur.com/hvUUFYV.png"
        },
        {
          icon: Clock,
          title: t('featuresCarousel.slide3.title'),
          description: t('featuresCarousel.slide3.description'),
          type: 'image',
          media: "https://i.imgur.com/gW8Qc3M.png"
        },
    ], [t]);

    const activeSlide = featureSlides[activeIndex];

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[900px] py-10 overflow-hidden bg-transparent">
            
            {/* Header com Animação de Texto */}
            <div className="text-center max-w-3xl mx-auto mb-8 transition-opacity duration-300 min-h-[160px] px-4 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -15, filter: "blur(5px)" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/10 border border-purple-500/30 mb-5 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                            <activeSlide.icon className="w-7 h-7 text-purple-300" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-xl mb-3">
                            {activeSlide.title}
                        </h3>
                        <p className="text-purple-200/80 text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            {activeSlide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* CARROSSEL 3D "PERFEITO" */}
            <div className="relative w-full max-w-[1200px] perspective-[1000px]">
                 <Swiper
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    slidesPerView={'auto'}
                    initialSlide={1}
                    speed={800} // Transição mais suave e lenta
                    // CONFIGURAÇÃO MÁGICA PARA O EFEITO "ESCONDIDO/INCLINADO"
                    coverflowEffect={{
                        rotate: 35,       // Inclinação perfeita para mostrar a lateral
                        stretch: 0,       // Mantém agrupado
                        depth: 100,       // Profundidade para empurrar os laterais para trás
                        modifier: 1,      
                        slideShadows: false, // Sem sombra preta, usamos blur/brilho no componente
                        scale: 0.85       // REDUZ o tamanho dos laterais para enfatizar a profundidade
                    }}
                    modules={[EffectCoverflow, Navigation, Pagination]}
                    className="features-swiper !pb-14 !px-4 !overflow-visible" 
                 >
                     {featureSlides.map((slide, index) => (
                        <SwiperSlide key={index} className="!w-[300px] md:!w-[320px] transition-all duration-500">
                             {({ isActive }) => (
                                 <IphoneMockup isActive={isActive}>
                                    {slide.type === 'video' ? (
                                        <video 
                                            src={slide.media} 
                                            autoPlay loop muted playsInline 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Image 
                                            src={slide.media} 
                                            alt={slide.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 300px"
                                            quality={90}
                                        />
                                    )}
                                </IphoneMockup>
                             )}
                        </SwiperSlide>
                    ))}
                 </Swiper>

                 {/* Botões de Navegação Flutuantes e Minimalistas */}
                 <div className="hidden md:block pointer-events-none absolute inset-0 z-30">
                    <div className="relative w-full h-full max-w-[800px] mx-auto flex justify-between items-center pointer-events-auto">
                        <Button onClick={() => swiper?.slidePrev()} variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-black/20 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 hover:scale-110 backdrop-blur-xl transition-all duration-300 shadow-2xl group -translate-x-4 lg:-translate-x-12">
                            <ChevronLeft className="h-6 w-6 text-white group-hover:-translate-x-0.5 transition-transform"/>
                        </Button>
                        <Button onClick={() => swiper?.slideNext()} variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-black/20 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 hover:scale-110 backdrop-blur-xl transition-all duration-300 shadow-2xl group translate-x-4 lg:translate-x-12">
                            <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-0.5 transition-transform"/>
                        </Button>
                    </div>
                 </div>
            </div>
            
            {/* Paginação Customizada */}
            <div className="flex justify-center items-center gap-2 mt-6 z-20">
                {featureSlides.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => swiper?.slideToLoop(index)}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-500 ease-out",
                            activeIndex === index 
                                ? "w-8 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]" 
                                : "w-1.5 bg-zinc-700/50 hover:bg-zinc-600"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

             <div className="mt-14 relative z-20">
                <Button asChild className="bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 transition-all duration-300 text-white text-lg font-bold px-10 py-7 rounded-full shadow-[0_0_50px_-10px_rgba(147,51,234,0.4)] hover:shadow-[0_0_70px_-15px_rgba(147,51,234,0.6)] ring-1 ring-white/20">
                    <Link href="/criar" className="flex items-center gap-3">
                        {t('featuresCarousel.cta')} 
                        <ArrowRight className="w-5 h-5 animate-pulse" />
                    </Link>
                </Button>
             </div>
        </div>
    );
}
