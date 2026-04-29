
'use client';

import { useState, useEffect } from 'react';
import { X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRemainingSpots } from '@/lib/scarcity';

const TIMER_KEY = 'mycupid_offer_deadline';
const INITIAL_SECONDS = 24 * 3600; // 24 horas

function getDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + INITIAL_SECONDS * 1000;
  try {
    const stored = localStorage.getItem(TIMER_KEY);
    if (stored) {
      const deadline = parseInt(stored);
      // Se o deadline guardado é inválido ou está muito no passado (mais de 2 dias), ignora
      if (isNaN(deadline) || deadline < Date.now() - 2 * 86400000) {
        localStorage.removeItem(TIMER_KEY);
      } else {
        return deadline;
      }
    }
    const deadline = Date.now() + INITIAL_SECONDS * 1000;
    localStorage.setItem(TIMER_KEY, String(deadline));
    return deadline;
  } catch {
    return Date.now() + INITIAL_SECONDS * 1000;
  }
}

function useBannerTimer() {
  const [timeLeft, setTimeLeft] = useState(INITIAL_SECONDS);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const deadline = getDeadline();
    const tick = () => {
      const remaining = Math.floor((deadline - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        setExpired(true);
      } else {
        setTimeLeft(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');

  return { formatted: `${h}h ${m}min ${s}s`, expired };
}

function useScarcitySpots() {
  const [spots, setSpots] = useState(0);

  useEffect(() => {
    setSpots(getRemainingSpots());

    const interval = setInterval(() => {
      setSpots(prev => {
        if (prev <= 2) return prev;
        return Math.random() < 0.3 ? prev - 1 : prev;
      });
    }, 150_000);
    return () => clearInterval(interval);
  }, []);

  return spots;
}

function isMothersDayPeriod() {
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  return (m === 4 && d >= 25) || (m === 5 && d <= 11);
}

export default function DiscountBanner() {
  const [visible, setVisible] = useState(false);
  const [showScarcity, setShowScarcity] = useState(false);
  const { formatted, expired } = useBannerTimer();
  const spots = useScarcitySpots();
  const [mothersDay, setMothersDay] = useState(false);
  useEffect(() => { setMothersDay(isMothersDayPeriod()); }, []);

  useEffect(() => {
    const BANNER_ACTIVE = true;
    if (!BANNER_ACTIVE) return;
    const dismissed = sessionStorage.getItem('discount-banner-dismissed');
    if (!dismissed) setVisible(true);
  }, []);

  // Alterna entre as duas mensagens a cada 5 segundos
  useEffect(() => {
    if (!visible || expired) return;
    const interval = setInterval(() => {
      setShowScarcity(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [visible, expired]);

  const dismiss = () => {
    sessionStorage.setItem('discount-banner-dismissed', '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full overflow-hidden"
          style={{
            background: expired
              ? 'linear-gradient(90deg, #1a0505 0%, #3b0a0a 50%, #1a0505 100%)'
              : mothersDay
                ? 'linear-gradient(90deg, #831843 0%, #be185d 40%, #db2777 60%, #9d174d 100%)'
                : 'linear-gradient(90deg, #3b0764 0%, #6b21a8 40%, #7c3aed 60%, #4c1d95 100%)',
          }}
        >
          {/* shimmer */}
          {!expired && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
                animation: 'shimmer 3s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          )}
          <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>

          <div className="relative flex items-center justify-center gap-2 py-2.5 px-10 text-center">
            {expired ? (
              <p className="text-sm text-red-300 leading-none font-semibold">
                ⚠️ Oferta encerrada — preço normal restaurado
              </p>
            ) : showScarcity && spots > 0 ? (
              <p className="text-xs font-bold text-white flex items-center justify-center gap-2 transition-opacity duration-500">
                <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>
                  Restam <span className="text-yellow-300 tabular-nums">{spots}</span> {mothersDay ? 'páginas com desconto de Dia das Mães' : 'páginas com preço promocional hoje'}
                </span>
                <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              </p>
            ) : (
              <p className="text-sm text-white leading-none transition-opacity duration-500">
                {mothersDay ? '🌸' : '🔥'} <span className="font-black">{mothersDay ? 'Dia das Mães — até 40% OFF' : '312 páginas criadas essa semana'}</span>
                <span className="mx-2 opacity-40">—</span>
                <span className="text-pink-200 font-semibold">{mothersDay ? 'Oferta acaba em ' : 'Oferta especial por mais '}</span>
                <span className="font-black text-yellow-300 tabular-nums">{formatted}</span>
              </p>
            )}
            <button
              onClick={dismiss}
              aria-label="Fechar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/90 transition-colors p-1"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
