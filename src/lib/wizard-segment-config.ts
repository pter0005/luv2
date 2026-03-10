// Textos adaptativos do wizard por segmento.
// Lido pelo CreatePageWizard via ?segment= na URL.

export type WizardSegmentKey = 'namorada' | 'mae' | 'esposa' | 'namorado' | 'amiga' | 'namorade' | 'espouse';

export interface WizardSegmentConfig {
  // Passo 1 — Título
  titleStepTitle: string;
  titleStepDescription: string;
  titlePlaceholder: string;

  // Passo 2 — Mensagem
  messageStepTitle: string;
  messageStepDescription: string;
  messagePlaceholder: string;

  // Passo 3 — Data
  dateStepTitle: string;
  dateStepDescription: string;

  // Passo 4 — Galeria
  galleryStepDescription: string;

  // Passo 5 — Timeline
  timelineStepDescription: string;

  // Passo 6 — Música
  musicStepDescription: string;

  // Passo 8 — Puzzle
  puzzleStepDescription: string;

  // Passo 9 — Memória
  memoryStepDescription: string;

  // Passo 10 — Quiz
  quizStepTitle: string;
  quizStepDescription: string;

  // Sucesso
  successTitle: string;
  successSubtitle: string;
  whatsappMessage: string;
}

const segmentsBase = {
  namorada: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo da surpresa. Ex: João & Maria, ou só o nome dela.',
    titlePlaceholder: 'Ex: Para a minha namorada 💜',
    messageStepTitle: 'Sua declaração de amor',
    messageStepDescription: 'Escreva tudo que você sente por ela. Esse texto vai aparecer destacado na página.',
    messagePlaceholder: 'Desde o dia que te conheci, cada momento ao seu lado é...',
    dateStepTitle: 'Data de vocês',
    dateStepDescription: 'Quando o relacionamento de vocês começou? Vamos criar um contador de dias juntos.',
    galleryStepDescription: 'As melhores fotos de vocês dois juntos — aquelas que contam a história.',
    timelineStepDescription: 'Os momentos mais marcantes do relacionamento de vocês, em ordem cronológica.',
    musicStepDescription: 'A música que é de vocês dois, ou uma mensagem de voz só pra ela.',
    puzzleStepDescription: 'Ela precisa montar o quebra-cabeça pra ver a surpresa — começa emocionante!',
    memoryStepDescription: 'Um jogo da memória com as fotos de vocês. Fofo demais.',
    quizStepTitle: 'Quiz do Casal',
    quizStepDescription: 'Perguntas que só ela saberia responder. Quanto ela te conhece?',
    successTitle: 'Surpresa pronta! 💜',
    successSubtitle: 'Agora é só enviar pra ela e esperar a reação.',
    whatsappMessage: 'Amor, fiz uma surpresa especial pra você 💝 abre aqui quando puder',
  },

  mae: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo da homenagem. Ex: Para a melhor mãe do mundo.',
    titlePlaceholder: 'Ex: Para a minha mãe 🌸',
    messageStepTitle: 'Sua mensagem pra ela',
    messageStepDescription: 'Escreva tudo que você sempre quis dizer pra sua mãe. Pode se emocionar.',
    messagePlaceholder: 'Mãe, eu nunca vou conseguir colocar em palavras o quanto você significa pra mim...',
    dateStepTitle: 'Uma data especial',
    dateStepDescription: 'O aniversário dela, o dia das mães, ou qualquer data que marca algo entre vocês.',
    galleryStepDescription: 'Fotos com ela — as antigas, as recentes, as que você mais ama.',
    timelineStepDescription: 'Os momentos mais marcantes que vocês viveram juntos.',
    musicStepDescription: 'Uma música que lembra ela, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ela monta o quebra-cabeça pra revelar uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês. Ela vai adorar.',
    quizStepTitle: 'Quanto ela te conhece?',
    quizStepDescription: 'Perguntas divertidas — ela sabe tudo sobre você?',
    successTitle: 'Surpresa pronta! 🌸',
    successSubtitle: 'Manda pra ela agora e prepara o lenço.',
    whatsappMessage: 'Mãe, fiz uma surpresa especial pra você 💝 abre aqui',
  },

  esposa: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo. Ex: Para a mulher da minha vida.',
    titlePlaceholder: 'Ex: Para a minha esposa 💍',
    messageStepTitle: 'Sua declaração',
    messageStepDescription: 'Escreva com o coração. Tudo que vocês viveram juntos merece ser dito.',
    messagePlaceholder: 'Cada dia ao seu lado me lembra por que escolhi você, e escolho de novo todo dia...',
    dateStepTitle: 'Data de vocês',
    dateStepDescription: 'O dia que se casaram, ou quando começou tudo. O contador vai mostrar quanto tempo juntos.',
    galleryStepDescription: 'As fotos mais lindas de vocês — do casamento, das viagens, do dia a dia.',
    timelineStepDescription: 'A história de vocês contada em momentos — do início até hoje.',
    musicStepDescription: 'A música do casamento, ou qualquer música que é de vocês.',
    puzzleStepDescription: 'Ela monta o quebra-cabeça e revela uma foto especial de vocês dois.',
    memoryStepDescription: 'Um jogo da memória com as melhores fotos de vocês.',
    quizStepTitle: 'Quiz do Casal',
    quizStepDescription: 'Perguntas que só ela saberia — mostre que conhece tudo sobre ela.',
    successTitle: 'Surpresa pronta! 💍',
    successSubtitle: 'Envia pra ela e espera a reação.',
    whatsappMessage: 'Amor, fiz algo especial pra você 💝 abre quando puder',
  },

  namorado: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo da surpresa. Ex: Para o meu namorado.',
    titlePlaceholder: 'Ex: Para o meu namorado 🖤',
    messageStepTitle: 'Sua declaração pra ele',
    messageStepDescription: 'Escreva o que você sente. Não precisa ser perfeito — só precisa ser verdadeiro.',
    messagePlaceholder: 'Você é a melhor coisa que aconteceu na minha vida e eu precisava te mostrar isso...',
    dateStepTitle: 'Data de vocês',
    dateStepDescription: 'Quando o relacionamento de vocês começou? O contador vai mostrar quanto tempo juntos.',
    galleryStepDescription: 'As melhores fotos de vocês dois — as que fazem você sorrir só de olhar.',
    timelineStepDescription: 'Os momentos mais marcantes que vocês viveram juntos.',
    musicStepDescription: 'A música de vocês, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ele monta o quebra-cabeça pra revelar a surpresa — começa já emocionante.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês. Ele vai amar.',
    quizStepTitle: 'Quanto ele te conhece?',
    quizStepDescription: 'Perguntas que só ele saberia responder sobre você.',
    successTitle: 'Surpresa pronta! 🖤',
    successSubtitle: 'Agora é só mandar pra ele e ver a reação.',
    whatsappMessage: 'Fiz uma surpresa especial pra você 💝 abre aqui quando puder',
  },

  amiga: {
    titleStepTitle: 'Título da homenagem',
    titleStepDescription: 'O nome que aparece no topo. Ex: Para a minha melhor amiga.',
    titlePlaceholder: 'Ex: Para a minha melhor amiga 🤍',
    messageStepTitle: 'Sua mensagem pra ela',
    messageStepDescription: 'Escreva o que essa amizade significa pra você. Ela vai chorar (de alegria).',
    messagePlaceholder: 'Você é daquelas pessoas que a vida coloca no seu caminho e você não consegue imaginar sem...',
    dateStepTitle: 'Data da amizade',
    dateStepDescription: 'Quando vocês se conheceram, ou uma data especial de vocês duas.',
    galleryStepDescription: 'As fotos mais lindas de vocês — as aventuras, os rolês, os momentos especiais.',
    timelineStepDescription: 'A história da amizade de vocês em momentos marcantes.',
    musicStepDescription: 'Uma música que é de vocês, ou uma mensagem de voz pra emocionar.',
    puzzleStepDescription: 'Ela monta o quebra-cabeça e revela uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês duas. Vai ser divertido demais.',
    quizStepTitle: 'Quanto ela te conhece?',
    quizStepDescription: 'Perguntas que só a sua melhor amiga saberia responder.',
    successTitle: 'Homenagem pronta! 🤍',
    successSubtitle: 'Manda pra ela e prepara o lenço.',
    whatsappMessage: 'Fiz uma surpresa especial pra você 🤍 abre aqui quando puder',
  },
};

