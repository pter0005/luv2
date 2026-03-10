'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

const OPTIONS = [
  { key: 'namorade', emoji: '💜', label: 'Namorada/o',     sub: 'declare seu amor' },
  { key: 'espouse',  emoji: '💍', label: 'Esposa/o',       sub: 'eternize o amor' },
  { key: 'mae',      emoji: '🌸', label: 'Mãe',            sub: 'surpreenda ela' },
  { key: 'pai',      emoji: '💙', label: 'Pai',            sub: 'surpreenda ele' },
  { key: 'amige',    emoji: '🤍', label: 'Amigo/a',        sub: 'homenageie essa pessoa' },
  { key: 'avo',      emoji: '🌻', label: 'Avó/Avô',        sub: 'um presente especial' },
  { key: 'filho',    emoji: '💛', label: 'Filho/Filha',    sub: 'eternize esse amor' },
  { key: 'outro',    emoji: '✨', label: 'Outra pessoa',   sub: 'alguém especial' },
];

export default function CriarPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    const segment = selected === 'outro' ? '' : `&segment=${selected}`;
    setTimeout(() => {
      router.push(`/criar/fazer-eu-mesmo?plan=avancado&new=true${segment}`);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Background glows */}
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

      {/* Cards grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl"
      >
        {OPTIONS.map((opt, i) => {
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

      {/* CTA — aparece só depois de selecionar */}
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
                  <span>Criar a surpresa agora</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-xs text-white/25 mt-3">
              Pronto em menos de 5 minutos · a partir de R$14,90
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}