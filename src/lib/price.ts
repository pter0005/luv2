import type { Locale, Market } from '@/i18n/config';
import { marketFromLocale } from '@/i18n/config';

/**
 * Preços BRL — mercado brasileiro (Mercado Pago).
 */
export const PRICES = {
  basico: 19.90,
  avancado: 24.90,
  vip: 34.99,          // bundle flat — TUDO incluído + edição ilimitada
  introLove: 5.90,
  introPoema: 6.90,
  voice: 2.90,
  wordGame: 2.00,
  qrCustom: 3.90,
} as const;

/**
 * Preços USD — mercado americano (Stripe).
 * Pricing internacional: piso $9.99 (limiar de credibilidade do mercado US).
 * Add-ons proporcionalmente em USD.
 */
export const PRICES_USD = {
  basico: 9.99,
  avancado: 14.99,
  vip: 19.99,
  introLove: 2.99,
  introPoema: 3.49,
  voice: 1.99,
  wordGame: 1.49,
  qrCustom: 1.99,
} as const;

/**
 * Preços EUR — Portugal (Stripe).
 * Pricing PT: paridade de poder de compra ~70% US, mas ainda confortavelmente
 * abaixo de €15/€20 (limiares psicológicos europeus).
 */
export const PRICES_EUR = {
  basico: 8.99,
  avancado: 12.99,
  vip: 17.99,
  introLove: 2.49,
  introPoema: 2.99,
  voice: 1.49,
  wordGame: 1.29,
  qrCustom: 1.79,
} as const;

export type PricingInput = {
  plan?: string | null;
  qrCodeDesign?: string | null;
  enableWordGame?: boolean | null;
  wordGameQuestions?: unknown[] | null;
  introType?: string | null;
  audioRecording?: { url?: string | null } | null;
  discountAmount?: number | null;
};

type PriceTable = typeof PRICES;

function computeTotalWith(
  input: PricingInput,
  prices: PriceTable,
): number {
  // VIP é flat — preço fechado com TUDO incluído, add-ons não somam.
  // Ancoragem psicológica: mostra "economia de $XX" no checkout.
  if (input.plan === 'vip') {
    const rawDiscount = Number(input.discountAmount ?? 0);
    const discount = isFinite(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;
    return Math.max(1, Number((prices.vip - discount).toFixed(2)));
  }

  const base = input.plan === 'avancado' ? prices.avancado : prices.basico;
  const qr = input.qrCodeDesign && input.qrCodeDesign !== 'classic' ? prices.qrCustom : 0;
  const wordGame =
    input.enableWordGame && Array.isArray(input.wordGameQuestions) && input.wordGameQuestions.length > 0
      ? prices.wordGame
      : 0;
  const intro = input.introType === 'love' ? prices.introLove : input.introType === 'poema' ? prices.introPoema : 0;
  const voice = input.audioRecording?.url ? prices.voice : 0;
  const rawDiscount = Number(input.discountAmount ?? 0);
  const discount = isFinite(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;
  const total = base + qr + wordGame + intro + voice - discount;
  return Math.max(1, Number(total.toFixed(2)));
}

export function computeTotalBRL(input: PricingInput): number {
  return computeTotalWith(input, PRICES);
}

export function computeTotalUSD(input: PricingInput): number {
  return computeTotalWith(input, PRICES_USD as unknown as PriceTable);
}

export function computeTotalEUR(input: PricingInput): number {
  return computeTotalWith(input, PRICES_EUR as unknown as PriceTable);
}

/**
 * Total na moeda canônica do market.
 * BR → BRL, PT → EUR, US → USD.
 */
export function computeTotalForMarket(input: PricingInput, market: Market): number {
  if (market === 'PT') return computeTotalEUR(input);
  if (market === 'US') return computeTotalUSD(input);
  return computeTotalBRL(input);
}

/**
 * Retorna a tabela de preços do market.
 */
export function getPricesForMarket(market: Market): PriceTable {
  if (market === 'PT') return PRICES_EUR as unknown as PriceTable;
  if (market === 'US') return PRICES_USD as unknown as PriceTable;
  return PRICES;
}

/**
 * Total na moeda canônica do locale (backward compat).
 * Para PT (EUR), use computeTotalForMarket('PT').
 */
export function computeTotal(input: PricingInput, locale: Locale): number {
  return computeTotalForMarket(input, marketFromLocale(locale));
}

/**
 * Retorna o objeto de preços correto por locale (backward compat).
 */
export function getPrices(locale: Locale): PriceTable {
  return getPricesForMarket(marketFromLocale(locale));
}

/**
 * Economia exibida no card VIP — valor fixo pra ancoragem visual consistente.
 * Não é uma função dos add-ons porque o objetivo é marketing/percepção de
 * valor, não cálculo aritmético do bundle.
 */
export function computeVipSavings(_locale: Locale): number {
  return 15;
}

export function computeVipSavingsForMarket(market: Market): number {
  if (market === 'PT') return 7;
  if (market === 'US') return 10;
  return 15;
}
