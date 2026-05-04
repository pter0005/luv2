'use client';

import { useEffect, useState } from 'react';
import { defaultMarket, isMarket, type Market } from './config';

/**
 * Hook client-side pra ler o market resolvido pelo middleware.
 *
 * Lê do cookie MARKET (setado em toda response do middleware) — primeira
 * leitura é defaultMarket pra evitar mismatch SSR/CSR; após mount, sincroniza
 * com o cookie real. Diferente de Locale (que tem useLocale do next-intl
 * com SSR proper), Market é dimensão custom — daí o pattern de hidratação.
 */
export function useMarket(): Market {
  const [market, setMarket] = useState<Market>(defaultMarket);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)MARKET=([^;]+)/);
    const value = cookieMatch?.[1];
    if (isMarket(value)) setMarket(value);
  }, []);

  return market;
}
