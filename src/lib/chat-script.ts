import type { WizardSegmentKey } from './wizard-segment-config';
import type { Locale } from '@/i18n/config';

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

export interface CupidContext {
  recipientName?: string;
}

type LineFn = (ctx: CupidContext) => string;
type SegmentLines = Record<ChatStepKey, LineFn>;

// Helpers: nome da pessoa ou fallback carinhoso por segmento
const nameOr = (ctx: CupidContext, fallback: string) =>
  (ctx.recipientName && ctx.recipientName.trim()) || fallback;

// ─────────────────────────────────────────────────────────────
// NAMORADE — tom apaixonado, romântico, intimista
// ─────────────────────────────────────────────────────────────
const NAMORADE_LINES: SegmentLines = {
  recipient: () => 'Oiii! 💘 Antes de tudo: qual o nome de quem vai receber essa surpresa?',
  title: (ctx) => `Aaah, ${nameOr(ctx, 'que nome lindo')}! 🥰 Agora me conta: qual vai ser o título lá em cima da página? (pode ser seu nome, apelidinho, frase de efeito…)`,
  message: (ctx) => `Agora vem a parte mais especial 💌 — escreva a mensagem do coração pra ${nameOr(ctx, 'ela(e)')}. Se joga, o Cupido ajuda a deixar fofo!`,
  specialDate: (ctx) => `Eba! Me conta: há quanto tempo vocês estão juntos? ⏳ (pra gente mostrar o tempo de amor de vocês na página 💖)`,
  gallery: (ctx) => `Bora escolher as fotos? 📸 Solta as que você mais ama de vocês dois — ${nameOr(ctx, 'ele(a)')} vai amar relembrar!`,
  timeline: (ctx) => `Agora os momentos que marcaram vocês 🕰️ — primeiro date, primeira viagem, aquele dia que não sai da cabeça… monta a história!`,
  intro: (ctx) => `Quer uma aberturinha especial pra surpreender ${nameOr(ctx, 'ele(a)')}? ✨ Tem umas animações super fofas.`,
  music: (ctx) => `Tem uma música que é de vocês? 🎶 Cola aqui pra ela tocar quando ${nameOr(ctx, 'ele(a)')} abrir a página!`,
  voice: (ctx) => `Essa aqui é a minha favorita 🎤 — grava um áudio seu pra ${nameOr(ctx, 'ele(a)')} ouvir. Juro que vai derreter o coração.`,
  background: () => `Agora vamos dar um clima pra página 💫 — qual desses fundos animados você achou mais lindo?`,
  extras: (ctx) => `Quer deixar ainda mais divertido? 🎮 Dá pra adicionar joguinhos que ${nameOr(ctx, 'ele(a)')} vai jogar navegando pela página.`,
  plan: () => `Quase lá! 🎉 Escolhe o plano que mais combina com o que você quer entregar.`,
  payment: (ctx) => `Prontinho! 💌 Agora é só finalizar e sua surpresa vai direto pra ${nameOr(ctx, 'ele(a)')}.`,
};

// ─────────────────────────────────────────────────────────────
// MAE — tom acolhedor, cheio de carinho, emocional
// ─────────────────────────────────────────────────────────────
const MAE_LINES: SegmentLines = {
  recipient: () => 'Que lindo, uma homenagem pra mãe 💕 Me conta, qual o nome dela?',
  title: (ctx) => `Ah, ${nameOr(ctx, 'que nome bonito')}! 🌷 Como você quer titular essa homenagem? Algo como "A melhor mãe do mundo" ou algo único de vocês duas(oi).`,
  message: (ctx) => `Agora a parte que aperta o coração 💞 — o que você sempre quis dizer pra ${nameOr(ctx, 'ela')}? Solta tudo, pode ser longo!`,
  specialDate: () => `Me conta: quando vocês começaram essa história juntas? 🌿 (pode ser seu aniversário mesmo — aí a gente mostra o tempo de amor de vocês!)`,
  gallery: (ctx) => `Hora das fotos 📸 — escolhe aquelas fotos marcantes de vocês. ${nameOr(ctx, 'Ela')} vai chorar!`,
  timeline: () => `Agora vamos montar os momentos especiais de vocês 🕰️ — aniversários, viagens, o dia que… vem tudo!`,
  intro: () => `Quer uma abertura especial pra surpreender? ✨ Dá um toque mágico logo de cara.`,
  music: (ctx) => `Tem uma música que lembra ${nameOr(ctx, 'ela')}? 🎶 Cola aqui — música certa arrepia na hora.`,
  voice: (ctx) => `Essa daqui é linda 🎤 — grava um áudio seu dizendo o que você sente por ${nameOr(ctx, 'ela')}. Ela vai guardar pra sempre.`,
  background: () => `Que clima você quer pra homenagem? 💫 Olha que lindos esses fundinhos:`,
  extras: () => `Quer adicionar joguinhos interativos? 🎮 Deixa a página ainda mais especial.`,
  plan: () => `Quase pronto! 🎉 Escolhe o plano que combina com o que você quer.`,
  payment: (ctx) => `É só finalizar e ${nameOr(ctx, 'sua mãe')} vai receber uma surpresa linda 💐`,
};

