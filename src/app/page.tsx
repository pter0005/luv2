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
      <FallingHearts />
      <section className="py-20 md:py-32">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 items-center gap-12">
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:-ml-8">
              <h1 className="text-6xl md:text-7xl font-headline font-bold tracking-tighter mb-2 leading-tight">
                Declare seu amor
              </h1>
              <p className="text-7xl md:text-8xl font-script gradient-text h-32 md:h-36 min-h-[8rem]">
                {typedPhrase}
                <span className="animate-pulse">|</span>
              </p>
              <p className="max-w-xl text-lg text-muted-foreground mb-10 mt-6">
                Transforme seus sentimentos em uma obra de arte digital. Uma experiência exclusiva, criada para celebrar momentos que merecem ser eternos.
              </p>
              <Link href="/criar">
                <Button size="lg" className="shadow-[0_0_20px_0px] shadow-primary/50">
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
                    className="rounded-2xl shadow-[0_0_30px_5px] shadow-primary/40 object-cover"
                    data-ai-hint="road trees"
                />
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="py-20 md:py-28">
        <div className="container max-w-5xl text-center">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Crie uma memória em 4 passos!</h2>
            <p className="text-lg text-muted-foreground mt-4 mb-6">
              Surpreenda alguém especial com uma lembrança digital que fará o coração disparar. É fácil, rápido e inesquecível.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={step.title} className="card-glow-subtle group text-center flex flex-col p-6 transition-all duration-300 bg-black/30 backdrop-blur-sm">
                <CardHeader className="p-0 mb-4 flex-grow">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-2xl font-bold text-primary/80">{index + 1}.</span>
                    <step.icon className="w-12 h-12 text-primary/80 mt-2" />
                    <h3 className="text-xl font-semibold mt-2">{step.title}</h3>
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-4 max-h-0 opacity-0 group-hover:max-h-screen group-hover:opacity-100 transition-all duration-500 ease-in-out">
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
           <div className="text-center mt-16">
              <Link href="/criar">
                <Button variant="outline">Comece agora!</Button>
              </Link>
            </div>
        </div>
      </section>

      <section id="experiencia" className="py-20 md:py-28">
        <div className="container max-w-5xl">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Uma Experiência Incomparável</h2>
              <p className="mt-4 text-lg text-muted-foreground">Cada detalhe foi pensado para proporcionar uma declaração de amor que transcende o comum. Oferecemos mais que uma página, uma memória viva.</p>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                  <Card key={feature.title} className="card-glow-subtle p-6 text-left flex flex-col gap-4 transition-all bg-black/30 backdrop-blur-sm">
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
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Histórias que Inspiram</h2>
            <p className="mt-4 text-lg text-muted-foreground">Veja o que casais apaixonados estão dizendo sobre Amore Pages.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="card-glow-subtle p-6 transition-all bg-black/30 backdrop-blur-sm">
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
