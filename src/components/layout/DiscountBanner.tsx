
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIMER_KEY = 'mycupid_offer_deadline';
const INITIAL_SECONDS = 1 * 3600 + 47 * 60; // 1h 47min

function getDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + INITIAL_SECONDS * 1000;
  const stored = localStorage.getItem(TIMER_KEY);
  if (stored) return parseInt(stored);
  const deadline = Date.now() + INITIAL_SECONDS * 1000;
  localStorage.setItem(TIMER_KEY, String(deadline));
  return deadline;
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

export default function DiscountBanner() {
  const [visible, setVisible] = useState(false);
  const { formatted, expired } = useBannerTimer();

  useEffect(() => {
    const BANNER_ACTIVE = true;
    if (!BANNER_ACTIVE) return;
    const dismissed = sessionStorage.getItem('discount-banner-dismissed');
    if (!dismissed) setVisible(true);
  }, []);

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
            ) : (
              <p className="text-sm text-white leading-none">
                🔥 <span className="font-black">312 páginas criadas essa semana</span>
                <span className="mx-2 opacity-40">—</span>
                <span className="text-pink-200 font-semibold">Oferta especial por mais </span>
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
