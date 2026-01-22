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


const IphoneMockup = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative mx-auto h-[580px] w-[290px] group-hover:scale-105 transition-transform duration-300">
            <MagicHeart className="-left-14 bottom-20" rotate={-45} delay={0} size={90} zIndex={40} />
            <MagicHeart className="-right-10 top-24" rotate={35} delay={2} size={70} zIndex={40} />
            <MagicHeart className="-left-12 top-10 opacity-60" rotate={-30} delay={1} size={50} zIndex={0} />
            <MagicHeart className="-right-12 bottom-32 opacity-60" rotate={45} delay={1.5} size={60} zIndex={0} />
            <div className="relative w-full h-full border-zinc-800 bg-zinc-900 border-[8px] rounded-[3.5rem] shadow-2xl flex flex-col justify-start overflow-hidden ring-1 ring-white/10 z-20">
                <div className="absolute top-[90px] -left-[10px] h-[35px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[140px] -left-[10px] h-[60px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[130px] -right-[10px] h-[90px] w-[4px] bg-zinc-700 rounded-r-lg"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 h-[30px] w-[100px] bg-black rounded-full z-30 pointer-events-none flex items-center justify-end pr-3">
                    <div className="w-2 h-2 bg-zinc-800/50 rounded-full"></div>
                </div>
                <div className="w-full h-full bg-black relative z-10 overflow-hidden rounded-[3rem]">
                    {children}
                </div>
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
        <div className="w-full flex flex-col items-center justify-center min-h-[750px] py-10 md:py-0">
            
            <div className="text-center max-w-2xl mx-auto mb-8 transition-opacity duration-300 min-h-[160px] md:min-h-[180px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            <activeSlide.icon className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            {activeSlide.title}
                        </h3>
                        <p className="text-zinc-300/80 text-base md:text-lg leading-relaxed font-light mt-3">
                            {activeSlide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            <div className="relative w-full max-w-7xl">
                 <Swiper
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    slidesPerView={'auto'}
                    coverflowEffect={{
                        rotate: 0,
                        stretch: 40,
                        depth: 250,
                        modifier: 1,
                        slideShadows: false,
                    }}
                    modules={[EffectCoverflow, Navigation, Pagination]}
                    className="features-swiper"
                 >
                     {featureSlides.map((slide, index) => (
                        <SwiperSlide key={index} className="!w-[320px]">
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

                 <Button onClick={() => swiper?.slidePrev()} variant="ghost" size="icon" className="absolute left-0 md:left-20 top-1/2 -translate-y-1/2 z-10 rounded-full h-14 w-14 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm hidden md:flex">
                    <ChevronLeft className="h-6 w-6"/>
                </Button>
                <Button onClick={() => swiper?.slideNext()} variant="ghost" size="icon" className="absolute right-0 md:right-20 top-1/2 -translate-y-1/2 z-10 rounded-full h-14 w-14 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm hidden md:flex">
                    <ChevronRight className="h-6 w-6"/>
                </Button>
            </div>
            
            <div className="flex justify-center items-center gap-2.5 mt-8">
                {featureSlides.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => swiper?.slideToLoop(index)}
                        className={cn(
                            "h-2.5 rounded-full transition-all duration-300",
                            activeIndex === index ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/50 hover:bg-muted-foreground/80"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

             <div className="mt-12">
                <Button asChild className="bg-purple-600 hover:bg-purple-700 hover:scale-105 transition-all text-white text-lg font-bold px-10 py-7 rounded-2xl shadow-[0_10px_30px_rgba(147,51,234,0.4)] w-full md:w-auto">
                    <Link href="/criar">{t('featuresCarousel.cta')} <ArrowRight className="ml-2 w-6 h-6" /></Link>
                </Button>
             </div>
        </div>
    );
}