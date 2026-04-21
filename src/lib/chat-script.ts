import type { WizardSegmentKey } from './wizard-segment-config';

export type ChatStepKey =
  | 'title'
  | 'message'
  | 'specialDate'
  | 'gallery'
  | 'timeline'
  | 'intro'
  | 'music'
  | 'voice'
  | 'background'
  | 'extras'
  | 'plan'
  | 'payment';

export const CHAT_STEP_ORDER: ChatStepKey[] = [
  'title',
  'message',
  'specialDate',
  'gallery',
  'timeline',
  'intro',
  'music',
  'voice',
  'background',
  'extras',
  'plan',
  'payment',
];

type SegmentLines = Record<ChatStepKey, string>;

// Tom: claro, direto, guiando o cliente passo a passo.
// Frase curta, português correto, sem gírias. Uma instrução por step.
const NAMORADE_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da página?',
  message: 'Agora escreva a mensagem principal pra ele(a).',
  specialDate: 'Qual é a data especial de vocês?',
  gallery: 'Selecione as fotos que você quer exibir.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre vocês dois.',
  voice: 'Grave um áudio pra ele(a) ouvir.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const MAE_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da homenagem?',
  message: 'Escreva a mensagem que você quer dizer pra ela.',
  specialDate: 'Qual é a data especial entre vocês duas?',
  gallery: 'Selecione as fotos que você quer incluir.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre sua mãe.',
  voice: 'Grave um áudio pra ela ouvir.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const ESPOUSE_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da página?',
  message: 'Agora escreva a mensagem pra seu(sua) esposo(a).',
  specialDate: 'Qual é a data especial de vocês?',
  gallery: 'Selecione as fotos que você quer exibir.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre vocês dois.',
  voice: 'Grave um áudio pra surpreender.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const AMIGE_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da homenagem?',
  message: 'Escreva a mensagem pra essa pessoa especial.',
  specialDate: 'Quando vocês se conheceram?',
  gallery: 'Selecione as fotos mais marcantes de vocês.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre vocês.',
  voice: 'Grave um áudio pra surpreender.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const PAI_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da homenagem?',
  message: 'Escreva a mensagem que você quer dizer pra ele.',
  specialDate: 'Qual é a data especial entre vocês dois?',
  gallery: 'Selecione as fotos que você quer incluir.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre seu pai.',
  voice: 'Grave um áudio pra ele ouvir.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const AVO_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da homenagem?',
  message: 'Escreva a mensagem que você quer dizer pra ele(a).',
  specialDate: 'Tem uma data especial entre vocês?',
  gallery: 'Selecione as fotos que você quer incluir.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre ele(a).',
  voice: 'Grave um áudio pra ele(a) ouvir.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

const FILHO_LINES: SegmentLines = {
  title: 'Primeiro, qual vai ser o título da homenagem?',
  message: 'Escreva a mensagem que você quer dizer pra ele(a).',
  specialDate: 'Qual é uma data especial entre vocês?',
  gallery: 'Selecione as fotos mais marcantes.',
  timeline: 'Monte a linha do tempo de vocês.',
  intro: 'Escolha uma animação de abertura pra página.',
  music: 'Adicione uma música que lembre vocês.',
  voice: 'Grave um áudio pra ele(a) ouvir.',
  background: 'Escolha o fundo que mais combina.',
  extras: 'Ative os extras interativos.',
  plan: 'Agora escolha o plano ideal pra você.',
  payment: 'Tudo pronto! Finalize o pagamento abaixo.',
};

export const CUPID_LINES: Record<WizardSegmentKey, SegmentLines> = {
  namorade: NAMORADE_LINES,
  mae: MAE_LINES,
  espouse: ESPOUSE_LINES,
  amige: AMIGE_LINES,
  pai: PAI_LINES,
  avo: AVO_LINES,
  filho: FILHO_LINES,
};

export function getCupidLine(segment: WizardSegmentKey | undefined, step: ChatStepKey): string {
  const seg = segment && CUPID_LINES[segment] ? segment : 'namorade';
  return CUPID_LINES[seg][step] ?? CUPID_LINES.namorade[step];
}
