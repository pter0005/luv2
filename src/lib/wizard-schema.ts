import { z } from "zod";

export const MAX_GALLERY_IMAGES = 10;
export const MAX_TIMELINE_IMAGES = 24;

export const paymentSchema = z.object({
  payerFirstName: z.string().min(1, "Nome é obrigatório.").optional(),
  payerLastName: z.string().min(1, "Sobrenome é obrigatório.").optional(),
  payerEmail: z.string().email("E-mail inválido.").optional(),
  payerCpf: z.string().optional(),
});

export const fileWithPreviewSchema = z.object({
  url: z.string().url({ message: "URL de pré-visualização inválida." }),
  path: z.string(),
});
export type FileWithPreview = z.infer<typeof fileWithPreviewSchema>;

export const timelineEventSchema = z.object({
  id: z.string().optional(),
  image: fileWithPreviewSchema.optional(),
  description: z.string().optional(),
  date: z.date().optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const quizOptionSchema = z.object({
  text: z.string().min(1, "A opção não pode estar vazia."),
});

export const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "A pergunta não pode estar vazia."),
  options: z.array(quizOptionSchema).min(2, "Mínimo de 2 opções.").max(5, "Máximo de 5 opções."),
  correctAnswerIndex: z.number({ required_error: "Selecione a resposta correta." }).nullable(),
});

export const wordGameQuestionSchema = z.object({
  question: z.string().min(1, "A pergunta não pode estar vazia."),
  answer: z.string().min(1, "A resposta não pode estar vazia."),
  hint: z.string().min(1, "A dica não pode estar vazia."),
});

export const pageSchema = z.object({
  plan: z.string().default('avancado'),
  intentId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().default("Seu Título Aqui"),
  titleColor: z.string().default("#FFFFFF"),
  message: z.string().min(1, "A mensagem não pode estar vazia.").max(2000, "A mensagem pode ter no máximo 2000 caracteres.").default(""),
  messageFontSize: z.string().default("text-base"),
  messageFormatting: z.array(z.string()).default([]),
  specialDate: z.date().optional(),
  countdownStyle: z.string().default("Padrão"),
  countdownColor: z.string().default("#FFFFFF"),
  galleryImages: z.array(fileWithPreviewSchema).max(MAX_GALLERY_IMAGES, `Você pode adicionar no máximo ${MAX_GALLERY_IMAGES} fotos.`).default([]),
  galleryStyle: z.string().default("Coverflow"),
  timelineEvents: z.array(timelineEventSchema).max(MAX_TIMELINE_IMAGES, `Você pode adicionar no máximo ${MAX_TIMELINE_IMAGES} momentos.`).default([]),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: fileWithPreviewSchema.optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("#D14D72"),
  backgroundVideo: fileWithPreviewSchema.optional(),
  enablePuzzle: z.boolean().default(false),
  puzzleImage: fileWithPreviewSchema.optional(),
  puzzleBackgroundAnimation: z.string().optional(),
  enableMemoryGame: z.boolean().default(false),
  memoryGameImages: z.array(fileWithPreviewSchema).default([]),
  enableQuiz: z.boolean().default(false),
  quizQuestions: z.array(quizQuestionSchema).max(5, "Máximo de 5 perguntas.").default([]),
  enableWordGame: z.boolean().default(false),
  wordGameQuestions: z.array(wordGameQuestionSchema).max(4, "Máximo de 4 palavras.").default([]),
  introType: z.string().optional(),
  introGender: z.enum(['fem', 'mas']).default('fem').optional(),
  introFont: z.string().default('cormorant').optional(),
  qrCodeDesign: z.string().default("classic"),
  utmSource: z.string().optional(),
  whatsappNumber: z.string().optional(),
  payment: paymentSchema.optional(),
});

export type PageData = z.infer<typeof pageSchema>;

export const chatDefaultValues: Partial<PageData> = {
  plan: 'avancado',
  title: "",
  titleColor: "#FFFFFF",
  message: "",
  messageFontSize: "text-base",
  messageFormatting: [],
  countdownStyle: "Padrão",
  countdownColor: "#FFFFFF",
  backgroundAnimation: "none",
  galleryStyle: "Coverflow",
  galleryImages: [],
  timelineEvents: [],
  enablePuzzle: false,
  enableMemoryGame: false,
  enableQuiz: false,
  quizQuestions: [],
  enableWordGame: false,
  wordGameQuestions: [],
  memoryGameImages: [],
  musicOption: 'none',
  qrCodeDesign: "classic",
  introGender: 'fem',
  introFont: 'cormorant',
};
