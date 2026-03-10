// Textos adaptativos do wizard por segmento.
// Lido pelo CreatePageWizard via ?segment= na URL.

export type WizardSegmentKey = 'namorade' | 'mae' | 'espouse' | 'amige' | 'pai' | 'avo' | 'filho';

export interface WizardSegmentConfig {
  titleStepTitle: string;
  titleStepDescription: string;
  titlePlaceholder: string;
  messageStepTitle: string;
  messageStepDescription: string;
  messagePlaceholder: string;
  dateStepTitle: string;
  dateStepDescription: string;
  galleryStepDescription: string;
  timelineStepDescription: string;
  musicStepDescription: string;
  puzzleStepDescription: string;
  memoryStepDescription: string;
  quizStepTitle: string;
  quizStepDescription: string;
  successTitle: string;
  successSubtitle: string;
  whatsappMessage: string;
}

export const WIZARD_SEGMENTS: Record<WizardSegmentKey, WizardSegmentConfig> = {

  namorade: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo da surpresa. Ex: "Para o amor da minha vida" ou só o nome da pessoa.',
    titlePlaceholder: 'Ex: Para o amor da minha vida 💜',
    messageStepTitle: 'Sua declaração de amor',
    messageStepDescription: 'Escreva tudo que você sente. Esse texto vai aparecer em destaque na página.',
    messagePlaceholder: 'Desde o dia que te conheci, cada momento ao seu lado é...',
    dateStepTitle: 'Data de vocês',
    dateStepDescription: 'Quando o relacionamento de vocês começou? Vamos criar um contador de dias juntos.',
    galleryStepDescription: 'As melhores fotos de vocês juntos — aquelas que contam a história.',
    timelineStepDescription: 'Os momentos mais marcantes do relacionamento, em ordem cronológica.',
    musicStepDescription: 'A música que é de vocês, ou uma mensagem de voz só pra essa pessoa.',
    puzzleStepDescription: 'A pessoa precisa montar o quebra-cabeça pra ver a surpresa — começa emocionante!',
    memoryStepDescription: 'Um jogo da memória com as fotos de vocês. Fofo demais.',
    quizStepTitle: 'Quiz do Casal',
    quizStepDescription: 'Perguntas que só essa pessoa saberia responder. Quanto ela/ele te conhece?',
    successTitle: 'Surpresa pronta! 💜',
    successSubtitle: 'Agora é só enviar e esperar a reação.',
    whatsappMessage: 'Amor, fiz uma surpresa especial pra você 💝 abre aqui quando puder',
  },

  mae: {
    titleStepTitle: 'Título da homenagem',
    titleStepDescription: 'O nome que aparece no topo. Ex: Para a melhor mãe do mundo.',
    titlePlaceholder: 'Ex: Para a minha mãe 🌸',
    messageStepTitle: 'Sua mensagem pra ela',
    messageStepDescription: 'Escreva tudo que você sempre quis dizer. Pode se emocionar.',
    messagePlaceholder: 'Mãe, eu nunca vou conseguir colocar em palavras o quanto você significa pra mim...',
    dateStepTitle: 'Uma data especial',
    dateStepDescription: 'O aniversário dela, o Dia das Mães, ou qualquer data que marca algo entre vocês.',
    galleryStepDescription: 'Fotos com ela — as antigas, as recentes, as que você mais ama.',
    timelineStepDescription: 'Os momentos mais marcantes que vocês viveram juntos.',
    musicStepDescription: 'Uma música que lembra ela, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ela monta o quebra-cabeça pra revelar uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês. Ela vai adorar.',
    quizStepTitle: 'Quanto ela te conhece?',
    quizStepDescription: 'Perguntas divertidas — ela sabe tudo sobre você?',
    successTitle: 'Homenagem pronta! 🌸',
    successSubtitle: 'Manda pra ela agora e prepara o lenço.',
    whatsappMessage: 'Mãe, fiz uma surpresa especial pra você 💝 abre aqui',
  },

  espouse: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo. Ex: "Para a pessoa que escolhi pra vida toda".',
    titlePlaceholder: 'Ex: Para o amor da minha vida 💍',
    messageStepTitle: 'Sua declaração',
    messageStepDescription: 'Escreva com o coração. Tudo que vocês viveram juntos merece ser dito.',
    messagePlaceholder: 'Cada dia ao seu lado me lembra por que escolhi você, e escolho de novo todo dia...',
    dateStepTitle: 'Data de vocês',
    dateStepDescription: 'O dia do casamento, ou quando começou tudo. O contador vai mostrar quanto tempo juntos.',
    galleryStepDescription: 'As fotos mais lindas de vocês — do casamento, das viagens, do dia a dia.',
    timelineStepDescription: 'A história de vocês contada em momentos — do início até hoje.',
    musicStepDescription: 'A música do casamento, ou qualquer música que é de vocês dois.',
    puzzleStepDescription: 'A pessoa monta o quebra-cabeça e revela uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com as melhores fotos de vocês.',
    quizStepTitle: 'Quiz do Casal',
    quizStepDescription: 'Perguntas que só essa pessoa saberia — mostre que se conhecem de verdade.',
    successTitle: 'Surpresa pronta! 💍',
    successSubtitle: 'Envia e espera a reação.',
    whatsappMessage: 'Amor, fiz algo especial pra você 💝 abre quando puder',
  },

  amige: {
    titleStepTitle: 'Título da homenagem',
    titleStepDescription: 'O nome que aparece no topo. Ex: "Para o meu melhor amigo" ou "Para a minha melhor amiga".',
    titlePlaceholder: 'Ex: Para o meu melhor amigo/a 🤍',
    messageStepTitle: 'Sua mensagem pra essa pessoa',
    messageStepDescription: 'Escreva o que essa amizade significa pra você. Vale chorar de alegria.',
    messagePlaceholder: 'Você é daquelas pessoas que a vida coloca no seu caminho e você não consegue imaginar sem...',
    dateStepTitle: 'Data da amizade',
    dateStepDescription: 'Quando vocês se conheceram, ou uma data especial entre vocês.',
    galleryStepDescription: 'As fotos mais lindas de vocês — as aventuras, os rolês, os momentos especiais.',
    timelineStepDescription: 'A história da amizade de vocês em momentos marcantes.',
    musicStepDescription: 'Uma música que é de vocês, ou uma mensagem de voz pra emocionar.',
    puzzleStepDescription: 'A pessoa monta o quebra-cabeça e revela uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês. Vai ser divertido demais.',
    quizStepTitle: 'Quanto ele/ela te conhece?',
    quizStepDescription: 'Perguntas que só o/a seu/sua melhor amigo/a saberia responder.',
    successTitle: 'Homenagem pronta! 🤍',
    successSubtitle: 'Manda e prepara o lenço.',
    whatsappMessage: 'Fiz uma surpresa especial pra você 🤍 abre aqui quando puder',
  },

  pai: {
    titleStepTitle: 'Título da homenagem',
    titleStepDescription: 'O nome que aparece no topo. Ex: Para o melhor pai do mundo.',
    titlePlaceholder: 'Ex: Para o meu pai 💙',
    messageStepTitle: 'Sua mensagem pra ele',
    messageStepDescription: 'Tudo que você sempre quis dizer pro seu pai. Agora é a hora.',
    messagePlaceholder: 'Pai, nem sempre é fácil colocar em palavras o quanto você significa pra mim...',
    dateStepTitle: 'Uma data especial',
    dateStepDescription: 'O Dia dos Pais, o aniversário dele, ou qualquer data marcante entre vocês.',
    galleryStepDescription: 'Fotos com ele — as da infância, as recentes, as que você mais guarda.',
    timelineStepDescription: 'Os momentos mais marcantes que vocês viveram juntos.',
    musicStepDescription: 'Uma música que lembra ele, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ele monta o quebra-cabeça pra revelar uma foto especial de vocês.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês. Ele vai amar.',
    quizStepTitle: 'Quanto ele te conhece?',
    quizStepDescription: 'Perguntas divertidas — seu pai sabe tudo sobre você?',
    successTitle: 'Homenagem pronta! 💙',
    successSubtitle: 'Manda pra ele agora.',
    whatsappMessage: 'Pai, fiz uma surpresa especial pra você 💝 abre aqui',
  },

  avo: {
    titleStepTitle: 'Título da homenagem',
    titleStepDescription: 'O nome que aparece no topo. Ex: "Para a minha vovó" ou "Para o meu vovô".',
    titlePlaceholder: 'Ex: Para a minha vovó/vovô 🌻',
    messageStepTitle: 'Sua mensagem pra ela/ele',
    messageStepDescription: 'Escreva com carinho tudo que essa pessoa representa pra você.',
    messagePlaceholder: 'Vó/Vô, você é uma das pessoas mais especiais da minha vida e eu precisava te dizer isso...',
    dateStepTitle: 'Uma data especial',
    dateStepDescription: 'O aniversário, um dia marcante, ou qualquer data especial entre vocês.',
    galleryStepDescription: 'As fotos mais lindas de vocês — as antigas e as recentes.',
    timelineStepDescription: 'Os momentos mais marcantes que vocês viveram juntos.',
    musicStepDescription: 'Uma música que lembra essa pessoa, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ela/ele monta o quebra-cabeça pra revelar uma foto especial.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês.',
    quizStepTitle: 'Quanto ela/ele te conhece?',
    quizStepDescription: 'Perguntas divertidas — será que ela/ele sabe tudo sobre você?',
    successTitle: 'Homenagem pronta! 🌻',
    successSubtitle: 'Manda com carinho e prepara o lenço.',
    whatsappMessage: 'Fiz uma surpresa especial pra você 💝 abre aqui quando puder',
  },

  filho: {
    titleStepTitle: 'Título da página',
    titleStepDescription: 'O nome que aparece no topo. Ex: "Para o meu filho" ou "Para a minha filha".',
    titlePlaceholder: 'Ex: Para o meu filho/filha 💛',
    messageStepTitle: 'Sua mensagem pra ele/ela',
    messageStepDescription: 'Escreva tudo que você sente. Vai ficar pra sempre.',
    messagePlaceholder: 'Você não faz ideia do quanto mudou a minha vida de uma forma que eu nunca imaginei...',
    dateStepTitle: 'Uma data especial',
    dateStepDescription: 'O aniversário, o nascimento, ou qualquer data marcante na vida de vocês.',
    galleryStepDescription: 'As fotos mais lindas — desde bebê até hoje.',
    timelineStepDescription: 'Os momentos mais marcantes da vida dele/dela que você quer eternizar.',
    musicStepDescription: 'Uma música que marcou a vida de vocês, ou uma mensagem de voz do coração.',
    puzzleStepDescription: 'Ele/ela monta o quebra-cabeça pra revelar uma foto especial.',
    memoryStepDescription: 'Um jogo da memória com fotos de vocês.',
    quizStepTitle: 'Quanto ele/ela te conhece?',
    quizStepDescription: 'Perguntas divertidas — será que seu filho/filha sabe tudo sobre você?',
    successTitle: 'Surpresa pronta! 💛',
    successSubtitle: 'Manda e espera a reação.',
    whatsappMessage: 'Fiz uma surpresa especial pra você 💝 abre aqui quando puder',
  },
};

