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

// Tom de amigo próximo: acolhedor, com emoção verdadeira — sem floreio.
// Frases curtas, portuguÊs correto (acentos + maiúscula no início), no máximo 1 emoji.
const NAMORADE_LINES: SegmentLines = {
  recipient: 'Então, pra quem vai ser essa surpresa?',
  title: 'Demais! Como você quer chamar essa página?',
  message: 'Agora o coração — o que você quer dizer pra ela(e)?',
  specialDate: 'Tem uma data que começou tudo? Me conta.',
  gallery: 'Bora colocar umas fotos de vocês! Escolhe as que mais te emocionam.',
  timeline: 'Quais foram os momentos que você nunca vai esquecer?',
  intro: 'Quer uma abertura bonita antes de abrir a página?',
  music: 'Tem aquela música que é de vocês?',
  voice: 'Se quiser, grava um áudio pra ela(e) ouvir — fica especial demais.',
  background: 'Que clima você quer passar?',
  extras: 'Que tal umas surpresas divertidas? Posso adicionar joguinhos.',
  plan: 'Último passo: escolhe o plano que combina mais.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const MAE_LINES: SegmentLines = {
  recipient: 'Que bonito! Pra quem é essa homenagem?',
  title: 'Lindo! Que nome você quer dar pra essa página?',
  message: 'Agora diz pra ela, com suas palavras, o que você sente.',
  specialDate: 'Tem uma data que marca muito vocês duas?',
  gallery: 'Bora colocar umas fotos! Escolhe aquelas que você ama.',
  timeline: 'Quais momentos com ela você guarda com carinho?',
  intro: 'Quer uma abertura bonita antes de abrir?',
  music: 'Tem uma música que sempre lembra ela?',
  voice: 'Se quiser, grava um áudio seu — imagina a reação dela.',
  background: 'Que clima combina com ela?',
  extras: 'Quer deixar mais divertido com uns joguinhos?',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const ESPOUSE_LINES: SegmentLines = {
  recipient: 'Então, pra quem vai esse presente?',
  title: 'Demais! Que nome você quer dar?',
  message: 'Agora o coração — o que você quer dizer pra ele(a)?',
  specialDate: 'Quando começou a história de vocês?',
  gallery: 'Bora colocar fotos de vocês dois!',
  timeline: 'Quais foram os momentos mais marcantes?',
  intro: 'Quer uma abertura especial antes de abrir?',
  music: 'Tem uma música que é só de vocês?',
  voice: 'Grava um áudio — fica inesquecível.',
  background: 'Que clima você quer passar?',
  extras: 'Quer adicionar uns joguinhos? Rende umas risadas.',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const AMIGE_LINES: SegmentLines = {
  recipient: 'Pra quem é essa homenagem?',
  title: 'Que legal! Como você quer chamar?',
  message: 'Agora, o que você quer dizer pra essa pessoa?',
  specialDate: 'Quando vocês se conheceram?',
  gallery: 'Bora de fotos! Escolhe as mais memoráveis.',
  timeline: 'Quais momentos com essa pessoa você ama lembrar?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que lembra vocês dois?',
  voice: 'Manda um áudio seu — pessoal demais.',
  background: 'Que clima combina mais com a amizade?',
  extras: 'Quer colocar uns joguinhos? Fica divertido.',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const PAI_LINES: SegmentLines = {
  recipient: 'Que bonito! Pra quem é essa homenagem?',
  title: 'Lindo! Que nome você quer dar?',
  message: 'Agora diz pra ele o que você sente, com suas palavras.',
  specialDate: 'Tem uma data que marca vocês dois?',
  gallery: 'Bora colocar fotos! Escolhe as que você mais ama.',
  timeline: 'Quais momentos com ele você guarda de verdade?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que sempre lembra ele?',
  voice: 'Grava um áudio seu — imagina a cara dele.',
  background: 'Que clima combina com ele?',
  extras: 'Quer deixar mais divertido com joguinhos?',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const AVO_LINES: SegmentLines = {
  recipient: 'Que coisa linda! Pra quem é?',
  title: 'Lindo! Que nome você quer dar?',
  message: 'Agora diz pra ele(a), do seu jeitinho, o que você sente.',
  specialDate: 'Tem uma data que vocês guardam?',
  gallery: 'Bora colocar fotos! Escolhe aquelas que te lembram dele(a).',
  timeline: 'Quais momentos juntos você nunca esquece?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que lembra ele(a)?',
  voice: 'Grava um áudio seu — vai emocionar.',
  background: 'Que clima combina?',
  extras: 'Quer colocar uns joguinhos?',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
};

const FILHO_LINES: SegmentLines = {
  recipient: 'Que fofo! Pra quem é a surpresa?',
  title: 'Demais! Como você quer chamar?',
  message: 'Agora diz pra ele(a), com o coração.',
  specialDate: 'Tem uma data especial?',
  gallery: 'Bora de fotos! Escolhe as mais fofas.',
  timeline: 'Quais momentos você quer eternizar?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que é de vocês?',
  voice: 'Grava um áudio seu — ele(a) vai guardar pra sempre.',
  background: 'Que clima combina?',
  extras: 'Quer adicionar uns joguinhos?',
  plan: 'Último passo: escolhe o plano.',
  payment: 'Prontinho! Bora finalizar 💌',
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
