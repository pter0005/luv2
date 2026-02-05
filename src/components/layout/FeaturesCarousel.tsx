
"use client";

import { useState, useMemo, useEffect } from 'react'; // Adicionado useEffect
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

// --- PARTÍCULAS DE CORAÇÃO ULTRA SMOOTH (GPU BASED) ---
const FloatingHeart = ({ index }: { index: number }) => {
    // Geramos valores aleatórios APENAS uma vez na montagem para evitar "hydration mismatch"
    const randomDuration = useMemo(() => 4 + Math.random() * 4, []); // Entre 4s e 8s (lento e suave)
    const randomDelay = useMemo(() => Math.random() * 3, []);
    const randomXStart = useMemo(() => (Math.random() - 0.5) * 100, []); // Começa perto do centro
    const randomXEnd = useMemo(() => (Math.random() - 0.5) * 300, []);   // Termina longe (espalhado)
    const randomSize = useMemo(() => 30 + Math.random() * 40, []);       // Grandes: 30px a 70px
    const randomRotate = useMemo(() => (Math.random() - 0.5) * 90, []);  // Rotação inicial

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 text-purple-500/40 pointer-events-none will-change-transform"
            initial={{ 
                x: randomXStart, 
                y: 100, // Começa em baixo
                opacity: 0, 
                scale: 0,
                rotate: randomRotate 
            }}
            animate={{ 
                x: randomXEnd,
                y: -400, // Sobe bastante
                opacity: [0, 0.8, 0], // Aparece e some no topo
                scale: [0, 1, 0.8], 
                rotate: randomRotate + 45 // Gira levemente enquanto sobe
            }}
            transition={{ 
                duration: randomDuration,
                repeat: Infinity,
                ease: "easeInOut", // Movimento natural
                delay: randomDelay,
            }}
        >
            <Heart fill="currentColor" strokeWidth={0} size={randomSize} className="drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
        </motion.div>
    );
};

const HeartEmitter = ({ isActive }: { isActive: boolean }) => {
    // Só renderiza se for o slide ativo para economizar processamento
    if (!isActive) return null;

    // 12 Corações flutuando ao mesmo tempo
    const hearts = Array.from({ length: 12 });

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
            {hearts.map((_, i) => (
                <FloatingHeart key={i} index={i} />
            ))}
        </div>
    );
};

// --- COMPONENTE CELULAR ---
const IphoneMockup = ({ children, isActive }: { children: React.ReactNode, isActive?: boolean }) => {
    return (
        <div className={cn(
            "relative mx-auto transition-all duration-700 ease-out select-none",
            // IMPORTANTE: overflow-visible para os corações saírem do celular
            "h-[500px] w-[260px] md:h-[620px] md:w-[310px] overflow-visible", 
            isActive 
                ? "scale-100 z-50 brightness-100" 
                : "scale-90 z-0 brightness-[0.5] opacity-80 grayscale-[30%] blur-[1px]" 
        )}>
            
            {/* Corações ficam ATRÁS do celular (z-0) mas visíveis fora dele */}
            <HeartEmitter isActive={!!isActive} />
            
            {/* Glow Traseiro para destacar o celular ativo */}
            {isActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] bg-purple-600/20 blur-[60px] rounded-full -z-10" />
            )}

            {/* Estrutura do Celular (Z-Index alto para ficar na frente dos corações) */}
            <div className="relative w-full h-full border-zinc-900 bg-black border-[8px] md:border-[10px] rounded-[3.5rem] md:rounded-[4rem] shadow-2xl flex flex-col justify-start overflow-hidden ring-1 ring-white/10 z-20">
                
                {/* Botões Laterais */}
                <div className="absolute top-[100px] -left-[10px] h-[35px] w-[4px] bg-zinc-800 rounded-l-md shadow-inner"></div>
                <div className="absolute top-[150px] -left-[10px] h-[60px] w-[4px] bg-zinc-800 rounded-l-md shadow-inner"></div>
                <div className="absolute top-[140px] -right-[10px] h-[90px] w-[4px] bg-zinc-800 rounded-r-md shadow-inner"></div>
                
                {/* Dynamic Island */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 h-[28px] w-[90px] md:h-[34px] md:w-[120px] bg-black rounded-full z-30 ring-1 ring-white/10 pointer-events-none flex items-center justify-center">
                    <div className="w-2/3 h-2/3 bg-zinc-900/40 rounded-full blur-[2px]"></div>
                </div>
                
                {/* Tela / Conteúdo */}
                <div className="w-full h-full bg-zinc-950 relative z-10 overflow-hidden rounded-[3rem] md:rounded-[3.5rem]">
                    {children}
                    {/* Sombra interna e gradiente */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-20"></div>
                    <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-20"></div>
                </div>
                
                {/* Reflexo Vidro */}
                <div className="absolute inset-0 pointer-events-none z-40 rounded-[3.5rem] md:rounded-[4rem] ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 opacity-30 mix-blend-overlay"></div>
                </div>
            </div>
        </div>
    );
}