// ─────────────────────────────────────────────────────────────
// ESPOUSE — tom maduro, romântico, cumplicidade
// ─────────────────────────────────────────────────────────────
const ESPOUSE_LINES: SegmentLines = {
  recipient: () => 'Que lindo! 💍 Antes de tudo, qual o nome do seu amor?',
  title: (ctx) => `${nameOr(ctx, 'Aah')}… nome lindo 🥹 Como você quer chamar essa página? Pode ser uma frase que resume vocês dois.`,
  message: (ctx) => `Agora a mensagem 💌 — o que seu coração quer dizer pra ${nameOr(ctx, 'ele(a)')}? Desabafa, é seguro aqui!`,
  specialDate: () => `Me conta: há quanto tempo vocês tão construindo essa vida juntos? 💞 (casamento, namoro desde quando — o que fizer mais sentido)`,
  gallery: () => `Bora ver as fotos de vocês? 📸 Escolhe as que contam a história de vocês dois.`,
  timeline: () => `Agora os marcos de vocês 🕰️ — o dia que se conheceram, o sim, viagens, cada momento importa.`,
  intro: (ctx) => `Quer uma abertura especial pra surpreender ${nameOr(ctx, 'ele(a)')}? ✨`,
  music: () => `A música de vocês dois, qual é? 🎶 Cola aqui pra tocar na abertura.`,
  voice: (ctx) => `Grava um áudio seu pra ${nameOr(ctx, 'ele(a)')} 🎤 — promete, vai arrepiar.`,
  background: () => `Vamos dar um climão especial 💫 — qual fundinho mais combina com vocês?`,
  extras: () => `Quer deixar mais divertido com joguinhos? 🎮 Fica ainda mais marcante.`,
  plan: () => `Quase lá! 🎉 Escolhe o plano que combina com a surpresa que você quer entregar.`,
  payment: (ctx) => `É só finalizar e a surpresa segue pra ${nameOr(ctx, 'ele(a)')} 💌`,
};

// ─────────────────────────────────────────────────────────────
// AMIGE — tom leve, brincalhão, amizade que é família
// ─────────────────────────────────────────────────────────────
const AMIGE_LINES: SegmentLines = {
  recipient: () => 'Amizade que é família é uma delícia 🫶 Me conta, qual o nome dessa pessoa especial?',
  title: (ctx) => `${nameOr(ctx, 'Essa pessoa')} é sortudo(a) demais! 🌟 Como você quer titular a página? Pode ser uma zoeira interna de vocês, uma frase, qualquer coisa.`,
  message: (ctx) => `Escreve aí, sem vergonha 💌 — o que você sempre quis dizer pra ${nameOr(ctx, 'ele(a)')}? Pode rir, pode chorar, tudo vale.`,
  specialDate: () => `Há quanto tempo vocês são amigos? ⏳ (desde a escola? faculdade? ontem?)`,
  gallery: () => `Hora das melhores fotos de vocês 📸 — as engraçadas, as fofas, as que ninguém pode ver…`,
  timeline: () => `Bora montar a história de vocês 🕰️ — rolês icônicos, viagens, perrengues, tudo conta!`,
  intro: () => `Quer uma abertura especial pra abrir com chave de ouro? ✨`,
  music: () => `Tem uma música que é tipo hino de vocês? 🎶 Cola aqui!`,
  voice: (ctx) => `Grava um áudio seu pra ${nameOr(ctx, 'ele(a)')} 🎤 — vai ficar único, promessa.`,
  background: () => `Qual desses fundinhos mais combina com vocês? 💫`,
  extras: () => `Quer colocar joguinhos? 🎮 Fica divertido demais.`,
  plan: () => `Quase pronto! 🎉 Escolhe o plano.`,
  payment: (ctx) => `Manda ver 💌 — ${nameOr(ctx, 'ele(a)')} não tem ideia do que tá vindo!`,
};

