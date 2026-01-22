
"use client";

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronLeft, ChevronRight, Puzzle, Clock, ArrowRight, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const IphoneMockup = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative mx-auto h-[580px] w-[290px]">
            
            {/* === CAMADA DE FRENTE (SOBREPÕE O CELULAR) === */}
            
            {/* Esquerda Baixo - O MAIOR DE TODOS */}
            <MagicHeart 
                className="-left-14 bottom-20" 
                rotate={-45} 
                delay={0} 
                size={90} 
                zIndex={40} 
            />
            
            {/* Direita Cima - GRANDE */}
            <MagicHeart 
                className="-right-10 top-24" 
                rotate={35} 
                delay={2} 
                size={70} 
                zIndex={40} 
            />

            {/* === CAMADA DE TRÁS (FUNDO) === */}
            
            {/* Esquerda Cima */}
            <MagicHeart 
                className="-left-12 top-10 opacity-60" 
                rotate={-30} 
                delay={1} 
                size={50} 
                zIndex={0} 
            />
            
            {/* Direita Baixo */}
            <MagicHeart 
                className="-right-12 bottom-32 opacity-60" 
                rotate={45} 
                delay={1.5} 
                size={60} 
                zIndex={0} 
            />

            {/* === O IPHONE (Chassi Premium) === */}
            <div className="relative w-full h-full border-zinc-800 bg-zinc-900 border-[8px] rounded-[3.5rem] shadow-2xl flex flex-col justify-start overflow-hidden ring-1 ring-white/10 z-20">
                {/* Botões Laterais */}
                <div className="absolute top-[90px] -left-[10px] h-[35px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[140px] -left-[10px] h-[60px] w-[4px] bg-zinc-700 rounded-l-lg"></div>
                <div className="absolute top-[130px] -right-[10px] h-[90px] w-[4px] bg-zinc-700 rounded-r-lg"></div>
                
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 h-[30px] w-[100px] bg-black rounded-full z-30 pointer-events-none flex items-center justify-end pr-3">
                    <div className="w-2 h-2 bg-zinc-800/50 rounded-full"></div>
                </div>

                {/* A Tela */}
                <div className="w-full h-full bg-black relative z-10 overflow-hidden rounded-[3rem]">
                    {children}
                </div>
            </div>
        </div>
    );
}

// CORAÇÃO OTIMIZADO (BIG & BOLD)
const MagicHeart = ({ className, delay, size, zIndex, rotate }: { className: string, delay: number, size: number, zIndex: number, rotate: number }) => (
    <motion.div
        className={cn("absolute text-purple-500", className)}
        style={{ zIndex: zIndex }}
        initial={{ opacity: 0, y: 20, scale: 0.8, rotate: rotate }}
        animate={{ 
            opacity: [0, 1, 1, 0], // Ciclo completo de visibilidade
            y: [0, -30],           // Flutua pra cima
            scale: [0.8, 1.1, 0.9], // Pulsa
            rotate: [rotate, rotate + 5, rotate - 5, rotate] // Balança levemente mantendo a inclinação
        }}
        transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: delay
        }}
    >
        {/* StrokeWidth mais grosso para ficar BOLD e visível */}
        <Heart fill="currentColor" strokeWidth={2.5} size={size} className="drop-shadow-[0_4px_15px_rgba(168,85,247,0.5)]" />
    </motion.div>
);


export default function FeaturesCarousel() {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

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

    const handleNext = () => setCurrentIndex((prev) => (prev === featureSlides.length - 1 ? 0 : prev + 1));
    const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? featureSlides.length - 1 : prev - 1));
    const currentFeature = featureSlides[currentIndex];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[750px]">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center justify-items-center w-full">
                
                {/* LADO ESQUERDO: CELULAR */}
                <div className="relative flex justify-center w-full group">
                    {/* Glow Roxo Intenso */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full -z-10 group-hover:bg-purple-600/40 transition-colors duration-1000"></div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative z-10"
                        >
                            <IphoneMockup>
                                {currentFeature.type === 'video' ? (
                                    <video 
                                        src={currentFeature.media} 
                                        autoPlay loop muted playsInline 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Image 
                                        src={currentFeature.media} 
                                        alt={currentFeature.title}
                                        fill
                                        className="object-cover"
                                        sizes="290px"
                                    />
                                )}
                            </IphoneMockup>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* LADO DIREITO: TEXTO */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 max-w-lg">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-2 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <currentFeature.icon className="w-8 h-8 text-purple-400" />
                    </div>
                    
                    <h3 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                        {currentFeature.title}
                    </h3>
                    
                    <p className="text-zinc-300 text-lg md:text-xl leading-relaxed font-light">
                        {currentFeature.description}
                    </p>

                    <div className="flex items-center gap-4 py-3 bg-zinc-900/60 p-2 rounded-full border border-white/5 backdrop-blur-sm">
                        <Button onClick={handlePrev} variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white w-10 h-10"><ChevronLeft /></Button>
                        <div className="flex gap-2.5">
                            {featureSlides.map((_, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => setCurrentIndex(index)} 
                                    className={cn(
                                        "h-2.5 rounded-full transition-all duration-500", 
                                        currentIndex === index ? "w-10 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "w-2.5 bg-zinc-700 hover:bg-zinc-600"
                                    )} 
                                />
                            ))}
                        </div>
                        <Button onClick={handleNext} variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white w-10 h-10"><ChevronRight /></Button>
                    </div>

                    <Button asChild className="bg-purple-600 hover:bg-purple-700 hover:scale-105 transition-all text-white text-lg font-bold px-10 py-7 rounded-2xl shadow-[0_10px_30px_rgba(147,51,234,0.4)] w-full md:w-auto">
                        <Link href="/criar">{t('featuresCarousel.cta')} <ArrowRight className="ml-2 w-6 h-6" /></Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
