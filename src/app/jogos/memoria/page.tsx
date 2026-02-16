'use client';

import MemoryGame from '@/components/memory-game/MemoryGame';
import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function MemoryGamePage() {
  const { t } = useTranslation();
  // 6 unique images for 12 cards
  const gameImages = [
    'https://picsum.photos/seed/mem1/200/200',
    'https://picsum.photos/seed/mem2/200/200',
    'https://picsum.photos/seed/mem3/200/200',
    'https://picsum.photos/seed/mem4/200/200',
    'https://picsum.photos/seed/mem5/200/200',
    'https://picsum.photos/seed/mem6/200/200',
  ];

  return (
    <div className="relative min-h-screen py-12 md:py-20 flex flex-col items-center justify-center">
       <Button asChild variant="outline" className="absolute top-8 left-8 bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('privacy.back')}
          </Link>
        </Button>
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-primary/10 rounded-2xl mb-4">
            <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">{t('memorygame.title')}</h1>
        <p className="text-muted-foreground">{t('memorygame.description')}</p>
      </div>
      <MemoryGame images={gameImages} />
    </div>
  );
}