// ─────────────────────────────────────────────────────────────
// PAI — tom respeitoso, afetuoso, emocional
// ─────────────────────────────────────────────────────────────
const PAI_LINES: SegmentLines = {
  recipient: () => 'Homenagem pra um pai 💙 que coisa linda. Qual o nome dele?',
  title: (ctx) => `${nameOr(ctx, 'Que nome forte')}! Agora, como você quer titular essa homenagem? Pode ser "Pro melhor pai do mundo" ou algo único.`,
  message: (ctx) => `Agora a parte mais especial 💌 — o que você quer dizer pra ${nameOr(ctx, 'ele')}? Solta, ele merece ouvir tudo.`,
  specialDate: () => `Me conta: quando começou essa história de vocês? 🌿 (pode ser seu aniversário — a gente mostra o tempo juntos na página)`,
  gallery: () => `Bora reviver esses momentos 📸 — escolhe as fotos mais marcantes de vocês.`,
  timeline: () => `Os momentos que vão pra sempre 🕰️ — viagens, conselhos, aquela foto antiga…`,
  intro: () => `Quer uma abertura especial? ✨ Fica memorável logo de cara.`,
  music: (ctx) => `Tem uma música que lembra ${nameOr(ctx, 'ele')}? 🎶 Cola aqui, vai emocionar.`,
  voice: (ctx) => `Grava um áudio seu 🎤 — ${nameOr(ctx, 'seu pai')} vai ouvir e guardar pra sempre.`,
  background: () => `Qual fundo mais combina pra homenagem? 💫`,
  extras: () => `Quer adicionar joguinhos? 🎮 Dá um toque interativo.`,
  plan: () => `Quase lá! 🎉 Escolhe o plano.`,
  payment: (ctx) => `Finaliza e ${nameOr(ctx, 'ele')} vai receber algo inesquecível 💙`,
};

// ─────────────────────────────────────────────────────────────
// AVO — tom ternura pura, cheio de amor
// ─────────────────────────────────────────────────────────────
const AVO_LINES: SegmentLines = {
  recipient: () => 'Aaah, uma homenagem pra avó/avô 🥹 coisa mais linda. Qual o nome?',
  title: (ctx) => `${nameOr(ctx, 'Que nome de ouro')}! Como você quer titular essa homenagem? Pode ser "Minha vó" ou um nome carinhoso especial.`,
  message: () => `Agora a parte mais fofa 💌 — o que você sempre quis dizer? Solta o coração.`,
  specialDate: () => `Me conta: quando começou essa história de amor de vocês? 🌿 (seu nascimento serve!)`,
  gallery: () => `Fotos antigas, fotos recentes, tudo vale 📸 — escolhe as mais marcantes.`,
  timeline: () => `Os momentos inesquecíveis 🕰️ — aquele almoço de domingo, viagens, histórias…`,
  intro: () => `Uma abertura especial pra deixar tudo ainda mais mágico? ✨`,
  music: (ctx) => `Tem uma música que lembra ${nameOr(ctx, 'ele(a)')}? 🎶`,
  voice: (ctx) => `Essa aqui derrete qualquer avó/avô 🎤 — grava um áudio seu pra ${nameOr(ctx, 'ele(a)')}.`,
  background: () => `Qual fundinho combina mais? 💫`,
  extras: () => `Quer joguinhos? 🎮 Fica divertido.`,
  plan: () => `Quase pronto! 🎉 Escolhe o plano.`,
  payment: (ctx) => `É só finalizar e ${nameOr(ctx, 'ele(a)')} vai receber algo único 💕`,
};

// ─────────────────────────────────────────────────────────────
// FILHO — tom orgulhoso, cheio de ternura de pai/mãe
// ─────────────────────────────────────────────────────────────
const FILHO_LINES: SegmentLines = {
  recipient: () => 'Homenagem pro filho(a) 🌱 que demais! Qual o nome?',
  title: (ctx) => `${nameOr(ctx, 'Nome lindo')}! Como vai ser o título da página? Pode ser o nome dele(a) mesmo, uma frase carinhosa…`,
  message: (ctx) => `Agora a mensagem 💌 — o que você quer que ${nameOr(ctx, 'ele(a)')} leia e guarde pra sempre?`,
  specialDate: (ctx) => `Há quanto tempo ${nameOr(ctx, 'ele(a)')} está iluminando a sua vida? 🌟 (pode ser a data de nascimento!)`,
  gallery: () => `Bora escolher as fotos mais marcantes 📸 — do primeiro dia até hoje.`,
  timeline: () => `Os momentos que você quer que fiquem eternos 🕰️ — primeira palavra, conquistas, viagens…`,
  intro: () => `Quer uma abertura especial? ✨`,
  music: () => `Tem uma música que é de vocês? 🎶 Cola aqui.`,
  voice: (ctx) => `Grava um áudio seu 🎤 — ${nameOr(ctx, 'ele(a)')} vai guardar pra vida toda.`,
  background: () => `Qual fundinho mais combina? 💫`,
  extras: () => `Quer joguinhos? 🎮`,
  plan: () => `Quase lá! 🎉 Escolhe o plano.`,
  payment: (ctx) => `Finaliza e ${nameOr(ctx, 'ele(a)')} vai se emocionar 🥹`,
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

export function getCupidLine(
  segment: WizardSegmentKey | undefined,
  step: ChatStepKey,
  ctx: CupidContext = {},
  locale: Locale = 'pt',
): string {
  // Lazy import EN dict pra evitar custo em callsites BR
  const dict = locale === 'en'
    ? (require('./chat-script-en').CUPID_LINES_EN as Record<WizardSegmentKey, SegmentLines>)
    : CUPID_LINES;
  const seg = segment && dict[segment] ? segment : 'namorade';
  const fn = dict[seg][step] ?? dict.namorade[step];
  try {
    return fn(ctx);
  } catch {
    return '';
  }
}
