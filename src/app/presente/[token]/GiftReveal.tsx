'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gift, ArrowRight } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico',
  avancado: 'Avançado',
  vip: 'VIP',
};

export default function GiftReveal({ token, credits, plan }: { token: string; credits: number; plan: string }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    setStarting(true);
    localStorage.setItem('mycupid_gift_token', token);
    setTimeout(() => {
      router.push(`/chat?plan=${plan}&new=true&gift=${token}`);
    }, 500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-pink-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, type: 'spring', damping: 22 }}
        className="relative z-10 text-center max-w-sm w-full"
      >
        {/* Logo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-8"
        >
          mycupid
        </motion.p>

        {/* Gift icon */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 14, stiffness: 200 }}
          className="w-28 h-28 rounded-3xl mx-auto mb-7 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.1))',
            border: '1.5px solid rgba(168,85,247,0.4)',
            boxShadow: '0 0 60px rgba(168,85,247,0.25)',
          }}
        >
          <span className="text-6xl leading-none select-none">🎁</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl font-black text-white mb-3 leading-tight"
        >
          Você ganhou {credits > 1 ? `${credits} páginas` : 'uma página'} grátis! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-white/50 text-base mb-8 leading-relaxed"
        >
          Alguém especial preparou um presente pra você.<br />
          Crie sua página agora, sem pagar nada.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={handleStart}
          disabled={starting}
          className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
            boxShadow: '0 0 40px rgba(147,51,234,0.5), 0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {starting ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Criar minha página grátis
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-xs text-white/25 mt-4"
        >
          Plano {PLAN_LABELS[plan] || 'Avançado'} · Sem cartão · Sem cobrança
        </motion.p>
      </motion.div>
    </div>
  );
}
