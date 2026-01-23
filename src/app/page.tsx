
"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  TestTube2,
  Play,
  Sparkles,
  Zap,
  Star,
  DatabaseZap,
  Hourglass,
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
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section ref={ref} id={id} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </section>
    );
};

// --- COMPONENTE IPHONE 15 PRO (Design Titânio Realista) ---
const Iphone15Pro = ({ videoSrc, delay = 0, className }: { videoSrc: string, delay?: number, className?: string }) => (
  <motion.div 
    // Animação de entrada: sobe e gira levemente
    initial={{ y: 120, opacity: 0, rotateX: 10 }}
    whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
    transition={{ duration: 1.2, delay: delay, type: "spring", bounce: 0.2 }}
    className={cn("relative group perspective-1000", className)}
  >
    {/* Animação Flutuante Contínua (Para dar vida) */}
    <motion.div 
      animate={{ y: [0, -15, 0] }} 
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay }}
      className="relative"
    >
        {/* Sombra realista no chão */}
        <div className="absolute inset-x-10 bottom-[-20px] h-10 bg-black/60 blur-xl rounded-full opacity-60"></div>

        {/* Estrutura do Celular */}
        <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-gradient-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
        
        {/* Bezel (Borda da tela) */}
        <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden mask-image-rounded">
            
            {/* Dynamic Island */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50">
                <div className="w-[100px] h-[28px] bg-black rounded-full flex items-center justify-between px-3 shadow-[0_2px_10px_rgba(0,0,0,0.5)] ring-1 ring-[#1f1f1f]">
                    <div className="w-2 h-2 rounded-full bg-[#111] ring-1 ring-white/10 ml-auto opacity-50"></div>
                </div>
            </div>

            {/* VÍDEO / TELA */}
            <div className="relative w-full h-full bg-[#050505] z-10">
            <video 
                className="w-full h-full object-cover scale-[1.02]" 
                autoPlay loop muted playsInline 
                src={videoSrc}
            />
            {/* Overlay Cinematográfico */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"></div>
            </div>

            {/* Reflexo de Vidro */}
            <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-30 rounded-[3.2rem]"></div>
        </div>
        </div>
    </motion.div>
  </motion.div>
);

// --- SEÇÃO DE DEMONSTRAÇÃO (LAYOUT INCLINADO/DIAGONAL) ---
function DemoSection() {
    return (
      <section className="w-full py-16 px-4 flex justify-center items-center overflow-hidden">
        
        {/* Container Principal */}
        <div className="relative w-full max-w-[1400px] h-[550px] rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/5 shadow-[0_0_80px_-20px_rgba(109,40,217,0.4)] group">
            
            {/* --- BACKGROUND --- */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a052b] via-[#0f021a] to-[#05000a] z-0"></div>
            
            {/* Grid de Fundo */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none perspective-500">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transform rotate-x-12 scale-150"></div>
            </div>

            {/* Glows de Fundo */}
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Partículas */}
            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-12 left-[20%] text-purple-300 opacity-60 z-10">
                <Sparkles size={20} />
            </motion.div>
            <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-20 right-[20%] text-pink-300 opacity-50 z-10">
                <Zap size={16} fill="currentColor" />
            </motion.div>


            {/* --- CONTEÚDO --- */}
            <div className="relative z-20 w-full h-full flex items-center justify-between px-4">

                {/* --- CELULAR ESQUERDO (INCLINADO 45 GRAUS) --- */}
                {/* rotate-[-45deg] faz ele ficar bem deitado na diagonal */}
                <div className="hidden md:flex absolute -left-24 lg:-left-12 top-10 justify-center">
                    <Iphone15Pro 
                        videoSrc="https://i.imgur.com/GHtKVNZ.mp4" 
                        className="origin-center rotate-[-40deg] scale-[0.85] lg:scale-90" // Rotação forte para esquerda
                    />
                </div>

                {/* --- TEXTO CENTRAL --- */}
                <div className="flex-1 flex flex-col items-center text-center mx-auto z-30 max-w-4xl mt-[-20px]">
                    
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
                    >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Nova Experiência</span>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/10 blur-[60px] rounded-full -z-10"></div>

                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                                Teste Nossa
                            </span>
                            <span className="block text-4xl md:text-5xl font-light text-gray-400 my-2 tracking-normal italic font-serif opacity-80">
                                página de
                            </span>
                            <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 pb-2">
                                    Demonstração
                                </span>
                                <span className="absolute inset-0 z-0 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-lg opacity-40 animate-pulse">
                                    Demonstração
                                </span>
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-pink-500 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="url(#gradient-line)" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#d8b4fe" />
                                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                        </h2>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 text-gray-400 max-w-lg text-sm md:text-base font-medium leading-relaxed"
                    >
                        Veja na prática como sua declaração pode se tornar uma <span className="text-white font-semibold">experiência inesquecível</span>.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-10"
                    >
                        <Link href="https://mycupid.com.br/p/A0vASdM58tZ2BOMksqCB" passHref target="_blank" rel="noopener noreferrer">
                            <button className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] group hover:scale-105 transition-transform duration-300">
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black/90 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                                        <Play size={14} fill="black" className="ml-0.5" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Sem cadastro</span>
                                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Testar Agora</span>
                                    </div>
                                </span>
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* --- CELULAR DIREITO (INCLINADO 45 GRAUS OPOSITOS) --- */}
                {/* rotate-[45deg] faz ele ficar bem deitado na diagonal oposta */}
                <div className="hidden md:flex absolute -right-24 lg:-right-12 top-10 justify-center">
                    <Iphone15Pro 
                        videoSrc="https://i.imgur.com/t7ICxbN.mp4" 
                        delay={0.3} 
                        className="origin-center rotate-[40deg] scale-[0.85] lg:scale-90" // Rotação forte para direita
                    />
                </div>

            </div>
        </div>
      </section>
    );
}