export default function FeaturesCarousel() {
    const { t, locale } = useTranslation();
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const originalSlides = useMemo(() => [
        {
          id: 1,
          icon: Calendar,
          title: t('featuresCarousel.slide1.title'),
          description: t('featuresCarousel.slide1.description'),
          type: 'video', 
          media: locale === 'en' ? "https://res.cloudinary.com/dncoxm1it/video/upload/v1770309853/mmmmmmm_w3cnqn.mp4" : "https://i.imgur.com/FxHuXVb.mp4"
        },
        {
          id: 2,
          icon: Puzzle,
          title: t('featuresCarousel.slide2.title'),
          description: t('featuresCarousel.slide2.description'),
          type: 'image',
          media: "https://i.imgur.com/hvUUFYV.png"
        },
        {
          id: 3,
          icon: Clock,
          title: t('featuresCarousel.slide3.title'),
          description: t('featuresCarousel.slide3.description'),
          type: 'image',
          media: "https://i.imgur.com/gW8Qc3M.png"
        },
    ], [t, locale]);

    const featureSlides = [...originalSlides, ...originalSlides];
    const realActiveIndex = activeIndex % originalSlides.length;
    const activeContent = originalSlides[realActiveIndex];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full flex flex-col items-center justify-center py-12 md:py-24 overflow-hidden bg-transparent"
        >
            
            {/* Header Texto */}
            <div className="text-center w-full max-w-4xl mx-auto mb-10 px-4 relative z-10 min-h-[180px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={realActiveIndex}
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col items-center"
                    >
                        <div className="mb-5 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-white/5">
                            <activeContent.icon className="w-8 h-8 md:w-10 md:h-10 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        </div>
                        <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
                            {activeContent.title}
                        </h3>
                        <p className="text-base md:text-xl text-zinc-300 font-medium max-w-xl leading-relaxed">
                            {activeContent.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* CARROSSEL */}
            <div className="relative w-full max-w-[1600px] perspective-[2000px]">
                 <Swiper
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    slidesPerView={'auto'}
                    initialSlide={1}
                    speed={800}
                    coverflowEffect={{
                        rotate: 0,
                        stretch: 0,
                        depth: 200,
                        modifier: 1,
                        slideShadows: false,
                        scale: 1
                    }}
                    breakpoints={{
                        0: { 
                            coverflowEffect: {
                                rotate: 25, 
                                stretch: -30, 
                                depth: 150,
                                scale: 0.85
                            }
                        },
                        768: { 
                            coverflowEffect: {
                                rotate: 20, 
                                stretch: -80,
                                depth: 300, 
                                scale: 0.85
                            }
                        }
                    }}
                    modules={[EffectCoverflow, Navigation, Pagination]}
                    className="features-swiper !pb-20 !px-4 !overflow-visible" 
                 >
                     {featureSlides.map((slide, index) => (
                        <SwiperSlide key={`${slide.id}-${index}`} className="!w-[260px] md:!w-[310px] z-10 transition-all duration-700">
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
                                            sizes="(max-width: 768px) 260px, 310px"
                                        />
                                    )}
                                </IphoneMockup>
                             )}
                        </SwiperSlide>
                    ))}
                 </Swiper>

                 {/* Controles Laterais */}
                 <div className="hidden lg:flex justify-between w-full absolute top-1/2 -translate-y-1/2 px-20 pointer-events-none z-30">
                    <Button onClick={() => swiper?.slidePrev()} variant="ghost" size="icon" className="pointer-events-auto h-20 w-20 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/50 backdrop-blur-xl transition-all duration-300 group shadow-2xl">
                        <ChevronLeft className="h-10 w-10 text-white/70 group-hover:text-white group-hover:-translate-x-1 transition-all"/>
                    </Button>
                    <Button onClick={() => swiper?.slideNext()} variant="ghost" size="icon" className="pointer-events-auto h-20 w-20 rounded-full bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/50 backdrop-blur-xl transition-all duration-300 group shadow-2xl">
                        <ChevronRight className="h-10 w-10 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all"/>
                    </Button>
                 </div>
            </div>
            
            {/* Paginação */}
            <div className="flex gap-3 mt-6 z-20">
                {originalSlides.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => {
                            const targetIndex = index;
                            swiper?.slideToLoop(targetIndex) 
                        }}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500 ease-out",
                            realActiveIndex === index 
                                ? "w-12 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]" 
                                : "w-2 bg-zinc-800 hover:bg-zinc-700"
                        )}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>

             <motion.div className="mt-16 relative z-20" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild className="relative overflow-hidden bg-white text-black hover:bg-zinc-100 text-xl font-bold px-12 py-8 rounded-full shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] transition-all">
                    <Link href="/criar" className="flex items-center gap-3 relative z-10">
                        {t('featuresCarousel.cta')} 
                        <ArrowRight className="w-6 h-6 animate-pulse" />
                    </Link>
                </Button>
             </motion.div>
        </motion.div>
    );
}

    