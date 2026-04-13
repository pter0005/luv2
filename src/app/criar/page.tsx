'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Heart, MessageCircleHeart, Sparkles, Users } from 'lucide-react';
import { useUser } from '@/firebase/provider';
import { ADMIN_EMAILS } from '@/lib/admin-emails';

// ─────────────────────────────────────────────────────────────────────
// LAYOUT PÚBLICO (antigo) — grid 2x4 com emojis
// ─────────────────────────────────────────────────────────────────────
const PUBLIC_OPTIONS = [
  { key: 'namorade', emoji: '💜', label: 'Namorada/o',     sub: 'declare seu amor' },
  { key: 'espouse',  emoji: '💍', label: 'Esposa/o',       sub: 'eternize o amor' },
  { key: 'mae',      emoji: '🌸', label: 'Mãe',            sub: 'surpreenda ela' },
  { key: 'pai',      emoji: '💙', label: 'Pai',            sub: 'surpreenda ele' },
  { key: 'amige',    emoji: '🤍', label: 'Amigo/a',        sub: 'homenageie essa pessoa' },
  { key: 'avo',      emoji: '🌻', label: 'Avó/Avô',        sub: 'um presente especial' },
  { key: 'filho',    emoji: '💛', label: 'Filho/Filha',    sub: 'eternize esse amor' },
  { key: 'outro',    emoji: '✨', label: 'Outra pessoa',   sub: 'alguém especial' },
];

// ─────────────────────────────────────────────────────────────────────
// LAYOUT ADMIN (novo) — cards grandes + chips + header live
// ─────────────────────────────────────────────────────────────────────
type ChipOpt = { key: string; emoji: string; label: string };
const ADMIN_CHIPS: ChipOpt[] = [
  { key: 'mae',    emoji: '🌸', label: 'Mãe' },
  { key: 'pai',    emoji: '💙', label: 'Pai' },
  { key: 'avo',    emoji: '🌻', label: 'Avó/Avô' },
  { key: 'filho',  emoji: '💛', label: 'Filho/Filha' },
  { key: 'espouse',emoji: '💍', label: 'Esposo/a' },
  { key: 'outro',  emoji: '✨', label: 'Outro' },
];

const LIVE_KEY = 'criar_live_count_v1';

