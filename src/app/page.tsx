
"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  CircleDollarSign,
  Gift,
  QrCode,
  Share2,
  Star,
  Puzzle,
  Clock,
  Images,
  Music,
  Globe,
  View,
  CheckCircle,
  XCircle,
  Play,
  Calendar,
  ChevronLeft,
  TestTube2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef } from 'react';
import { ScrollFloat } from '@/components/ui/scroll-float';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import FeaturesCarousel from '@/components/layout/FeaturesCarousel';
import { PlanFeature } from '@/components/layout/PlanFeature';

const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

const testimonials = [
  {
    name: 'Juliana S.',
    avatar: PlaceHolderImages.find(p => p.id === 'avatar1')?.imageUrl,
    text: 'Criei uma página para nosso aniversário de 5 anos e meu marido chorou de emoção. Foi o presente mais lindo que já dei!',
  },
  {
    name: 'Ricardo M.',
    avatar: PlaceHolderImages.find(p => p.id === 'avatar2')?.imageUrl,
    text: 'A ferramenta de IA me ajudou a encontrar as palavras certas. Simplesmente incrível e muito fácil de usar.',
  },
  {
    name: 'Fernanda L.',
    avatar: PlaceHolderImages.find(p => p.id === 'avatar3')?.imageUrl,
    text: 'Fiz uma surpresa e enviei o link para ele no trabalho. A reação foi a melhor possível! Recomendo a todos os românticos.',
  },
];

const cursivePhrases = [
  "para alguém especial!",
  "de forma única!",
  "para quem merece!",
];

const simpleSteps = [
    {
        icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl,
        title: "Conte a sua história de amor",
        description: "Preencha os dados do seu relacionamento e escolha elementos únicos para surpreender sua pessoa amada.",
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl,
        title: "Personalize cada detalhe",
        description: "Escolha suas fotos, adicione a música de vocês e escreva uma mensagem especial. É aqui que a mágica acontece!",
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl,
        title: "Receba seu QR Code",
        description: "Após a finalização, você receberá o QR Code de acesso ao presente personalizado em poucos instantes.",
    },
    {
        icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl,
        title: "Surpreenda com amor",
        description: "Compartilhe o QR Code e veja a emoção ao descobrir um presente que fala diretamente ao coração.",
    },
];

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


