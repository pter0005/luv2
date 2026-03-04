'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Star, CheckCircle2, XCircle, ChevronRight, RotateCcw, Sparkles, Trophy } from 'lucide-react';

interface QuizQuestion {
  questionText: string;
  options: { text: string }[];
  correctAnswerIndex: number;
}

interface QuizGameProps {
  questions: QuizQuestion[];
}

function FloatingOrb({ x, delay, size, dur }: { x: number; delay: number; size: number; dur: number }) {
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none select-none"
      style={{ left: `${x}%` }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -600, opacity: [0, 0.7, 0.5, 0], rotate: [-15, 15, -10, 20], x: [0, 25, -15, 8] }}
      transition={{ duration: dur, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: Math.random() * 3 }}
    >
      <Heart
        style={{ width: size, height: size }}
        className="text-violet-400 fill-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.9)]"
      />
    </motion.div>
  );
}

function HeartsRain() {
  const hearts = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 3,
    size: 12 + Math.random() * 20, dur: 2.5 + Math.random() * 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map(h => <FloatingOrb key={h.id} x={h.x} delay={h.delay} size={h.size} dur={h.dur} />)}
    </div>
  );
}

function CorrectBurst() {
  const items = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((i) => {
        const angle = (i / 14) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 80 + Math.random() * 60;
        return (
          <motion.div key={i} className="absolute top-1/2 left-1/2"
            initial={{ x: 0, y: 0, scale: 1.5, opacity: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, scale: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}>
            {i % 3 === 0
              ? <Heart className="w-4 h-4 text-violet-400 fill-violet-400" />
              : i % 3 === 1
              ? <Star className="w-3 h-3 text-purple-300 fill-purple-300" />
              : <Sparkles className="w-3 h-3 text-fuchsia-300" />}
          </motion.div>
        );
      })}
    </div>
  );
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total === 0 ? 0 : score / total;
  const r = 70, circ = 2 * Math.PI * r, offset = circ * (1 - pct);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="12" />
        <motion.circle cx="90" cy="90" r={r} fill="none" stroke="url(#sg)" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className="text-5xl font-black text-white leading-none"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.6 }}>
          {score}
        </motion.span>
        <span className="text-sm text-white/40 font-medium">de {total}</span>
      </div>
    </div>
  );
}

function getResultMessage(score: number, total: number) {
  const p = score / total;
  if (p === 1)  return { title: '💜 Sincronia Perfeita!',  sub: 'Vocês se conhecem de alma!' };
  if (p >= 0.8) return { title: '✨ Quase Perfeitos!',      sub: 'O amor de vocês é lindo assim.' };
  if (p >= 0.6) return { title: '💫 Sintonia no Ar!',       sub: 'Ainda têm muito para descobrir juntos.' };
  if (p >= 0.4) return { title: '🌸 Amor em Crescimento',   sub: 'A jornada é o melhor presente!' };
  return         { title: '💌 Começo de Tudo',              sub: 'O melhor ainda está por vir!' };
}

const gradPurple = 'linear-gradient(135deg, #a855f7 0%, #7c3aed 60%, #6d28d9 100%)';
const glowPurple = '0 4px 28px rgba(139,92,246,0.55)';

