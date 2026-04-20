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

const NAMORADE_LINES: SegmentLines = {
  title: 'Oi! 💘 Vamos criar algo lindo juntos. Como você quer chamar essa surpresa?',
  message: 'Agora a parte mais especial: o que seu coração quer dizer pra ele(a)?',
  specialDate: 'Que lindo! Me conta, quando começou tudo entre vocês?',
  gallery: 'Bora ver as fotos de vocês? Escolhe as que mais marcam 📸',
  timeline: 'Quais foram os momentos que marcaram essa história?',
  intro: 'Quer uma abertura bem especial pra surpreender de primeira?',
  music: 'Tem uma música que é de vocês? Cola aqui que eu cuido do resto 🎵',
  voice: 'Essa aqui é pra emocionar: grava um áudio curtinho pra ele(a) ouvir 🎤',
  background: 'Que clima você quer dar pra página?',
  extras: 'Quer adicionar uns joguinhos interativos? (tudo opcional)',
  plan: 'Quase lá! Qual plano combina mais com a sua surpresa?',
  payment: 'Prontinho! Vamos finalizar pra ele(a) poder ver 💌',
};

const MAE_LINES: SegmentLines = {
  title: 'Que lindo fazer isso pra ela 🌸 Como você quer chamar essa homenagem?',
  message: 'Agora escreve de coração: o que você sempre quis dizer pra ela?',
  specialDate: 'Tem uma data que marca vocês duas/dois? O aniversário dela, talvez?',
  gallery: 'Escolhe as fotos mais lindas com ela 📸',
  timeline: 'Quais momentos com ela você quer eternizar aqui?',
  intro: 'Quer uma abertura especial pra surpreender ela logo de cara?',
  music: 'Tem uma música que lembra ela? 🎵',
  voice: 'Grava um áudio seu falando com ela — vai ser inesquecível 🎤',
  background: 'Que clima você quer na página dela?',
  extras: 'Quer deixar mais divertido com uns joguinhos? (é opcional)',
  plan: 'Falta pouco! Qual plano você escolhe?',
  payment: 'Prontinho! Agora é só finalizar 💝',
};

const ESPOUSE_LINES: SegmentLines = {
  title: 'Amor de vida merece homenagem à altura 💍 Como chama essa surpresa?',
  message: 'Escreve com o coração tudo que vocês viveram e ainda vão viver.',
  specialDate: 'Quando foi que começou tudo? Ou o dia do sim?',
  gallery: 'Coloca as fotos mais marcantes de vocês 📸',
  timeline: 'Conta a história de vocês em momentos 💍',
  intro: 'Uma abertura especial faz toda a diferença — quer adicionar?',
  music: 'Qual a música que é de vocês dois?',
  voice: 'Grava um áudio — a voz é o que toca mais fundo 🎤',
  background: 'Qual atmosfera combina mais com vocês?',
  extras: 'Quer incluir uns joguinhos interativos?',
  plan: 'Qual plano combina mais com o que você quer fazer?',
  payment: 'Prontinho, agora é só finalizar 💌',
};

const AMIGE_LINES: SegmentLines = {
  title: 'Amizade dessas merece ser celebrada 🤍 Como chama essa homenagem?',
  message: 'Escreve o que essa amizade significa pra você.',
  specialDate: 'Tem uma data que marca vocês? Quando se conheceram?',
  gallery: 'Cola as fotos mais marcantes de vocês 📸',
  timeline: 'Quais momentos você quer eternizar aqui?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que é de vocês?',
  voice: 'Grava um áudio — vai emocionar 🎤',
  background: 'Que clima combina mais com vocês?',
  extras: 'Quer colocar uns joguinhos? É opcional',
  plan: 'Qual plano você prefere?',
  payment: 'Prontinho! Vamos finalizar 🤍',
};

const PAI_LINES: SegmentLines = {
  title: 'Pra ele vai ser emocionante 💙 Como quer chamar essa homenagem?',
  message: 'Tudo que você sempre quis dizer pra ele — escreve aqui.',
  specialDate: 'Tem uma data marcante entre vocês?',
  gallery: 'Escolhe as fotos mais especiais com ele 📸',
  timeline: 'Quais momentos com ele você quer guardar?',
  intro: 'Quer uma abertura especial pra surpreender ele?',
  music: 'Tem uma música que lembra ele?',
  voice: 'Grava um áudio seu pra ele ouvir 🎤',
  background: 'Que clima você quer na página?',
  extras: 'Quer incluir joguinhos? É opcional',
  plan: 'Qual plano combina mais?',
  payment: 'Prontinho! 💙',
};

const AVO_LINES: SegmentLines = {
  title: 'Amor de avó/avô é único 🌻 Como chama essa homenagem?',
  message: 'Escreve com carinho tudo que essa pessoa representa.',
  specialDate: 'Tem uma data especial entre vocês?',
  gallery: 'Cola as fotos mais lindas de vocês 📸',
  timeline: 'Quais momentos você quer eternizar?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que lembra essa pessoa?',
  voice: 'Grava um áudio pra ela(e) ouvir 🎤',
  background: 'Qual clima combina mais?',
  extras: 'Quer adicionar joguinhos? É opcional',
  plan: 'Qual plano você escolhe?',
  payment: 'Prontinho! 🌻',
};

const FILHO_LINES: SegmentLines = {
  title: 'Que lindo fazer isso pra ele/ela 💛 Como quer chamar?',
  message: 'Escreve tudo que você sente — vai ficar pra sempre.',
  specialDate: 'Uma data marcante? O nascimento, talvez?',
  gallery: 'Cola as fotos mais lindas 📸',
  timeline: 'Quais momentos você quer eternizar?',
  intro: 'Quer uma abertura especial?',
  music: 'Tem uma música que marcou vocês?',
  voice: 'Grava um áudio — vai ser pra sempre 🎤',
  background: 'Que clima combina mais?',
  extras: 'Quer incluir joguinhos? É opcional',
  plan: 'Qual plano você escolhe?',
  payment: 'Prontinho! 💛',
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
