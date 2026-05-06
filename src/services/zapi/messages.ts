import { RecipientCategory, recipientLabel } from './recipient';

const FOOTER = '\n\n—\nMyCupid';

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

export function buildOrderConfirmation(params: {
  firstName: string;
  recipient: RecipientCategory;
  pageUrl: string;
}): string {
  const name = safe(params.firstName) || 'amor';
  const recipientStr = recipientLabel(params.recipient);
  return `Pagamento confirmado, ${name}! 🎉

Sua página pra ${recipientStr} já tá no ar:

👉 ${params.pageUrl}

Compartilha e prepara — a reação vai ser épica ✨

Qualquer coisa, é só responder aqui!${FOOTER}`;
}

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
    return `Oi ${name}, vi aqui que você gerou o PIX da página da sua mãe mas o pagamento não chegou ainda 👀

Pra te ajudar a finalizar, já liberei R$ 10 OFF:

🎁 Cupom CUPOM10 (já aplicado)
⏰ Faltam só ${params.daysToMothersDay} dias pro Dia das Mães
✅ Entrega na hora — sua mãe vê hoje

👉 ${params.checkoutUrl}

A reação dela vai valer cada centavo 💜${FOOTER}`;
  }

  return `Oi ${name}, percebi que você começou a página pra ${recipientStr} mas o pagamento ficou pra trás 👀

Já liberei R$ 10 OFF pra te ajudar a finalizar:

🎁 Cupom CUPOM10 (já aplicado)
✅ Em menos tempo do que demora pedir um café

👉 ${params.checkoutUrl}

Qualquer dúvida, é só responder aqui que eu te ajudo na hora 🙌${FOOTER}`;
}

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