export default function QuizGame({ questions }: QuizGameProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');
  const [direction, setDirection] = useState(1);

  const q = questions[currentQ];
  const isAnswered = confirmed !== null;
  const isCorrect = confirmed === q?.correctAnswerIndex;
  const isLastQ = currentQ === questions.length - 1;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setConfirmed(idx);
    setSelectedAnswers(p => ({ ...p, [currentQ]: idx }));
    if (idx === q.correctAnswerIndex) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 800);
    }
  };

  const handleNext = () => {
    if (isLastQ) { setPhase('results'); return; }
    setDirection(1);
    setCurrentQ(c => c + 1);
    setConfirmed(null);
    setShowBurst(false);
  };

  const handleReset = () => {
    setCurrentQ(0); setSelectedAnswers({}); setConfirmed(null);
    setShowBurst(false); setPhase('quiz');
  };

  const score = questions.reduce((a, q, i) => a + (selectedAnswers[i] === q.correctAnswerIndex ? 1 : 0), 0);
  const { title, sub } = getResultMessage(score, questions.length);
  const progressPct = ((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100;

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ?  80 : -80, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -80 :  80, opacity: 0, scale: 0.95 }),
  };
  const optVar = {
    hidden:  { opacity: 0, x: -20 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.08, duration: 0.35 } }),
  };

  /* ── Results ── */
  if (phase === 'results') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg mx-auto flex flex-col items-center gap-6 p-8 rounded-3xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.35) 0%, rgba(10,5,25,0.97) 70%)',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 0 80px rgba(109,40,217,0.3), inset 0 0 60px rgba(0,0,0,0.5)',
        }}>
        <HeartsRain />

        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="relative z-10 p-4 rounded-full"
          style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
          <Trophy className="w-10 h-10 text-violet-300" />
        </motion.div>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative z-10">
          <ScoreRing score={score} total={questions.length} />
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }} className="relative z-10 text-center space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-white/50 text-sm">{sub}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }} className="relative z-10 w-full space-y-2">
          {questions.map((q, i) => {
            const ok = selectedAnswers[i] === q.correctAnswerIndex;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: ok ? 'rgba(109,40,217,0.2)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${ok ? 'rgba(139,92,246,0.35)' : 'rgba(244,63,94,0.2)'}`,
                }}>
                {ok
                  ? <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  : <XCircle     className="w-4 h-4 text-rose-400   flex-shrink-0" />}
                <span className="text-white/80 truncate flex-grow">{q.questionText}</span>
                {ok
                  ? <Heart className="w-3 h-3 text-violet-400 fill-violet-400 ml-auto flex-shrink-0" />
                  : <span className="ml-auto text-white/35 flex-shrink-0 text-xs">{q.options[q.correctAnswerIndex]?.text}</span>}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
          className="relative z-10">
          <Button onClick={handleReset}
            className="gap-2 bg-white/8 hover:bg-white/15 border border-violet-500/20 text-white rounded-2xl px-6 py-3 font-semibold hover:scale-105 active:scale-95">
            <RotateCcw className="w-4 h-4" /> Jogar Novamente
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Quiz ── */
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 px-2 pb-8">

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">
            Pergunta {currentQ + 1} de {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <motion.div key={i} className="h-1.5 rounded-full overflow-hidden"
                animate={{ width: i === currentQ ? 28 : 10 }} transition={{ duration: 0.3 }}>
                <div className="h-full w-full rounded-full" style={{
                  background: i < currentQ
                    ? (selectedAnswers[i] === questions[i].correctAnswerIndex ? '#a855f7' : '#fb7185')
                    : i === currentQ ? '#c084fc' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.3s',
                }} />
              </motion.div>
            ))}
          </div>
        </div>
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.15)' }}>
          <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: gradPurple, boxShadow: '0 0 12px rgba(168,85,247,0.7)' }} />
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQ} custom={direction} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }} className="relative">

            <AnimatePresence>{showBurst && <CorrectBurst />}</AnimatePresence>

            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-xl font-bold text-white mb-6 leading-snug px-1"
              style={{ textShadow: '0 2px 20px rgba(168,85,247,0.4)' }}>
              {q.questionText}
            </motion.p>

            <div className="space-y-3">
              {q.options.map((opt, oIdx) => {
                const isSelected  = confirmed === oIdx;
                const isRight     = oIdx === q.correctAnswerIndex;
                const showCorrect = isAnswered && isRight;
                const showWrong   = isAnswered && isSelected && !isRight;
                const dimmed      = isAnswered && !isSelected && !isRight;

                return (
                  <motion.button key={oIdx} custom={oIdx} variants={optVar} initial="hidden" animate="visible"
                    whileHover={!isAnswered ? { scale: 1.02, x: 4 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(oIdx)}
                    disabled={isAnswered}
                    className={cn(
                      'relative w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all duration-300 overflow-hidden group',
                      !isAnswered && 'border-violet-500/15 bg-violet-500/5 hover:bg-violet-500/12 hover:border-violet-400/50 text-white cursor-pointer',
                      showCorrect && 'border-violet-400/60 bg-violet-600/18 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.35)]',
                      showWrong   && 'border-rose-400/60   bg-rose-500/12   text-rose-300   shadow-[0_0_18px_rgba(244,63,94,0.2)]',
                      dimmed      && 'border-white/5       bg-white/2       text-white/25   opacity-50',
                      isAnswered  && 'cursor-default'
                    )}>
                    {!isAnswered && (
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'flex-shrink-0 w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center transition-colors duration-300',
                        !isAnswered && 'bg-violet-500/15 text-violet-300',
                        showCorrect && 'bg-violet-500/30 text-violet-200',
                        showWrong   && 'bg-rose-500/30   text-rose-300',
                        dimmed      && 'bg-white/5       text-white/20',
                      )}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-grow">{opt.text}</span>
                      {showCorrect && (
                        <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <CheckCircle2 className="w-5 h-5 text-violet-300" />
                        </motion.span>
                      )}
                      {showWrong && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <XCircle className="w-5 h-5 text-rose-400" />
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="mt-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2"
                  style={{
                    background: isCorrect ? 'rgba(109,40,217,0.2)' : 'rgba(244,63,94,0.12)',
                    border: `1px solid ${isCorrect ? 'rgba(168,85,247,0.35)' : 'rgba(244,63,94,0.25)'}`,
                    color: isCorrect ? '#c4b5fd' : '#fca5a5',
                  }}>
                  <Heart className="w-4 h-4 fill-current flex-shrink-0" />
                  <span>
                    {isCorrect
                      ? ['Incrível! Vocês são perfeitos! 💫', 'Arrasou! 💜', 'Que sintonia! 🌸', 'Isso aí! ✨'][currentQ % 4]
                      : <><span>Resposta certa: </span><strong className="text-white">{q.options[q.correctAnswerIndex]?.text}</strong></>}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 }}>
            <button onClick={handleNext}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: gradPurple, boxShadow: glowPurple }}>
              {isLastQ
                ? <><Trophy className="w-5 h-5" /><span>Ver Resultado</span><Sparkles className="w-4 h-4" /></>
                : <><span>Próxima Pergunta</span><ChevronRight className="w-5 h-5" /></>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