export default function Home() {
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
    // Typing effect
    if (typedPhrase.length < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setTypedPhrase(currentPhrase.slice(0, typedPhrase.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    }

    // Pause and switch to next phrase
    const timeout = setTimeout(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % cursivePhrases.length);
      setTypedPhrase('');
    }, 2000); // Pause for 2 seconds

    return () => clearTimeout(timeout);
  }, [phraseIndex, typedPhrase]);

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
                    Declare seu amor <br />
                    <span className="block font-handwriting text-primary text-5xl md:text-6xl mt-2 leading-relaxed">
                    {typedPhrase}
                    <span className="animate-blink">|</span>
                    </span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto md:mx-0 my-6">
                    Transforme seus sentimentos em uma obra de arte digital. Uma
                    experiência exclusiva, criada para celebrar momentos que merecem ser
                    eternos.
                </p>
                <Link href="/login?redirect=/criar">
                    <Button
                    size="lg"
                    className="group relative w-full sm:w-auto shadow-[0_0_20px_0px] shadow-primary/50"
                    >
                    Criar minha página
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
                    data-ai-hint="happy couple"
                />
            </motion.div>
        </div>
      </section>

      <AnimatedSection id="how-it-works-simple" className="section-padding">
        <div className="container max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">Crie um presente inesquecível em <span className="text-primary">4 passos simples</span></h2>
              <p className="text-base text-muted-foreground mt-4">
                Nossa plataforma torna fácil criar uma experiência digital e personalizada que vai emocionar quem você ama.
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
                                <Image src={step.icon || "https://placehold.co/160"} alt={step.title} fill className="object-contain" unoptimized/>
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
              <h2 className='text-4xl md:text-5xl font-semibold tracking-tight leading-tight'>Crie uma página de amor</h2>
              <h3 className="text-5xl md:text-6xl font-bold mt-1 leading-none gradient-text">
                  Totalmente Personalizada
              </h3>
              <p className="text-lg text-muted-foreground mt-4">
                Use o assistente passo a passo para montar cada detalhe.
              </p>
            </div>
            <FeaturesCarousel />
        </div>
      </AnimatedSection>

      <AnimatedSection id="how-it-works" className="section-padding">
        <div className="container max-w-5xl text-center">
        <Link href="/p/demo" passHref>
          <div className="relative bg-primary rounded-2xl p-8 md:p-12 flex items-center justify-center overflow-hidden cursor-pointer group">
            <div
              className="absolute inset-0 bg-repeat bg-center opacity-10 group-hover:opacity-20 transition-opacity"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
             <div
                className="absolute inset-0 bg-grid-slate-100/10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
                style={{
                  backgroundPosition: '10px 10px',
                  backgroundSize: '40px 40px',
                  opacity: 0.5,
                }}
              ></div>

            <div className="relative flex justify-between items-center w-full z-10">
              <Image src="https://i.imgur.com/mJ2VCA2.png" alt="Demo em celular esquerdo" width={200} height={400} className="hidden md:block w-auto h-full max-h-[250px] object-contain transform -rotate-12 group-hover:scale-105 transition-transform" />
              <h2 className="text-4xl md:text-5xl font-bold font-headline text-white max-w-xs mx-auto">
                Teste a melhor página de amor
              </h2>
              <Image src="https://i.imgur.com/mJ2VCA2.png" alt="Demo em celular direito" width={200} height={400} className="hidden md:block w-auto h-full max-h-[250px] object-contain transform rotate-12 group-hover:scale-105 transition-transform" />
            </div>
          </div>
        </Link>
        </div>
      </AnimatedSection>
      
      <AnimatedSection id="avaliacoes" className="section-padding bg-card/50">
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Histórias que Inspiram</h2>
            <p className="mt-4 text-base text-muted-foreground">Veja o que casais apaixonados estão dizendo sobre mycupid.</p>
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
      
      <AnimatedSection id="planos" className="section-padding">
        <div className="container max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Escolha seu plano para testar</h2>
                <p className="mt-4 text-base text-muted-foreground">Temos a opção ideal para eternizar seu momento, com a flexibilidade que você precisa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Plano Avançado */}
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col">
                    <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" /> RECOMENDADO
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Plano Avançado</h3>
                    <p className="text-muted-foreground text-sm mb-8">Todos os recursos liberados.</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text="Galeria de fotos (até 6)" />
                        <PlanFeature text="Música de fundo" />
                        <PlanFeature text="Quebra-cabeça Interativo" />
                        <PlanFeature text="Linha do Tempo 3D (até 25 momentos)" />
                    </ul>
                    <Button asChild size="lg" className="w-full mt-auto">
                        <Link href="/login?redirect=/criar?plan=avancado&new=true">
                            <TestTube2 className="mr-2" />
                            Testar Plano Avançado
                        </Link>
                    </Button>
                </div>
                
                {/* Plano Básico */}
                <div className="bg-card/80 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">Plano Básico</h3>
                    <p className="text-muted-foreground text-sm mb-8">Uma opção mais simples para começar.</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text="Galeria de fotos (até 2)" />
                         <PlanFeature text="Linha do Tempo 3D (até 5 momentos)" />
                        <PlanFeature text="Música de fundo" included={false} />
                        <PlanFeature text="Quebra-cabeça Interativo" included={false}/>
                    </ul>
                     <Button asChild size="lg" className="w-full mt-auto" variant="secondary">
                        <Link href="/login?redirect=/criar?plan=basico&new=true">
                             <TestTube2 className="mr-2" />
                            Testar Plano Básico
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </AnimatedSection>
    </>
  );
}
