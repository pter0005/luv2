
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
  CheckCircle2,
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

const AnimatedSection = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section ref={ref} id={id} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </section>
    );
};

const CSSIphone = ({ videoSrc, className }: { videoSrc: string, className?: string }) => (
  <div className={cn("relative w-[280px] h-[580px] rounded-[3.5rem] border-[8px] border-[#1a1a1a] bg-black overflow-hidden", className)}>
    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-40 ring-1 ring-white/10 flex items-center justify-center">
        <div className="w-16 h-full bg-zinc-900/50 rounded-full blur-[1px]"></div>
    </div>
    <video className="w-full h-full object-cover" style={{objectPosition: '48% 50%'}} autoPlay loop muted playsInline src={videoSrc} />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40 pointer-events-none"></div>
  </div>
);

const FloatingWidget = ({ children, className, delay }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
        className={cn("absolute bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl z-40", className)}
    >
        {children}
    </motion.div>
);


// --- COMPONENTE IPHONE OTIMIZADO (GPU FRIENDLY) ---
const Iphone15Pro = ({ videoSrc, className }: { videoSrc: string, className?: string }) => (
  <div className={cn("relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-[#1a1a1a] shadow-2xl ring-1 ring-white/10 group transform-gpu will-change-transform", className)}>
    <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden mask-image-rounded">
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50">
            <div className="w-[100px] h-[28px] bg-black rounded-full flex items-center justify-between px-3 shadow-sm ring-1 ring-[#1f1f1f]">
                <div className="w-2 h-2 rounded-full bg-[#111] ring-1 ring-white/10 ml-auto opacity-50"></div>
            </div>
        </div>
        <div className="relative w-full h-full bg-[#050505] z-10">
            <video 
                className="w-full h-full object-cover" 
                style={{objectPosition: '48% 50%'}}
                autoPlay loop muted playsInline 
                src={videoSrc}
            />
        </div>
        {/* Reflexo estático para não pesar a GPU */}
        <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-30 rounded-[3.2rem]"></div>
    </div>
  </div>
);

