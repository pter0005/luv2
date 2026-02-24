'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Card {
  id: number;
  imageId: number;
  imageUrl: string;
}

interface MemoryGameProps {
  images: string[];
}

const shuffleArray = (array: any[]) => {
  return array.sort(() => Math.random() - 0.5);
};

export default function MemoryGame({ images }: MemoryGameProps) {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);

  const gameImages = images.slice(0, 8); // Use up to 8 images
  const gridSize = gameImages.length <= 6 ? 3 : 4;

  useEffect(() => {
    const initialCards: Card[] = shuffleArray([
      ...gameImages.map((url, index) => ({ id: index * 2, imageId: index, imageUrl: url })),
      ...gameImages.map((url, index) => ({ id: index * 2 + 1, imageId: index, imageUrl: url })),
    ]);
    setCards(initialCards);
    // Reset game state
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsGameWon(false);
  }, [images]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [firstIndex, secondIndex] = flippedIndices;
      if (cards[firstIndex].imageId === cards[secondIndex].imageId) {
        setMatchedPairs([...matchedPairs, cards[firstIndex].imageId]);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
      setMoves(moves + 1);
    }
  }, [flippedIndices, cards, matchedPairs, moves]);

  useEffect(() => {
    if (gameImages.length > 0 && matchedPairs.length === gameImages.length) {
      setIsGameWon(true);
    }
  }, [matchedPairs, gameImages]);


  const handleCardClick = (index: number) => {
    if (isGameWon || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index].imageId)) {
      return;
    }
    setFlippedIndices([...flippedIndices, index]);
  };
  
  const resetGame = () => {
    const initialCards: Card[] = shuffleArray([
      ...gameImages.map((url, index) => ({ id: index * 2, imageId: index, imageUrl: url })),
      ...gameImages.map((url, index) => ({ id: index * 2 + 1, imageId: index, imageUrl: url })),
    ]);
    setCards(initialCards);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsGameWon(false);
  };


  return (
    <div className="w-full max-w-md mx-auto p-4 md:p-6 rounded-2xl">
      <AnimatePresence>
        {isGameWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 rounded-2xl"
          >
            <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-3xl font-bold font-headline text-white mb-2">{t('memorygame.win.title')}</h2>
            <p className="text-muted-foreground mb-6">{t('memorygame.win.description')}</p>
            <Button onClick={resetGame}>{t('memorygame.win.playAgain')}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end items-center mb-6 px-2">
        <Button variant="ghost" onClick={resetGame}>{t('memorygame.reset')}</Button>
      </div>
      <div className={cn("grid gap-3", gridSize === 3 ? 'grid-cols-3' : 'grid-cols-4')} style={{ perspective: '1000px' }}>
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card.imageId);
          return (
            <div
              key={card.id}
              className="w-full aspect-square cursor-pointer"
              onClick={() => handleCardClick(index)}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Frente da Carta (?) */}
                <div
                  className="absolute w-full h-full flex items-center justify-center bg-card rounded-lg border-2 border-dashed border-primary/40"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-4xl font-bold text-primary/60">?</span>
                </div>

                {/* Verso da Carta (Imagem) */}
                <div
                  className="absolute w-full h-full bg-black rounded-lg overflow-hidden border-2 border-primary/70"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <Image
                    src={card.imageUrl}
                    alt={`card-${card.imageId}`}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
