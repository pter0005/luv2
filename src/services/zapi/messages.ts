import { RecipientCategory, recipientLabel } from './recipient';

const FOOTER = '\n\n—\nMyCupid';

// Teaser do cupom MAIS40 (50% OFF, 2 usos por email/phone) — anexado ao final
// de toda confirmação. Brinde direto, sem condicional ("vc merece, manda pra
// mais alguém"). Drive a SEGUNDA venda — produto naturalmente é one-shot.
const COUPON_TEASER =
  '\n\n🎁 Pequeno mimo: MAIS40 vale 50% OFF se quiser fazer outra página. Até 2 usos.\n👉 mycupid.com.br/desconto/MAIS40';

/**
 * Sanitiza string que vai pro WhatsApp — evita usuário injetar markdown
 * malicioso (pouca chance de exploit, mas garante UX limpa). Trunca pra
 * tamanho razoável.
 */
function safe(s: string | null | undefined, max = 30): string {
  if (!s) return '';
  return String(s)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[*_~`]/g, '')   // chars de markdown WhatsApp
    .trim()
    .slice(0, max);
}

/**
 * Limpa nome pra uso nas mensagens. Retorna string vazia quando o nome é
 * inválido OU é um fallback genérico ("amor", "cliente", etc) — assim a
 * mensagem decide se omite o "Olá <nome>" inteiro em vez de mandar
 * "Olá amor!" que soa estranho pra um cliente real.
 */
function cleanName(s: string | null | undefined): string {
  const cleaned = safe(s);
  if (!cleaned) return '';
  if (/^(amor|cliente|usuario|usuário|user)$/i.test(cleaned)) return '';
  return cleaned;
}

/**
 * Confirmação de pagamento — Cupido como protagonista. Nome do cliente é
 * opcional (se não tiver, omite o ", Nome" sem deixar a frase quebrada).
 */
export function buildOrderConfirmation(params: {
  firstName: string;
  recipient: RecipientCategory;
  pageUrl: string;
}): string {
  const name = cleanName(params.firstName);
  const greet = name ? `, ${name}` : '';
  const url = params.pageUrl;
  let body: string;

  switch (params.recipient) {
    case 'mae':
      body = `Prontinho${greet}! 💜

O Cupido criou a página pra sua mãe:
👉 ${url}

Manda quando achar que é a hora. Pode preparar o lenço, vai ser bonito.`;
      break;

    case 'pai':
      body = `Prontinho${greet}!

O Cupido criou a página pro seu pai:
👉 ${url}

Manda quando achar legal. Vai surpreender ele 😊`;
      break;

    case 'namorada':
      body = `Prontinho${greet}! 🌹

O Cupido criou a página da sua namorada:
👉 ${url}

Faz a surpresa quando achar a hora certa. Ela vai amar.`;
      break;

    case 'namorado':
      body = `Prontinho${greet}! 💜

O Cupido criou a página do seu namorado:
👉 ${url}

Manda pra ele quando achar bom. Vai gostar muito.`;
      break;

    case 'esposa':
      body = `Prontinho${greet}!

O Cupido criou a página pra sua esposa:
👉 ${url}

Vai surpreender demais 💜`;
      break;

    case 'esposo':
      body = `Prontinho${greet}!

O Cupido criou a página pro seu esposo:
👉 ${url}

Vai surpreender demais 💜`;
      break;

    case 'filho_filha':
      body = `Prontinho${greet}! 💜

O Cupido criou sua página:
👉 ${url}

Vai ficar guardado pra sempre. Aproveita o momento!`;
      break;

    case 'amigo_amiga':
      body = `Prontinho${greet}!

O Cupido criou a página pra essa pessoa especial:
👉 ${url}

Manda já, vai ser top. Quero saber a reação depois 😊`;
      break;

    case 'irmao_irma':
    case 'avo':
      body = `Prontinho${greet}!

O Cupido criou a página pra ${recipientLabel(params.recipient)}:
👉 ${url}

Vai gostar muito 💜`;
      break;

    default:
      body = `Prontinho${greet}!

O Cupido já criou sua página:
👉 ${url}

Faz a entrega quando achar bom. Vai ser massa 💜`;
  }

  return body + COUPON_TEASER + FOOTER;
}

/**
 * Recovery 5min — SOFT check-in. Cliente acabou de gerar PIX e não pagou.
 * Importante: explicar CONTEXTO (o que ele fez), não assumir que ele lembra.
 * Tom de ajuda, sem pressão de cupom.
 */
export function buildRecovery5min(params: {
  firstName: string;
  recipient: RecipientCategory;
  checkoutUrl: string;
  daysToMothersDay: number;
}): string {
  const name = cleanName(params.firstName);
  const greet = name ? `Oi ${name}! 👋` : 'Oi! 👋';
  const isMae = params.recipient === 'mae';
  const recipientStr = recipientLabel(params.recipient);

  if (isMae && params.daysToMothersDay > 0 && params.daysToMothersDay <= 14) {
    return `${greet}

Vi que você começou a fazer uma página pra sua mãe no MyCupid e gerou um PIX, mas o pagamento não chegou ainda.

Faltam só ${params.daysToMothersDay} dias pro Dia das Mães. Travou alguma coisa? Posso te ajudar?

Se quiser, é só responder aqui 💜${FOOTER}`;
  }

  return `${greet}

Vi que você começou a fazer uma página pra ${recipientStr} no MyCupid e gerou um PIX, mas o pagamento não chegou ainda.

Travou alguma coisa? Posso te ajudar?

Se quiser, é só responder aqui 💜${FOOTER}`;
}

/**
 * Recovery 1h (atual: 10min) — COM cupom CUPOM10 (R$10 OFF). Cliente foi
 * avisado no soft sem pressão; se ainda não pagou, oferece desconto.
 * Importante: explicar contexto antes de oferecer cupom.
 */
export function buildRecovery1h(params: {
  firstName: string;
  recipient: RecipientCategory;
  checkoutUrl: string;
  daysToMothersDay: number;
}): string {
  const name = cleanName(params.firstName);
  const greet = name ? `Oi ${name}! 👋` : 'Oi! 👋';
  const isMae = params.recipient === 'mae';
  const recipientStr = recipientLabel(params.recipient);

  if (isMae && params.daysToMothersDay > 0 && params.daysToMothersDay <= 14) {
    return `${greet}

Vi que você começou a fazer uma página pra sua mãe no MyCupid e gerou um PIX, mas o pagamento não chegou ainda.

Faltam só ${params.daysToMothersDay} dias pro Dia das Mães. Pra te ajudar a finalizar a tempo, separei R$ 10 OFF:

🎁 Cupom CUPOM10 (já aplicado no link)
⏰ Vale só até amanhã essa hora
✅ Entrega na hora — sua mãe vê hoje

👉 ${params.checkoutUrl}

Não deixa essa surpresa passar batido 💜${FOOTER}`;
  }

  return `${greet}

Vi que você começou a fazer uma página pra ${recipientStr} no MyCupid e gerou um PIX, mas o pagamento não chegou ainda.

Pra te ajudar a finalizar, separei R$ 10 OFF:

🎁 Cupom CUPOM10 (já aplicado no link)
⏰ Vale só até amanhã
💜 Pronto em menos de 5 minutos

👉 ${params.checkoutUrl}

Qualquer dúvida, é só responder aqui!${FOOTER}`;
}

/**
 * Recovery 24h — função mantida pra histórico, mas atualmente NÃO está no
 * STAGES do cron (cadência reduzida pra 5min + 1h apenas, decisão do dono).
 */
export function buildRecovery24h(params: {
  firstName: string;
  recipient: RecipientCategory;
  checkoutUrl: string;
}): string {
  const name = cleanName(params.firstName);
  const recipientStr = recipientLabel(params.recipient);
  const opener = name ? `Oi ${name}, último aviso ⏰` : 'Último aviso ⏰';
  return `${opener}

A página pra ${recipientStr} ainda tá esperando você finalizar.

Se mudou de ideia, tudo bem. Mas se ainda quer fazer essa surpresa acontecer, esse é o momento:

🎁 R$ 10 OFF: CUPOM10 (já aplicado)
✅ Entrega na hora
💜 5 minutos

👉 ${params.checkoutUrl}

Esse é o último lembrete, prometo 🙏${FOOTER}`;
}

export function buildOptOutConfirmation(): string {
  return `Ok, entendido. Parei os lembretes 👍

Se mudar de ideia, é só voltar lá no site que tá tudo salvo.${FOOTER}`;
}