function DemoSection() {
    return (
      <section className="w-full py-16 px-4 flex justify-center items-center overflow-hidden">
        <div className="relative w-full max-w-[1400px] h-[550px] rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/5 bg-black/40 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a052b]/80 via-[#0f021a]/80 to-[#05000a]/80"></div>
            
            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-12 left-[20%] text-purple-300 opacity-60 z-10">
                <Sparkles size={20} />
            </motion.div>

            <div className="relative z-20 w-full h-full flex items-center justify-between px-4">
                {/* Lateral Esquerda */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex absolute -left-12 top-10 justify-center scale-90"
                >
                    <div className="rotate-[-15deg]">
                        <Iphone15Pro videoSrc="https://i.imgur.com/GHtKVNZ.mp4" />
                    </div>
                </motion.div>

                {/* Texto Central */}
                <div className="flex-1 flex flex-col items-center text-center mx-auto z-30 max-w-4xl mt-[-20px]">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Nova Experiência</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-xl">
                        Teste Nossa <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400">Demonstração</span>
                    </h2>

                    <div className="mt-10">
                        <Link href="https://mycupid.com.br/p/A0vASdM58tZ2BOMksqCB" passHref target="_blank" rel="noopener noreferrer">
                            <button className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-50 group hover:scale-105 transition-transform duration-300">
                                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black/90 px-8 py-1 text-sm font-medium text-white gap-3">
                                    <Play size={14} fill="white" />
                                    <span className="text-lg font-bold">Testar Agora</span>
                                </span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Lateral Direita */}
                <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex absolute -right-12 top-10 justify-center scale-90"
                >
                    <div className="rotate-[15deg]">
                        <Iphone15Pro videoSrc="https://i.imgur.com/t7ICxbN.mp4" />
                    </div>
                </motion.div>
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
      <section ref={heroRef} className="relative w-full overflow-hidden flex items-center min-h-[100dvh] pt-24 pb-12 lg:py-0 bg-[#05000a]">
    {/* Background Effects (Sutil e Profissional) */}
    <div className="absolute inset-0 z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
         <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[100px] mix-blend-screen opacity-40"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
    </div>

    <div className="container relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
            
            {/* --- COLUNA ESQUERDA: TEXTO E CTA --- */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
                 
                 {/* Badge de Prova Social */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-4 mb-8 backdrop-blur-md shadow-lg hover:bg-white/10 transition-colors cursor-default"
                 >
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0112] overflow-hidden bg-gray-800">
                                <Image src={`https://picsum.photos/seed/users${i}/100/100`} alt="User" width={32} height={32} className="object-cover" />
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-[#0a0112] bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">+2k</div>
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Junte-se a</span>
                        <span className="text-sm font-bold text-white">+20.000 Casais</span>
                    </div>
                 </motion.div>

                 {/* Título Principal */}
                 <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl lg:text-7xl font-bold tracking-tight text-white font-display leading-[1.1] mb-6"
                >
                    Declare seu amor <br />
                    <span className="block mt-2 min-h-[1.2em]">
                        <span className="font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 pb-2 pr-2">
                            {typedPhrase}
                        </span>
                        <span className="animate-blink inline-block w-[3px] h-[0.8em] bg-purple-400 align-middle"></span>
                    </span>
                </motion.h1>

                {/* Subtítulo */}
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg text-gray-400 max-w-lg mb-8 leading-relaxed font-light"
                >
                    Transforme seus sentimentos em uma <strong className="text-white font-medium">experiência digital imersiva</strong>. Crie um site exclusivo com suas fotos, vídeos e músicas para eternizar momentos.
                </motion.p>

                {/* Botões */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link href="/login?redirect=/criar" className="w-full sm:w-auto">
                        <Button size="xl" className="w-full sm:w-auto bg-white text-black hover:bg-purple-100 hover:scale-105 transition-all duration-300 font-bold text-lg px-8 py-7 rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">
                            Criar minha página <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="#demo-section" className="w-full sm:w-auto">
                         <Button variant="ghost" size="xl" className="w-full sm:w-auto text-white border border-white/10 rounded-full px-8 py-7 hover:bg-white/5 hover:border-white/30 transition-all">
                            <Play className="w-4 h-4 mr-2 fill-white" /> Ver Exemplo
                        </Button>
                    </Link>
                </motion.div>

                {/* Checkmarks */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 flex items-center gap-6 text-xs text-gray-500 font-medium"
                >
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Sem mensalidade</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Acesso vitalício</span>
                </motion.div>
            </div>
            

            {/* --- COLUNA DIREITA: VISUAL HERO (O "PULO DO GATO") --- */}
            <div className="relative h-[500px] lg:h-[700px] flex items-center justify-center order-1 lg:order-2 perspective-[2000px]">
                 
                 {/* Glow Central Atrás dos Phones */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/30 blur-[80px] rounded-full z-0"></div>

                 {/* CONTAINER DOS CELULARES - Ajustado para ser responsivo (scale no mobile) */}
                 <div className="relative w-[320px] h-[600px] scale-[0.65] sm:scale-[0.8] md:scale-[0.9] lg:scale-100 transition-transform duration-500">
                    
                     {/* 1. CELULAR ESQUERDA (Atrás + Inclinado) */}
                     <motion.div
                        initial={{ x: 0, opacity: 0, rotate: 0 }}
                        animate={{ x: -140, opacity: 1, rotate: -15, y: 40 }}
                        transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                        className="absolute top-0 left-0 z-10 brightness-[0.5] hover:brightness-[0.7] transition-all duration-500 origin-bottom-right"
                     >
                        <CSSIphone videoSrc="https://res.cloudinary.com/dncoxm1it/video/upload/v1769412069/2026-01-26_04-19-40_btnwe5.mp4" />
                     </motion.div>

                     {/* 2. CELULAR DIREITA (Atrás + Inclinado) */}
                     <motion.div
                        initial={{ x: 0, opacity: 0, rotate: 0 }}
                        animate={{ x: 140, opacity: 1, rotate: 15, y: 40 }}
                        transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
                        className="absolute top-0 right-0 z-10 brightness-[0.5] hover:brightness-[0.7] transition-all duration-500 origin-bottom-left"
                     >
                         <CSSIphone videoSrc="https://res.cloudinary.com/dncoxm1it/video/upload/v1769412070/2026-01-26_04-18-56_wyf9ir.mp4" />
                     </motion.div>

                     {/* 3. CELULAR CENTRAL (Destaque) */}
                     <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0 z-30 drop-shadow-2xl"
                     >
                         <CSSIphone videoSrc="https://res.cloudinary.com/dncoxm1it/video/upload/v1769411450/2026-01-26_04-09-00_uplyk1.mp4" className="shadow-[0_0_50px_-10px_rgba(147,51,234,0.3)]" />
                     </motion.div>


                     {/* --- ELEMENTOS FLUTUANTES (WIDGETS) --- */}
                     
                     {/* WIDGET: SUPORTE (Esquerda Topo) */}
                     <FloatingWidget delay={0.8} className="top-[100px] -left-[90px] p-3 pr-5 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center relative">
                             <MessageCircle size={20} className="text-green-400" />
                             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border border-black rounded-full"></span>
                         </div>
                         <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suporte</p>
                             <p className="text-sm font-bold text-white">Online 24/7</p>
                         </div>
                     </FloatingWidget>

                     {/* WIDGET: AVALIAÇÃO (Direita Base) */}
                     <FloatingWidget delay={1} className="bottom-[80px] -right-[100px] py-4 px-5 flex flex-col items-center min-w-[160px]">
                         <div className="absolute -top-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                             <Palette size={10} /> Design Exclusivo
                         </div>
                         <div className="flex gap-1 mb-1 mt-1">
                             {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                         </div>
                         <p className="text-xs font-medium text-gray-300">"Ela chorou de emoção!"</p>
                     </FloatingWidget>

                     {/* EFEITOS DE CORAÇÃO (Paralaxe suave) */}
                     <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-12 -right-12 z-0 opacity-60">
                        <Heart fill="#a855f7" className="text-purple-300 w-24 h-24 rotate-12 blur-[1px]" />
                     </motion.div>
                     <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-[20%] -left-12 z-0 opacity-50">
                        <Heart fill="#a855f7" className="text-purple-600 w-12 h-12 rotate-[25deg] drop-shadow-md" />
                     </motion.div>
                     <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-20 -left-20 z-40 opacity-80">
                        <Heart fill="#a855f7" className="text-purple-600 w-16 h-16 -rotate-12 drop-shadow-lg" />
                     </motion.div>
                     <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-[25%] -right-10 z-0 opacity-50">
                        <Heart fill="#a855f7" className="text-purple-600 w-14 h-14 rotate-[-20deg] drop-shadow-lg" />
                     </motion.div>

                 </div>
            </div>
        </div>
    </div>
  </section>
      
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

