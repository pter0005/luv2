/**
 * Helpers usados pelos endpoints /api/external/*.
 *
 * Centraliza: detecção de market, parse de add-ons, classificação NLP de
 * destinatário (mãe/namorada/etc), parse de UA pra device/OS/browser, e
 * mascaramento de PII. Mudança de regra em UM lugar — todos endpoints
 * pegam de uma vez.
 */

const FX_TO_BRL = { BRL: 1, EUR: 5.8, USD: 5.1 } as const;
export type Currency = keyof typeof FX_TO_BRL;
export type Market = 'BR' | 'PT' | 'US';

/**
 * Detecta market a partir do doc do lovepage/intent. Tenta:
 *   1. Campo canônico `market` (persistido desde i18n feat)
 *   2. `currency` ou `locale` legado
 *   3. paymentId não-numérico → US legado (Stripe session)
 *   4. fallback BR
 */
export function resolveMarket(d: any): Market {
  if (d?.market === 'BR' || d?.market === 'PT' || d?.market === 'US') return d.market;
  if (d?.currency === 'EUR') return 'PT';
  if (d?.currency === 'USD' || d?.locale === 'en') return 'US';
  if (d?.currency === 'BRL' || d?.locale === 'pt') return 'BR';
  if (d?.paymentId && isNaN(Number(d.paymentId))) return 'US';
  return 'BR';
}

export function currencyOfMarket(m: Market): Currency {
  return m === 'PT' ? 'EUR' : m === 'US' ? 'USD' : 'BRL';
}

export function toBRL(value: number, currency: Currency): number {
  return value * FX_TO_BRL[currency];
}

/**
 * Preço base por plano e market quando paidAmount não está disponível.
 */
const BASE_PRICES: Record<Market, Record<string, number>> = {
  BR: { vip: 34.99, avancado: 24.90, basico: 19.90 },
  PT: { vip: 17.99, avancado: 12.99, basico: 8.99 },
  US: { vip: 19.99, avancado: 14.99, basico: 9.99 },
};

export function basePriceFor(market: Market, plan: string): number {
  const m = BASE_PRICES[market];
  return m[plan] ?? m['basico'];
}

export function resolveAmount(d: any, market: Market): number {
  const paid = Number(d?.paidAmount);
  if (isFinite(paid) && paid > 0) return paid;
  return basePriceFor(market, (d?.plan as string) || 'basico');
}

/**
 * Add-ons aceitos por essa página. Reflete /admin/page.tsx:170-175.
 * Cada add-on é um upsell que o cliente escolheu durante o wizard.
 */
export type AddOnsAccepted = {
  intro: 'love' | 'poema' | null;
  voice: boolean;
  wordGame: boolean;
  customQR: boolean;
  count: number;
};

export function parseAddOns(d: any): AddOnsAccepted {
  const intro = d?.introType === 'love' ? 'love' : d?.introType === 'poema' ? 'poema' : null;
  const voice = !!d?.audioRecording?.url;
  const wordGame = !!d?.enableWordGame && Array.isArray(d?.wordGameQuestions) && d.wordGameQuestions.length > 0;
  const customQR = !!d?.qrCodeDesign && d.qrCodeDesign !== 'classic';
  const count = (intro ? 1 : 0) + (voice ? 1 : 0) + (wordGame ? 1 : 0) + (customQR ? 1 : 0);
  return { intro, voice, wordGame, customQR, count };
}

/**
 * Classifica destinatário via keywords no título. Cada categoria tem peso
 * (mais palavras conferindo = match mais forte). Empate volta pra 'outro'.
 */