export const WIZARD_SEGMENTS: Record<WizardSegmentKey, WizardSegmentConfig> = {
  ...segmentsBase,
  namorade: segmentsBase.namorada,
  espouse: segmentsBase.esposa,
};


// Fallback genérico (sem segmento)
export const DEFAULT_WIZARD_CONFIG: WizardSegmentConfig = {
  titleStepTitle: 'Título da página',
  titleStepDescription: 'Escreva o título dedicatório. Ex: João & Maria.',
  titlePlaceholder: 'Ex: João & Maria',
  messageStepTitle: 'Sua Mensagem de Amor',
  messageStepDescription: 'Escreva a mensagem principal.',
  messagePlaceholder: 'Sua declaração...',
  dateStepTitle: 'Data Especial',
  dateStepDescription: 'Informe a data que simboliza o início de tudo.',
  galleryStepDescription: 'Adicione as fotos que marcaram a história de vocês.',
  timelineStepDescription: 'Momentos flutuantes para uma viagem nostálgica.',
  musicStepDescription: 'Escolha uma trilha sonora ou grave sua voz.',
  puzzleStepDescription: 'Um desafio antes de revelar a surpresa!',
  memoryStepDescription: 'Crie um jogo de memória divertido com suas fotos.',
  quizStepTitle: 'Quiz do Casal',
  quizStepDescription: 'Crie um quiz divertido sobre vocês.',
  successTitle: 'Página Criada com Sucesso!',
  successSubtitle: 'Sua obra de arte está pronta. Compartilhe o link com seu amor.',
  whatsappMessage: 'Oi amor, fiz uma surpresa especial pra você 💝',
};
