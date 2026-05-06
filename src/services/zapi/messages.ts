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
 * Confirmação de pagamento — variante por destinatário pra soar como pessoa
 * de verdade falando, não template corporativo.
 */
export function buildOrderConfirmation(params: {
  firstName: string;
  recipient: RecipientCategory;
  pageUrl: string;
}): string {
  const name = safe(params.firstName) || 'amor';
  const url = params.pageUrl;
  let body: string;

  switch (params.recipient) {
    case 'mae':
      body = `Eba ${name}, tá pronta!

A página pra sua mãe:
👉 ${url}

Manda quando achar que é a hora. Pode preparar o lenço, vai ser bonito.

Boa sorte 💜`;
      break;

    case 'pai':
      body = `Tá pronto, ${name}!

A página pra seu pai:
👉 ${url}

Manda quando achar legal. Vai surpreender ele 😊`;
      break;

    case 'namorada':
      body = `Eba ${name}! 🌹

A página da sua namorada:
👉 ${url}

Faz a surpresa quando achar a hora certa. Ela vai amar.`;
      break;

    case 'namorado':
      body = `Eba ${name} 💜

A página do seu namorado:
👉 ${url}

Manda pra ele quando achar bom. Vai gostar muito.`;
      break;

    case 'esposa':
      body = `Tá pronta, ${name}!

A página pra sua esposa:
👉 ${url}

Vai surpreender demais. Boa sorte 💜`;
      break;

    case 'esposo':
      body = `Tá pronta, ${name}!

A página pro seu esposo:
👉 ${url}

Vai surpreender demais. Boa sorte 💜`;
      break;

    case 'filho_filha':
      body = `${name} 💜

A página pra sua família:
👉 ${url}

Vai ficar guardado pra sempre. Aproveita o momento!`;
      break;

    case 'amigo_amiga':
      body = `${name}!

A página pra essa pessoa especial tá pronta:
👉 ${url}

Manda já, vai ser top. Quero saber a reação depois 😊`;
      break;

    case 'irmao_irma':
    case 'avo':
      body = `Tá pronta, ${name}!

A página pra ${recipientLabel(params.recipient)}:
👉 ${url}

Vai gostar muito. Boa sorte com a surpresa 💜`;
      break;

    default:
      body = `Pronto, ${name}!

Sua página:
👉 ${url}

Faz a entrega quando achar bom. Vai ser massa 💜`;
  }

  return body + COUPON_TEASER + FOOTER;
}

/**
 * Recovery 5min — SOFT check-in. Cliente acabou de gerar PIX, talvez só
 * teve algum problema técnico. Tom de ajuda, sem pressão de cupom.
 */
export function buildRecovery5min(params: {
  firstName: string;
  recipient: RecipientCategory;
  checkoutUrl: string;
  daysToMothersDay: number;
}): string {
  const name = safe(params.firstName) || 'amor';
  const isMae = params.recipient === 'mae';
  const recipientStr = recipientLabel(params.recipient);

  if (isMae && params.daysToMothersDay > 0 && params.daysToMothersDay <= 14) {
    return `Oi ${name}, tudo bem?

Vi que vc tava fazendo a página pra sua mãe — faltam ${params.daysToMothersDay} dias pro Dia das Mães.

Travou alguma coisa? Posso te ajudar?

Se quiser, é só responder aqui 💜${FOOTER}`;
  }

  return `Oi ${name}, tudo bem?

Vi que vc começou a fazer a página pra ${recipientStr} mas o pagamento não chegou.

Travou alguma coisa? Posso te ajudar?

Se quiser, é só responder aqui 💜${FOOTER}`;
}

/**
 * Recovery 1h — agora COM cupom CUPOM10 (R$10 OFF). Cliente foi avisado no
 * 5min sem pressão; se ainda não pagou, oferece desconto pra fechar.
 */
export function buildRecovery1h(params: {
  firstName: string;
  recipient: RecipientCategory;
  checkoutUrl: string;
  daysToMothersDay: number;
}): string {
  const name = safe(params.firstName) || 'amor';
  const isMae = params.recipient === 'mae';
  const recipientStr = recipientLabel(params.recipient);

  if (isMae && params.daysToMothersDay > 0 && params.daysToMothersDay <= 14) {
    return `Oi ${name}, sua mãe ainda tá te esperando 💜

Sei que rolou alguma fricção. R$ 10 OFF garantido pra finalizar:

🎁 Cupom CUPOM10 (já aplicado)
⏰ Vale só até amanhã essa hora
✅ Entrega na hora — sua mãe vê hoje

👉 ${params.checkoutUrl}

Não deixa o Dia das Mães passar batido 💜${FOOTER}`;
  }

  return `Oi ${name}, R$ 10 OFF garantido pra finalizar 🎁

A página pra ${recipientStr} tá te esperando — vai surpreender ela demais.

🎁 Cupom CUPOM10 (já aplicado)
⏰ Vale só até amanhã
💜 Pronto em 5 minutos

👉 ${params.checkoutUrl}

Quem ama, surpreende.${FOOTER}`;
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
  const name = safe(params.firstName) || 'amor';
  const recipientStr = recipientLabel(params.recipient);
  return `Oi ${name}, último aviso ⏰

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
