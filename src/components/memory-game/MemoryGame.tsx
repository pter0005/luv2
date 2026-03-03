'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Card {
  id: number;
  imageId: number;
  imageUrl: string;
}

interface MemoryGameProps {
  images: string[];
}

const shuffleArray = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

// Burst of hearts when a pair is matched
function MatchBurst({ x, y }: { x: number; y: number }) {
  const items = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {items.map((i) => {
        const angle = (i / items.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 50 + Math.random() * 50;
        const size = 10 + Math.random() * 12;
        return (
          <motion.div key={i} className="absolute"
            style={{ x: 0, y: 0 }}
            initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              scale: 0, opacity: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}>
            <Heart style={{ width: size, height: size }} className="text-violet-400 fill-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.9)]" />
          </motion.div>
        );
      })}
    </div>
  );
}

// Floating hearts for win screen
function WinHearts() {
  const hearts = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 3,
    size: 12 + Math.random() * 18, dur: 2.5 + Math.random() * 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map(h => (
        <motion.div key={h.id} className="absolute bottom-0 pointer-events-none"
          style={{ left: `${h.x}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -500, opacity: [0, 0.8, 0.5, 0], rotate: [-15, 15, -10, 20] }}
          transition={{ duration: h.dur, delay: h.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: Math.random() * 2 }}>
          <Heart style={{ width: h.size, height: h.size }}
            className="text-violet-400 fill-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
        </motion.div>
      ))}
    </div>
  );
}

export default function MemoryGame({ images }: MemoryGameProps) {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number; key: number } | null>(null);
  const [wrongPair, setWrongPair] = useState<number[]>([]);
  const [started, setStarted] = useState(false);

  const gameImages = images.slice(0, 8);
  const gridCols = gameImages.length <= 6 ? 3 : 4;

  const buildCards = useCallback(() => shuffleArray([
    ...gameImages.map((url, i) => ({ id: i * 2,     imageId: i, imageUrl: url })),
    ...gameImages.map((url, i) => ({ id: i * 2 + 1, imageId: i, imageUrl: url })),
  ]), [gameImages]);

  const resetGame = useCallback(() => {
    setCards(buildCards());
    setFlippedIndices([]);
    setMatchedPairs([]);
    setIsWon(false);
    setWrongPair([]);
    setStarted(false);
  }, [buildCards]);

  useEffect(() => { setCards(buildCards()); }, [buildCards]);

  useEffect(() => {
    if (flippedIndices.length !== 2) return;
    const [a, b] = flippedIndices;
    setStarted(true);

    if (cards[a]?.imageId === cards[b]?.imageId) {
      // Match!
      const rect = document.getElementById(`card-${a}`)?.getBoundingClientRect();
      if (rect) setBurstPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, key: Date.now() });
      setTimeout(() => setBurstPos(null), 700);

      setMatchedPairs(p => [...p, cards[a].imageId]);
      setFlippedIndices([]);
    } else {
      // Wrong
      setWrongPair([a, b]);
      setTimeout(() => { setFlippedIndices([]); setWrongPair([]); }, 900);
    }
  }, [flippedIndices, cards]);

  useEffect(() => {
    if (gameImages.length > 0 && matchedPairs.length === gameImages.length) {
      setTimeout(() => setIsWon(true), 400);
    }
  }, [matchedPairs, gameImages]);

  const handleCardClick = (index: number) => {
    if (
      isWon ||
      flippedIndices.length >= 2 ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(cards[index]?.imageId)
    ) return;
    setFlippedIndices(p => [...p, index]);
  };

  const isFlipped  = (i: number) => flippedIndices.includes(i) || matchedPairs.includes(cards[i]?.imageId);
  const isMatched  = (i: number) => matchedPairs.includes(cards[i]?.imageId);
  const isWrong    = (i: number) => wrongPair.includes(i);

  const totalPairs = gameImages.length;
  const foundPairs = matchedPairs.length;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 select-none">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
          <Sparkles className="w-3 h-3" /> {t('memorygame.header')}
        </div>
        <p className="text-white/50 text-sm">{t('memorygame.description')}</p>
      </motion.div>

      {/* Progress bar */}
      <div className="px-2 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40 uppercase tracking-widest font-medium">{t('memorygame.progress')}</span>
          <span className="text-xs font-bold" style={{ color: '#c4b5fd' }}>{foundPairs}/{totalPairs} {t('memorygame.pairs')}</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.12)' }}>
          <motion.div className="h-full rounded-full"
            animate={{ width: `${totalPairs > 0 ? (foundPairs / totalPairs) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #a855f7, #7c3aed)', boxShadow: '0 0 10px rgba(168,85,247,0.6)' }} />
        </div>
      </div>

      {/* Grid */}
      <div
        className={cn('grid gap-2.5', gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4')}
        style={{ perspective: '1000px' }}
      >
        {cards.map((card, index) => {
          const flipped = isFlipped(index);
          const matched = isMatched(index);
          const wrong   = isWrong(index);

          return (
            <motion.div key={card.id} id={`card-${index}`}
              className="w-full aspect-square cursor-pointer"
              onClick={() => handleCardClick(index)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={!flipped ? { scale: 1.05, y: -3 } : {}}
              whileTap={!flipped ? { scale: 0.95 } : {}}
            >
              <motion.div className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{
                  rotateY: flipped ? 180 : 0,
                  scale: wrong ? [1, 1.05, 0.95, 1] : 1,
                }}
                transition={{
                  rotateY: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                  scale: wrong ? { duration: 0.35, times: [0, 0.3, 0.7, 1] } : { duration: 0.2 },
                }}
              >
                {/* Card back (hidden state) */}
                <div className="absolute w-full h-full rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, rgba(109,40,217,0.3) 0%, rgba(139,92,246,0.15) 100%)',
                    border: '1.5px solid rgba(139,92,246,0.3)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}>
                  {/* Shimmer pattern */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(196,181,253,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(139,92,246,0.3) 0%, transparent 50%)',
                    }} />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="relative z-10"
                  >
                    <Heart className="w-6 h-6 text-violet-400/60 fill-violet-400/30" />
                  </motion.div>
                </div>

                {/* Card front (revealed image) */}
                <div className="absolute w-full h-full rounded-2xl overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    border: matched
                      ? '2px solid rgba(168,85,247,0.8)'
                      : wrong
                      ? '2px solid rgba(244,63,94,0.7)'
                      : '1.5px solid rgba(139,92,246,0.5)',
                    boxShadow: matched
                      ? '0 0 20px rgba(139,92,246,0.5), 0 4px 16px rgba(0,0,0,0.4)'
                      : wrong
                      ? '0 0 16px rgba(244,63,94,0.3)'
                      : '0 4px 16px rgba(0,0,0,0.4)',
                    transition: 'border 0.3s, box-shadow 0.3s',
                  }}>
                  <Image src={card.imageUrl} alt={`card-${card.imageId}`} fill
                    className="object-cover" sizes="150px" unoptimized />

                  {/* Matched overlay shimmer */}
                  <AnimatePresence>
                    {matched && (
                      <motion.div className="absolute inset-0 rounded-2xl"
                        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.6), rgba(109,40,217,0.4))' }} />
                    )}
                  </AnimatePresence>

                  {/* Matched heart badge */}
                  <AnimatePresence>
                    {matched && (
                      <motion.div className="absolute inset-0 flex items-center justify-center"
                        initial={{ scale: 0, opacity: 1 }} animate={{ scale: [0, 1.5, 1], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.6, times: [0, 0.5, 1] }}>
                        <Heart className="w-8 h-8 text-white fill-violet-500 drop-shadow-[0_0_12px_rgba(168,85,247,1)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Reset button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex justify-center pt-1">
        <button onClick={resetGame}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RotateCcw className="w-3.5 h-3.5" /> {t('memorygame.shuffle')}
        </button>
      </motion.div>

      {/* Match burst particles */}
      <AnimatePresence>
        {burstPos && <MatchBurst key={burstPos.key} x={burstPos.x} y={burstPos.y} />}
      </AnimatePresence>

      {/* Win overlay */}
      <AnimatePresence>
        {isWon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(10,5,25,0.92)', backdropFilter: 'blur(16px)' }}>
            <WinHearts />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative z-10 flex flex-col items-center gap-5 p-10 rounded-3xl text-center"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.4) 0%, rgba(10,5,25,0.97) 70%)',
                border: '1px solid rgba(139,92,246,0.35)',
                boxShadow: '0 0 80px rgba(109,40,217,0.35), inset 0 0 60px rgba(0,0,0,0.4)',
                maxWidth: 340,
              }}>

              {/* Trophy */}
              <motion.div
                animate={{ rotate: [-5, 5, -5], y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="p-4 rounded-full"
                style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
                <span style={{ fontSize: 44 }}>💜</span>
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">{t('memorygame.win.title')}</h2>
                <p className="text-violet-300 font-semibold">{t('memorygame.win.description')}</p>
                <p className="text-white/45 text-sm">{t('memorygame.win.perfect')}</p>
              </div>

              {/* Stars row */}
              <motion.div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 + i * 0.12 }}>
                    <Sparkles className="w-7 h-7 text-violet-300 fill-violet-400/40" />
                  </motion.div>
                ))}
              </motion.div>

              <button onClick={resetGame}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 60%, #6d28d9 100%)',
                  boxShadow: '0 4px 24px rgba(139,92,246,0.55)',
                }}>
                <RotateCcw className="w-4 h-4" /> {t('memorygame.win.playAgain')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
