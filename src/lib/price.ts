import type { Locale } from '@/i18n/config';

/**
 * Preços BRL — mercado brasileiro (Mercado Pago).
 */
export const PRICES = {
  basico: 19.90,
  avancado: 24.90,
  vip: 29.90,          // bundle flat — TUDO incluído
  introLove: 5.90,
  introPoema: 6.90,
  voice: 2.90,
  wordGame: 2.00,
  qrCustom: 3.90,
} as const;

/**
 * Preços USD — mercado americano (Stripe).
 */
export const PRICES_USD = {
  basico: 19.90,
  avancado: 24.90,
  vip: 29.90,
  introLove: 5.90,
  introPoema: 6.90,
  voice: 2.90,
  wordGame: 2.00,
  qrCustom: 3.90,
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

function computeTotalWith(
  input: PricingInput,
  prices: typeof PRICES | typeof PRICES_USD,
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
  return computeTotalWith(input, PRICES_USD);
}

/**
 * Total na moeda canônica do locale.
 * `pt` → BRL (Mercado Pago), `en` → USD (Stripe).
 */
export function computeTotal(input: PricingInput, locale: Locale): number {
  return locale === 'en' ? computeTotalUSD(input) : computeTotalBRL(input);
}

/**
 * Retorna o objeto de preços correto por locale.
 */
export function getPrices(locale: Locale): typeof PRICES {
  return locale === 'en' ? PRICES_USD : PRICES;
}

/**
 * Calcula quanto a pessoa "economiza" escolhendo VIP vs comprar tudo separado.
 * Usado no card VIP pra mostrar "Save $X" — ancoragem visual forte.
 */
export function computeVipSavings(locale: Locale): number {
  const p = getPrices(locale);
  // Advanced + todos os add-ons principais = total "teórico" se comprasse separado
  const fullSeparate = p.avancado + p.introPoema + p.voice + p.wordGame + p.qrCustom;
  return Math.max(0, Number((fullSeparate - p.vip).toFixed(2)));
}
