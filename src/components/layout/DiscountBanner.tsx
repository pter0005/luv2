"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiscountBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostra só no Dia das Mulheres (6–9 de março)
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const isDiasMulheres = m === 3 && d >= 6 && d <= 9;

    if (!isDiasMulheres) return;

    // Respeita se o usuário fechou
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
            background: 'linear-gradient(90deg, #3b0764 0%, #6b21a8 40%, #7c3aed 60%, #4c1d95 100%)',
          }}
        >
          {/* shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
              animation: 'shimmer 3s infinite',
              backgroundSize: '200% 100%',
            }}
          />
          <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>

          <div className="relative flex items-center justify-center gap-2 py-2.5 px-10 text-center">
            <span className="text-base leading-none">🌸</span>
            <p className="text-sm text-white leading-none">
              <span className="font-black">Dia das Mulheres</span>
              <span className="mx-2 opacity-40">—</span>
              <span className="text-pink-200 font-semibold">preços com 50% de desconto</span>
              <span className="hidden sm:inline opacity-40 mx-2">·</span>
              <span className="hidden sm:inline text-white/50 text-xs">só hoje</span>
            </p>
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