export default function Home() {
  const { t } = useTranslation();

  const cursivePhrases = useMemo(() => [
    t('home.hero.subtitle.part1'),
    t('home.hero.subtitle.part2'),
    t('home.hero.subtitle.part3'),
  ], [t]);
  
  const simpleSteps = useMemo(() => [
    {
        icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl,
        title: t('home.howitworks.step1.title'),
        description: t('home.howitworks.step1.description'),
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl,
        title: t('home.howitworks.step2.title'),
        description: t('home.howitworks.step2.description'),
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl,
        title: t('home.howitworks.step3.title'),
        description: t('home.howitworks.step3.description'),
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl,
        title: t('home.howitworks.step4.title'),
        description: t('home.howitworks.step4.description'),
    },
  ], [t]);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);
  const heroImageUrl = PlaceHolderImages.find(p => p.id === 'heroVertical')?.imageUrl || '';
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const timelineDemoEvents = useMemo(() => {
    const startDate = new Date(2021, 5, 15); // June 15, 2021
    const eventsData = [
      { description: "Nosso primeiro encontro", imageUrl: "https://i.imgur.com/OXZTiYV.png" },
      { description: "Nossa Primeira viagem", imageUrl: "https://i.imgur.com/DlwrBgW.png" },
      { description: "Show do Bruno Mars", imageUrl: "https://i.imgur.com/Ejeh5vJ.png" },
      { description: "Nosso primeiro carro juntos", imageUrl: "https://i.imgur.com/4cJl6lr.png" },
      { description: "Aniversário de 1 ano", imageUrl: "https://i.imgur.com/m6R0J62.png" },
      { description: "Mudança para nosso cantinho", imageUrl: "https://i.imgur.com/bXQmqFE.png" },
      { description: "Férias na Disney", imageUrl: "https://i.imgur.com/5zAqwhQ.png" },
      { description: "O pedido de casamento", imageUrl: "https://i.imgur.com/Ghg4Fqf.png" },
      { description: "Fim de ano na praia", imageUrl: "https://i.imgur.com/cBOYaXM.png" },
      { description: "Aniversário de 2 anos", imageUrl: "https://i.imgur.com/umW7vdJ.png" }
    ];

    return eventsData.map((event, index) => {
      const eventDate = new Date(startDate);
      eventDate.setMonth(startDate.getMonth() + index * 3 + Math.floor(Math.random() * 3));
      eventDate.setDate(startDate.getDate() + Math.floor(Math.random() * 28));

      return {
        id: `demo-${index}`,
        imageUrl: event.imageUrl,
        alt: event.description,
        title: event.description,
        date: eventDate
      };
    });
  }, []);

  useEffect(() => {
    const currentPhrase = cursivePhrases[phraseIndex];
    if (typedPhrase.length < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setTypedPhrase(currentPhrase.slice(0, typedPhrase.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % cursivePhrases.length);
      setTypedPhrase('');
    }, 2000); // Pause for 2 seconds

    return () => clearTimeout(timeout);
  }, [phraseIndex, typedPhrase, cursivePhrases]);

  if (showTimeline) {
    return <Timeline events={timelineDemoEvents} onClose={() => setShowTimeline(false)} />;
  }

  return (
    <>
      <section ref={heroRef} className="relative w-full overflow-hidden flex items-center justify-center min-h-[100vh] py-20 lg:py-0">
        
        {/* --- BACKGROUND CINEMATOGRÁFICO --- */}
        {/* 1. Base Escura */}
        <div className="absolute inset-0 bg-[#05000a] -z-30"></div>

        {/* 2. Holofote Roxo (Ambient Light) */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[800px] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none -z-20"></div>

        {/* 3. Glow Rosa Secundário (Bottom Right) */}
        <div className="absolute bottom-[-10%] right-0 w-[600px] h-[600px] bg-pink-600/10 blur-[100px] rounded-full pointer-events-none -z-20 animate-pulse-slow"></div>

        {/* 4. Partículas/Estrelas Sutis */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 -z-10 mix-blend-overlay"></div>


        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-0 items-center relative z-10 h-full">
            
            {/* --- COLUNA DA ESQUERDA (TEXTO) --- */}
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start pt-10 lg:pt-0 order-2 lg:order-1">
                 
                 {/* Badge de Prova Social (Estilo Imagem 2) */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-4 mb-8 backdrop-blur-md shadow-lg shadow-purple-500/10 hover:bg-white/10 transition-colors cursor-default"
                 >
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0112] overflow-hidden">
                                <Image src={`https://picsum.photos/seed/love${i}/100/100`} alt="User" width={32} height={32} />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Junte-se a</span>
                        <span className="text-sm font-bold text-white">+20.000 Casais</span>
                    </div>
                 </motion.div>

                 <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white font-display leading-[1.1] mb-6">
                    Declare seu amor <br />
                    <span className="relative inline-block mt-2">
                        {/* Texto com Gradiente e Fonte Manuscrita */}
                        <span className="font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-6xl lg:text-8xl animate-gradient-x pb-4">
                            {typedPhrase}
                            <span className="animate-blink text-white ml-1 font-sans font-light">|</span>
                        </span>
                        
                        {/* Sublinhado Artístico */}
                        <svg className="absolute w-full h-4 -bottom-2 left-0 text-purple-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                </h1>

                <p className="text-lg lg:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
                    Transforme seus sentimentos em uma <strong className="text-white font-medium">obra de arte digital</strong>. Uma experiência exclusiva, criada para celebrar momentos que merecem ser eternos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/login?redirect=/criar" className="w-full sm:w-auto">
                        <Button
                        size="xl"
                        className="group relative w-full sm:w-auto bg-white text-black hover:bg-purple-50 hover:scale-105 transition-all duration-300 font-bold text-lg px-8 py-6 rounded-full shadow-[0_0_40px_-10px_rgba(168,85,247,0.6)]"
                        >
                        {t('home.hero.cta')}
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-purple-600" />
                        </Button>
                    </Link>
                    
                    {/* Botão Secundário (Demo) */}
                    <Link href="#demo-section" className="w-full sm:w-auto">
                         <Button
                            variant="ghost"
                            size="xl"
                            className="w-full sm:w-auto text-white hover:bg-white/10 hover:text-white rounded-full px-8 py-6 border border-white/10 backdrop-blur-sm"
                        >
                            <Play className="w-4 h-4 mr-2 fill-white" />
                            Ver Exemplo
                        </Button>
                    </Link>
                </div>
                
                <p className="mt-4 text-xs text-gray-500 font-medium uppercase tracking-widest opacity-60">
                    ✨ Crie grátis • Sem cartão de crédito
                </p>
            </div>
            

            {/* --- COLUNA DA DIREITA (VISUAL FODA) --- */}
            <div className="relative h-[600px] w-full flex items-center justify-center perspective-1000 order-1 lg:order-2">
                 
                 {/* O Celular Principal (Mistura do Img 2 e 3) */}
                 <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: -10 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-20"
                 >
                    {/* Animação de Flutuação Suave */}
                    <motion.div
                        animate={{ y: [-15, 15, -15], rotateZ: [-1, 1, -1] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative w-[300px] h-[600px] border-[8px] border-[#1a1a1a] bg-black rounded-[3.5rem] shadow-[0_0_60px_-15px_rgba(147,51,234,0.5)] overflow-hidden ring-1 ring-white/20">
                            {/* Dynamic Island */}
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-30 ring-1 ring-white/10 flex items-center justify-end px-3">
                                <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
                            </div>

                            {/* Conteúdo da Tela (Simulando o App) */}
                            <div className="relative w-full h-full bg-[#0a0a0a]">
                                <Image 
                                    src="https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=600&h=1200&fit=crop" 
                                    alt="Couple" 
                                    fill 
                                    className="object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                
                                {/* UI Elements dentro do celular */}
                                <div className="absolute bottom-10 left-6 right-6">
                                    <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Nosso tempo juntos</div>
                                    <div className="flex gap-2 mb-6">
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center flex-1 border border-white/5">
                                            <span className="block text-2xl font-bold text-white">02</span>
                                            <span className="text-[10px] text-gray-300">Anos</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center flex-1 border border-white/5">
                                            <span className="block text-2xl font-bold text-white">11</span>
                                            <span className="text-[10px] text-gray-300">Meses</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center flex-1 border border-white/5">
                                            <span className="block text-2xl font-bold text-white">24</span>
                                            <span className="text-[10px] text-gray-300">Dias</span>
                                        </div>
                                    </div>
                                    <button className="w-full bg-white text-black rounded-full py-3 font-bold text-sm shadow-lg">Ver Linha do Tempo</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                 </motion.div>

                 {/* --- ELEMENTOS FLUTUANTES (WIDGETS ESTILO IMAGEM 3) --- */}
                 
                 {/* Widget 1: Música (Esquerda) */}
                 <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute left-[-20px] lg:left-[-60px] top-[20%] bg-[#121212]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 z-30 max-w-[220px]"
                 >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shrink-0">
                        <div className="bar-loader flex gap-[2px] items-end h-4">
                            <span className="w-[3px] h-2 bg-white animate-music-bar"></span>
                            <span className="w-[3px] h-4 bg-white animate-music-bar animation-delay-100"></span>
                            <span className="w-[3px] h-3 bg-white animate-music-bar animation-delay-200"></span>
                        </div>
                    </div>
                    <div>
                         <p className="text-[10px] text-green-400 font-bold uppercase">Tocando agora</p>
                         <p className="text-xs text-white font-medium truncate w-[100px]">Perfect - Ed Sheeran</p>
                    </div>
                 </motion.div>

                 {/* Widget 2: Avaliação (Direita Baixo) */}
                 <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="absolute right-[-10px] lg:right-[-40px] bottom-[25%] bg-[#121212]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-30"
                 >
                    <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-xs text-white font-medium">"Melhor presente!"</p>
                    <p className="text-[10px] text-gray-400 mt-1">- Ana & Pedro</p>
                 </motion.div>

                 {/* Widget 3: Notificação (Topo Direita) */}
                 <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="absolute right-[0px] top-[15%] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-purple-500/40 z-10 rotate-6"
                 >
                    ❤️ Design Personalizado
                 </motion.div>

                 {/* Corações Flutuantes (Particles) */}
                 {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute z-0 text-purple-500/40"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                            opacity: [0, 0.8, 0], 
                            scale: [0.5, 1.2, 0.8],
                            y: [0, -100 - (i*20)],
                            x: [(i%2===0 ? -20 : 20), (i%2===0 ? -50 : 50)]
                        }}
                        transition={{ 
                            duration: 4 + i, 
                            repeat: Infinity, 
                            delay: i * 0.5,
                            ease: "easeOut"
                        }}
                        style={{
                            left: `${20 + (i * 15)}%`,
                            bottom: '10%'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 .81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </motion.div>
                 ))}

            </div>
        </div>
      </section>

      <AnimatedSection id="how-it-works-simple" className="section-padding bg-transparent">
        <div className="container max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">{t('home.howitworks.title').replace('4 passos simples', '')}<span className="text-primary">{t('home.howitworks.title').match(/4 passos simples/)}</span></h2>
              <p className="text-base text-muted-foreground mt-4">
                {t('home.howitworks.description')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {simpleSteps.map((step, i) => (
                    <div key={i} className="relative flex flex-col items-center text-center group">
                        <div className="absolute -top-5 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30 z-10">
                            {i+1}
                        </div>
                        <div className="card-glow p-6 pt-10 rounded-2xl flex flex-col items-center flex-grow w-full transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105">
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
        <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-0">
              <h2 className='text-4xl md:text-5xl font-semibold tracking-tight leading-tight'>{t('home.features.title')}</h2>
              <h3 className="text-5xl md:text-6xl font-bold mt-1 leading-none gradient-text">
                  {t('home.features.subtitle')}
              </h3>
              <p className="text-lg text-muted-foreground mt-4">
                {t('home.features.description')}
              </p>
            </div>
            <FeaturesCarousel />
        </div>
      </AnimatedSection>

      <AnimatedSection id="demo-section" className="section-padding bg-transparent">
        <DemoSection />
      </AnimatedSection>
      
      <AnimatedSection id="avaliacoes" className="section-padding bg-transparent overflow-hidden relative">
        {/* Efeito de Fundo Sutil na Seção */}
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            
            {/* Badge 'Social Proof' */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-500 overflow-hidden">
                             <Image src={`https://picsum.photos/seed/avatar${i}/24/24`} alt="User" width={24} height={24} />
                        </div>
                    ))}
                </div>
                <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">+10.000 Casais Felizes</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              O que nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">clientes</span> dizem
            </h2>
            <p className="text-lg text-muted-foreground">
              Histórias reais de pessoas que criaram páginas únicas para surpreender alguém especial com o MyCupid.
            </p>
          </div>
          
          {/* Componente Marquee Inserido Aqui */}
          <div className="-mx-4 md:-mx-8 lg:-mx-16"> {/* Margem negativa para expandir a largura visual */}
             <TestimonialsMarquee />
          </div>
          
        </div>
      </AnimatedSection>
      
      <AnimatedSection id="planos" className="section-padding bg-transparent">
        <div className="container max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{t('home.plans.title')}</h2>
                <p className="mt-4 text-base text-muted-foreground">{t('home.plans.description')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Plano Avançado */}
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col">
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
                        <Link href="/login?redirect=/criar?plan=avancado&new=true">
                            <TestTube2 className="mr-2" />
                            {t('home.plans.avancado.cta')}
                        </Link>
                    </Button>
                </div>
                
                {/* Plano Básico */}
                <div className="bg-card/80 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">{t('home.plans.basico.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('home.plans.basico.description')}</p>
                    <div className="text-center my-6">
                        <p className="text-4xl font-bold text-foreground">R$14,99</p>
                        <p className="text-sm text-muted-foreground">Pagamento único</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_basic')} />
                         <PlanFeature text={t('home.plans.feature.timeline_basic')} />
                        <PlanFeature text="Página disponível por 25h" icon={Hourglass} />
                        <PlanFeature text={t('home.plans.feature.music')} included={false} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} included={false}/>
                    </ul>
                     <Button asChild size="lg" className="w-full mt-auto" variant="secondary">
                        <Link href="/login?redirect=/criar?plan=basico&new=true">
                             <TestTube2 className="mr-2" />
                            {t('home.plans.basico.cta')}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </AnimatedSection>
    </>
  );
}
