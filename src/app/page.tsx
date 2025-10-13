"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Paintbrush,
  Camera,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FallingHearts from '@/components/effects/FallingHearts';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: Paintbrush,
    title: 'Personalização Completa',
    description: 'Escolha cores, fontes e layouts. Deixe a página com a cara de vocês.',
  },
  {
    icon: Camera,
    title: 'Suas Fotos, Sua História',
    description: 'Adicione suas fotos favoritas e crie uma galeria de momentos inesquecíveis.',
  },
  {
    icon: Sparkles,
    title: 'Inspiração com IA',
    description: 'Sem palavras? Nossa IA sugere frases, poemas e citações para te inspirar.',
  },
  {
    icon: Heart,
    title: 'Link Único e Secreto',
    description: 'Compartilhe sua declaração através de um link exclusivo que só vocês conhecem.',
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
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="mystic-fog-1"></div>
        <div className="mystic-fog-2"></div>
      </div>
      <FallingHearts />
      <section className="container grid md:grid-cols-2 items-center gap-12 py-20 md:py-32 min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col items-start text-left">
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter mb-4 leading-tight">
            Declare seu amor
          </h1>
          <p className="text-4xl md:text-5xl font-script gradient-text h-24 md:h-28">
            {typedPhrase}
            <span className="animate-pulse">|</span>
          </p>
          <p className="max-w-xl text-lg text-muted-foreground mb-10 mt-4">
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
                alt="Imagem de um casal se abraçando"
                width={400}
                height={600}
                className="rounded-2xl shadow-2xl shadow-primary/20 object-cover"
                data-ai-hint="couple hugging"
            />
        </div>
      </section>

      <section id="recursos" className="py-20 md:py-28 bg-background/80 backdrop-blur-sm">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Recursos Feitos para Apaixonar</h2>
            <p className="mt-4 text-lg text-muted-foreground">Tudo que você precisa para criar uma declaração de amor perfeita.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/80 border-border/60 text-center flex flex-col items-center p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-2">
                <CardHeader>
                  <div className="p-4 bg-primary/10 rounded-full mb-4 self-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
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
