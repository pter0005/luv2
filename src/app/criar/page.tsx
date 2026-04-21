'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Heart, MessageCircleHeart, Sparkles, Users } from 'lucide-react';

type ChipOpt = { key: string; emoji: string; label: string };
const CHIPS: ChipOpt[] = [
  { key: 'mae',    emoji: '🌸', label: 'Mãe' },
  { key: 'pai',    emoji: '💙', label: 'Pai' },
  { key: 'avo',    emoji: '🌻', label: 'Avó/Avô' },
  { key: 'filho',  emoji: '💛', label: 'Filho/Filha' },
  { key: 'espouse',emoji: '💍', label: 'Esposo/a' },
  { key: 'outro',  emoji: '✨', label: 'Outro' },
];

export default function CriarPage() {
  const router = useRouter();

  const [liveCount, setLiveCount] = useState(0);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  // Em dev, assume admin imediatamente — o /api/admin/check confirma depois.
  const [isAdmin, setIsAdmin] = useState(process.env.NODE_ENV !== 'production');

  // ── Fake live counter — random between 6 and 23 ──
  useEffect(() => {
    const randInRange = () => 6 + Math.floor(Math.random() * 18); // 6..23
    setLiveCount(randInRange());

    const tick = () => setLiveCount(randInRange());
    const id = window.setInterval(tick, 4500 + Math.random() * 2500);
    return () => window.clearInterval(id);
  }, []);

  // ── Admin check — se for admin, CTAs mandam pro /chat ──
  useEffect(() => {
    fetch('/api/admin/check', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d?.admin))
      .catch(() => {});
  }, []);

  const go = (segment: string) => {
    if (loadingKey) return;
    setLoadingKey(segment);
    const seg = segment && segment !== 'outro' ? segment : '';
    if (isAdmin) {
      const q = seg ? `?segment=${seg}` : '';
      router.push(`/chat${q}`);
    } else {
      const q = seg ? `&segment=${seg}` : '';
      router.push(`/criar/fazer-eu-mesmo?plan=avancado&new=true${q}`);
    }
  };

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
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(109,40,217,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white/90 tracking-wider uppercase"
            style={{
              background: 'rgba(147,51,234,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            Mais popular
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
            background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(236,72,153,0.05) 100%)',
            border: '1px solid rgba(251,146,60,0.22)',
          }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white/90 tracking-wider uppercase"
            style={{
              background: 'rgba(249,115,22,0.75)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            Dia do Amigo
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
          {CHIPS.map(c => {
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
