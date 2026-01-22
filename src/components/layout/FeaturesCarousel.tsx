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

// --- PARTÍCULAS SUTIS ---
const HeartEmitter = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) return null;
    const particles = Array.from({ length: 3 }); 
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-purple-500/80"
                    initial={{ opacity: 0, y: 50, x: 0, scale: 0.4 }}
                    animate={{ 
                        opacity: [0, 1, 0],
                        y: -100 - (Math.random() * 50),
                        x: (Math.random() - 0.5) * 80, 
                        scale: [0.4, 0.9, 0.5],
                        rotate: (Math.random() - 0.5) * 40
                    }}
                    transition={{ 
                        duration: 2 + Math.random(),
                        repeat: Infinity, 
                        ease: "easeOut",
                        delay: i * 0.4,
                    }}
                    style={{ left: '50%', top: '50%' }}
                >
                    <Heart fill="currentColor" strokeWidth={0} size={22 + Math.random() * 15} className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                </motion.div>
            ))}
        </div>
    );
};

// --- COMPONENTE CELULAR ---
const IphoneMockup = ({ children, isActive }: { children: React.ReactNode, isActive?: boolean }) => {
    return (
        // O Tamanho do celular é fixo e imponente
        <div className={cn(
            "relative mx-auto transition-all duration-500 ease-out select-none",
            "h-[500px] w-[260px] md:h-[620px] md:w-[310px]", 
            isActive 
                ? "scale-100 z-50 brightness-100" 
                : "scale-90 z-0 brightness-[0.6] opacity-90 grayscale-[20%]" // Deixei menos escuro para ver melhor os de trás
        )}>
            <HeartEmitter isActive={!!isActive} />
            
            {/* Glow Central */}
            {isActive && (
                <div className="absolute inset-0 bg-purple-600/25 blur-[50px] rounded-full -z-10" />
            )}

            {/* Estrutura */}
            <div className="relative w-full h-full border-zinc-900 bg-black border-[7px] md:border-[9px] rounded-[3rem] md:rounded-[3.5rem] shadow-2xl flex flex-col justify-start overflow-hidden ring-1 ring-white/10 z-20">
                <div className="absolute top-[90px] -left-[8px] h-[30px] w-[3px] bg-zinc-800 rounded-l-md"></div>
                <div className="absolute top-[130px] -left-[8px] h-[50px] w-[3px] bg-zinc-800 rounded-l-md"></div>
                
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 h-[26px] w-[90px] md:h-[32px] md:w-[110px] bg-black rounded-full z-30 ring-1 ring-white/10 pointer-events-none"></div>
                
                <div className="w-full h-full bg-zinc-950 relative z-10 overflow-hidden rounded-[2.6rem] md:rounded-[3rem]">
                    {children}
                    <div className="absolute bottom-0 w-full h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20"></div>
                </div>
                
                <div className="absolute inset-0 pointer-events-none z-40 rounded-[3rem] md:rounded-[3.5rem] ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"></div>
            </div>
        </div>
    );
}

