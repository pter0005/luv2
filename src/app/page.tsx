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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FallingHearts from '@/components/effects/FallingHearts';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const steps = [
  {
    icon: Gift,
    title: "Preencha os campos",
    description: "Insira suas mensagens, fotos e vídeos para criar uma experiência personalizada e emocionante.",
  },
  {
    icon: CircleDollarSign,
    title: "Pagamento",
    description: "Realize o pagamento de forma rápida e segura para finalizar a criação da sua página.",
  },
  {
    icon: QrCode,
    title: "Código QR e Link",
    description: "Receba um link exclusivo e um Código QR para acessar e compartilhar sua declaração de amor.",
  },
  {
    icon: Share2,
    title: "Compartilhe a memória",
    description: "Envie o link ou o QR Code para a pessoa amada e surpreenda-a com essa lembrança inesquecível.",
  },
];

const features = [
    {
      icon: Puzzle,
      title: "Quebra-Cabeça Interativo",
      description: "Transforme a revelação em um jogo! A pessoa amada monta uma foto especial para desvendar a surpresa e acessar sua página.",
    },
    {
      icon: Clock,
      title: "Contador de tempo",
      description: "Mostre há quanto tempo vocês estão juntos com um contador em tempo real.",
    },
    {
      icon: Images,
      title: "Galerias de Fotos",
      description: "Conte sua história com galerias de fotos animadas e personalizadas.",
    },
    {
      icon: Music,
      title: "Música dedicada",
      description: "Adicione a trilha sonora do seu amor com uma música do YouTube.",
    },
    {
      icon: Globe,
      title: "Acesso Global",
      description: "Sua página acessível de qualquer lugar do mundo, com um link exclusivo.",
    },
    {
      icon: QrCode,
      title: "QR Code Exclusivo",
      description: "Receba um QR Code para imprimir e surpreender de forma criativa.",
    },
  ];

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
  "de forma única!",
  "para alguém especial!",
  "para quem merece!",
];

export default function Home() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState('');
  const heroImageUrl = PlaceHolderImages.find(p => p.id === 'heroVertical')?.imageUrl || '';


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

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full -z-20 overflow-hidden pointer-events-none">
        <div className="mystic-fog-1"></div>
        <div className="mystic-fog-2"></div>
      </div>
      <FallingHearts />
      <section className="container grid md:grid-cols-2 items-center gap-12 py-20 md:py-32 min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-2 leading-tight">
            Declare seu amor
          </h1>
          <p className="text-5xl md:text-6xl font-script gradient-text h-24 md:h-28 min-h-[6rem]">
            {typedPhrase}
            <span className="animate-pulse">|</span>
          </p>
          <p className="max-w-xl text-lg text-muted-foreground mb-10 mt-6">
            Transforme seus sentimentos em uma obra de arte digital. Uma experiência exclusiva, criada para celebrar momentos que merecem ser eternos.
          </p>
          <Link href="/criar">
            <Button size="lg">
              Criar minha página
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        <div className="hidden md:flex items-center justify-center">
            <Image 
                src={heroImageUrl}
                alt="Estrada ladeada de árvores com uma luz brilhante ao fundo"
                width={350}
                height={500}
                className="rounded-2xl shadow-2xl shadow-primary/20 object-cover"
                data-ai-hint="road trees"
            />
        </div>
      </section>

      <section id="recursos" className="py-20 md:py-28 bg-background/80 backdrop-blur-sm">
        <div className="container">
          <div className="border border-border/60 rounded-xl p-8 md:p-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Crie uma memória em 4 passos!</h2>
              <p className="text-lg text-muted-foreground mt-4 mb-6">
                Surpreenda alguém especial com uma lembrança digital que fará o coração disparar. É fácil, rápido e inesquecível.
              </p>
              <Link href="/criar">
                <Button variant="outline">Comece agora!</Button>
              </Link>
            </div>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <Tooltip key={step.title}>
                    <TooltipTrigger asChild>
                      <Card className="bg-card/80 border-border/60 text-left flex flex-col p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-2">
                        <CardHeader className="p-0 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-primary/50">0{index + 1}.</span>
                            <step.icon className="w-10 h-10 text-primary/80" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow flex flex-col justify-end">
                          <h3 className="text-2xl font-semibold">{step.title}</h3>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{step.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </section>

      <section id="experiencia" className="py-20 md:py-28">
        <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Uma Experiência Incomparável</h2>
                <p className="mt-4 text-lg text-muted-foreground">Cada detalhe foi pensado para proporcionar uma declaração de amor que transcende o comum. Oferecemos mais que uma página, uma memória viva.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <Card key={feature.title} className="bg-card/80 border-border/60 p-6 text-left flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                        </div>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </Card>
                ))}
            </div>
            <div className="text-center mt-16">
                <h3 className="text-2xl font-headline font-bold mb-4">Veja a Revelação em Ação</h3>
                <p className="text-muted-foreground mb-6">Descubra como funciona a experiência interativa que torna sua declaração inesquecível.</p>
                <Button asChild>
                    <Link href="/como-funciona">
                        Como funciona?
                    </Link>
                </Button>
            </div>
        </div>
      </section>

      <section id="avaliacoes" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Histórias que Inspiram</h2>
            <p className="mt-4 text-lg text-muted-foreground">Veja o que casais apaixonados estão dizendo sobre Amore Pages.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-card/80 border-border/60 p-6">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="mb-6 text-foreground/90">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person" />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{testimonial.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
