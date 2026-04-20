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

// Tom de amigo próximo: leve, acolhedor, com uma pitada de emoção — mas sem floreio.
// Frases curtas, minúsculas, no máximo 1 emoji quando faz sentido.
const NAMORADE_LINES: SegmentLines = {
  recipient: 'então, pra quem vai ser essa surpresa?',
  title: 'demais! como você quer chamar essa página?',
  message: 'agora o coração — o que você quer dizer pra ela(e)?',
  specialDate: 'tem uma data que começou tudo? conta pra mim',
  gallery: 'bora colocar umas fotos de vocês? escolhe as que mais te emocionam',
  timeline: 'quais foram os momentos que você nunca vai esquecer?',
  intro: 'quer uma abertura bonita antes de abrir a página?',
  music: 'tem aquela música que é de vocês?',
  voice: 'se quiser, grava um áudio pra ela(e) ouvir — fica especial demais',
  background: 'que clima você quer passar?',
  extras: 'que tal umas surpresas divertidas? posso adicionar joguinhos',
  plan: 'último passo: escolhe o plano que combina mais',
  payment: 'prontinho! bora finalizar 💌',
};

const MAE_LINES: SegmentLines = {
  recipient: 'que bonito, pra quem é essa homenagem?',
  title: 'lindo! que nome você quer dar pra essa página?',
  message: 'agora diz pra ela, com suas palavras, o que sente',
  specialDate: 'tem uma data que marca muito vocês duas?',
  gallery: 'bora colocar umas fotos? escolhe aquelas que você ama',
  timeline: 'quais momentos com ela você guarda com carinho?',
  intro: 'quer uma abertura bonita antes de abrir?',
  music: 'tem uma música que sempre lembra ela?',
  voice: 'se quiser, grava um áudio seu — imagina a reação dela',
  background: 'que clima combina com ela?',
  extras: 'quer deixar mais divertido com uns joguinhos?',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
};

const ESPOUSE_LINES: SegmentLines = {
  recipient: 'então, pra quem vai esse presente?',
  title: 'demais! que nome você quer dar?',
  message: 'agora o coração — o que você quer dizer pra ele(a)?',
  specialDate: 'quando começou a história de vocês?',
  gallery: 'bora colocar fotos de vocês dois?',
  timeline: 'quais foram os momentos mais marcantes?',
  intro: 'quer uma abertura especial antes de abrir?',
  music: 'tem uma música que é só de vocês?',
  voice: 'grava um áudio — fica inesquecível',
  background: 'que clima você quer passar?',
  extras: 'quer adicionar uns joguinhos? rende umas risadas',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
};

const AMIGE_LINES: SegmentLines = {
  recipient: 'pra quem é essa homenagem?',
  title: 'que legal! como você quer chamar?',
  message: 'agora, o que você quer dizer pra essa pessoa?',
  specialDate: 'quando vocês se conheceram?',
  gallery: 'bora de fotos! escolhe as mais memoráveis',
  timeline: 'quais momentos com essa pessoa você ama lembrar?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música que lembra vocês dois?',
  voice: 'manda um áudio seu — pessoal demais',
  background: 'que clima combina mais com a amizade?',
  extras: 'quer colocar uns joguinhos? fica divertido',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
};

const PAI_LINES: SegmentLines = {
  recipient: 'que bonito, pra quem é essa homenagem?',
  title: 'lindo! que nome você quer dar?',
  message: 'agora diz pra ele o que sente, com suas palavras',
  specialDate: 'tem uma data que marca vocês dois?',
  gallery: 'bora colocar fotos? escolhe as que você mais ama',
  timeline: 'quais momentos com ele você guarda de verdade?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música que sempre lembra ele?',
  voice: 'grava um áudio seu — imagina a cara dele',
  background: 'que clima combina com ele?',
  extras: 'quer deixar mais divertido com joguinhos?',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
};

const AVO_LINES: SegmentLines = {
  recipient: 'que coisa linda, pra quem é?',
  title: 'lindo! que nome você quer dar?',
  message: 'agora diz pra ele(a), do seu jeitinho, o que sente',
  specialDate: 'tem uma data que vocês guardam?',
  gallery: 'bora colocar fotos? escolhe aquelas que te lembram dele(a)',
  timeline: 'quais momentos juntos você nunca esquece?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música que lembra ele(a)?',
  voice: 'grava um áudio seu — vai emocionar',
  background: 'que clima combina?',
  extras: 'quer colocar uns joguinhos?',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
};

const FILHO_LINES: SegmentLines = {
  recipient: 'que fofo, pra quem é a surpresa?',
  title: 'demais! como você quer chamar?',
  message: 'agora diz pra ele(a), com o coração',
  specialDate: 'tem uma data especial?',
  gallery: 'bora de fotos! escolhe as mais fofas',
  timeline: 'quais momentos você quer eternizar?',
  intro: 'quer uma abertura especial?',
  music: 'tem uma música que é de vocês?',
  voice: 'grava um áudio seu — ele(a) vai guardar pra sempre',
  background: 'que clima combina?',
  extras: 'quer adicionar uns joguinhos?',
  plan: 'último passo: escolhe o plano',
  payment: 'prontinho! bora finalizar 💌',
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