export default function FeaturesCarousel() {
    const { t } = useTranslation();
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // DADOS ORIGINAIS
    const originalSlides = useMemo(() => [
        {
          id: 1,
          icon: Calendar,
          title: t('featuresCarousel.slide1.title'),
          description: t('featuresCarousel.slide1.description'),
          type: 'video', 
          media: "https://i.imgur.com/FxHuXVb.mp4" 
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
    ], [t]);

    // SOLUÇÃO DO BUG "3-1-2": Duplicamos os slides. 
    // O Swiper precisa de mais slides do que 'slidesPerView' para fazer um loop perfeito.
    // Com apenas 3 slides, ele se perde. Com 6 (ou 9), o loop é matemático e suave.
    const featureSlides = [...originalSlides, ...originalSlides];

    // Calculamos o índice real (0, 1, 2) baseado no loop duplicado para exibir o texto correto
    const realActiveIndex = activeIndex % originalSlides.length;
    const activeContent = originalSlides[realActiveIndex];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full flex flex-col items-center justify-center py-12 md:py-20 overflow-hidden bg-transparent"
        >
            
            {/* Header Texto */}
            <div className="text-center w-full max-w-4xl mx-auto mb-8 px-4 relative z-10 min-h-[160px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={realActiveIndex} // Usa o índice real para animar o texto
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                    >
                        <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            <activeContent.icon className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
                            {activeContent.title}
                        </h3>
                        <p className="text-sm md:text-lg text-zinc-300 font-medium max-w-lg leading-relaxed">
                            {activeContent.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* CARROSSEL */}
            <div className="relative w-full max-w-[1400px]">
                 <Swiper
                    onSwiper={setSwiper}
                    onSlideChange={(s) => setActiveIndex(s.realIndex)}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    loop={true}
                    slidesPerView={'auto'}
                    initialSlide={1} // Começa no meio visualmente
                    speed={600}
                    // AQUI ESTÁ A CONFIGURAÇÃO "COLADO" (GLUED)
                    coverflowEffect={{
                        rotate: 0,        // Rotação ZERO ou mínima para parecer "stacked" como na foto 2
                        stretch: 0,       // O controle será feito via largura do slide (veja CSS abaixo)
                        depth: 150,       // Profundidade para dar o efeito 3D atrás
                        modifier: 1,
                        slideShadows: false,
                        scale: 1          // Mantemos a escala próxima
                    }}
                    // Breakpoints para ajustar o "aperto" (stretch)
                    breakpoints={{
                        0: { // Mobile
                            coverflowEffect: {
                                rotate: 20, 
                                stretch: -40, // NEGATIVO: Puxa os slides pra cima do outro
                                depth: 120,
                                scale: 0.85
                            }
                        },
                        768: { // Desktop
                            coverflowEffect: {
                                rotate: 20,    // Leve rotação
                                stretch: -90,  // MUITO NEGATIVO: Isso faz eles ficarem COLADOS
                                depth: 250,    // Profundidade forte
                                scale: 0.85
                            }
                        }
                    }}
                    modules={[EffectCoverflow, Navigation, Pagination]}
                    className="features-swiper !pb-16 !px-4 !overflow-visible" 
                 >
                     {featureSlides.map((slide, index) => (
                        // Largura fixa aqui é importante para o cálculo de sobreposição
                        <SwiperSlide key={`${slide.id}-${index}`} className="!w-[260px] md:!w-[310px] z-10">
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

                 {/* Botões de Navegação */}
                 <div className="hidden md:flex justify-between w-full absolute top-1/2 -translate-y-1/2 px-12 lg:px-40 pointer-events-none z-30">
                    <Button onClick={() => swiper?.slidePrev()} variant="ghost" size="icon" className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 backdrop-blur-md transition-all shadow-2xl group">
                        <ChevronLeft className="h-8 w-8 text-white group-hover:-translate-x-1 transition-transform"/>
                    </Button>
                    <Button onClick={() => swiper?.slideNext()} variant="ghost" size="icon" className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 backdrop-blur-md transition-all shadow-2xl group">
                        <ChevronRight className="h-8 w-8 text-white group-hover:translate-x-1 transition-transform"/>
                    </Button>
                 </div>
            </div>
            
            {/* Paginação */}
            <div className="flex gap-2.5 mt-4 z-20">
                {originalSlides.map((_, index) => (
                    <button 
                        key={index}
                        // Precisamos encontrar o próximo índice correspondente no loop duplicado
                        onClick={() => {
                            // Hack para encontrar o slide mais próximo visualmente que corresponde ao ID
                            const currentRealIndex = swiper?.realIndex || 0;
                            const targetIndex = index;
                            // Se estivermos longe, o swiper se vira com o loopTo
                            swiper?.slideToLoop(targetIndex) 
                        }}
                        className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            realActiveIndex === index 
                                ? "w-10 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
                                : "w-2 bg-zinc-800 hover:bg-zinc-700"
                        )}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>

             <motion.div className="mt-12 md:mt-16 relative z-20" whileTap={{ scale: 0.95 }}>
                <Button asChild className="bg-white text-black hover:bg-zinc-200 text-lg font-bold px-10 py-7 rounded-full shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)] transition-all">
                    <Link href="/criar" className="flex items-center gap-2">
                        {t('featuresCarousel.cta')} 
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </Button>
             </motion.div>
        </motion.div>
    );
}
