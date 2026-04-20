import type { WizardSegmentKey } from './wizard-segment-config';

export type ChatStepKey =
  | 'recipient'
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
  'recipient',
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

// Falas curtas, tom de amigo. Sem "oi! ✨", sem exagero, sem emoji em todo lugar.
const NAMORADE_LINES: SegmentLines = {
  recipient: 'pra quem é essa surpresa?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer?',
  specialDate: 'quando começou tudo?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música de vocês?',
  voice: 'grava um áudio pra ela(e)?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const MAE_LINES: SegmentLines = {
  recipient: 'pra quem é essa homenagem?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer pra ela?',
  specialDate: 'tem uma data especial?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'alguma música que lembra ela?',
  voice: 'grava um áudio pra ela?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const ESPOUSE_LINES: SegmentLines = {
  recipient: 'pra quem é essa surpresa?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer?',
  specialDate: 'quando começou tudo?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música de vocês?',
  voice: 'grava um áudio pra ela(e)?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const AMIGE_LINES: SegmentLines = {
  recipient: 'pra quem é essa homenagem?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer?',
  specialDate: 'quando se conheceram?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música de vocês?',
  voice: 'grava um áudio pra essa pessoa?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const PAI_LINES: SegmentLines = {
  recipient: 'pra quem é essa homenagem?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer pra ele?',
  specialDate: 'tem uma data especial?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'alguma música que lembra ele?',
  voice: 'grava um áudio pra ele?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const AVO_LINES: SegmentLines = {
  recipient: 'pra quem é essa homenagem?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer?',
  specialDate: 'tem uma data especial?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'alguma música que lembra?',
  voice: 'grava um áudio pra ele(a)?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
};

const FILHO_LINES: SegmentLines = {
  recipient: 'pra quem é essa surpresa?',
  title: 'como vai chamar ela?',
  message: 'o que você quer dizer?',
  specialDate: 'tem uma data especial?',
  gallery: 'bora escolher as fotos',
  timeline: 'quais momentos marcaram mais?',
  intro: 'quer uma abertura especial?',
  music: 'alguma música que marcou?',
  voice: 'grava um áudio?',
  background: 'que clima combina mais?',
  extras: 'quer adicionar joguinhos?',
  plan: 'qual plano?',
  payment: 'prontinho, bora finalizar',
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
