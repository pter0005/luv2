
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

// --- COMPONENTE CELULAR (IPHONE MOCKUP) ---
const IphoneMockup = ({ children }: { children: React.ReactNode }) => {
    return (
        // Removi o hover:scale para não conflitar com o efeito 3D do carrossel
        <div className="relative mx-auto h-[580px] w-[290px] transition-all duration-500 ease-out select-none">
            
            {/* Corações flutuantes decorativos */}
            <MagicHeart className="-left-14 bottom-20" rotate={-45} delay={0} size={90} zIndex={40} />
            <MagicHeart className="-right-10 top-24" rotate={35} delay={2} size={70} zIndex={40} />
            <MagicHeart className="-left-12 top-10 opacity-60" rotate={-30} delay={1} size={50} zIndex={0} />
            <MagicHeart className="-right-12 bottom-32 opacity-60" rotate={45} delay={1.5} size={60} zIndex={0} />
            
            {/* Estrutura do Celular */}
            <div className="relative w-full h-full border-zinc-800 bg-zinc-900 border-[8px] rounded-[3.5rem] shadow-2xl flex flex-col justify-start overflow-hidden ring-1 ring-white/10 z-20">
                {/* Botões laterais */}
                <div className="absolute top-[90px] -left-[10px] h-[35px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[140px] -left-[10px] h-[60px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[130px] -right-[10px] h-[90px] w-[4px] bg-zinc-700 rounded-r-lg"></div>
                
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 h-[30px] w-[100px] bg-black rounded-full z-30 pointer-events-none flex items-center justify-end pr-3">
                    <div className="w-2 h-2 bg-zinc-800/50 rounded-full"></div>
                </div>
                
                {/* Tela / Conteúdo */}
                <div className="w-full h-full bg-black relative z-10 overflow-hidden rounded-[3rem]">
                    {children}
                </div>
                
                {/* Reflexo de Vidro para dar realismo */}
                <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-[3.5rem]"></div>
            </div>
        </div>
    );
}

const MagicHeart = ({ className, delay, size, zIndex, rotate }: { className: string, delay: number, size: number, zIndex: number, rotate: number }) => (
    <motion.div
        className={cn("absolute text-purple-500", className)}
        style={{ zIndex: zIndex }}
        initial={{ opacity: 0, y: 20, scale: 0.8, rotate: rotate }}
        animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -30],
            scale: [0.8, 1.1, 0.9],
            rotate: [rotate, rotate + 5, rotate - 5, rotate]
        }}
        transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: delay
        }}
    >
        <Heart fill="currentColor" strokeWidth={2.5} size={size} className="drop-shadow-[0_4px_15px_rgba(168,85,247,0.5)]" />
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
          media: "https://i.imgur.com/vj5AAn7.png"
        },
        {
          icon: Clock,
          title: t('featuresCarousel.slide3.title'),
          description: t('featuresCarousel.slide3.description'),
          type: 'image',
          media: "https://i.imgur.com/mYmNmAY.png"
        },
    ], [t]);

    const activeSlide = featureSlides[activeIndex];

    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[800px] py-10 overflow-hidden">
            
            {/* Header com Animação de Texto */}
            <div className="text-center max-w-2xl mx-auto mb-12 transition-opacity duration-300 min-h-[160px] md:min-h-[180px] px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <activeSlide.icon className="w-8 h-8 text-purple-300" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white tracking-tight leading-tight drop-shadow-lg">
                            {activeSlide.title}
                        </h3>
                        <p className="text-purple-200/70 text-base md:text-lg leading-relaxed font-medium mt-4 max-w-lg mx-auto">
                            {activeSlide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* CARROSSEL COM EFEITO 3D "DEITADO" */}
            <div className="relative w-full max-w-[1400px]">
                 <Swiper
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    slidesPerView={'auto'}
                    // AQUI ESTÁ A MÁGICA DO EFEITO "DEITADO"
                    coverflowEffect={{
                        rotate: 30,      // Aumentei de 0 para 30 (Isso faz eles virarem)
                        stretch: 0,      // Espaçamento entre eles
                        depth: 150,      // Profundidade (z-index visual)
                        modifier: 1,     // Multiplicador do efeito
                        slideShadows: false, // Sem sombra preta feia do swiper
                    }}
                    modules={[EffectCoverflow, Navigation, Pagination]}
                    className="features-swiper !pb-12 !px-4" // Padding para não cortar sombras
                 >
                     {featureSlides.map((slide, index) => (
                        <SwiperSlide key={index} className="!w-[300px] md:!w-[320px]">
                             <IphoneMockup>
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
                                        sizes="290px"
                                    />
                                )}
                            </IphoneMockup>
                        </SwiperSlide>
                    ))}
                 </Swiper>

                 {/* Botões de Navegação Customizados */}
                 <div className="hidden md:block">
                    <Button onClick={() => swiper?.slidePrev()} variant="ghost" size="icon" className="absolute left-10 lg:left-32 top-1/2 -translate-y-1/2 z-20 rounded-full h-16 w-16 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 backdrop-blur-md transition-all shadow-xl group">
                        <ChevronLeft className="h-8 w-8 text-white group-hover:-translate-x-1 transition-transform"/>
                    </Button>
                    <Button onClick={() => swiper?.slideNext()} variant="ghost" size="icon" className="absolute right-10 lg:right-32 top-1/2 -translate-y-1/2 z-20 rounded-full h-16 w-16 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 backdrop-blur-md transition-all shadow-xl group">
                        <ChevronRight className="h-8 w-8 text-white group-hover:translate-x-1 transition-transform"/>
                    </Button>
                 </div>
            </div>
            
            {/* Paginação (Bolinhas) */}
            <div className="flex justify-center items-center gap-3 mt-4">
                {featureSlides.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => swiper?.slideToLoop(index)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            activeIndex === index 
                                ? "w-10 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                                : "w-2 bg-zinc-700 hover:bg-zinc-600"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

             <div className="mt-12">
                <Button asChild className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 transition-all text-white text-lg font-bold px-12 py-8 rounded-full shadow-[0_0_40px_rgba(147,51,234,0.3)] hover:shadow-[0_0_60px_rgba(147,51,234,0.5)]">
                    <Link href="/criar" className="flex items-center gap-3">
                        {t('featuresCarousel.cta')} 
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </Button>
             </div>
        </div>
    );
}

    