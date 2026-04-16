export const PRICES = {
  basico: 19.90,
  avancado: 24.90,
  introLove: 5.90,
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

export function computeTotalBRL(input: PricingInput): number {
  const base = input.plan === 'avancado' ? PRICES.avancado : PRICES.basico;
  const qr = input.qrCodeDesign && input.qrCodeDesign !== 'classic' ? PRICES.qrCustom : 0;
  const wordGame =
    input.enableWordGame && Array.isArray(input.wordGameQuestions) && input.wordGameQuestions.length > 0
      ? PRICES.wordGame
      : 0;
  const intro = (input.introType === 'love' || input.introType === 'poema') ? PRICES.introLove : 0;
  const voice = input.audioRecording?.url ? PRICES.voice : 0;
  const rawDiscount = Number(input.discountAmount ?? 0);
  const discount = isFinite(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;
  const total = base + qr + wordGame + intro + voice - discount;
  return Math.max(1, Number(total.toFixed(2)));
}