const RECIPIENT_KEYWORDS: Record<string, RegExp[]> = {
  mae: [/\bm[aã]e\b/i, /\bmamãe\b/i, /\bmaezinha\b/i, /\bmother\b/i, /\bmom\b/i],
  pai: [/\bpai\b/i, /\bpapai\b/i, /\bpaezinho\b/i, /\bfather\b/i, /\bdad\b/i],
  namorada: [/\bnamorada\b/i, /\bgirlfriend\b/i],
  namorado: [/\bnamorado\b/i, /\bboyfriend\b/i],
  esposa: [/\besposa\b/i, /\bmulher\b/i, /\bwife\b/i],
  esposo: [/\besposo\b/i, /\bmarido\b/i, /\bhusband\b/i],
  amigo_amiga: [/\bamigo\b/i, /\bamiga\b/i, /\bbest\s?friend\b/i, /\bfriend\b/i, /\bbff\b/i],
  filho_filha: [/\bfilho\b/i, /\bfilha\b/i, /\bson\b/i, /\bdaughter\b/i],
  irmao_irma: [/\birm[ãa]o\b/i, /\birm[ãa]\b/i, /\bbrother\b/i, /\bsister\b/i],
  avo: [/\bav[oô]\b/i, /\bvov[oô]\b/i, /\bgrand(ma|pa|mother|father)\b/i],
};

export type RecipientCategory =
  | 'mae' | 'pai' | 'namorada' | 'namorado' | 'esposa' | 'esposo'
  | 'amigo_amiga' | 'filho_filha' | 'irmao_irma' | 'avo' | 'outro';

export function categorizeRecipient(title: string | null | undefined): RecipientCategory {
  if (!title || typeof title !== 'string') return 'outro';
  const t = title.toLowerCase();

  let best: { cat: RecipientCategory; score: number } = { cat: 'outro', score: 0 };
  for (const [cat, patterns] of Object.entries(RECIPIENT_KEYWORDS)) {
    let score = 0;
    for (const p of patterns) if (p.test(t)) score++;
    if (score > best.score) best = { cat: cat as RecipientCategory, score };
  }
  return best.cat;
}

/**
 * Parse simples de userAgent pra device/OS/browser.
 * Regex em ordem (mais específica primeiro). Não é Bowser/UAParser-grade,
 * mas resolve 95% dos casos com zero deps.
 */
export type ParsedUA = {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
  os: string;
  browser: string;
};

export function parseUA(ua: string | null | undefined): ParsedUA {
  if (!ua) return { deviceType: 'unknown', os: 'unknown', browser: 'unknown' };
  const s = ua.toLowerCase();

  // Bots
  if (/bot|crawler|spider|slurp|googlebot|bingbot|facebot/i.test(s)) {
    return { deviceType: 'bot', os: 'unknown', browser: 'bot' };
  }

  // Device
  let deviceType: ParsedUA['deviceType'] = 'desktop';
  if (/ipad|tablet|kindle/i.test(s)) deviceType = 'tablet';
  else if (/iphone|android|mobile|phone|ipod/i.test(s)) deviceType = 'mobile';

  // OS
  let os = 'unknown';
  if (/iphone|ipad|ipod/i.test(s)) os = 'iOS';
  else if (/android/i.test(s)) os = 'Android';
  else if (/windows/i.test(s)) os = 'Windows';
  else if (/mac os|macintosh/i.test(s)) os = 'macOS';
  else if (/linux/i.test(s)) os = 'Linux';

  // Browser
  let browser = 'unknown';
  if (/edg\//i.test(s)) browser = 'Edge';
  else if (/chrome/i.test(s) && !/edg/i.test(s)) browser = 'Chrome';
  else if (/firefox/i.test(s)) browser = 'Firefox';
  else if (/safari/i.test(s) && !/chrome/i.test(s)) browser = 'Safari';
  else if (/opr\/|opera/i.test(s)) browser = 'Opera';

  return { deviceType, os, browser };
}

/**
 * Date helpers em America/Sao_Paulo (BRT, UTC-3 sem DST).
 */
export function dateKeyBR(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '-');
}

/**
 * Hour-of-day em BRT (0-23). Usado no /hourly.
 */
export function hourBR(date: Date): number {
  // Trunca pra hora em BRT (UTC-3 sem DST)
  const utcHours = date.getUTCHours();
  return ((utcHours - 3) + 24) % 24;
}

/**
 * Dia da semana em BRT. 0=Domingo .. 6=Sábado.
 */
export function dayOfWeekBR(date: Date): number {
  const utcMs = date.getTime();
  const brMs = utcMs - 3 * 60 * 60 * 1000;
  return new Date(brMs).getUTCDay();
}

export const DOW_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DOW_NAMES_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `**@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length < 4) return '***';
  return `***${d.slice(-4)}`;
}

export const FX = FX_TO_BRL;
