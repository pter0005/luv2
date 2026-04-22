'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function ScarcityBanner() {
  const [spots, setSpots] = useState(0);
  const locale = useLocale();
  const isEN = locale === 'en';

  useEffect(() => {
    // Gera um número entre 3-9 baseado na hora do dia (parece real, muda a cada ~2h)
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const hourBlock = Math.floor(now.getHours() / 2);
    const base = ((seed * 7 + hourBlock * 13) % 7) + 3; // 3-9
    setSpots(base);
  }, []);

  useEffect(() => {
    // Decrementa lentamente a cada 2-5 min pra parecer real
    const interval = setInterval(() => {
      setSpots(prev => {
        if (prev <= 2) return prev; // nunca vai pra 0
        // 30% de chance de decrementar
        return Math.random() < 0.3 ? prev - 1 : prev;
      });
    }, 150_000); // a cada 2.5 min
    return () => clearInterval(interval);
  }, []);

  if (!spots) return null;

  return (
    <div className="w-full py-2 px-4 text-center"
      style={{
        background: 'linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%)',
      }}>
      <p className="text-xs font-bold text-white flex items-center justify-center gap-2">
        <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        <span>
          {isEN
            ? <>Only <span className="text-yellow-300 tabular-nums">{spots}</span> pages left at promo price today</>
            : <>Restam <span className="text-yellow-300 tabular-nums">{spots}</span> páginas com preço promocional hoje</>}
        </span>
        <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
      </p>
    </div>
  );
}
