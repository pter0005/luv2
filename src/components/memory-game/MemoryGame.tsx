'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Card {
  id: number;
  imageId: number;
  imageUrl: string;
}

interface MemoryGameProps {
  images: string[];
}

const shuffleArray = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

// ── Bug fix notes ──────────────────────────────────────────────────────────────
// 1. backfaceVisibility MUST include WebkitBackfaceVisibility for Safari/iOS
// 2. Card back/front use CSS transition (not framer rotateY on parent) so the
//    preserve-3d chain never breaks across browsers
// 3. Image container has explicit position:'relative' + width/height (not just 'fill')
// ──────────────────────────────────────────────────────────────────────────────

function MatchBurst({ x, y }: { x: number; y: number }) {
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="fixed pointer-events-none z-[9999]" style={{ left: x, top: y }}>
      {items.map((i) => {
        const angle = (i / items.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 45 + Math.random() * 55;
        const size = 10 + Math.random() * 14;
        return (
          <motion.div key={i} className="absolute"
            initial={{ x: 0, y: 0, scale: 1.4, opacity: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, scale: 0, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}>
            <Heart
              style={{ width: size, height: size }}
              className="text-violet-400 fill-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.9)]"
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function WinHearts() {
  const hearts = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    size: 12 + Math.random() * 18,
    dur: 2.5 + Math.random() * 2,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map(h => (
        <motion.div key={h.id} className="absolute bottom-0 pointer-events-none"
          style={{ left: `${h.x}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -500, opacity: [0, 0.8, 0.5, 0], rotate: [-15, 15, -10, 20] }}
          transition={{ duration: h.dur, delay: h.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.5 }}>
          <Heart
            style={{ width: h.size, height: h.size }}
            className="text-violet-400 fill-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.9)]"
          />
        </motion.div>
      ))}
    </div>
  );
}

// Single card — uses CSS transition so preserve-3d works across all browsers
function MemoryCard({
  card,
  index,
  isFlipped,
  isMatched,
  isWrong,
  onClick,
}: {
  card: Card;
  index: number;
  isFlipped: boolean;
  isMatched: boolean;
  isWrong: boolean;
  onClick: () => void;
}) {
  // CSS-only flip: we rotate the entire card wrapper. Both faces sit in the same
  // 3D space and each hides its back with backface-visibility.
  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    // The two required prefixes so Safari doesn't show both faces at once
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  } as any;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',
    transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  } as any;

  return (
    <motion.div
      id={`card-${index}`}
      className="w-full aspect-square cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{
        opacity: 1,
        scale: isWrong ? [1, 1.07, 0.93, 1] : 1,
      }}
      transition={{
        opacity: { delay: index * 0.03, duration: 0.3 },
        scale: isWrong
          ? { duration: 0.35, times: [0, 0.3, 0.7, 1] }
          : { delay: index * 0.03, type: 'spring', stiffness: 260, damping: 20 },
      }}
      whileHover={!isFlipped ? { scale: 1.06, y: -4 } : {}}
      whileTap={!isFlipped ? { scale: 0.94 } : {}}
      style={{ perspective: '800px', WebkitPerspective: '800px' } as any}
    >
      <div style={wrapperStyle}>

        {/* ── BACK FACE (hidden state) ── */}
        <div
          style={{
            ...faceStyle,
            background: 'linear-gradient(135deg, rgba(109,40,217,0.35) 0%, rgba(139,92,246,0.18) 100%)',
            border: isWrong
              ? '2px solid rgba(244,63,94,0.6)'
              : '1.5px solid rgba(139,92,246,0.35)',
            boxShadow: isWrong
              ? '0 0 18px rgba(244,63,94,0.3), 0 4px 16px rgba(0,0,0,0.35)'
              : '0 4px 16px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'border 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Radial glow pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.25,
            backgroundImage: `
              radial-gradient(circle at 30% 30%, rgba(196,181,253,0.5) 0%, transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(139,92,246,0.4) 0%, transparent 50%)
            `,
          }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Heart className="w-6 h-6 text-violet-400/60 fill-violet-400/25" />
          </motion.div>
        </div>

        {/* ── FRONT FACE (image) ── */}
        <div
          style={{
            ...faceStyle,
            // rotateY(180deg) pre-flips this face so it starts hidden,
            // then the wrapper's flip brings it into view
            transform: 'rotateY(180deg)',
            border: isMatched
              ? '2px solid rgba(168,85,247,0.85)'
              : '1.5px solid rgba(139,92,246,0.5)',
            boxShadow: isMatched
              ? '0 0 24px rgba(139,92,246,0.55), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            transition: 'border 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Next.js Image: explicit fill container */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={card.imageUrl}
              alt={`memory-card-${card.imageId}`}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 30vw, 150px"
              unoptimized
            />
          </div>

          {/* Match shimmer flash */}
          <AnimatePresence>
            {isMatched && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                initial={{ opacity: 0.75 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.65), rgba(109,40,217,0.45))' }}
              />
            )}
          </AnimatePresence>

          {/* Match heart pulse */}
          <AnimatePresence>
            {isMatched && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.6, 1], opacity: [1, 1, 0] }}
                transition={{ duration: 0.65, times: [0, 0.5, 1] }}
              >
                <Heart className="w-9 h-9 fill-violet-500 text-white drop-shadow-[0_0_14px_rgba(168,85,247,1)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}

export default function MemoryGame({ images }: MemoryGameProps) {
  const gameImages = useMemo(() => images.slice(0, 8), [images]);
  const gridCols = gameImages.length <= 6 ? 3 : 4;

  const buildCards = useCallback((): Card[] => shuffleArray([
    ...gameImages.map((url, i) => ({ id: i * 2,     imageId: i, imageUrl: url })),
    ...gameImages.map((url, i) => ({ id: i * 2 + 1, imageId: i, imageUrl: url })),
  ]), [gameImages]);

  const [cards, setCards]               = useState<Card[]>([]);
  const [flippedIndices, setFlipped]    = useState<number[]>([]);
  const [matchedPairs, setMatched]      = useState<number[]>([]);
  const [isWon, setIsWon]               = useState(false);
  const [burstPos, setBurst]            = useState<{ x: number; y: number; key: number } | null>(null);
  const [wrongPair, setWrong]           = useState<number[]>([]);

  const resetGame = useCallback(() => {
    setCards(buildCards());
    setFlipped([]);
    setMatched([]);
    setIsWon(false);
    setWrong([]);
  }, [buildCards]);

  // Init
  useEffect(() => { setCards(buildCards()); }, [buildCards]);

  // Match logic
  useEffect(() => {
    if (flippedIndices.length !== 2) return;
    const [a, b] = flippedIndices;

    if (cards[a]?.imageId === cards[b]?.imageId) {
      // Burst particles at card position
      const el = document.getElementById(`card-${a}`);
      if (el) {
        const r = el.getBoundingClientRect();
        setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2, key: Date.now() });
        setTimeout(() => setBurst(null), 750);
      }
      setMatched(p => [...p, cards[a].imageId]);
      setFlipped([]);
    } else {
      setWrong([a, b]);
      setTimeout(() => { setFlipped([]); setWrong([]); }, 950);
    }
  }, [flippedIndices, cards]);

  // Win condition
  useEffect(() => {
    if (gameImages.length > 0 && matchedPairs.length === gameImages.length) {
      setTimeout(() => setIsWon(true), 450);
    }
  }, [matchedPairs, gameImages]);

  const handleCardClick = (index: number) => {
    if (
      isWon ||
      flippedIndices.length >= 2 ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(cards[index]?.imageId)
    ) return;
    setFlipped(p => [...p, index]);
  };

  const totalPairs = gameImages.length;
  const foundPairs = matchedPairs.length;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 select-none">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 px-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
        >
          <Sparkles className="w-3 h-3" /> Jogo da Memória
        </div>
        <p className="text-white/50 text-sm">Encontre todos os pares de fotos de vocês! 💜</p>
      </motion.div>

      {/* Progress */}
      <div className="px-2 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Progresso</span>
          <span className="text-xs font-bold" style={{ color: '#c4b5fd' }}>
            {foundPairs}/{totalPairs} pares
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${totalPairs > 0 ? (foundPairs / totalPairs) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #a855f7, #7c3aed)', boxShadow: '0 0 10px rgba(168,85,247,0.6)' }}
          />
        </div>
      </div>

      {/* Card grid */}
      <div
        className={cn('grid gap-2.5', gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4')}
      >
        {cards.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            index={index}
            isFlipped={flippedIndices.includes(index) || matchedPairs.includes(card.imageId)}
            isMatched={matchedPairs.includes(card.imageId)}
            isWrong={wrongPair.includes(index)}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      {/* Shuffle button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex justify-center pt-1">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white/55 hover:text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Embaralhar
        </button>
      </motion.div>

      {/* Match burst */}
      <AnimatePresence>
        {burstPos && <MatchBurst key={burstPos.key} x={burstPos.x} y={burstPos.y} />}
      </AnimatePresence>

      {/* Win overlay */}
      <AnimatePresence>
        {isWon && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(10,5,25,0.92)', backdropFilter: 'blur(16px)' }}
          >
            <WinHearts />
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative z-10 flex flex-col items-center gap-5 p-10 rounded-3xl text-center"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.4) 0%, rgba(10,5,25,0.97) 70%)',
                border: '1px solid rgba(139,92,246,0.35)',
                boxShadow: '0 0 80px rgba(109,40,217,0.35), inset 0 0 60px rgba(0,0,0,0.4)',
                maxWidth: 340,
              }}
            >
              <motion.div
                animate={{ rotate: [-5, 5, -5], y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="p-4 rounded-full"
                style={{
                  background: 'rgba(168,85,247,0.2)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.4)',
                  fontSize: 44,
                }}
              >
                💜
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Parabéns!</h2>
                <p className="text-violet-300 font-semibold">Você encontrou todos os pares!</p>
                <p className="text-white/45 text-sm">O amor de vocês é perfeito assim 🌸</p>
              </div>

              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 + i * 0.12 }}>
                    <Sparkles className="w-7 h-7 text-violet-300 fill-violet-400/40" />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 60%, #6d28d9 100%)',
                  boxShadow: '0 4px 24px rgba(139,92,246,0.55)',
                }}
              >
                <RotateCcw className="w-4 h-4" /> Jogar Novamente
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
