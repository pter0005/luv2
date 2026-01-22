"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Star,
  TestTube2,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import dynamic from 'next/dynamic';
import FeaturesCarousel from '@/components/layout/FeaturesCarousel';
import { PlanFeature } from '@/components/layout/PlanFeature';
import { useTranslation } from '@/lib/i18n';

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
    className={`relative group perspective-1000 ${className}`}
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

// --- SEÇÃO DE DEMONSTRAÇÃO (TEXTO ULTRA PROFISSIONAL) ---
function DemoSection() {
    return (
      <section className="w-full py-16 px-4 flex justify-center items-center overflow-hidden">
        
        {/* Container Principal - Altura responsiva */}
        <div className="relative w-full max-w-[1400px] h-auto py-24 md:h-[580px] md:py-0 bg-[#08020d] rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/5 shadow-[0_0_80px_-20px_rgba(109,40,217,0.4)] group">
            
            {/* --- BACKGROUND --- */}
            
            {/* 1. Gradiente Base Profundo */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a052b] via-[#0f021a] to-[#05000a] z-0"></div>
            
            {/* 2. GRID 3D "RETRO WAVE" (Perspectiva no chão) */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none perspective-500">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transform rotate-x-12 scale-150"></div>
            </div>

            {/* 3. Luzes de Palco (Spotlights) */}
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* 4. Estrelas Decorativas */}
            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-12 left-[20%] text-purple-300 opacity-60 z-10">
                <Sparkles size={20} />
            </motion.div>
            <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-20 right-[20%] text-pink-300 opacity-50 z-10">
                <Zap size={16} fill="currentColor" />
            </motion.div>


            {/* --- CONTEÚDO --- */}
            <div className="relative z-20 w-full h-full flex items-center justify-between px-4 md:px-10">

                {/* --- CELULAR ESQUERDO --- */}
                <div className="hidden md:flex absolute left-[-20px] lg:left-6 -bottom-16 justify-center">
                    <Iphone15Pro videoSrc="https://i.imgur.com/GHtKVNZ.mp4" className="origin-bottom-right rotate-[-10deg] scale-95" />
                </div>

                {/* --- TEXTO CENTRAL (AQUI ESTÁ A MUDANÇA) --- */}
                <div className="flex-1 flex flex-col items-center text-center mx-auto z-30 max-w-4xl md:mt-[-20px]">
                    
                    {/* Badge de "Novidade" estilo Glass */}
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
                        {/* Glow atrás do texto para destacar do fundo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/10 blur-[60px] rounded-full -z-10"></div>

                        {/* Tamanho de fonte responsivo */}
                        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                                Teste Nossa
                            </span>
                            <span className="block text-3xl sm:text-4xl md:text-5xl font-light text-gray-400 my-2 tracking-normal italic font-serif opacity-80">
                                página de
                            </span>
                            <span className="relative inline-block">
                                {/* Texto Gradiente */}
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 pb-2">
                                    Demonstração
                                </span>
                                {/* Brilho/Sombra do texto (Neon Effect) */}
                                <span className="absolute inset-0 z-0 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-lg opacity-40 animate-pulse">
                                    Demonstração
                                </span>
                                {/* Linha Decorativa embaixo */}
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

                    {/* Parágrafo com tamanho de fonte responsivo */}
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 text-gray-400 max-w-lg text-sm sm:text-base font-medium leading-relaxed"
                    >
                        Veja na prática como sua declaração pode se tornar uma <span className="text-white font-semibold">experiência inesquecível</span>.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-10"
                    >
                        {/* BOTÃO "SHIMMER" (Efeito de luz passando) - Com tamanho responsivo */}
                        <Link href="https://mycupid.com.br/p/A0vASdM58tZ2BOMksqCB" passHref target="_blank" rel="noopener noreferrer">
                            <button className="relative inline-flex h-12 md:h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] group hover:scale-105 transition-transform duration-300">
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black/90 px-6 md:px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-2 md:gap-3">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-black flex items-center justify-center">
                                        <Play size={14} fill="black" className="ml-0.5" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Sem cadastro</span>
                                        <span className="text-base md:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Testar Agora</span>
                                    </div>
                                </span>
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* --- CELULAR DIREITO --- */}
                <div className="hidden md:flex absolute right-[-20px] lg:right-6 -bottom-16 justify-center">
                    <Iphone15Pro videoSrc="https://i.imgur.com/t7ICxbN.mp4" delay={0.3} className="origin-bottom-left rotate-[10deg] scale-95" />
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

  const testimonials = useMemo(() => [
    {
      name: t('home.testimonials.t1.name'),
      avatar: PlaceHolderImages.find(p => p.id === 'avatar1')?.imageUrl,
      text: t('home.testimonials.t1.text'),
    },
    {
      name: t('home.testimonials.t2.name'),
      avatar: PlaceHolderImages.find(p => p.id === 'avatar2')?.imageUrl,
      text: t('home.testimonials.t2.text'),
    },
    {
      name: t('home.testimonials.t3.name'),
      avatar: PlaceHolderImages.find(p => p.id === 'avatar3')?.imageUrl,
      text: t('home.testimonials.t3.text'),
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
      <section ref={heroRef} className="relative w-full overflow-hidden flex items-center justify-center min-h-[calc(100vh-5rem)] py-24">
        <div className="absolute inset-0 w-full h-full mystic-glow -z-10"></div>
        <div className="container grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display leading-tight">
                    {t('home.hero.title')} <br />
                    <span className="block font-handwriting text-primary text-5xl md:text-6xl mt-2 leading-relaxed">
                    {typedPhrase}
                    <span className="animate-blink">|</span>
                    </span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto md:mx-0 my-6">
                    {t('home.hero.description')}
                </p>
                <Link href="/login?redirect=/criar">
                    <Button
                    size="lg"
                    className="group relative w-full sm:w-auto shadow-[0_0_20px_0px] shadow-primary/50"
                    >
                    {t('home.hero.cta')}
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>
            <motion.div 
                className="relative w-full h-[60vh] md:h-auto md:aspect-[9/10] rounded-3xl overflow-hidden shadow-2xl shadow-primary/20"
                style={{ y }}
                initial={{ opacity: 0, y: 50, rotate: 5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1]}}
            >
                 <Image
                    src={heroImageUrl}
                    alt="Casal feliz"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    data-ai-hint="happy couple"
                />
            </motion.div>
        </div>
      </section>

      <AnimatedSection id="how-it-works-simple" className="section-padding">
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
      
      <AnimatedSection className="section-padding bg-card/50">
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

      <AnimatedSection id="demo-section" className="section-padding">
        <DemoSection />
      </AnimatedSection>
      
      <AnimatedSection id="avaliacoes" className="section-padding">
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{t('home.testimonials.title')}</h2>
            <p className="mt-4 text-base text-muted-foreground">{t('home.testimonials.description')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="card-glow p-6 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="mb-6 text-foreground/90 text-sm">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person" />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>
      
      <AnimatedSection id="planos" className="section-padding bg-card/50">
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
                    <p className="text-muted-foreground text-sm mb-8">{t('home.plans.avancado.description')}</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_advanced')} />
                        <PlanFeature text={t('home.plans.feature.music')} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} />
                        <PlanFeature text={t('home.plans.feature.timeline_advanced')} />
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
                    <p className="text-muted-foreground text-sm mb-8">{t('home.plans.basico.description')}</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_basic')} />
                         <PlanFeature text={t('home.plans.feature.timeline_basic')} />
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
