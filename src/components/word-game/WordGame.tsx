"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RotateCcw, Trophy, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
export interface WordGameQuestion {
  question: string;
  answer:   string;
  hint:     string;
}
interface WordGameProps {
  questions: WordGameQuestion[];
  onExit?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS — fora do componente para estabilidade de referência
───────────────────────────────────────────────────────────────────────────── */
const MAX_WRONG = 6;

// Layout QWERTY → muito mais intuitivo no mobile
const QWERTY: string[][] = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

// Corações flutuantes — valores fixos para não re-renderizar
const FLOATERS = Array.from({ length: 14 }, (_, i) => ({
  id:    i,
  x:     5 + Math.round((i / 14) * 90),
  delay: Math.round((i * 0.37) * 10) / 10,
  size:  8 + (i % 5) * 4,
  dur:   3.5 + (i % 4) * 0.8,
}));

// Partículas de vitória
const BURST = Array.from({ length: 18 }, (_, i) => {
  const rad  = ((i / 18) * 360 * Math.PI) / 180;
  const dist = 55 + (i % 5) * 18;
  return { rad, dist, t: i % 4 };
});

const WIN_PHRASES = [
  'Você me conhece de verdade! 💘',
  'Sintonia perfeita! ✨',
  'Arrasou! 💜',
  'É tudo isso! 🎯',
  'Que amor! 🌸',
];

/* ─────────────────────────────────────────────────────────────────────────────
   SVG — Flecha do Cupido
───────────────────────────────────────────────────────────────────────────── */
function CupidArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" className={className}>
      {/* cabo */}
      <line x1="4" y1="8" x2="36" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* ponta */}
      <path d="M32 4 L44 8 L32 12" fill="currentColor" />
      {/* penas */}
      <path d="M4 8 C4 8 2 5 0 5 M4 8 C4 8 2 11 0 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
function Floater({ x, delay, size, dur }: (typeof FLOATERS)[number]) {
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none select-none"
      style={{ left: `${x}%` }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -380, opacity: [0, 0.45, 0.25, 0], x: [0, 6, -4, 0] }}
      transition={{ duration: dur, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: dur * 0.6 }}
    >
      <Heart style={{ width: size, height: size }} className="text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.5)]" />
    </motion.div>
  );
}

function HeartsRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {FLOATERS.map(h => <Floater key={h.id} {...h} />)}
    </div>
  );
}

function WinBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {BURST.map(({ rad, dist, t }, i) => (
        <motion.div key={i} className="absolute"
          initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
          animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, scale: 0, opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          {t === 0 && <Heart    className="w-4 h-4 text-rose-400   fill-rose-400"   />}
          {t === 1 && <Sparkles className="w-3 h-3 text-purple-300"                />}
          {t === 2 && <span     className="text-lg leading-none"    >💘</span>       }
          {t === 3 && <Heart    className="w-3 h-3 text-pink-300    fill-pink-300"  />}
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function WordGame({ questions, onExit }: WordGameProps) {
  const [currentQ,       setCurrentQ]       = useState(0);
  const [guessed,        setGuessed]        = useState<Set<string>>(new Set());
  const [showHint,       setShowHint]       = useState(false);
  const [hintUsed,       setHintUsed]       = useState(false);
  const [showBurst,      setShowBurst]      = useState(false);
  const [phase,          setPhase]          = useState<'game' | 'results'>('game');
  const [scores,         setScores]         = useState<boolean[]>([]);
  const [shakeLetter,    setShakeLetter]    = useState<string | null>(null);

  const q   = questions[currentQ];
  const nav = normalize(q.answer);

  const wrongLetters = useMemo(
    () => [...guessed].filter(l => !nav.replace(/\s/g, '').includes(l)),
    [guessed, nav],
  );

  const isWon = useMemo(
    () => nav.replace(/\s/g, '').split('').every(l => guessed.has(l)),
    [guessed, nav],
  );

  const isLost   = wrongLetters.length >= MAX_WRONG;
  const isOver   = isWon || isLost;
  const lives    = MAX_WRONG - wrongLetters.length;
  const isLastQ  = currentQ >= questions.length - 1;

  const handleGuess = (letter: string) => {
    if (guessed.has(letter) || isOver) return;
    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);

    const correct = nav.replace(/\s/g, '').includes(letter);
    if (!correct) {
      // shake no coração perdido
      setShakeLetter(letter);
      setTimeout(() => setShakeLetter(null), 500);
    }
    const won = nav.replace(/\s/g, '').split('').every(l => next.has(l));
    if (won) { setShowBurst(true); setTimeout(() => setShowBurst(false), 900); }
  };

  const handleNext = () => {
    setScores(s => [...s, isWon]);
    if (isLastQ) { setPhase('results'); return; }
    setCurrentQ(c => c + 1);
    setGuessed(new Set());
    setShowHint(false);
    setHintUsed(false);
    setShowBurst(false);
  };

  const handleReset = () => {
    setCurrentQ(0); setGuessed(new Set()); setShowHint(false);
    setHintUsed(false); setShowBurst(false); setPhase('game'); setScores([]);
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TELA DE RESULTADO
  ══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'results') {
    const wins    = [...scores, isWon].filter(Boolean).length;
    const total   = questions.length;
    const perfect = wins === total;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-sm mx-auto flex flex-col items-center gap-5 px-4 py-10 rounded-3xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(190,24,93,0.28) 0%, rgba(10,5,25,0.97) 65%)',
          border: '1px solid rgba(244,114,182,0.25)',
          boxShadow: '0 0 80px rgba(190,24,93,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <HeartsRain />

        {/* Ícone troféu com glow */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, rgba(109,40,217,0.15) 100%)',
            border: '1px solid rgba(244,114,182,0.35)',
            boxShadow: '0 0 40px rgba(244,114,182,0.35), 0 0 80px rgba(109,40,217,0.2)',
          }}
        >
          <Trophy className="w-9 h-9 text-pink-300" />
        </motion.div>

        {/* Placar grande */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 14, delay: 0.25 }}
          className="relative z-10 text-center"
        >
          <div className="flex items-end justify-center gap-1">
            <span className="text-7xl font-black text-white leading-none" style={{ textShadow: '0 0 40px rgba(244,114,182,0.5)' }}>
              {wins}
            </span>
            <span className="text-2xl font-black text-white/30 mb-2">/{total}</span>
          </div>
          <p className="text-white/40 text-sm tracking-wide">palavras descobertas</p>
        </motion.div>

        {/* Mensagem */}
        <motion.div
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="relative z-10 text-center px-4"
        >
          <h2 className="text-xl font-black text-white leading-tight">
            {perfect ? '💘 Você me conhece de verdade!' : wins > 0 ? '✨ Você foi incrível!' : '💌 O amor conta mais!'}
          </h2>
          <p className="text-white/40 text-sm mt-1.5">
            {perfect ? 'Sintonia total entre vocês.' : wins > 0 ? 'Quase tudo descoberto!' : 'Tente de novo, vai conseguir!'}
          </p>
        </motion.div>

        {/* Flechas decorativas */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <CupidArrow className="w-10 h-3 text-pink-400/50 -scale-x-100" />
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <CupidArrow className="w-10 h-3 text-pink-400/50" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="relative z-10 flex gap-3"
        >
          {onExit && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExit}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/60 border border-white/10 hover:text-white/90 hover:border-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #9333ea 60%, #7c3aed 100%)',
              boxShadow: '0 4px 24px rgba(225,29,72,0.4), 0 4px 24px rgba(147,51,234,0.3)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     JOGO
  ══════════════════════════════════════════════════════════════════════════ */
  const words    = q.answer.split(' ');
  const navWords = nav.split(' ');

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3 px-3 pb-4 select-none">

      {/* ── Header: progress + vidas ── */}
      <div className="flex items-center justify-between pt-1">

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/35 font-semibold uppercase tracking-widest">
            {currentQ + 1}/{questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === currentQ ? 20 : 6 }}
                transition={{ duration: 0.3 }}
                className="h-1 rounded-full"
                style={{
                  background: i < currentQ
                    ? scores[i] ? '#f472b6' : 'rgba(251,113,133,0.4)'
                    : i === currentQ ? 'rgba(244,114,182,0.8)' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Vidas — corações */}
        <div className="flex gap-1">
          {Array.from({ length: MAX_WRONG }).map((_, i) => {
            const alive = i < lives;
            return (
              <motion.div
                key={i}
                animate={!alive && shakeLetter !== null ? { rotate: [-20, 20, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  initial={false}
                  animate={alive ? { scale: 1 } : { scale: [1, 1.4, 0.7, 1] }}
                  transition={{ duration: 0.35 }}
                >
                  <Heart className={cn(
                    'w-4 h-4 transition-all duration-300',
                    alive ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.7)]' : 'text-white/10 fill-white/10',
                  )} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Card da pergunta (tema carta de amor) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.28 }}
          className="relative rounded-2xl px-4 py-3 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(190,24,93,0.12) 0%, rgba(109,40,217,0.1) 100%)',
            border: '1px solid rgba(244,114,182,0.2)',
            boxShadow: '0 0 30px rgba(190,24,93,0.1)',
          }}
        >
          {/* Glow top line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.6), transparent)' }} />

          <div className="flex items-center gap-2 mb-1.5">
            <CupidArrow className="w-6 h-2 text-pink-400/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400/60">
              Cupido pergunta
            </span>
          </div>
          <p className="text-[15px] font-bold text-white leading-snug">
            {q.question}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* ── Display da resposta ── */}
      <div className="relative flex flex-wrap justify-center gap-x-3 gap-y-2 py-3 px-2 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 72,
        }}
      >
        <AnimatePresence>{showBurst && <WinBurst />}</AnimatePresence>

        {words.map((word, wIdx) => (
          <div key={wIdx} className="flex gap-1.5 items-end">
            {navWords[wIdx].split('').map((normLetter, lIdx) => {
              const revealed = guessed.has(normLetter) || isLost;
              const correct  = guessed.has(normLetter);

              return (
                <div key={lIdx} className="flex flex-col items-center gap-[3px]">
                  {/* Letra ou espaço */}
                  <div className="w-[22px] h-7 flex items-end justify-center">
                    <AnimatePresence mode="wait">
                      {revealed ? (
                        <motion.span
                          key="revealed"
                          initial={{ y: -14, opacity: 0, scale: 0.6 }}
                          animate={{ y: 0,   opacity: 1, scale: 1   }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: lIdx * 0.035 }}
                          className={cn(
                            'text-lg font-black leading-none',
                            correct ? 'text-white' : 'text-rose-400',
                          )}
                          style={correct ? { textShadow: '0 0 12px rgba(244,114,182,0.8)' } : {}}
                        >
                          {word[lIdx]}
                        </motion.span>
                      ) : (
                        <motion.span key="hidden" className="text-lg font-black leading-none text-transparent">
                          {word[lIdx]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Sublinhado */}
                  <motion.div
                    className="h-[2px] rounded-full"
                    style={{ width: 18 }}
                    animate={{
                      background: revealed
                        ? correct
                          ? ['rgba(244,114,182,0.3)', 'rgba(244,114,182,0.9)', 'rgba(244,114,182,0.6)']
                          : 'rgba(251,113,133,0.6)'
                        : 'rgba(255,255,255,0.22)',
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Botão de dica + card animado ── */}
      {!isOver && (
        <div className="flex justify-center">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { setShowHint(s => !s); setHintUsed(true); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors',
              showHint
                ? 'border-amber-500/30 text-amber-300/50 bg-amber-500/5'
                : hintUsed
                  ? 'border-amber-500/20 text-amber-400/40 bg-transparent'
                  : 'border-amber-500/35 text-amber-300 bg-amber-500/8 hover:bg-amber-500/14',
            )}
          >
            {/* Feather icon via emoji pra não poluir imports */}
            <span className="text-sm">{showHint ? '🪶' : '💡'}</span>
            {showHint ? 'Esconder dica' : 'Ver dica'}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 py-2.5 rounded-2xl flex items-start gap-2.5"
              style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.22)' }}>
              <CupidArrow className="w-5 h-2 text-amber-400/70 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-amber-200/70 leading-relaxed">{q.hint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Estados: ganhou / perdeu ── */}
      <AnimatePresence>
        {isWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="flex flex-col items-center gap-3 py-1"
          >
            <motion.p
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, delay: 0.08 }}
              className="text-xl font-black text-white text-center"
              style={{ textShadow: '0 0 24px rgba(244,114,182,0.7)' }}
            >
              {WIN_PHRASES[currentQ % WIN_PHRASES.length]}
            </motion.p>

            <motion.div className="flex items-center gap-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <CupidArrow className="w-8 h-2.5 text-pink-400/60 -scale-x-100" />
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <CupidArrow className="w-8 h-2.5 text-pink-400/60" />
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #9333ea 60%, #7c3aed 100%)',
                boxShadow: '0 4px 20px rgba(225,29,72,0.35), 0 4px 20px rgba(147,51,234,0.25)',
              }}
            >
              {isLastQ ? <><Trophy className="w-4 h-4" /> Ver Resultado</> : <><span>Próxima</span><ChevronRight className="w-4 h-4" /></>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-1"
          >
            <div className="px-4 py-2.5 rounded-2xl text-center"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">A resposta era</p>
              <p className="text-base font-black text-white">{q.answer}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #9333ea 60%, #7c3aed 100%)',
                boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
              }}
            >
              {isLastQ ? <><Trophy className="w-4 h-4" /> Ver Resultado</> : <><span>Próxima</span><ChevronRight className="w-4 h-4" /></>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Teclado QWERTY (mobile-first) ── */}
      {!isOver && (
        <div className="flex flex-col gap-1.5 mt-1">
          {QWERTY.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5">
              {row.map(letter => {
                const used    = guessed.has(letter);
                const correct = used && nav.replace(/\s/g, '').includes(letter);
                const wrong   = used && !nav.replace(/\s/g, '').includes(letter);

                return (
                  <motion.button
                    key={letter}
                    whileTap={!used ? { scale: 0.78, y: 2 } : {}}
                    onClick={() => handleGuess(letter)}
                    disabled={used}
                    className={cn(
                      'w-8 h-10 rounded-lg text-[13px] font-black transition-all duration-200 relative overflow-hidden',
                      !used   && 'text-white cursor-pointer active:shadow-none',
                      correct && 'cursor-default',
                      wrong   && 'cursor-default',
                    )}
                    style={
                      !used ? {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                      } : correct ? {
                        background: 'rgba(244,114,182,0.18)',
                        border: '1px solid rgba(244,114,182,0.35)',
                        color: 'rgba(249,168,212,0.6)',
                        boxShadow: '0 0 8px rgba(244,114,182,0.2)',
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.15)',
                      }
                    }
                  >
                    {/* Shimmer on hover */}
                    {!used && (
                      <span className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent rounded-lg" />
                    )}
                    <span className="relative">{letter}</span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Letras erradas ── */}
      {wrongLetters.length > 0 && !isOver && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex justify-center gap-1.5 flex-wrap"
        >
          {wrongLetters.map(l => (
            <span key={l} className="text-[11px] font-bold text-rose-400/50 line-through">
              {l}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
