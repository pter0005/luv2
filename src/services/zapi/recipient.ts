/**
 * Categorização de destinatário pelo título da página.
 * Espelha src/lib/external-api-helpers.ts:categorizeRecipient mas com
 * outputs específicos pra mensagens (label em PT-BR pra usar no copy).
 *
 * Não importa do helper original pra manter loose coupling — mensagens
 * são uma feature isolada e podem evoluir o copy sem mexer nas analytics.
 */

const RECIPIENT_PATTERNS: Record<string, RegExp> = {
  mae: /\b(m[aã]e|m[aã]ezinha|mam[aã]e)\b/i,
  pai: /\b(pai|paizinho|pap[aá]i)\b/i,
  esposa: /\b(esposa|mulher)\b/i,
  esposo: /\b(esposo|marido)\b/i,
  namorada: /\bnamorada\b/i,
  namorado: /\bnamorado\b/i,
  filho_filha: /\b(filh[oa])\b/i,
  irmao_irma: /\b(irm[aã]o|irm[aã])\b/i,
  avo: /\b(av[oó]|vov[oó])\b/i,
  amigo_amiga: /\b(amig[ao]|melhor amig[ao]|bff|best)\b/i,
};

export type RecipientCategory =
  | 'mae' | 'pai' | 'esposa' | 'esposo' | 'namorada' | 'namorado'
  | 'filho_filha' | 'irmao_irma' | 'avo' | 'amigo_amiga' | 'outro';

export function categorizeRecipient(title: string | null | undefined): RecipientCategory {
  if (!title || typeof title !== 'string') return 'outro';
  const t = title.toLowerCase();
  for (const [cat, pat] of Object.entries(RECIPIENT_PATTERNS)) {
    if (pat.test(t)) return cat as RecipientCategory;
  }
  return 'outro';
}

const RECIPIENT_LABELS: Record<RecipientCategory, string> = {
  mae: 'sua mãe',
  pai: 'seu pai',
  esposa: 'sua esposa',
  esposo: 'seu esposo',
  namorada: 'sua namorada',
  namorado: 'seu namorado',
  filho_filha: 'sua família',
  irmao_irma: 'sua família',
  avo: 'sua família',
  amigo_amiga: 'essa pessoa especial',
  outro: 'essa pessoa',
};

export function recipientLabel(category: RecipientCategory): string {
  return RECIPIENT_LABELS[category];
}
