/**
 * Normaliza phone pra E.164 brasileiro (12-13 díg começando com 55).
 * Aceita raws comuns: "11 9 8888-7777", "+55 11 98888-7777", "5511988887777".
 *
 * Retorna sem o "+" — Z-API quer só os dígitos no payload (`phone: "5511..."`).
 */
export function formatPhoneE164(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return null;

  // Remove zero internacional inicial (alguns formulários colocam "0...")
  if (digits.startsWith('0') && !digits.startsWith('00')) digits = digits.slice(1);

  // Já vem com 55 (12-13 díg)? Mantém.
  // 11 díg = celular BR sem DDI → prepend 55.
  // 10 díg = fixo BR sem DDI → prepend 55 (raro, mas suporta).
  if (digits.length === 11 || digits.length === 10) {
    digits = '55' + digits;
  }

  // Range válido E.164 BR: 12 (55 + 10) ou 13 (55 + 11) díg.
  if (digits.length < 12 || digits.length > 13) return null;
  if (!digits.startsWith('55')) return null;

  return digits;
}

/**
 * Celular BR válido = 13 díg total (55 + 2 DDD + 9 + 8 número).
 * Z-API só envia pra celular (mensagens em fixo são ignoradas), então
 * usamos isso pra filtrar antes de tentar mandar.
 */
export function isValidBrazilianMobile(rawPhone: string | null | undefined): boolean {
  const formatted = formatPhoneE164(rawPhone);
  if (!formatted) return false;
  if (formatted.length !== 13) return false;
  // Celular BR começa com 9 após o DDD (posição 4 = "55XX9...")
  return formatted.charAt(4) === '9';
}