export default function CriarPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email));

  const [liveCount, setLiveCount] = useState(0);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // ── Fake live counter (only increments, admin layout only) ─────────
  useEffect(() => {
    if (!isAdmin) return;
    const stored = parseInt(localStorage.getItem(LIVE_KEY) || '0', 10);
    const start = stored > 120 ? stored : 847 + Math.floor(Math.random() * 60);
    setLiveCount(start);
    localStorage.setItem(LIVE_KEY, String(start));

    const tick = () => {
      setLiveCount(prev => {
        const next = prev + (Math.floor(Math.random() * 3) + 1);
        localStorage.setItem(LIVE_KEY, String(next));
        return next;
      });
    };
    const id = window.setInterval(tick, 4500 + Math.random() * 2500);
    return () => window.clearInterval(id);
  }, [isAdmin]);

  const go = (segment: string) => {
    if (loadingKey) return;
    setLoadingKey(segment);
    const q = segment && segment !== 'outro' ? `&segment=${segment}` : '';
    setTimeout(() => {
      router.push(`/criar/fazer-eu-mesmo?plan=avancado&new=true${q}`);
    }, 350);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    const segment = selected === 'outro' ? '' : `&segment=${selected}`;
    setTimeout(() => {
      router.push(`/criar/fazer-eu-mesmo?plan=avancado&new=true${segment}`);
    }, 400);
  };

  // Evita flash do layout antigo enquanto a auth carrega
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN LAYOUT (novo) — só admins veem
  // ═══════════════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10 relative overflow-hidden">

        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/12 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/8 blur-[120px] rounded-full" />
        </div>

        {/* HEADER */}
        <header className="w-full max-w-xl flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">MyCupid</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-amber-300"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-400" />
            </span>
            <span className="text-[11px] font-semibold text-white/80 tabular-nums">
              {liveCount.toLocaleString('pt-BR')} criando agora
            </span>
          </div>
        </header>

        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 max-w-xl"
        >
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.05] tracking-tight">
            Pra quem é a surpresa?
          </h1>
          <p className="text-white/45 mt-3 text-sm sm:text-base">
            A página é criada sob medida pra essa pessoa.
          </p>
        </motion.div>

        {/* MAIN CARDS */}
        <div className="w-full max-w-xl space-y-3">

          {/* Presente de Amor */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            onClick={() => go('namorade')}
            disabled={!!loadingKey}
            className="w-full relative text-left rounded-2xl p-5 sm:p-6 transition-all active:scale-[0.99] group"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.12) 100%)',
              border: '1.5px solid rgba(168,85,247,0.55)',
              boxShadow: '0 0 32px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black text-white tracking-widest uppercase"
              style={{
                background: 'linear-gradient(90deg, #9333ea, #c026d3)',
                boxShadow: '0 4px 14px rgba(147,51,234,0.45)',
              }}>
              ⚡ Mais Popular
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
                  border: '1px solid rgba(168,85,247,0.4)',
                }}>
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-pink-300" fill="currentColor" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  Presente de Amor
                </h2>
                <p className="text-xs sm:text-sm text-white/55 mt-0.5">
                  Pra namorado(a), cônjuge ou crush
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </motion.button>

          {/* Presente para Amiga — Dia do Amigo */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            onClick={() => go('amige')}
            disabled={!!loadingKey}
            className="w-full relative text-left rounded-2xl p-5 sm:p-6 transition-all active:scale-[0.99] group"
            style={{
              background: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(236,72,153,0.08) 100%)',
              border: '1.5px solid rgba(251,146,60,0.35)',
              boxShadow: '0 0 24px rgba(251,146,60,0.12)',
            }}
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black text-white tracking-widest uppercase flex items-center gap-1"
              style={{
                background: 'linear-gradient(90deg, #f97316, #ec4899)',
                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              }}>
              🎉 Dia do Amigo
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,146,60,0.28), rgba(236,72,153,0.18))',
                  border: '1px solid rgba(251,146,60,0.4)',
                }}>
                <MessageCircleHeart className="w-7 h-7 sm:w-8 sm:h-8 text-orange-300" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  Presente para Amiga
                </h2>
                <p className="text-xs sm:text-sm text-white/55 mt-0.5">
                  Surpreenda sua melhor amiga · Edição Dia do Amigo
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </motion.button>
        </div>

        {/* DIRECT HOMAGE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full max-w-xl mt-8 sm:mt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Ou homenageie diretamente</p>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {ADMIN_CHIPS.map(c => {
              const isLoading = loadingKey === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => go(c.key)}
                  disabled={!!loadingKey}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <span className="text-sm leading-none">{c.emoji}</span>
                  <span>{c.label}</span>
                  {isLoading && (
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-white/25 mt-6 flex items-center justify-center gap-1.5">
            <Users className="w-3 h-3" />
            Pronta em 5 minutos · a pessoa vai se emocionar
          </p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC LAYOUT (antigo) — todo mundo que não é admin
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">MyCupid</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
          Pra quem é a surpresa?
        </h1>
        <p className="text-white/40 mt-3 text-base">
          A página vai ser personalizada pra esse presente.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl"
      >
        {PUBLIC_OPTIONS.map((opt, i) => {
          const isSelected = selected === opt.key;
          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.15 }}
              onClick={() => setSelected(opt.key)}
              className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-3 cursor-pointer transition-all duration-200 active:scale-95 outline-none"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(109,40,217,0.2) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: isSelected
                  ? '1.5px solid rgba(168,85,247,0.7)'
                  : '1.5px solid rgba(255,255,255,0.07)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-3xl leading-none">{opt.emoji}</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white leading-tight">{opt.label}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mt-8 w-full max-w-lg"
          >
            <motion.button
              onClick={handleConfirm}
              disabled={confirming}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                boxShadow: '0 0 30px rgba(147,51,234,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                opacity: confirming ? 0.7 : 1,
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>

              {confirming ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <>
                  <span>Declarar meu amor agora</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-xs text-white/25 mt-3">
              Pronto em 5 minutos · a pessoa amada vai se emocionar
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