// Fallback genérico (sem segmento ou ?segment=outro)
export const DEFAULT_WIZARD_CONFIG: WizardSegmentConfig = {
  titleStepTitle: 'Título da página',
  titleStepDescription: 'Escreva o título dedicatório. Ex: João & Maria.',
  titlePlaceholder: 'Ex: João & Maria',
  messageStepTitle: 'Sua Mensagem',
  messageStepDescription: 'Escreva a mensagem principal da página.',
  messagePlaceholder: 'Escreva sua mensagem aqui...',
  dateStepTitle: 'Data Especial',
  dateStepDescription: 'Informe a data que simboliza o início de tudo.',
  galleryStepDescription: 'Adicione as fotos que marcaram essa história.',
  timelineStepDescription: 'Os momentos mais marcantes, em ordem cronológica.',
  musicStepDescription: 'Escolha uma trilha sonora ou grave sua voz.',
  puzzleStepDescription: 'Um desafio antes de revelar a surpresa!',
  memoryStepDescription: 'Crie um jogo de memória com suas fotos.',
  quizStepTitle: 'Quiz',
  quizStepDescription: 'Crie um quiz divertido.',
  successTitle: 'Página Criada! 💜',
  successSubtitle: 'Compartilhe o link com quem você ama.',
  whatsappMessage: 'Fiz uma surpresa especial pra você 💝 abre aqui quando puder',
};
