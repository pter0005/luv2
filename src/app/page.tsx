"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Play,
  Sparkles,
  Zap,
  Star,
  Palette,
  MessageCircle,
  Heart,
  TestTube,
  Hourglass,
  DatabaseZap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import dynamic from 'next/dynamic';
import FeaturesCarousel from '@/components/layout/FeaturesCarousel';
import { PlanFeature } from '@/components/layout/PlanFeature';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import TestimonialsMarquee from '@/components/layout/TestimonialsMarquee';

const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

// --- OTIMIZAÇÃO: Componente de Seção Leve ---
const AnimatedSection = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section ref={ref} id={id} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="will-change-[opacity,transform]"
            >
                {children}
            </motion.div>
        </section>
    );
};

const FloatingHeart = ({ className, delay }: { className?: string; delay: number }) => {
  return (
    <motion.div
      className={cn("absolute text-purple-500/40 pointer-events-none z-20", className)} // z-20 fica entre os celulares de trás (z-10) e o da frente (z-30)
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: -20 }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror", // Efeito de subida e descida
        delay,
      }}
    >
      <Heart fill="currentColor" strokeWidth={0} className="w-16 h-16 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
    </motion.div>
  );
};


// --- COMPONENTE IPHONE (Leve, sem Blur pesado) ---
const Iphone15Pro = ({ videoSrc, delay = 0, className }: { videoSrc: string, delay?: number, className?: string }) => (
  <motion.div 
    initial={{ y: 40, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
    className={cn("relative group transform-gpu will-change-transform", className)}
  >
    <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-[#1a1a1a] shadow-2xl ring-1 ring-white/10">
        <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden">
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50">
                <div className="w-[100px] h-[28px] bg-black rounded-full flex items-center justify-between px-3 shadow-sm ring-1 ring-[#1f1f1f]">
                    <div className="w-2 h-2 rounded-full bg-[#111] ring-1 ring-white/10 ml-auto opacity-50"></div>
                </div>
            </div>
            <div className="relative w-full h-full bg-[#050505] z-10">
                <video 
                    className="w-full h-full object-cover scale-[1.01]" 
                    autoPlay loop muted playsInline 
                    src={videoSrc}
                />
            </div>
            <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40 rounded-[3.2rem]"></div>
        </div>
    </div>
  </motion.div>
);

// --- SEÇÃO DE DEMONSTRAÇÃO (ESTILO LEQUE 3D) ---
function DemoSection() {
    return (
        <section className="w-full py-16 px-4 flex justify-center items-center overflow-hidden">
            <div className="relative w-full max-w-[1400px] h-[550px] rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/5 shadow-[0_0_80px_-20px_rgba(109,40,217,0.4)] group">
                
                {/* BACKGROUND ROXO ESCURO */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a052b] via-[#0f021a] to-[#05000a] z-0"></div>
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none perspective-500">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transform rotate-x-12 scale-150"></div>
                </div>
                
                {/* GLOWS / LUZES */}
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                {/* ÍCONES FLUTUANTES (Sparkles e Zap) */}
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-12 left-[20%] text-purple-300 opacity-60 z-10">
                   <Sparkles />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-20 right-[20%] text-pink-300 opacity-50 z-10">
                   <Zap />
                </motion.div>

                <div className="relative z-20 w-full h-full flex items-center justify-between px-4">
                    
                    {/* CELULAR ESQUERDO (Video GHtKVNZ.mp4) */}
                    <div className="hidden md:flex absolute -left-24 lg:-left-12 top-10 justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 120, rotateX: 10 }}
                            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative group perspective-1000 origin-center rotate-[-40deg] scale-[0.85] lg:scale-90">
                             <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-gradient-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
                                <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden">
                                    <video className="w-full h-full object-cover scale-[1.02]" autoPlay loop muted playsInline src="https://i.imgur.com/GHtKVNZ.mp4"></video>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CONTEÚDO CENTRAL (Texto e Botão) */}
                    <div className="flex-1 flex flex-col items-center text-center mx-auto z-30 max-w-4xl mt-[-20px]">
                        
                        <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Nova Experiência</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/10 blur-[60px] rounded-full -z-10"></div>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">Teste Nossa</span>
                                <span className="block text-4xl md:text-5xl font-light text-gray-400 my-2 tracking-normal italic font-serif opacity-80">página de</span>
                                <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 pb-2">Demonstração</span>
                                </span>
                            </h2>
                        </motion.div>

                        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-6 text-gray-400 max-w-lg text-sm md:text-base font-medium leading-relaxed">
                            Veja na prática como sua declaração pode se tornar uma <span className="text-white font-semibold">experiência inesquecível</span>.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-10">
                            <a target="_blank" rel="noopener noreferrer" href="https://mycupid.com.br/p/A0vASdM58tZ2BOMksqCB">
                                <button className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] group hover:scale-105 transition-transform duration-300">
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"></span>
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black/90 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-3">
                                      <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Testar Agora</span>
                                    </span>
                                </button>
                            </a>
                        </motion.div>
                    </div>

                    {/* CELULAR DIREITO (Video t7ICxbN.mp4) */}
                    <div className="hidden md:flex absolute -right-24 lg:-right-12 top-10 justify-center">
                         <motion.div
                            initial={{ opacity: 0, y: 120, rotateX: 10 }}
                            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative group perspective-1000 origin-center rotate-[40deg] scale-[0.85] lg:scale-90">
                             <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-gradient-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
                                <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden">
                                    <video className="w-full h-full object-cover scale-[1.02]" autoPlay loop muted playsInline src="https://i.imgur.com/t7ICxbN.mp4"></video>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default function Home() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const phrases = useMemo(() => ["para alguém especial!", "de forma única!", "para quem merece!"], []);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typeSpeed = isDeleting ? 40 : 80;
    const delayBeforeDelete = 2000;

    const handleTyping = () => {
      if (!isDeleting) {
        if (typedPhrase.length < currentPhrase.length) setTypedPhrase(currentPhrase.slice(0, typedPhrase.length + 1));
        else setTimeout(() => setIsDeleting(true), delayBeforeDelete);
      } else {
        if (typedPhrase.length > 0) setTypedPhrase(currentPhrase.slice(0, typedPhrase.length - 1));
        else { setIsDeleting(false); setPhraseIndex((prev) => (prev + 1) % phrases.length); }
      }
    };
    const timer = setTimeout(handleTyping, typeSpeed);
    return () => clearTimeout(timer);
  }, [typedPhrase, isDeleting, phraseIndex, phrases]);

  const simpleSteps = useMemo(() => [
    { icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl, title: t('home.howitworks.step1.title'), description: t('home.howitworks.step1.description') },
    { icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl, title: t('home.howitworks.step2.title'), description: t('home.howitworks.step2.description') },
    { icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl, title: t('home.howitworks.step3.title'), description: t('home.howitworks.step3.description') },
    { icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl, title: t('home.howitworks.step4.title'), description: t('home.howitworks.step4.description') },
  ], [t]);

  if (showTimeline) return <Timeline events={[]} onClose={() => setShowTimeline(false)} />;

  return (
    <>
       {/* --- HERO SECTION DEFINITIVA --- */}
       <section ref={heroRef} className="relative w-full overflow-hidden flex items-center justify-center min-h-[100dvh] py-12 lg:py-0">

        <div className="container flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 items-center relative z-10 h-full">
            
            {/* --- TEXTO --- */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left pt-0 relative z-20 order-2 lg:order-1">
                 
                 <div className="hidden lg:inline-flex items-center gap-3 bg-zinc-900/80 border border-white/10 rounded-full py-2 px-4 mb-6 shadow-lg">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0112] overflow-hidden bg-gray-800">
                                <Image src={`https://picsum.photos/seed/love${i}/100/100`} alt="User" width={32} height={32} className="object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Junte-se a</span>
                        <span className="text-sm font-bold text-white">+20.000 Casais</span>
                    </div>
                 </div>

                 <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.1] mb-6 min-h-[120px] lg:min-h-[auto]">
                    Declare seu amor <br />
                    <span className="relative inline-block mt-2">
                        <span className="font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-5xl lg:text-7xl pb-4">
                            {typedPhrase}
                            <span className="animate-blink text-purple-400 ml-1">|</span>
                        </span>
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-purple-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                </h1>

                <p className="text-base lg:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed font-light">
                    Transforme seus sentimentos em uma <strong className="text-white font-medium">obra de arte digital</strong>. Uma experiência exclusiva, criada para celebrar momentos que merecem ser eternos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/login?redirect=/criar" className="w-full sm:w-auto">
                        <Button size="xl" className="w-full sm:w-auto bg-white text-black hover:bg-purple-50 font-bold text-lg px-8 py-6 rounded-full shadow-lg">
                            {t('home.hero.cta')} <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="#demo-section" className="w-full sm:w-auto">
                         <Button variant="ghost" size="xl" className="w-full sm:w-auto text-white border border-white/10 rounded-full px-8 py-6 hover:bg-white/5">
                            <Play className="w-4 h-4 mr-2 fill-white" /> Ver Exemplo
                        </Button>
                    </Link>
                </div>
            </div>
            
            {/* --- ÁREA DOS CELULARES + CARD (MOBILE) --- */}
            <div className="flex flex-col items-center w-full order-1 lg:order-2">
                <div className="inline-flex lg:hidden items-center gap-3 bg-zinc-900/80 border border-white/10 rounded-full py-2 px-4 mb-4 shadow-lg">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0112] overflow-hidden bg-gray-800">
                                <Image src={`https://picsum.photos/seed/love${i}/100/100`} alt="User" width={32} height={32} className="object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Junte-se a</span>
                        <span className="text-sm font-bold text-white">+20.000 Casais</span>
                    </div>
                </div>

                <div className="relative h-[450px] sm:h-[500px] lg:h-[650px] w-full flex items-center justify-center perspective-[1200px] mt-0">
                    <div className="relative w-full max-w-[500px] h-[500px] sm:h-[600px] flex items-center justify-center scale-[0.6] xs:scale-[0.75] md:scale-100 transition-transform duration-300 transform-gpu will-change-transform">
                        {/* 1. ESQUERDA (ATRÁS & -15º) */}
                        <motion.div
                            initial={{ opacity: 0, x: 0 }}
                            whileInView={{ opacity: 1, x: -90, y: 30, rotate: -15 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="absolute z-10 brightness-[0.5] hover:z-40 hover:brightness-100 hover:scale-105 transition-all duration-500 origin-bottom-right"
                        >
                            <div className="w-[240px] h-[500px] rounded-[2.5rem] border-[6px] border-[#121212] bg-black overflow-hidden shadow-2xl">
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/FxHuXVb.png"
                                    src="https://i.imgur.com/FxHuXVb.mp4" 
                                />
                            </div>
                        </motion.div>

                        {/* 2. DIREITA (ATRÁS & 15º) */}
                        <motion.div
                            initial={{ opacity: 0, x: 0 }}
                            whileInView={{ opacity: 1, x: 90, y: 30, rotate: 15 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="absolute z-10 brightness-[0.5] hover:z-40 hover:brightness-100 hover:scale-105 transition-all duration-500 origin-bottom-left"
                        >
                            <div className="w-[240px] h-[500px] rounded-[2.5rem] border-[6px] border-[#121212] bg-black overflow-hidden shadow-2xl">
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/t7ICxbN.png"
                                    src="https://i.imgur.com/t7ICxbN.mp4" 
                                />
                            </div>
                        </motion.div>

                        {/* 3. CENTRAL (DESTAQUE) */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                            className="relative z-30"
                        >
                            <motion.div
                            animate={{ y: [0, 15, 0]}}
                            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity}}
                            >
                            <div className="w-[280px] h-[580px] rounded-[3.5rem] border-[8px] border-[#1a1a1a] bg-black overflow-hidden shadow-[0_20px_70px_-20px_rgba(168,85,247,0.5)] ring-1 ring-white/20">
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-40 ring-1 ring-white/10 flex items-center justify-center">
                                    <div className="w-16 h-full bg-zinc-900/50 rounded-full blur-[1px]"></div>
                                </div>
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/GHtKVNZ.png"
                                    src="https://i.imgur.com/GHtKVNZ.mp4" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40 pointer-events-none"></div>
                            </div>
                            </motion.div>
                        </motion.div>


                        <FloatingHeart className="top-[10%] left-[15%]" delay={0} />
                        <FloatingHeart className="top-[5%] right-[15%]" delay={1.2} />
                        <FloatingHeart className="bottom-[10%] left-[20%]" delay={2.4} />
                        <FloatingHeart className="bottom-[5%] right-[20%]" delay={3.6} />


                        {/* WIDGET 1: Suporte (Esquerda Topo) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }} 
                            whileInView={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.5 }}
                            className="absolute -left-[140px] md:-left-[200px] top-[10%] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 py-3 px-4 rounded-2xl shadow-2xl flex items-center gap-3 z-40 hover:scale-105 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                <MessageCircle size={18} className="text-green-400" />
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e] border border-black"></div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Suporte</p>
                                <p className="text-sm text-white font-bold">Online 24/7</p>
                            </div>
                        </motion.div>

                        {/* WIDGET 2: Avaliação (Direita Baixo) */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }} 
                            whileInView={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.7 }}
                            className="absolute -right-[120px] md:-right-[180px] bottom-[10%] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 py-4 px-5 rounded-2xl shadow-2xl z-40 flex flex-col items-center hover:scale-105 transition-transform"
                        >
                            <div className="absolute -top-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                <Palette size={10} /> Design Personalizado
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-purple-500 text-purple-500" />)}
                            </div>
                            <p className="text-xs text-white font-bold">Avaliação dos usuários</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* RESTO DAS SEÇÕES (MANTIDAS) */}
      <AnimatedSection id="how-it-works-simple" className="section-padding bg-transparent">
        <div className="container max-w-6xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">{t('home.howitworks.title').replace('4 passos simples', '')}<span className="text-primary">{t('home.howitworks.title').match(/4 passos simples/)}</span></h2>
              <p className="text-base text-muted-foreground mt-4">{t('home.howitworks.description')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {simpleSteps.map((step, i) => (
                    <div key={i} className="relative flex flex-col items-center text-center group">
                        <div className="absolute -top-5 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30 z-10">
                            {i+1}
                        </div>
                        <div className="card-glow p-6 pt-10 rounded-2xl flex flex-col items-center flex-grow w-full transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105 bg-white/5 border-white/10">
                            <div className="relative w-48 h-48 mb-4">
                                <Image src={step.icon || "https://placehold.co/160"} alt={step.title} fill className="object-contain" sizes="192px"/>
                            </div>
                            <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                            <p className="text-muted-foreground text-sm mt-2 flex-grow">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </AnimatedSection>
      
      <AnimatedSection className="section-padding bg-transparent">
        <div className="container relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-0">
              <h2 className='text-4xl md:text-5xl font-semibold tracking-tight leading-tight'>{t('home.features.title')}</h2>
              <h3 className="text-5xl md:text-6xl font-bold mt-1 leading-none gradient-text">{t('home.features.subtitle')}</h3>
              <p className="text-lg text-muted-foreground mt-4">{t('home.features.description')}</p>
            </div>
            <FeaturesCarousel />
        </div>
      </AnimatedSection>

      <AnimatedSection id="demo-section" className="section-padding bg-transparent">
        <DemoSection />
      </AnimatedSection>
      
      <AnimatedSection id="avaliacoes" className="section-padding bg-transparent overflow-hidden relative">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-500 overflow-hidden"><Image src={`https://picsum.photos/seed/avatar${i}/24/24`} alt="User" width={24} height={24} /></div>)}
                </div>
                <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">+10.000 Casais Felizes</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              O que nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">clientes</span> dizem
            </h2>
            <p className="text-lg text-muted-foreground">Histórias reais de pessoas que criaram páginas únicas para surpreender alguém especial com o MyCupid.</p>
          </div>
          <div className="-mx-4 md:-mx-8 lg:-mx-16"><TestimonialsMarquee /></div>
        </div>
      </AnimatedSection>
      
      <AnimatedSection id="planos" className="section-padding bg-transparent">
        <div className="container max-w-5xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{t('home.plans.title')}</h2>
                <p className="mt-4 text-base text-muted-foreground">{t('home.plans.description')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col bg-white/5 backdrop-blur-md">
                    <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" /> {t('home.plans.recommended')}
                    </div>
                    <h3 className="text-2xl font-bold text-primary">{t('home.plans.avancado.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('home.plans.avancado.description')}</p>
                    <div className="text-center my-6">
                        <p className="text-4xl font-bold text-foreground">R$24,99</p>
                        <p className="text-sm text-muted-foreground">Pagamento único</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_advanced')} />
                        <PlanFeature text={t('home.plans.feature.music')} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} />
                        <PlanFeature text={t('home.plans.feature.timeline_advanced')} />
                        <PlanFeature text="Página permanente com backup" icon={DatabaseZap} />
                    </ul>
                    <Button asChild size="lg" className="w-full mt-auto">
                        <Link href="/login?redirect=/criar?plan=avancado&new=true"><TestTube className="mr-2" />{t('home.plans.avancado.cta')}</Link>
                    </Button>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">{t('home.plans.basico.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('home.plans.basico.description')}</p>
                    <div className="text-center my-6">
                        <p className="text-4xl font-bold text-foreground">R$14,99</p>
                        <p className="text-sm text-muted-foreground">Pagamento único</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_basic')} />
                         <PlanFeature text={t('home.plans.feature.timeline_basic')} />
                        <PlanFeature text="Página disponível por 12 horas" icon={Hourglass} />
                        <PlanFeature text={t('home.plans.feature.music')} included={false} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} included={false}/>
                    </ul>
                     <Button asChild size="lg" className="w-full mt-auto" variant="secondary">
                        <Link href="/login?redirect=/criar?plan=basico&new=true"><TestTube className="mr-2" />{t('home.plans.basico.cta')}</Link>
                    </Button>
                </div>
            </div>
        </div>
      </AnimatedSection>
    </>
  );
}
