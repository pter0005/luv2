'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useMarket } from '@/i18n/use-market';
import { isMarket, type Market } from '@/i18n/config';

const FLAGS: Record<Market, { emoji: string; label: string; currency: string }> = {
  BR: { emoji: '🇧🇷', label: 'Brasil', currency: 'R$' },
  PT: { emoji: '🇵🇹', label: 'Portugal', currency: '€' },
  US: { emoji: '🇺🇸', label: 'United States', currency: '$' },
};

/**
 * Escape hatch manual: usuário com VPN ou viajando força market diferente
 * do que geo-IP detectou. Seta cookie MARKET_OVERRIDE — middleware respeita
 * em toda request subsequente.
 *
 * Não aparece em mycupid.com.br (BR puro) — só faz sentido em mycupid.net,
 * onde geo decide entre US e PT e o usuário pode querer trocar.
 */
export default function MarketSwitcher() {
  const market = useMarket();
  const [open, setOpen] = useState(false);

  // Esconde no domínio BR — não é configurável (geo ignorado, host é a verdade).
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('mycupid.com.br')) {
    return null;
  }

  const select = (next: Market) => {
    if (!isMarket(next) || next === market) {
      setOpen(false);
      return;
    }
    document.cookie = `MARKET_OVERRIDE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.cookie = `MARKET=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  };

  const current = FLAGS[market];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition"
        aria-label="Change region"
      >
        <span className="text-base leading-none">{current.emoji}</span>
        <span className="hidden sm:inline tabular-nums">{current.currency}</span>
        <Globe className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 min-w-[180px] py-1.5">
            {(Object.keys(FLAGS) as Market[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => select(m)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                  m === market ? 'text-white bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg leading-none">{FLAGS[m].emoji}</span>
                <span className="flex-1 text-left">{FLAGS[m].label}</span>
                <span className="text-xs text-zinc-500 tabular-nums">{FLAGS[m].currency}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
