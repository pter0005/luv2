

"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition, DragEvent, useMemo } from "react";
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { useForm, FormProvider, useWatch, useFormContext, useFieldArray, useFormState, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download, Plus, Trash, CalendarIcon, Info, AlertTriangle, Copy, Terminal, Clock, TestTube2, View, Camera, Eye, Lock, CreditCard, ChevronRight as ChevronRightIcon, Gamepad2, HelpCircle, Hourglass, DatabaseZap, XCircle, Gift, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, type Locale } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import Countdown from "./Countdown";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-flip';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import { findYoutubeVideo } from "@/ai/flows/find-youtube-video";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import { createOrUpdatePaymentIntent, processPixPayment, verifyPaymentWithMercadoPago, adminFinalizePage, createStripeCheckoutSession, finalizeWithCredit, finalizeWithGiftToken } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams, useRouter } from 'next/navigation'
import { fileToBase64, compressImage, base64ToBlob } from "@/lib/image-utils";
import { SuggestContentOutput } from "@/ai/flows/ai-powered-content-suggestion";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { signInAnonymously } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PreviewContent from "./PreviewContent";
import FallingHearts from "@/components/effects/FallingHearts";
import StarrySky from "@/components/effects/StarrySky";
import MysticVortex from "@/components/effects/MysticVortex";
import FloatingDots from "@/components/effects/FloatingDots";
import CustomAudioPlayer from "./CustomAudioPlayer";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import NebulaBackground from "@/components/effects/NebulaBackground";
import { FirebaseError } from "firebase/app";
import PayPalButton from "@/components/paypal/PaypalButton";
import MysticFlowers from "@/components/effects/MysticFlowers";
import QrCodeSelector from "./QrCodeSelector";
import { Suspense } from "react";
import { WIZARD_SEGMENTS, DEFAULT_WIZARD_CONFIG, type WizardSegmentKey } from '@/lib/wizard-segment-config';
import { downloadQrCard } from '@/lib/downloadQrCard';
import { trackEvent, trackFunnelStep } from '@/lib/analytics';

const RealPuzzle = dynamic(() => import("@/components/puzzle/Puzzle"), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />
});

const Timeline = dynamic(() => import('./Timeline'), { ssr: false });

const cpfMask = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const MAX_GALLERY_IMAGES = 10;
const MAX_TIMELINE_IMAGES = 24;

const paymentSchema = z.object({
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

const quizOptionSchema = z.object({
  text: z.string().min(1, "A opção não pode estar vazia."),
});

const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "A pergunta não pode estar vazia."),
  options: z.array(quizOptionSchema).min(2, "Mínimo de 2 opções.").max(5, "Máximo de 5 opções."),
  correctAnswerIndex: z.number({ required_error: "Selecione a resposta correta." }).nullable(),
});

const wordGameQuestionSchema = z.object({
  question: z.string().min(1, "A pergunta não pode estar vazia."),
  answer:   z.string().min(1, "A resposta não pode estar vazia."),
  hint:     z.string().min(1, "A dica não pode estar vazia."),
});

const pageSchema = z.object({
  plan: z.string().default('avancado'),
  intentId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().default("Seu Título Aqui"),
  titleColor: z.string().default("#FFFFFF"),
  message: z.string().min(1, "A mensagem não pode estar vazia.").default(""),
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
  qrCodeDesign: z.string().default("classic"),
  utmSource: z.string().optional(),
  payment: paymentSchema.optional(),
});

export type PageData = z.infer<typeof pageSchema>;

// ─────────────────────────────────────────────
// STEP COMPONENTS
// ─────────────────────────────────────────────

const TitleStep = React.memo(({ titlePlaceholder = 'Ex: João & Maria' }: { titlePlaceholder?: string }) => {
    const { control } = useFormContext<PageData>();
    return (
        <div className="space-y-8">
            <FormField control={control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder={titlePlaceholder} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="titleColor" render={({ field }) => (
                <FormItem>
                    <FormLabel>Cor do título</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center gap-4">
                            <Input type="color" className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0" {...field} />
                            <span className="text-sm">Escolha uma cor para o texto</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );
});
TitleStep.displayName = 'TitleStep';

const MessageStep = React.memo(({ messagePlaceholder = 'Sua declaração...' }: { messagePlaceholder?: string }) => {
  const form = useFormContext<PageData>();
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <FormLabel>Sua Mensagem</FormLabel>
                <FormField control={form.control} name="messageFormatting" render={({ field }) => (
                    <ToggleGroup type="multiple" variant="outline" className="justify-start" value={field.value} onValueChange={field.onChange}>
                        <ToggleGroupItem value="bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                    <FormControl><Textarea placeholder={messagePlaceholder} className="min-h-[288px]" {...field} /></FormControl>
                )} />
            </div>
        </div>
    );
});
MessageStep.displayName = 'MessageStep';

const SpecialDateStep = React.memo(() => {
  const { control, setValue, watch } = useFormContext<PageData>();
  const countdownStyle = watch("countdownStyle");
  const titleColor = watch("titleColor");
  const fnsLocale = ptBR;

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <FormLabel>Início do relacionamento</FormLabel>
        <FormField
          control={control}
          name="specialDate"
          render={({ field }) => (
            <FormItem className="flex justify-center">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                locale={fnsLocale}
                className="rounded-md border"
                captionLayout="dropdown-buttons"
                fromYear={1960}
                toYear={new Date().getFullYear()}
              />
            </FormItem>
          )}
        />
        <FormDescription className="text-center">
          Essa data será usada para o contador.
        </FormDescription>
      </div>

      <div className="space-y-4">
        <FormLabel>Modo de Exibição do Contador</FormLabel>
        <FormField
          control={control}
          name="countdownStyle"
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-2 gap-4"
            >
              <FormItem>
                <FormControl>
                  <RadioGroupItem value="Padrão" id="countdown-style-default" className="peer sr-only" />
                </FormControl>
                <Label
                  htmlFor="countdown-style-default"
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                    field.value === "Padrão" ? "border-primary" : "border-muted"
                  )}
                >
                  Padrão
                </Label>
              </FormItem>
              <FormItem>
                <FormControl>
                  <RadioGroupItem value="Simples" id="countdown-style-simple" className="sr-only" />
                </FormControl>
                <Label
                  htmlFor="countdown-style-simple"
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                    field.value === "Simples" ? "border-primary" : "border-muted"
                  )}
                >
                  Simples
                </Label>
              </FormItem>
            </RadioGroup>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormLabel>Cor do Contador</FormLabel>
        <FormField
          control={control}
          name="countdownColor"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                    {...field}
                  />
                  <span>Clique no quadrado para escolher uma cor</span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="link"
          className="p-0 text-primary"
          onClick={() => setValue("countdownColor", titleColor)}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Usar a cor do título
        </Button>
      </div>
    </div>
  );
});
SpecialDateStep.displayName = 'SpecialDateStep';

// Helper: upload a file to Firebase Storage
const uploadFile = async (storage: any, userId: string, file: File | Blob, folderName: string): Promise<FileWithPreview> => {
    if (!userId) throw new Error("Usuário não identificado para upload.");
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = (file instanceof File ? file.name : 'audio.webm').replace(/[^a-zA-Z0-9.]/g, "_");
    const fileName = `${timestamp}-${random}-${safeName}`;
    const fullPath = `temp/${userId}/${folderName}/${fileName}`;
    const fileRef = storageRef(storage, fullPath);
    try {
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        return { url: downloadURL, path: fullPath };
    } catch (error: any) {
        console.error("Erro detalhado no upload:", error);
        throw error;
    }
};

// ─────────────────────────────────────────────
// GALLERY STEP
// ─────────────────────────────────────────────
const GalleryStep = React.memo(() => {
    const { control, formState: { errors } } = useFormContext<PageData>();
    const { fields, append, remove } = useFieldArray({ control, name: "galleryImages" });
    const { user, storage, isUserLoading } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const uploadingRef = useRef(false); // guard contra onChange duplo no mobile
    const lastUploadFinishedRef = useRef(0); // cooldown contra onChange tardio pós-upload
    const { toast } = useToast();
    const isLimitReached = fields.length >= MAX_GALLERY_IMAGES;

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        // Previne disparo duplo do onChange (bug iOS/Android) — inclui cooldown de 2s pós-upload
        if (uploadingRef.current) return;
        if (Date.now() - lastUploadFinishedRef.current < 2000) return;
        // Captura os arquivos e reseta o input imediatamente
        const rawFiles = Array.from(event.target.files);
        event.target.value = '';

        if (isUserLoading) {
            toast({ variant: 'default', title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        if (!user || !storage) {
            toast({ variant: 'destructive', title: 'Sessão expirada', description: 'Faça login novamente para continuar.' });
            return;
        }
        const availableSlots = MAX_GALLERY_IMAGES - fields.length;
        if (availableSlots <= 0) return;

        // Deduplica por nome+tamanho para evitar arquivos idênticos
        const seen = new Set<string>();
        const uniqueFiles = rawFiles.filter(f => {
            const key = `${f.name}_${f.size}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, availableSlots);

        if (uniqueFiles.length === 0) return;

        uploadingRef.current = true;
        setIsUploading(true);
        try {
            const uploadPromises = uniqueFiles.map(async file => {
                const compressedFile = await compressImage(file, 1280, 0.9);
                return uploadFile(storage, user.uid, compressedFile, 'gallery');
            });
            const newImageObjects = await Promise.all(uploadPromises);
            append(newImageObjects);
            toast({ title: 'Imagens enviadas!', description: `${newImageObjects.length} foto${newImageObjects.length > 1 ? 's' : ''} adicionada${newImageObjects.length > 1 ? 's' : ''}.` });
        } catch (error: any) {
            console.error("Error uploading files:", error);
            const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: (
                    <div>
                        <p>Não foi possível enviar as imagens.</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                    </div>
                )
            });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
            lastUploadFinishedRef.current = Date.now(); // marca fim para o cooldown
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = fields[index];
        if ('path' in imageToRemove && typeof (imageToRemove as any).path === 'string' && storage) {
            const imageRef = storageRef(storage, (imageToRemove as any).path);
            deleteObject(imageRef).catch(err => console.error("Failed to delete image from storage:", err));
        }
        remove(index);
    };

    return (
        <div className="space-y-8">
            <ImageLimitWarning currentCount={fields.length} limit={MAX_GALLERY_IMAGES} itemType='fotos na galeria' />
            <div className="space-y-2">
                <FormLabel>Suas Fotos para a galeria</FormLabel>
                <FormControl>
                    <label
                        htmlFor="photo-upload"
                        className={cn(
                            "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block",
                            (isLimitReached || isUploading) && "cursor-not-allowed opacity-50"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-2 animate-spin" />
                        ) : (
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                        )}
                        <p className="font-semibold">{isUploading ? 'Enviando...' : 'Clique para adicionar fotos'}</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF (Qualidade original)</p>
                        <input
                            id="photo-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isLimitReached || isUploading}
                        />
                    </label>
                </FormControl>
                {fields && fields.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 mt-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="relative group aspect-square">
                                <Image
                                    src={(field as any).url || 'https://via.placeholder.com/150'}
                                    alt={`Pré-visualização da imagem ${index + 1}`}
                                    fill
                                    className="rounded-md object-cover"
                                    unoptimized
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-2 z-10"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-4 pt-6 border-t">
                <FormLabel className="text-base font-semibold">Modo de Exibição da Galeria</FormLabel>
                <FormField
                    control={control}
                    name="galleryStyle"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {["Coverflow", "Cards", "Flip", "Cube"].map((style) => (
                                        <div key={style}>
                                            <RadioGroupItem value={style} id={`style-${style}`} className="sr-only" />
                                            <Label
                                                htmlFor={`style-${style}`}
                                                className={cn(
                                                    "flex items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:bg-accent transition-all",
                                                    field.value === style ? "border-primary bg-primary/5" : "border-muted"
                                                )}
                                            >
                                                {style}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
});
GalleryStep.displayName = 'GalleryStep';

// ─────────────────────────────────────────────
// TIMELINE STEP
// ─────────────────────────────────────────────
const TimelineStep = React.memo(() => {
    const { control, formState: { errors } } = useFormContext<PageData>();
    const { fields, remove, append } = useFieldArray({ control, name: "timelineEvents" });
    const { user, storage, isUserLoading } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const uploadingRef = useRef(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fnsLocale = ptBR;
    const isLimitReached = fields.length >= MAX_TIMELINE_IMAGES;

    const handleBulkImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        if (uploadingRef.current) return;
        const rawFiles = Array.from(event.target.files);
        event.target.value = '';

        if (isUserLoading) {
            toast({ variant: 'default', title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        if (!user || !storage) {
            toast({ variant: 'destructive', title: 'Sessão expirada', description: 'Faça login novamente para continuar.' });
            return;
        }
        const availableSlots = MAX_TIMELINE_IMAGES - fields.length;
        if (availableSlots <= 0) {
            toast({ variant: 'destructive', title: 'Limite Excedido', description: `Você já atingiu o limite de ${MAX_TIMELINE_IMAGES} momentos.` });
            return;
        }
        const seen = new Set<string>();
        const filesToUpload = rawFiles.filter(f => {
            const key = `${f.name}_${f.size}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, availableSlots);
        if (filesToUpload.length === 0) return;
        uploadingRef.current = true;
        setIsUploading(true);
        try {
            const uploadPromises = filesToUpload.map(async (file) => {
                const compressedFile = await compressImage(file, 1280, 0.85);
                return uploadFile(storage, user.uid, compressedFile, 'timeline');
            });
            const uploadedFiles = await Promise.all(uploadPromises);
            // FIX: sem id manual — useFieldArray gerencia IDs sozinho
            const newEvents: TimelineEvent[] = uploadedFiles.map(fileData => ({
                image: fileData,
                description: '',
                date: undefined,
            }));
            append(newEvents);
            toast({
                title: `${uploadedFiles.length} foto${uploadedFiles.length > 1 ? 's' : ''} adicionada${uploadedFiles.length > 1 ? 's' : ''}!`,
                description: 'Adicione uma descrição e data para cada momento.',
            });
        } catch (error: any) {
            console.error("Erro no upload da timeline:", error);
            const errorCode = error instanceof FirebaseError ? error.code : (error?.message || 'unknown');
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: (
                    <div>
                        <p>Não foi possível enviar as imagens.</p>
                        <p className="font-mono text-xs mt-2 opacity-80">ERR: {errorCode}</p>
                    </div>
                )
            });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
        }
    };

    const handleRemove = (index: number) => {
        const eventToRemove = fields[index];
        if ((eventToRemove as any).image?.path && storage) {
            const imageRef = storageRef(storage, (eventToRemove as any).image.path);
            deleteObject(imageRef).catch(err => console.error("Erro ao deletar imagem do storage:", err));
        }
        remove(index);
    };

    return (
        <div className="space-y-6">
            <ImageLimitWarning currentCount={fields.length} limit={MAX_TIMELINE_IMAGES} itemType="momentos na linha do tempo" />
            {errors.timelineEvents?.root && (
                <p className="text-sm font-medium text-destructive">{errors.timelineEvents.root.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
                Adicione momentos importantes. Eles aparecerão na sua linha do tempo 3D.
            </p>
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                {fields.length === 0 && !isUploading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <Camera className="w-10 h-10 mb-4" />
                        <p className="font-semibold">Sua linha do tempo está vazia</p>
                        <p className="text-sm">Use o botão abaixo para adicionar seus momentos.</p>
                    </div>
                )}
                {fields.map((field, index) => {
                    const imageUrl: string | undefined = (field as any)?.image?.url;
                    return (
                        <Card key={field.id} className="p-4 bg-card/80 flex flex-col sm:flex-row gap-4 items-start relative">
                            <div className="flex-shrink-0">
                                <div className={cn(
                                    "w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden relative bg-background",
                                    imageUrl && "border-solid border-primary/30"
                                )}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={`Momento ${index + 1}`} className="w-full h-full object-cover rounded-md" loading="lazy" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow space-y-2">
                                <FormField
                                    control={control}
                                    name={`timelineEvents.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Descreva este momento..." className="bg-background min-h-[50px] sm:min-h-[80px]" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`timelineEvents.${index}.date`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value
                                                                ? format(new Date(field.value), "PPP", { locale: fnsLocale })
                                                                : <span>Escolha a data</span>
                                                            }
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                        initialFocus
                                                        locale={fnsLocale}
                                                        captionLayout="dropdown-buttons"
                                                        fromYear={1960}
                                                        toYear={new Date().getFullYear()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 p-2 h-auto w-auto text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemove(index)}
                            >
                                <Trash className="w-4 h-4" />
                            </Button>
                        </Card>
                    );
                })}
            </div>
            <FormControl>
                <label
                    htmlFor="timeline-images-upload"
                    className={cn(
                        buttonVariants({ size: "lg" }),
                        "w-full",
                        isLimitReached || isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    )}
                >
                    <input
                        id="timeline-images-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleBulkImageUpload}
                        disabled={isLimitReached || isUploading}
                        ref={fileInputRef}
                    />
                    {isUploading
                        ? <><Loader2 className="mr-2 animate-spin" /> Enviando...</>
                        : <><Upload className="mr-2" /> Adicionar Fotos para a Linha do Tempo</>
                    }
                </label>
            </FormControl>
        </div>
    );
});
TimelineStep.displayName = 'TimelineStep';

// ─────────────────────────────────────────────
// MUSIC STEP
// ─────────────────────────────────────────────
const MusicStep = React.memo(() => {
    const { control, setValue, getValues } = useFormContext<PageData>();
    const { user, storage, isUserLoading } = useFirebase();
    const { toast } = useToast();
    const musicOption = useWatch({ control, name: "musicOption" });
    const youtubeUrl = useWatch({ control, name: "youtubeUrl" });
    const [isSearching, startSearchTransition] = useTransition();
    const [showManualLinkInput, setShowManualLinkInput] = useState(false);
    const manualLinkInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading'>('idle');
    const audioRecording = useWatch({ control, name: "audioRecording" });

    const handleSearchMusic = () => {
        const sName = getValues("songName");
        const aName = getValues("artistName");
        if (!sName) {
            toast({ variant: "destructive", title: 'O nome da música é obrigatório' });
            return;
        }
        startSearchTransition(async () => {
            try {
                const result = await findYoutubeVideo({ songName: sName, artistName: aName || '' });
                if (result.url) {
                    setValue("youtubeUrl", result.url, { shouldDirty: true });
                    toast({ title: 'Música conectada!', description: 'Sua música foi encontrada no YouTube.' });
                }
            } catch (e: any) {
                toast({ variant: "destructive", title: 'Erro na Busca', description: e.message || 'Não foi possível encontrar um vídeo.' });
            }
        });
    };

    const handleSetManualLink = () => {
        const manualUrl = manualLinkInputRef.current?.value;
        if (manualUrl && manualUrl.startsWith("http")) {
            setValue("youtubeUrl", manualUrl, { shouldDirty: true, shouldValidate: true });
            toast({ title: 'Link adicionado!', description: 'A música do link foi adicionada.' });
        } else {
            toast({ variant: "destructive", title: 'Link inválido', description: 'Por favor, insira um link válido do YouTube.' });
        }
    };

    const uploadRecording = async (audioBlob: Blob) => {
        if (isUserLoading) {
            toast({ variant: 'default', title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        if (!storage || !user) {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível salvar sua gravação. Faça login novamente.' });
            return;
        }
        setRecordingStatus('uploading');
        try {
            const fileData = await uploadFile(storage, user.uid, audioBlob, 'audio');
            setValue("audioRecording", fileData, { shouldDirty: true, shouldValidate: true });
            setRecordingStatus('recorded');
            toast({ title: 'Gravação Salva!', description: 'Sua mensagem de voz foi salva com segurança.' });
        } catch (error: any) {
            console.error("Error uploading audio:", error);
            setRecordingStatus('recorded');
            const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: (
                    <div>
                        <p>Não foi possível salvar sua gravação.</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                    </div>
                )
            });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setValue("audioRecording", undefined, { shouldDirty: true });
            mediaRecorderRef.current.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                uploadRecording(audioBlob);
                audioChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setRecordingStatus("recording");
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            toast({
                variant: "destructive",
                title: 'Erro no Microfone',
                description: (
                    <div>
                        <p>Não foi possível acessar o microfone. Verifique as permissões do navegador.</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {err.name || 'unknown'}</p>
                    </div>
                )
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="musicOption"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Escolha a trilha sonora</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setValue("youtubeUrl", "");
                                    setShowManualLinkInput(false);
                                }}
                                defaultValue={field.value}
                                className="flex flex-col space-y-2"
                            >
                                <FormItem>
                                    <FormControl><RadioGroupItem value="none" id="music-none" className="peer sr-only" /></FormControl>
                                    <Label htmlFor="music-none" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Nenhum Som</Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl><RadioGroupItem value="record" id="music-record" className="peer sr-only" /></FormControl>
                                    <Label htmlFor="music-record" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Gravar Mensagem de Voz <Mic className="h-5 w-5" /></Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl><RadioGroupItem value="youtube" id="music-youtube" className="peer sr-only" /></FormControl>
                                    <Label htmlFor="music-youtube" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Usar Música do YouTube <Youtube className="h-5 w-5" /></Label>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {musicOption === 'youtube' && (
                <div className="space-y-4 rounded-lg border bg-card/80 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={control} name="songName" render={({ field }) => (
                            <FormItem><FormLabel>Nome da Música</FormLabel><FormControl><Input placeholder="Ex: Perfect" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={control} name="artistName" render={({ field }) => (
                            <FormItem><FormLabel>Nome do Artista</FormLabel><FormControl><Input placeholder="Ex: Ed Sheeran" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <Button type="button" onClick={handleSearchMusic} disabled={isSearching} className="w-full">
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search className="mr-2" />}
                        Buscar com IA
                    </Button>
                    {youtubeUrl && !isSearching && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-sm text-center text-muted-foreground mb-2">A música não está correta?</p>
                            <Button type="button" variant="secondary" className="w-full" onClick={() => setShowManualLinkInput(!showManualLinkInput)}>
                                Usar um link direto do YouTube
                            </Button>
                        </div>
                    )}
                    {showManualLinkInput && (
                        <div className="mt-4 space-y-2">
                            <FormLabel htmlFor="manual-link">Usar um link direto do YouTube</FormLabel>
                            <div className="flex gap-2">
                                <Input id="manual-link" ref={manualLinkInputRef} placeholder="Cole o link aqui..." />
                                <Button type="button" onClick={handleSetManualLink}>OK</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {musicOption === 'record' && (
                <div className="space-y-4 rounded-lg border bg-card/80 p-4">
                    <h4 className="font-semibold">Gravador de Voz</h4>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {recordingStatus === "idle" && <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Gravar</Button>}
                        {recordingStatus === "recording" && <Button type="button" onClick={stopRecording} variant="destructive"><StopCircle className="mr-2 h-4 w-4" />Parar</Button>}
                        {recordingStatus === "recorded" && <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Gravar Novamente</Button>}
                        {recordingStatus === 'uploading' && <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</Button>}
                        {audioRecording?.url && <audio src={audioRecording.url} controls className="w-full" />}
                    </div>
                    <p className="text-sm text-muted-foreground text-center sm:text-left mt-2">
                        {recordingStatus === 'recording' && 'Gravando...'}
                        {recordingStatus === 'recorded' && 'Gravação concluída. Ouça acima.'}
                    </p>
                </div>
            )}
        </div>
    );
});
MusicStep.displayName = 'MusicStep';

// ─────────────────────────────────────────────
// BACKGROUND STEP
// ─────────────────────────────────────────────
const BackgroundStep = React.memo(({ isVisible }: { isVisible: boolean }) => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const backgroundAnimation = watch("backgroundAnimation");
    const titleColor = watch("titleColor");
    const [isClient, setIsClient] = useState(false);

    const animationOptions = [
        { id: "none", name: 'Nenhuma' },
        { id: "falling-hearts", name: 'Chuva de Corações', isFavorite: true },
        { id: "starry-sky", name: 'Céu Estrelado', isFavorite: true },
        { id: "nebula", name: 'Nebulosa Galáctica' },
        { id: 'mystic-flowers', name: 'Flores Nascendo', isFavorite: true },
        { id: "floating-dots", name: 'Pontos Coloridos' },
        { id: "clouds", name: 'Nuvens' },
    ];

    useEffect(() => { setIsClient(true); }, []);

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="backgroundAnimation"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Escolha a Animação</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                {animationOptions.map((option) => (
                                    <FormItem key={option.id}>
                                        <FormControl>
                                            <RadioGroupItem value={option.id} id={`anim-${option.id}`} className="peer sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor={`anim-${option.id}`}
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 h-24 text-sm relative overflow-hidden group/item cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                                field.value === option.id ? "border-primary" : "border-muted"
                                            )}
                                        >
                                            {isClient && isVisible && (
                                                <div className="absolute inset-0 w-full h-full opacity-30 group-hover/item:opacity-40 -z-10">
                                                    {option.id === "falling-hearts" && <div className="w-full h-full relative overflow-hidden"><FallingHearts count={50} color={watch("heartColor")} /></div>}
                                                    {option.id === "starry-sky" && <div className="w-full h-full relative overflow-hidden"><StarrySky /></div>}
                                                    {option.id === "nebula" && <div className="w-full h-full relative overflow-hidden"><NebulaBackground /></div>}
                                                    {option.id === "floating-dots" && <div className="w-full h-full relative overflow-hidden"><FloatingDots /></div>}
                                                    {option.id === 'mystic-flowers' && <div className="w-full h-full relative overflow-hidden"><MysticFlowers /></div>}
                                                    {option.id === "clouds" && <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover"><source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" /></video>}
                                                </div>
                                            )}
                                            {option.isFavorite && <Heart className="absolute top-2 left-2 w-4 h-4 text-pink-400 fill-pink-400" />}
                                            <span className="relative z-10">{option.name}</span>
                                        </Label>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {backgroundAnimation === 'falling-hearts' && (
                <FormField
                    control={control}
                    name="heartColor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cor dos Corações</FormLabel>
                            <FormControl>
                                <div className="relative flex items-center gap-4">
                                    <Input type="color" className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0" {...field} />
                                    <span className="text-sm">Clique no quadrado para escolher uma cor</span>
                                </div>
                            </FormControl>
                            <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setValue("heartColor", titleColor, { shouldDirty: true })}>
                                <Pipette className="mr-2 h-4 w-4" />
                                Usar a cor do título
                            </Button>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
});
BackgroundStep.displayName = 'BackgroundStep';

// ─────────────────────────────────────────────
// INTRO STEP — Introdução animada do site (+R$5,90)
// ─────────────────────────────────────────────
const INTRO_PRICE = 5.90;

const IntroStep = React.memo(() => {
    const { control, watch } = useFormContext<PageData>();
    const introType = watch('introType');
    const enabled = introType === 'love';

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="introType"
                render={({ field }) => (
                    <FormItem>
                        <button
                            type="button"
                            onClick={() => field.onChange(field.value === 'love' ? undefined : 'love')}
                            className={cn(
                                "w-full relative rounded-2xl overflow-hidden p-5 text-left transition-all duration-300 border-2",
                                enabled
                                    ? "border-pink-400 shadow-2xl shadow-pink-400/20"
                                    : "border-white/10 hover:border-pink-400/40"
                            )}
                            style={{
                                background: enabled
                                    ? 'linear-gradient(135deg, rgba(45,17,82,0.95) 0%, rgba(26,10,46,0.95) 50%, rgba(45,17,82,0.95) 100%)'
                                    : 'rgba(255,255,255,0.03)',
                            }}
                        >
                            {enabled && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #5ee8b5, #3dd4a0)' }}>
                                    <svg width="12" height="12" viewBox="0 0 8 8" fill="none">
                                        <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="shrink-0" style={{ animation: enabled ? 'bunnyBounce 2s ease-in-out infinite' : 'none' }}>
                                    <svg width="48" height="64" viewBox="0 0 120 160" fill="none">
                                        <ellipse cx="60" cy="120" rx="24" ry="18" fill="#fff" stroke="#cbaabb" strokeWidth="1.8"/>
                                        <circle cx="38" cy="118" r="6" fill="#fff" stroke="#cbaabb" strokeWidth="1.2"/>
                                        <ellipse cx="48" cy="136" rx="8" ry="5" fill="#fff" stroke="#cbaabb" strokeWidth="1.4"/>
                                        <ellipse cx="72" cy="136" rx="8" ry="5" fill="#fff" stroke="#cbaabb" strokeWidth="1.4"/>
                                        <path d="M45 52 C38 49,35 28,40 12 C42 6,48 5,50 12 C54 28,53 49,45 52Z" fill="#fff" stroke="#cbaabb" strokeWidth="1.8"/>
                                        <path d="M46 46 C41 44,39 30,42 19 C43 14,47 14,48 19 C50 30,49 44,46 46Z" fill="#ffc8e0"/>
                                        <path d="M75 52 C82 49,85 28,80 12 C78 6,72 5,70 12 C66 28,67 49,75 52Z" fill="#fff" stroke="#cbaabb" strokeWidth="1.8"/>
                                        <path d="M74 46 C79 44,81 30,78 19 C77 14,73 14,72 19 C70 30,71 44,74 46Z" fill="#ffc8e0"/>
                                        <ellipse cx="60" cy="70" rx="34" ry="30" fill="#fff" stroke="#cbaabb" strokeWidth="2"/>
                                        <circle cx="48" cy="68" r="5" fill="#1a1018"/><ellipse cx="46" cy="66" rx="2.5" ry="2.2" fill="#fff"/>
                                        <circle cx="72" cy="68" r="5" fill="#1a1018"/><ellipse cx="70" cy="66" rx="2.5" ry="2.2" fill="#fff"/>
                                        <ellipse cx="38" cy="77" rx="9" ry="6" fill="#ffb6c1" fillOpacity="0.45"/>
                                        <ellipse cx="82" cy="77" rx="9" ry="6" fill="#ffb6c1" fillOpacity="0.45"/>
                                        <path d="M60 76 C58 73,55 74,57 76 C57.5 77,60 79,60 79 C60 79,62.5 77,63 76 C65 74,62 73,60 76Z" fill="#ff90ac"/>
                                        <path d="M55 82 Q60 88,65 82" stroke="#b07888" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <style>{`@keyframes bunnyBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-white">Coelhinho Kawaii</h3>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                            style={{ background: 'linear-gradient(135deg, #ff8aab, #ff5e8a)', color: 'white' }}>
                                            NOVO
                                        </span>
                                    </div>
                                    <p className="text-[12px] mt-1.5 leading-snug text-white/50">
                                        Intro interativa &quot;Você me ama?&quot; com 7 reações + celebração com corações + revelação cinematográfica da sua página
                                    </p>
                                    <ul className="mt-3 space-y-1.5">
                                        {['Animação interativa antes da página', 'Coelhinho com reações ao toque', 'Revelação cinematográfica'].map((t, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[11px] text-white/60">
                                                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className={cn(
                                "w-full mt-4 p-2.5 text-center font-bold text-sm rounded-xl transition-all",
                                enabled ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-white/40"
                            )}>
                                {enabled ? 'Ativado!' : 'Toque para adicionar'}
                            </div>
                        </button>
                    </FormItem>
                )}
            />
        </div>
    );
});
IntroStep.displayName = "IntroStep";

// ─────────────────────────────────────────────
// PUZZLE STEP — FIX #5: toast quando !user || !storage
// ─────────────────────────────────────────────
const PuzzleStep = React.memo(({ handleAutosave }: { handleAutosave?: () => Promise<void> }) => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const { user, storage, isUserLoading } = useFirebase();
    const enablePuzzle = watch("enablePuzzle");
    const puzzleImage = watch("puzzleImage");
    const plan = watch("plan");
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (isUserLoading) {
            toast({ variant: 'default', title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        // FIX #5: error toast quando user/storage null após loading
        if (!user || !storage) {
            toast({ variant: 'destructive', title: 'Sessão expirada', description: 'Faça login novamente para continuar.' });
            return;
        }
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setIsProcessing(true);
            try {
                const compressedBlob = await compressImage(file, 1280, 0.9);
                const fileData = await uploadFile(storage, user.uid, compressedBlob, 'puzzle');
                setValue("puzzleImage", fileData, { shouldValidate: true, shouldDirty: true });
                await handleAutosave?.();
                toast({ title: 'Imagem enviada!', description: 'Sua foto foi adicionada.' });
            } catch (error: any) {
                console.error("Error processing puzzle image:", error);
                const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
                toast({
                    variant: 'destructive',
                    title: 'Erro no Upload',
                    description: (
                        <div>
                            <p>Não foi possível enviar a imagem.</p>
                            <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                        </div>
                    )
                });
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const removePuzzleImage = async () => {
        if (puzzleImage?.path && storage) {
            const imageRef = storageRef(storage, puzzleImage.path);
            deleteObject(imageRef).catch(err => console.error("Failed to delete puzzle image from storage:", err));
        }
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
        await handleAutosave?.();
        toast({ title: 'Imagem removida' });
    };

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enablePuzzle"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Quebra-Cabeça</FormLabel>
                            <FormDescription>Exigir que o quebra-cabeça seja resolvido para ver a página.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {enablePuzzle && (
                <div className="space-y-4">
                    <FormLabel>Imagem do Quebra-Cabeça</FormLabel>
                    {!puzzleImage?.url ? (
                        <FormControl>
                            <label
                                htmlFor="puzzle-photo-upload"
                                className={cn(
                                    "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block",
                                    isProcessing && "cursor-not-allowed opacity-50"
                                )}
                            >
                                {isProcessing ? (
                                    <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-2 animate-spin" />
                                ) : (
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                                )}
                                <p className="font-semibold">{isProcessing ? 'Processando...' : 'Clique para adicionar uma foto'}</p>
                                <p className="text-xs text-muted-foreground">A imagem será transformada em quebra-cabeça.</p>
                                <input id="puzzle-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePuzzleImageChange} disabled={isProcessing} />
                            </label>
                        </FormControl>
                    ) : (
                        <div className="w-full flex flex-col items-center gap-6">
                            <div className="w-full max-w-[300px] mx-auto">
                                <RealPuzzle imageSrc={puzzleImage.url} />
                            </div>
                            <Button type="button" variant="destructive" onClick={removePuzzleImage} size="sm">
                                <X className="mr-2 h-4 w-4" />Remover Imagem
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
PuzzleStep.displayName = 'PuzzleStep';

// ─────────────────────────────────────────────
// MEMORY GAME STEP — FIX #4: isUserLoading adicionado
// ─────────────────────────────────────────────
const MemoryGameStep = React.memo(() => {
    const { control, watch } = useFormContext<PageData>();
    // FIX #4: isUserLoading incluído para evitar falha silenciosa
    const { user, storage, isUserLoading } = useFirebase();
    const { toast } = useToast();
    const { fields, append, remove } = useFieldArray({ control, name: "memoryGameImages" });
    const [isUploading, setIsUploading] = useState(false);
    const uploadingRef = useRef(false);
    const lastUploadFinishedRef = useRef(0);
    const enableMemoryGame = watch("enableMemoryGame");
    const MAX_IMAGES = 8;
    const isLimitReached = fields.length >= MAX_IMAGES;

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        if (uploadingRef.current) return;
        if (Date.now() - lastUploadFinishedRef.current < 2000) return;
        const rawFiles = Array.from(event.target.files);
        event.target.value = '';

        if (isUserLoading) {
            toast({ variant: 'default', title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        if (!user || !storage) {
            toast({ variant: 'destructive', title: 'Sessão expirada', description: 'Faça login novamente para continuar.' });
            return;
        }
        const availableSlots = MAX_IMAGES - fields.length;
        if (availableSlots <= 0) return;

        const seen = new Set<string>();
        const uniqueFiles = rawFiles.filter(f => {
            const key = `${f.name}_${f.size}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, availableSlots);

        if (uniqueFiles.length === 0) return;

        uploadingRef.current = true;
        setIsUploading(true);
        try {
            const uploadPromises = uniqueFiles.map(async file => {
                const compressedFile = await compressImage(file, 400, 0.8);
                return uploadFile(storage, user.uid, compressedFile, 'memory-game');
            });
            const newImageObjects = await Promise.all(uploadPromises);
            append(newImageObjects);
            toast({ title: 'Imagens enviadas!', description: `${newImageObjects.length} foto${newImageObjects.length > 1 ? 's' : ''} adicionada${newImageObjects.length > 1 ? 's' : ''}.` });
        } catch (error: any) {
            console.error("Error uploading memory game files:", error);
            const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: (
                    <div>
                        <p>Não foi possível enviar as imagens.</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                    </div>
                )
            });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
            lastUploadFinishedRef.current = Date.now();
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = fields[index];
        if ('path' in imageToRemove && typeof (imageToRemove as any).path === 'string' && storage) {
            const imageRef = storageRef(storage, (imageToRemove as any).path);
            deleteObject(imageRef).catch(err => console.error("Failed to delete image from storage:", err));
        }
        remove(index);
    };

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enableMemoryGame"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Jogo da Memória</FormLabel>
                            <FormDescription>Crie um jogo de memória divertido com suas fotos.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {enableMemoryGame && (
                <div className="space-y-4">
                    <FormLabel>Imagens para o Jogo da Memória</FormLabel>
                    <ImageLimitWarning currentCount={fields.length} limit={MAX_IMAGES} itemType='fotos para o jogo' />
                    <FormControl>
                        <label
                            htmlFor="memory-game-upload"
                            className={cn(
                                "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block",
                                (isLimitReached || isUploading) && "cursor-not-allowed opacity-50"
                            )}
                        >
                            {isUploading ? <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-2 animate-spin" /> : <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />}
                            <p className="font-semibold">{isUploading ? 'Enviando...' : 'Adicionar fotos para o jogo'}</p>
                            <p className="text-xs text-muted-foreground">Adicione de 2 a 8 fotos para o jogo.</p>
                            <input id="memory-game-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLimitReached || isUploading} />
                        </label>
                    </FormControl>
                    {fields.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative group aspect-square">
                                    <Image src={(field as any).url || 'https://via.placeholder.com/150'} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" unoptimized />
                                    <Button type="button" variant="destructive" className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-2 z-10" onClick={() => removeImage(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
MemoryGameStep.displayName = 'MemoryGameStep';

// ─────────────────────────────────────────────
// QUIZ STEP
// ─────────────────────────────────────────────
const QuizQuestionForm = ({ qIndex, removeQuestion, MAX_OPTIONS }: { qIndex: number, removeQuestion: (index: number) => void, MAX_OPTIONS: number }) => {
    const { control, formState: { errors } } = useFormContext<PageData>();
    const { fields, append, remove } = useFieldArray({ control, name: `quizQuestions.${qIndex}.options` });
    const questionErrors = errors.quizQuestions?.[qIndex];

    return (
        <Card className="p-4 bg-card/80 relative">
            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(qIndex)}>
                <Trash className="w-4 h-4" />
            </Button>
            <div className="space-y-4">
                <FormField
                    control={control}
                    name={`quizQuestions.${qIndex}.questionText`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pergunta {qIndex + 1}</FormLabel>
                            <FormControl><Input placeholder='Qual é a nossa música?' {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="space-y-2">
                    <FormLabel>Opções de Resposta</FormLabel>
                    <FormDescription>Marque a opção correta. Mínimo de 2, máximo de 5.</FormDescription>
                    <FormField
                        control={control}
                        name={`quizQuestions.${qIndex}.correctAnswerIndex`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <RadioGroup onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                                        {fields.map((option, oIndex) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                                                <div className="flex-grow">
                                                    <FormField
                                                        control={control}
                                                        name={`quizQuestions.${qIndex}.options.${oIndex}.text`}
                                                        render={({ field }) => <Input placeholder={`Opção ${oIndex + 1}`} {...field} />}
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(oIndex)} disabled={fields.length <= 2}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                {(questionErrors as any)?.correctAnswerIndex && <FormMessage>{(questionErrors as any).correctAnswerIndex.message}</FormMessage>}
                            </FormItem>
                        )}
                    />
                </div>
                {fields.length < MAX_OPTIONS && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => append({ text: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                    </Button>
                )}
            </div>
        </Card>
    );
};

const QuizStep = React.memo(() => {
    const { control, watch } = useFormContext<PageData>();
    const enableQuiz = watch("enableQuiz");
    const { fields, append, remove } = useFieldArray({ control, name: "quizQuestions" });
    const MAX_QUESTIONS = 5;

    const addQuestion = () => {
        if (fields.length < MAX_QUESTIONS) {
            append({ questionText: '', options: [{ text: '' }, { text: '' }], correctAnswerIndex: null });
        }
    };

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enableQuiz"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Quiz do Casal</FormLabel>
                            <FormDescription>Adicionar um quiz divertido sobre vocês dois.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {enableQuiz && (
                <div className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Dica de Mestre</AlertTitle>
                        <AlertDescription>Crie perguntas que só vocês dois saberiam a resposta para tornar o jogo mais íntimo e divertido!</AlertDescription>
                    </Alert>
                    {fields.map((question, qIndex) => (
                        <QuizQuestionForm key={question.id} qIndex={qIndex} removeQuestion={remove} MAX_OPTIONS={5} />
                    ))}
                    {fields.length < MAX_QUESTIONS && (
                        <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                            <Plus className="mr-2" /> Adicionar Pergunta ({fields.length}/{MAX_QUESTIONS})
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});
QuizStep.displayName = 'QuizStep';

// ─────────────────────────────────────────────
// WORD GAME STEP
// ─────────────────────────────────────────────
const WordGameStep = React.memo(() => {
    const { control, watch } = useFormContext<PageData>();
    const enableWordGame = watch("enableWordGame");
    const { fields, append, remove } = useFieldArray({ control, name: "wordGameQuestions" });
    const MAX_WORDS = 4;

    const addWord = () => {
        if (fields.length < MAX_WORDS) {
            append({ question: '', answer: '', hint: '' });
        }
    };

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enableWordGame"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Adivinhe a Palavra 💘</FormLabel>
                            <FormDescription>A pessoa amada tenta adivinhar suas respostas letra por letra.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}
            />
            {enableWordGame && (
                <div className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Como funciona</AlertTitle>
                        <AlertDescription>
                            Você escreve uma pergunta e a resposta secreta. A pessoa amada vai tentando adivinhar letra por letra — como um jogo de forca romântico! A dica aparece se ela pedir ajuda.
                        </AlertDescription>
                    </Alert>
                    {fields.map((wordField, wIndex) => (
                        <div key={wordField.id} className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-muted-foreground">Palavra {wIndex + 1}</span>
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(wIndex)} className="text-destructive hover:text-destructive">
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>
                            <FormField
                                control={control}
                                name={`wordGameQuestions.${wIndex}.question`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pergunta</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Ex: "O que mais amo em você?"' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`wordGameQuestions.${wIndex}.answer`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resposta secreta</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Ex: "Seus olhos lindos"' />
                                        </FormControl>
                                        <FormDescription className="text-xs">Só letras e espaços. Evite respostas muito longas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`wordGameQuestions.${wIndex}.hint`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dica 💡</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Ex: "Pensa no que você mais nota nele/ela"' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    ))}
                    {fields.length < MAX_WORDS && (
                        <Button type="button" variant="outline" onClick={addWord} className="w-full">
                            <Plus className="mr-2" /> Adicionar Palavra ({fields.length}/{MAX_WORDS})
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});
WordGameStep.displayName = 'WordGameStep';

// ─────────────────────────────────────────────
// PLAN STEP
// ─────────────────────────────────────────────
const PlanStep = React.memo(() => {
    const { control } = useFormContext<PageData>();
    const { field } = useController({ name: 'plan', control });
    const { user } = useUser();
    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);

    const [offerExpired, setOfferExpired] = useState(false);
    const [offerTimeLeft, setOfferTimeLeft] = useState(0);
    useEffect(() => {
        let stored = localStorage.getItem('mycupid_offer_deadline');
        if (!stored) {
            const deadline = Date.now() + 15 * 60 * 1000; // 15 minutos
            localStorage.setItem('mycupid_offer_deadline', String(deadline));
            stored = String(deadline);
        }
        const deadline = parseInt(stored);
        const remaining = Math.max(0, deadline - Date.now());
        if (remaining <= 0) {
            setOfferExpired(true);
            setOfferTimeLeft(0);
        } else {
            setOfferTimeLeft(Math.ceil(remaining / 1000));
        }
        const interval = setInterval(() => {
            const left = Math.max(0, deadline - Date.now());
            if (left <= 0) {
                setOfferExpired(true);
                setOfferTimeLeft(0);
                clearInterval(interval);
            } else {
                setOfferTimeLeft(Math.ceil(left / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const plans: Array<{
        id: string;
        name: string;
        price: string;
        originalPrice?: string;
        description: string;
        features: Array<{ text: string; included: boolean; icon?: any; highlight?: boolean }>;
    }> = [
        {
            id: 'basico',
            name: 'Plano Básico',
            price: '19,90',
            description: 'Uma surpresa impactante com prazo definido.',
            features: [
                { text: 'Todos os recursos de personalização', included: true },
                { text: 'Quebra-cabeça, Jogo da Memória e Quiz', included: true },
                { text: 'Página disponível por 25 horas', included: true, icon: Hourglass },
                { text: 'Página permanente', included: false },
            ]
        },
        {
            id: 'avancado',
            name: 'Plano Avançado',
            price: offerExpired ? '27,90' : '24,90',
            originalPrice: offerExpired ? '34,90' : '29,90',
            description: 'A experiência completa, para sempre.',
            features: [
                { text: 'Todos os recursos de personalização', included: true },
                { text: 'Quebra-cabeça, Jogo da Memória e Quiz', included: true },
                { text: 'Página permanente + backup infinito', included: true, icon: DatabaseZap, highlight: true },
                { text: 'Página disponível por 25 horas', included: false },
            ]
        }
    ];

    const offerMins = String(Math.floor(offerTimeLeft / 60)).padStart(2, '0');
    const offerSecs = String(offerTimeLeft % 60).padStart(2, '0');

    return (
        <div className="space-y-6">
            {/* Countdown banner */}
            {!offerExpired && offerTimeLeft > 0 && (
                <div className="rounded-2xl p-4 text-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(15,10,30,0.9) 100%)',
                        border: '1.5px solid rgba(234,179,8,0.3)',
                    }}>
                    <p className="text-xs text-amber-300/70 uppercase tracking-wider font-bold mb-1">Preço promocional expira em</p>
                    <p className="text-3xl font-black tabular-nums text-amber-400">{offerMins}:{offerSecs}</p>
                    <p className="text-[11px] text-white/40 mt-1">Depois o Plano Avançado sobe para R$27,90</p>
                </div>
            )}
            {offerExpired && (
                <div className="rounded-2xl p-3 text-center"
                    style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1.5px solid rgba(239,68,68,0.25)',
                    }}>
                    <p className="text-xs text-red-400 font-bold">A promoção expirou — preço atualizado</p>
                </div>
            )}
            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((planInfo) => {
                    const isSelected = field.value === planInfo.id;
                    return (
                        <Label key={planInfo.id} htmlFor={`plan-${planInfo.id}`} className={cn(
                            "relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                            "bg-card/50 border-2",
                            isSelected ? "border-primary shadow-2xl shadow-primary/20" : 'border-border hover:border-primary/40'
                        )}>
                            <RadioGroupItem value={planInfo.id} id={`plan-${planInfo.id}`} className="sr-only peer" />
                            {planInfo.id === 'avancado' && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-fit px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-b-lg z-10">MAIS POPULAR</div>
                            )}
                            <div className="p-6 pt-12 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-foreground mb-2">{planInfo.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4 h-10">{planInfo.description}</p>
                                <div className="my-4 text-center">
                                    {planInfo.originalPrice && (
                                      <p className="text-zinc-500 text-lg line-through font-medium">De R${planInfo.originalPrice}</p>
                                    )}
                                    <div className="flex items-baseline gap-1 justify-center">
                                        <span className={`text-foreground ${planInfo.originalPrice ? 'text-5xl' : 'text-4xl'} font-black`}>R${planInfo.price}</span>
                                        <span className="text-muted-foreground text-sm">/pagamento único</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 text-sm flex-grow">
                                    {planInfo.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            {feature.included ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <XCircle className="w-5 h-5 text-muted-foreground/50 shrink-0" />}
                                            <span className={cn('leading-tight', !feature.included && 'line-through text-muted-foreground/70', feature.highlight && 'text-primary font-bold')}>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className={cn("w-full p-3 text-center font-bold text-sm border-t mt-4", isSelected ? 'bg-primary/20 border-primary/30 text-primary-foreground' : 'bg-muted/30 border-border text-muted-foreground')}>
                                {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
                            </div>
                        </Label>
                    );
                })}
            </RadioGroup>
        </div>
    );
});
PlanStep.displayName = "PlanStep";

// ─────────────────────────────────────────────
// FIX #1: stepComponents array — ERA ESTE QUE FALTAVA, CAUSA DO CRASH TOTAL
// Deve mapear exatamente os índices dos steps definidos em WizardInternal
// índice 0→TitleStep, 1→MessageStep, ..., 10→PlanStep
// índice 11 (payment) é tratado separadamente no WizardInternal
// ─────────────────────────────────────────────
const stepComponents: React.ComponentType<any>[] = [
    TitleStep,       // 0 - title
    MessageStep,     // 1 - message
    SpecialDateStep, // 2 - specialDate
    GalleryStep,     // 3 - gallery
    TimelineStep,    // 4 - timeline
    MusicStep,       // 5 - music
    BackgroundStep,  // 6 - background
    IntroStep,       // 7 - intro
    PuzzleStep,      // 8 - puzzle
    MemoryGameStep,  // 9 - memory
    QuizStep,        // 10 - quiz
    WordGameStep,    // 11 - word game
    PlanStep,        // 12 - plan
];

// ─────────────────────────────────────────────
// PAYMENT STEP
// ─────────────────────────────────────────────
const PaymentStep = ({ setPageId }: { setPageId: (id: string) => void; }) => {
    const { getValues, watch, setValue, control } = useFormContext<PageData>();
    const plan = watch('plan') as 'basico' | 'avancado';
    const intentId = watch('intentId');
    const { user } = useUser();
    const [isProcessing, startTransition] = useTransition();
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<{ message: string; details?: any } | null>(null);
    const { toast } = useToast();
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; paymentId: string } | null>(null);
    const [pixExpired, setPixExpired] = useState(false);
    const [pixTimeLeft, setPixTimeLeft] = useState(0);
    const pixCreatedAtRef = useRef<number>(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isBrazilDomain, setIsBrazilDomain] = useState<boolean | null>(null);
    const router = useRouter();

    // Guest email flow: anonymous Firebase users have no email.
    // We collect their email here so we can create a real account after payment.
    const isAnonymousUser = !!user && !user.email;
    const [guestEmailInput, setGuestEmailInput] = useState('');
    const [guestEmailError, setGuestEmailError] = useState('');
    const [confirmedGuestEmail, setConfirmedGuestEmail] = useState('');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    // ── WhatsApp capture ──────────────────────────────────────────
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const formatPhone = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    // ── GIFT TOKEN (link de presente) ─────────────────────────────
    const [giftToken, setGiftToken] = useState<string | null>(null);
    const [giftCredits, setGiftCredits] = useState(0);
    useEffect(() => {
        // Check URL param first (race condition fix: param may not be in localStorage yet)
        const urlToken = new URLSearchParams(window.location.search).get('gift');
        const stored = localStorage.getItem('mycupid_gift_token');
        const token = urlToken || stored;
        if (!token) return;
        if (urlToken) localStorage.setItem('mycupid_gift_token', urlToken);
        fetch(`/api/gift?token=${token}`)
            .then(r => r.json())
            .then(d => {
                if (d.valid) { setGiftToken(token); setGiftCredits(d.credits ?? 1); }
                else localStorage.removeItem('mycupid_gift_token');
            })
            .catch(() => {});
    }, []);
    // ── FIM GIFT TOKEN ─────────────────────────────────────────────

    // ── DESCONTO (link de cupom) ───────────────────────────────────
    const [discountCode, setDiscountCode] = useState<string | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showDiscountBanner, setShowDiscountBanner] = useState(false);
    useEffect(() => {
        const urlCode = new URLSearchParams(window.location.search).get('discount');
        const stored = localStorage.getItem('mycupid_discount_code');
        const code = urlCode || stored;
        if (!code) return;
        if (urlCode) localStorage.setItem('mycupid_discount_code', urlCode);
        fetch(`/api/discount?code=${code}`)
            .then(r => r.json())
            .then(d => {
                if (d.valid) {
                    setDiscountCode(code);
                    setDiscountAmount(d.discount ?? 10);
                    setShowDiscountBanner(true);
                    setTimeout(() => setShowDiscountBanner(false), 5000);
                } else {
                    localStorage.removeItem('mycupid_discount_code');
                }
            })
            .catch(() => {});
    }, []);
    // ── FIM DESCONTO ───────────────────────────────────────────────

    // ── URGENCY TIMER — 15 minutos ────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(15 * 60); // segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const timerMins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const timerSecs = String(timeLeft % 60).padStart(2, '0');
    const timerExpired = timeLeft === 0;
    // ── FIM TIMER ─────────────────────────────────────────────────

    const { firestore } = useFirebase();

    useEffect(() => {
        if (user && !intentId) {
            const forceSave = async () => {
                const data = getValues();
                const result = await createOrUpdatePaymentIntent({ ...data, userId: user.uid });
                if (result.success) {
                    setValue('intentId', result.intentId, { shouldDirty: false });
                } else {
                    console.error("Failed to force create intent:", result.error, result.details);
                    setError({ message: result.error, details: result.details });
                }
            };
            forceSave();
        }
    }, [user, intentId, getValues, setValue]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const isProdBr = hostname.endsWith('mycupid.com.br');
            const isProdIntl = hostname.endsWith('mycupid.net');
            setIsBrazilDomain(isProdBr || !isProdIntl);
        }
    }, []);

    const [qrCodePrice, setQrCodePrice] = useState(0);
    const qrCodeDesign = watch('qrCodeDesign');
    const enableWordGame  = watch('enableWordGame');
    const wordGameQuestions = watch('wordGameQuestions');
    const hasWordGameContent = !!(enableWordGame && wordGameQuestions?.length > 0);
    const WORD_GAME_PRICE = 2.00;
    const introType = watch('introType');
    const hasIntro = introType === 'love';
    const basePriceUSD = plan === 'basico' ? 9.90 : 14.90;

    const offerExpired = typeof window !== 'undefined' && (() => {
        const stored = localStorage.getItem('mycupid_offer_deadline');
        if (!stored) return false;
        return Date.now() > parseInt(stored);
    })();

    const basePriceBRL = plan === 'basico'
        ? 19.90
        : (offerExpired ? 27.90 : 24.90);
    const totalBRL = Math.max(1, basePriceBRL + qrCodePrice + (hasWordGameContent ? WORD_GAME_PRICE : 0) + (hasIntro ? INTRO_PRICE : 0) - discountAmount);
    const totalUSD = basePriceUSD;

    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);

    // ── CRÉDITOS DO USUÁRIO ────────────────────────────────────────
    const [userCredits, setUserCredits] = useState(0);
    useEffect(() => {
        // Checa tanto o email de conta real quanto o guestEmail confirmado
        const emailToCheck = user?.email || confirmedGuestEmail;
        if (!emailToCheck || !firestore) return;
        getDoc(firestoreDoc(firestore, 'user_credits', emailToCheck.toLowerCase().trim()))
            .then((snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    const available = Math.max(0, (d.totalCredits ?? 0) - (d.usedCredits ?? 0));
                    setUserCredits(available);
                } else {
                    setUserCredits(0);
                }
            })
            .catch((err) => console.error('[PaymentStep] erro ao buscar créditos:', err));
    }, [user?.email, confirmedGuestEmail, !!firestore]); // eslint-disable-line react-hooks/exhaustive-deps
    // ── FIM CRÉDITOS ───────────────────────────────────────────────

    const handlePaymentSuccess = useCallback((pageId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        toast({ title: 'Página Criada!', description: 'Sua surpresa foi publicada com sucesso.' });
        setPageId(pageId);
        localStorage.removeItem('amore-pages-autosave');

        // ── TIKTOK PIXEL ──────────────────────────────────────────────
        try {
            const ttq = (window as any).ttq;
            if (ttq) {
                const planVal = getValues('plan');
                const priceBRL = planVal === 'avancado' ? 24.90 : 19.90;
                ttq.track('CompletePayment', {
                    value: priceBRL,
                    currency: 'BRL',
                    content_id: pageId,
                    content_type: 'product',
                    content_name: planVal === 'avancado' ? 'Plano Avançado' : 'Plano Básico',
                });
            }
        } catch (e) {
            console.warn('[TikTok Pixel] Falha ao disparar CompletePayment:', e);
        }

        // ── META PIXEL ────────────────────────────────────────────────
        const fireMeta = (retries = 15) => {
            if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                const planVal = getValues('plan');
                const value = planVal === 'avancado' ? 24.90 : 19.90;
                window.fbq('track', 'Purchase', {
                    value,
                    currency: 'BRL',
                    content_ids: [planVal],
                    content_type: 'product',
                });
                console.log('[Meta Pixel] Purchase disparado:', { value, planVal });
            } else if (retries > 0) {
                setTimeout(() => fireMeta(retries - 1), 500);
            } else {
                console.warn('[Meta Pixel] fbq não inicializou — Purchase não disparado');
            }
        };
        fireMeta();

        // ── GA4 ───────────────────────────────────────────────────────
        trackEvent('Purchase', {
            value: getValues('plan') === 'avancado' ? 24.90 : 19.90,
            currency: 'BRL',
            transaction_id: pageId,
            items: [{ item_name: getValues('plan') === 'avancado' ? 'Plano Avançado' : 'Plano Básico' }],
        });
        // ─────────────────────────────────────────────────────────────

    }, [setPageId, toast, getValues]);

    const startPolling = useCallback((paymentId: string, currentIntentId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = setInterval(async () => {
            const result = await verifyPaymentWithMercadoPago(paymentId, currentIntentId);
            if (result.status === 'approved') {
                clearInterval(pollingIntervalRef.current!);
                handlePaymentSuccess(result.pageId);
            } else if (result.status === 'error') {
                clearInterval(pollingIntervalRef.current!);
                setError({ message: result.error, details: result.details });
            }
        }, 3000);
    }, [handlePaymentSuccess]);

    useEffect(() => {
        if (pixData?.paymentId && intentId) startPolling(pixData.paymentId, intentId);
        return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
    }, [pixData, intentId, startPolling]);

    // PIX expiry countdown (30 min)
    useEffect(() => {
        if (!pixData) { setPixExpired(false); setPixTimeLeft(0); return; }
        if (!pixCreatedAtRef.current) pixCreatedAtRef.current = Date.now();
        const PIX_TTL = 30 * 60 * 1000; // 30 min
        const tick = () => {
            const elapsed = Date.now() - pixCreatedAtRef.current;
            const remaining = Math.max(0, PIX_TTL - elapsed);
            setPixTimeLeft(Math.ceil(remaining / 1000));
            if (remaining <= 0) setPixExpired(true);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [pixData]);

    // Saves the guest email into the payment intent so the backend can create a real account after payment.
    const handleConfirmGuestEmail = async () => {
        if (!user) return;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestEmailInput)) {
            setGuestEmailError('Por favor, insira um e-mail válido.');
            return;
        }
        setGuestEmailError('');
        setIsSavingEmail(true);
        try {
            const data = getValues();
            const result = await createOrUpdatePaymentIntent({
                ...data,
                userId: user.uid,
                guestEmail: guestEmailInput,
            });
            if (result.success) {
                setValue('intentId', result.intentId, { shouldDirty: false });
                setConfirmedGuestEmail(guestEmailInput);
            } else {
                setGuestEmailError('Erro ao salvar. Tente novamente.');
            }
        } catch {
            setGuestEmailError('Erro ao salvar. Tente novamente.');
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleOneClickPix = () => {
        setError(null);
        setPixData(null);
        setPixExpired(false);
        pixCreatedAtRef.current = 0;
        if (!user) { setError({ message: 'Sessão carregando, aguarde um instante e tente novamente.' }); return; }
        if (isAnonymousUser && !confirmedGuestEmail) { setGuestEmailError('Confirme seu e-mail antes de pagar.'); return; }
        if (!whatsappNumber || whatsappNumber.replace(/\D/g, '').length < 10) { setError({ message: 'Preencha seu WhatsApp com DDD para continuar.' }); return; }
        if (user.email) setValue('payment.payerEmail', user.email, { shouldDirty: true });
        startTransition(async () => {
            try {
                const fullData = {
                    ...getValues(),
                    userId: user.uid,
                    ...(isAnonymousUser && confirmedGuestEmail ? { guestEmail: confirmedGuestEmail } : {}),
                    whatsappNumber: whatsappNumber.replace(/\D/g, ''),
                };
                const saveResult = await createOrUpdatePaymentIntent(fullData);
                if (!saveResult.success) {
                    const { error, details } = saveResult;
                    setError({ message: error, details });
                    if (error?.includes("NOT_FOUND")) setValue('intentId', undefined, { shouldDirty: false });
                    return;
                }
                setValue('intentId', saveResult.intentId);
                const paymentResult = await processPixPayment(saveResult.intentId, totalBRL);
                if (paymentResult.error) {
                    setError({ message: paymentResult.error, details: paymentResult.details || {} });
                } else if (paymentResult.qrCode && paymentResult.qrCodeBase64 && paymentResult.paymentId) {
                    setPixData({ qrCode: paymentResult.qrCode, qrCodeBase64: paymentResult.qrCodeBase64, paymentId: paymentResult.paymentId });
                    // Marca desconto como usado
                    if (discountCode) {
                        const email = user.email || confirmedGuestEmail;
                        if (email) {
                            fetch('/api/discount', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: discountCode, email }) })
                                .then(() => { localStorage.removeItem('mycupid_discount_code'); })
                                .catch(() => {});
                        }
                    }
                }
            } catch (err: any) {
                setError({ message: "Erro ao conectar com o serviço de pagamento.", details: err });
            }
        });
    };

    const handleStripePayment = () => {
        setError(null);
        if (!user) { setError({ message: 'Sessão carregando, aguarde um instante e tente novamente.' }); return; }
        if (isAnonymousUser && !confirmedGuestEmail) { setGuestEmailError('Confirme seu e-mail antes de pagar.'); return; }
        startTransition(async () => {
            try {
                const fullData = {
                    ...getValues(),
                    userId: user.uid,
                    ...(isAnonymousUser && confirmedGuestEmail ? { guestEmail: confirmedGuestEmail } : {}),
                };
                const saveResult = await createOrUpdatePaymentIntent(fullData);
                if (!saveResult.success) {
                    setError({ message: saveResult.error || "Could not save draft before payment.", details: saveResult.details });
                    return;
                }
                setValue('intentId', saveResult.intentId);
                const planValue = getValues('plan') as 'basico' | 'avancado';
                const domain = window.location.origin;
                const sessionResult = await createStripeCheckoutSession(saveResult.intentId, planValue, domain);
                if (!sessionResult.success) {
                    setError({ message: sessionResult.error || "Could not create Stripe checkout session.", details: sessionResult.details });
                } else {
                    window.location.href = sessionResult.url;
                }
            } catch (err: any) {
                setError({ message: "Error connecting to the payment service.", details: err });
            }
        });
    };

    const handleAdminFinalize = async () => {
        if (!user || !intentId) { toast({ variant: 'destructive', title: 'Erro Admin', description: 'Usuário ou Rascunho não encontrado.' }); return; }
        startTransition(async () => {
            try {
                const result = await adminFinalizePage(intentId, user.uid);
                if (!result.success) {
                    setError({ message: result.error || "Falha ao finalizar como admin.", details: result.details });
                } else {
                    handlePaymentSuccess(result.pageId);
                }
            } catch (e: any) {
                setError({ message: "Erro de servidor ao finalizar como admin.", details: e });
            }
        });
    };

    const handleManualVerification = async () => {
        if (!pixData?.paymentId || !intentId) return;
        setIsVerifying(true);
        try {
            const result = await verifyPaymentWithMercadoPago(pixData.paymentId, intentId);
            if (result.status === 'approved') {
                handlePaymentSuccess(result.pageId);
            } else {
                toast({ variant: 'default', title: 'Pagamento ainda não confirmado', description: 'Por favor, tente novamente em alguns instantes.' });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro na Verificação', description: 'Não foi possível verificar o pagamento.' });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCreditFinalize = () => {
        setError(null);
        if (!user || !user.email) { setError({ message: 'Sessão de usuário inválida. Por favor, faça login novamente.' }); return; }
        if (!intentId) { setError({ message: 'Rascunho não encontrado. Tente recarregar a página.' }); return; }
        startTransition(async () => {
            try {
                const fullData = { ...getValues(), userId: user.uid };
                const saveResult = await createOrUpdatePaymentIntent(fullData);
                if (!saveResult.success) {
                    setError({ message: saveResult.error || 'Erro ao salvar rascunho.', details: saveResult.details });
                    return;
                }
                setValue('intentId', saveResult.intentId);
                const result = await finalizeWithCredit(saveResult.intentId, user.uid, user.email!);
                if (!result.success) {
                    setError({ message: result.error || 'Falha ao usar crédito.' });
                } else {
                    setUserCredits(prev => Math.max(0, prev - 1));
                    handlePaymentSuccess(result.pageId!);
                }
            } catch (e: any) {
                setError({ message: 'Erro ao finalizar com crédito.', details: e });
            }
        });
    };

    if (isBrazilDomain === null) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!isBrazilDomain) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* URGENCY TIMER */}
                <div className={cn(
                    "flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold",
                    timerExpired
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                )}>
                    <Clock size={16} className={timerExpired ? "text-red-400" : "text-amber-400 animate-pulse"} />
                    {timerExpired
                        ? "⚠️ Seu rascunho pode expirar — finalize agora!"
                        : <>Oferta reservada por <span className="font-black text-lg tabular-nums">{timerMins}:{timerSecs}</span></>
                    }
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-white">Quase lá!</h3>
                    <p className="text-sm text-zinc-400">Sua página foi montada. Finalize para receber o link.</p>
                </div>
                <div className="relative overflow-hidden p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <div className="absolute top-0 right-0 p-2">
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded-full uppercase">
                            {plan === 'avancado' ? 'Advanced Plan' : 'Economic Plan'}
                        </span>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
                    <h2 className="text-5xl font-black text-white mb-1">${totalUSD.toFixed(2)}</h2>
                    <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 uppercase">
                        <Clock size={12} /> Pagamento único • Acesso imediato
                    </p>
                </div>
                {userCredits > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4"
                        style={{
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(15,10,30,0.85) 100%)',
                            border: '1px solid rgba(34,197,94,0.45)',
                            boxShadow: '0 0 24px rgba(34,197,94,0.12)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                                <Gift className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-white leading-tight">
                                    You have {userCredits} free credit{userCredits > 1 ? 's' : ''}!
                                </p>
                                <p className="text-xs text-white/50">Create this page on Advanced Plan for free</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCreditFinalize}
                            disabled={isProcessing}
                            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                boxShadow: '0 0 18px rgba(22,163,74,0.4)',
                            }}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finalizing...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><Gift className="w-4 h-4" /> Use my free credit</span>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-white/25 mt-2">Or pay normally below</p>
                    </motion.div>
                )}
                {/* E-mail para usuários anônimos (sem conta) */}
                {isAnonymousUser && !confirmedGuestEmail && (
                    <div className="space-y-3 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <Lock className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-tight">Enter your email</p>
                                <p className="text-xs text-white/50 mt-0.5">You'll receive the page link and can access it later.</p>
                            </div>
                        </div>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={guestEmailInput}
                            onChange={(e) => { setGuestEmailInput(e.target.value); setGuestEmailError(''); }}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                        {guestEmailError && <p className="text-red-400 text-xs">{guestEmailError}</p>}
                        <Button
                            type="button"
                            onClick={handleConfirmGuestEmail}
                            disabled={isSavingEmail || !guestEmailInput}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {isSavingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Confirm email →'}
                        </Button>
                    </div>
                )}
                {isAnonymousUser && confirmedGuestEmail && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Email confirmed: <strong>{confirmedGuestEmail}</strong></span>
                    </div>
                )}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Pay with Credit Card</span>
                        <div className="flex gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
                            <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={24} height={16} />
                            <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={24} height={16} />
                        </div>
                    </div>
                    <Button onClick={handleStripePayment} disabled={isProcessing || (isAnonymousUser && !confirmedGuestEmail)} className="w-full h-16 text-lg font-bold bg-white text-black hover:bg-zinc-200 shadow-2xl transition-all active:scale-95 group">
                        {isProcessing ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CreditCard size={20} />
                                <span>Pagar com Cartão</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                        <Lock size={10} className="text-green-500" />
                        <span>Pagamento seguro através da Stripe.</span>
                    </div>
                </div>
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-600 uppercase">Or pay with</span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                </div>
                <div className="min-h-[100px] flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    {isAnonymousUser && !confirmedGuestEmail ? (
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center py-4">Confirm your email above to unlock PayPal</p>
                    ) : intentId ? (
                        <div className="w-full animate-in zoom-in-95 duration-500">
                            <PayPalButton intentId={intentId} plan={plan} amount={totalUSD.toFixed(2)} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Synchronizing with PayPal...</p>
                        </div>
                    )}
                </div>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>{error.message ?? 'Erro desconhecido'}</AlertTitle>
                        {typeof (error.details) === 'object' && (error.details as any)?.log && <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">{(error.details as any).log}</AlertDescription>}
                    </Alert>
                )}
            </div>
        );
    }

    // ── TELA BRASIL (PIX / Mercado Pago) ─────────────────────────
    return (
        <div className="space-y-6 text-center">
            {/* URGENCY TIMER */}
            <div className={cn(
                "flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold",
                timerExpired
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            )}>
                <Clock size={16} className={timerExpired ? "text-red-400" : "text-amber-400 animate-pulse"} />
                {timerExpired
                    ? "⚠️ Seu rascunho pode expirar — finalize agora!"
                    : <>Oferta reservada por <span className="font-black text-lg tabular-nums">{timerMins}:{timerSecs}</span></>
                }
            </div>
            <div className="mb-8">
                <h3 className="text-2xl font-bold font-headline mb-2">Quase lá!</h3>
                <p className="text-muted-foreground">Sua página foi montada. Finalize para receber o link.</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl mb-6">
                <span className="block text-sm text-purple-300 font-bold uppercase tracking-wider mb-1">Total a Pagar</span>
                <span className="block text-4xl font-black text-white">
                  R$ {totalBRL.toFixed(2).replace('.', ',')}
                </span>
                {qrCodePrice > 0 && (
                  <p className="text-xs text-purple-300 mt-1">
                    Inclui QR Code personalizado (+R$ {qrCodePrice.toFixed(2).replace('.', ',')})
                  </p>
                )}
                {hasWordGameContent && (
                  <p className="text-xs text-pink-300 mt-0.5">
                    Inclui Jogo Adivinhe a Palavra (+R$2,00)
                  </p>
                )}
                {hasIntro && (
                  <p className="text-xs text-pink-300 mt-0.5">
                    Inclui Introdução Animada (+R$5,90)
                  </p>
                )}
                {discountAmount > 0 && (
                  <p className="text-xs text-green-400 mt-0.5 font-bold">
                    Desconto aplicado (-R${discountAmount.toFixed(2).replace('.', ',')}) 🎉
                  </p>
                )}
                <p className="text-xs text-white/50">Pagamento único</p>
            </div>
            {!pixData && plan === 'basico' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-2xl p-4 mb-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(15,10,30,0.85) 100%)',
                        border: '1px solid rgba(139,92,246,0.45)',
                        boxShadow: '0 0 28px rgba(109,40,217,0.18)',
                    }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-white leading-tight">
                                Por apenas <span className="text-purple-300">R$5 a mais</span>, sua página dura para sempre 💜
                            </p>
                            <p className="text-xs text-white/45 mt-1 leading-relaxed">
                                Com o Plano Básico a sua página some em 25h — e a pessoa amada não vai poder rever esse momento. No Avançado fica online pra sempre, como uma lembrança eterna.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setValue('plan', 'avancado', { shouldDirty: true })}
                        className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                            boxShadow: '0 0 18px rgba(147,51,234,0.4)',
                        }}
                    >
                        Quero que dure para sempre — R${offerExpired ? '27,90' : '24,90'} →
                    </button>
                    <p className="text-center text-[10px] text-white/25 mt-2">Continuar com o Plano Básico mesmo assim</p>
                </motion.div>
            )}
            {!pixData && (
              <div className="rounded-2xl border border-purple-500/20 bg-card/50 overflow-hidden">
                <QrCodeSelector
                  value={qrCodeDesign}
                  onChange={(id) => setValue('qrCodeDesign', id, { shouldDirty: true })}
                  onPriceChange={(price) => setQrCodePrice(price)}
                />
              </div>
            )}
            {!pixData && hasWordGameContent && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(190,24,93,0.12) 0%, rgba(109,40,217,0.1) 100%)',
                  border: '1px solid rgba(244,114,182,0.25)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)' }}>
                      <span className="text-lg leading-none">💘</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Jogo Adivinhe a Palavra</p>
                      <p className="text-xs text-white/45">{wordGameQuestions.length} palavra{wordGameQuestions.length > 1 ? 's' : ''} secreta{wordGameQuestions.length > 1 ? 's' : ''} incluída{wordGameQuestions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-pink-300 shrink-0">+R$2,00</span>
                </div>
              </motion.div>
            )}
            {userCredits > 0 && !pixData && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4 mb-2"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(15,10,30,0.85) 100%)',
                        border: '1px solid rgba(34,197,94,0.45)',
                        boxShadow: '0 0 24px rgba(34,197,94,0.12)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                            <Gift className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-white leading-tight">
                                Você tem {userCredits} crédito{userCredits > 1 ? 's' : ''} grátis!
                            </p>
                            <p className="text-xs text-white/50">Crie esta página no Plano Avançado sem pagar nada</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCreditFinalize}
                        disabled={isProcessing}
                        className="w-full py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
                        style={{
                            background: 'linear-gradient(135deg, #16a34a, #15803d)',
                            boxShadow: '0 0 18px rgba(22,163,74,0.4)',
                        }}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finalizando...</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2"><Gift className="w-4 h-4" /> Usar meu crédito grátis</span>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-white/25 mt-2">Ou pague normalmente abaixo</p>
                </motion.div>
            )}
            {/* PRESENTE — aparece sempre que há token válido, email embutido dentro */}
            {giftCredits > 0 && !pixData && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 mb-2 space-y-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(15,10,30,0.88) 100%)',
                        border: '1.5px solid rgba(168,85,247,0.5)',
                        boxShadow: '0 0 32px rgba(168,85,247,0.15)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xl leading-none">🎁</span>
                        </div>
                        <div className="text-left">
                            <p className="text-base font-black text-white leading-tight">
                                Você ganhou {giftCredits} página{giftCredits > 1 ? 's' : ''} grátis!
                            </p>
                            <p className="text-xs text-purple-300/70">Presente especial — crie sem pagar nada</p>
                        </div>
                    </div>

                    {/* Email embutido para usuários anônimos */}
                    {isAnonymousUser && !confirmedGuestEmail && (
                        <div className="space-y-2">
                            <p className="text-xs text-white/60">Informe seu e-mail para resgatar:</p>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={guestEmailInput}
                                onChange={(e) => { setGuestEmailInput(e.target.value); setGuestEmailError(''); }}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-purple-500/40 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                            />
                            {guestEmailError && <p className="text-red-400 text-xs">{guestEmailError}</p>}
                            <Button
                                type="button"
                                onClick={handleConfirmGuestEmail}
                                disabled={isSavingEmail || !guestEmailInput}
                                className="w-full bg-purple-600 hover:bg-purple-500"
                            >
                                {isSavingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Confirmar e-mail →'}
                            </Button>
                        </div>
                    )}
                    {isAnonymousUser && confirmedGuestEmail && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>E-mail: <strong>{confirmedGuestEmail}</strong></span>
                        </div>
                    )}

                    {/* Botão de resgatar — aparece quando email ok ou usuário logado */}
                    {(!isAnonymousUser || confirmedGuestEmail) && (
                        <button
                            type="button"
                            onClick={() => {
                                if (!user || !giftToken) return;
                                const email = user.email || confirmedGuestEmail;
                                if (!email) { setError({ message: 'Confirme seu e-mail primeiro.' }); return; }
                                startTransition(async () => {
                                    try {
                                        const data = getValues();
                                        const saveResult = await createOrUpdatePaymentIntent({ ...data, userId: user.uid, plan: 'avancado', guestEmail: email });
                                        if (!saveResult.success) { setError({ message: saveResult.error }); return; }
                                        localStorage.removeItem('mycupid_gift_token');
                                        const finalResult = await finalizeWithGiftToken(saveResult.intentId!, user.uid, giftToken, email);
                                        if (finalResult.success && finalResult.pageId) handlePaymentSuccess(finalResult.pageId);
                                        else if (!finalResult.success) setError({ message: finalResult.error || 'Erro ao finalizar.' });
                                    } catch (e: any) { setError({ message: e.message }); }
                                });
                            }}
                            disabled={isProcessing}
                            className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                boxShadow: '0 0 20px rgba(168,85,247,0.45)',
                            }}
                        >
                            {isProcessing
                                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finalizando...</span>
                                : <span className="flex items-center justify-center gap-2"><Gift className="w-4 h-4" /> Resgatar meu presente grátis</span>
                            }
                        </button>
                    )}
                    <p className="text-center text-[10px] text-white/25">Ou pague normalmente abaixo</p>
                </motion.div>
            )}

            {/* E-mail para usuários anônimos SEM presente */}
            {isAnonymousUser && !confirmedGuestEmail && giftCredits === 0 && (
                <div className="space-y-3 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">Informe seu e-mail</p>
                            <p className="text-xs text-white/50 mt-0.5">Você receberá o link da página e poderá acessá-la depois.</p>
                        </div>
                    </div>
                    <input
                        type="email"
                        placeholder="seu@email.com"
                        value={guestEmailInput}
                        onChange={(e) => { setGuestEmailInput(e.target.value); setGuestEmailError(''); }}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                    {guestEmailError && <p className="text-red-400 text-xs">{guestEmailError}</p>}
                    <Button
                        type="button"
                        onClick={handleConfirmGuestEmail}
                        disabled={isSavingEmail || !guestEmailInput}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {isSavingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Confirmar e-mail →'}
                    </Button>
                </div>
            )}
            {isAnonymousUser && confirmedGuestEmail && giftCredits === 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>E-mail confirmado: <strong>{confirmedGuestEmail}</strong></span>
                </div>
            )}
            {/* WhatsApp — obrigatório */}
            {!pixData && (
                <div className="rounded-2xl p-4 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(15,10,30,0.85) 100%)',
                        border: `1.5px solid ${whatsappNumber.replace(/\D/g, '').length >= 10 ? 'rgba(37,211,102,0.35)' : 'rgba(239,68,68,0.4)'}`,
                        boxShadow: '0 0 20px rgba(37,211,102,0.08)',
                    }}>
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5"
                            style={{ border: '1px solid rgba(37,211,102,0.3)' }}>
                            <svg className="w-4.5 h-4.5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.111.546 4.096 1.504 5.823L0 24l6.335-1.627A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.886 0-3.63-.509-5.14-1.388l-.368-.218-3.817.981.99-3.637-.24-.38A9.766 9.766 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">Seu WhatsApp <span className="text-red-400">*</span></p>
                            <p className="text-xs text-white/50 mt-0.5">Para enviar atualizações e suporte do seu pedido</p>
                        </div>
                    </div>
                    <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(formatPhone(e.target.value))}
                        className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900 border text-white text-sm placeholder:text-zinc-500 focus:outline-none ${whatsappNumber && whatsappNumber.replace(/\D/g, '').length < 10 ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700 focus:border-green-500'}`}
                    />
                    {whatsappNumber && whatsappNumber.replace(/\D/g, '').length < 10 && (
                        <p className="text-[11px] text-red-400 mt-1.5">Digite um número válido com DDD</p>
                    )}
                </div>
            )}
            {(!isAnonymousUser || confirmedGuestEmail) && !pixData ? (
                <Button onClick={handleOneClickPix} disabled={isProcessing} size="lg" className="w-full h-auto py-4 text-lg font-bold bg-[#009EE3] hover:bg-[#008ac6]">
                    {isProcessing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span>Gerando QR Code do Mercado Pago...</span></>
                    ) : (
                        <span>Pagar com PIX via Mercado Pago</span>
                    )}
                </Button>
            ) : (!isAnonymousUser || confirmedGuestEmail) && pixData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center gap-6">
                    {pixExpired ? (
                        <>
                            <div className="w-full p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                                <h3 className="text-lg font-bold text-amber-300 mb-2">Seu PIX expirou!</h3>
                                <p className="text-sm text-zinc-300 mb-4">
                                    Mas não se preocupe — use o cupom abaixo e ganhe <span className="font-black text-emerald-400">R$5 de desconto</span>:
                                </p>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <code className="text-xl font-black text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl tracking-wider">DESCONTO5</code>
                                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white"
                                        onClick={() => { navigator.clipboard.writeText('DESCONTO5'); toast({ title: 'Cupom copiado!' }); }}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button onClick={handleOneClickPix} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Gerar novo PIX com desconto
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold font-headline">Pague com PIX para Finalizar</h3>
                            <p className="text-muted-foreground max-w-sm">Escaneie o QR Code com o aplicativo do seu banco ou use o código &quot;Copia e Cola&quot;.</p>
                            {pixTimeLeft > 0 && (
                                <p className="text-xs text-zinc-500">
                                    Expira em <span className="font-mono font-bold text-zinc-300">{Math.floor(pixTimeLeft / 60)}:{String(pixTimeLeft % 60).padStart(2, '0')}</span>
                                </p>
                            )}
                            <div className="p-4 bg-white rounded-lg border">
                                {pixData.qrCodeBase64 ? (
                                    <Image src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="PIX QR Code" width={256} height={256} unoptimized />
                                ) : (
                                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                                        <Loader2 className="animate-spin mb-2" />
                                        <p className="text-xs">Gerando QR Code...</p>
                                    </div>
                                )}
                            </div>
                            <Button onClick={() => navigator.clipboard.writeText(pixData.qrCode)} className="w-full max-w-xs bg-[#009EE3] hover:bg-[#008ac6]">
                                <Copy className="mr-2 h-4 w-4" />Copiar Código PIX
                            </Button>
                            <p className="text-xs text-muted-foreground">Aguardando pagamento... A página será liberada automaticamente.</p>
                            <Button onClick={handleManualVerification} disabled={isVerifying} variant="secondary" className="w-full max-w-xs">
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Verificar Pagamento
                            </Button>
                        </>
                    )}
                </div>
            ) : null}
            {isAdmin && intentId && (
                <div className="mt-8 pt-6 border-t-2 border-dashed border-yellow-500">
                    <Button type="button" size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" disabled={isProcessing} onClick={handleAdminFinalize}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Finalizar como Admin (TESTE)'}
                    </Button>
                </div>
            )}
            {error && (
                <Alert variant="destructive" className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{error.message}</AlertTitle>
                    {typeof (error.details) === 'object' && (error.details as any)?.log && <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">{(error.details as any).log}</AlertDescription>}
                </Alert>
            )}
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-border/20 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Pagamento 100% seguro via Mercado Pago</span>
                <Image src="https://i.imgur.com/QeYjEEv.png" alt="Logo do Mercado Pago" width={90} height={20} className="opacity-90" />
            </div>
            {/* Trust badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    Garantia 7 dias
                </span>
                <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Dados protegidos
                </span>
                <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                    Suporte 24h
                </span>
            </div>
            <p className="text-center text-[11px] text-zinc-600 mt-3">
                Se não ficar satisfeito, devolvemos 100% do valor em até 7 dias.
            </p>
        </div>
    );
};

// ─────────────────────────────────────────────
// SUCCESS STEP
// ─────────────────────────────────────────────
const SuccessStep = ({
    pageId,
    title = 'Página Criada com Sucesso!',
    subtitle = 'Sua obra de arte está pronta. Compartilhe o link abaixo com seu amor.',
    whatsappMessage = 'Oi amor, fiz uma surpresa especial pra você 💝',
}: {
    pageId: string;
    title?: string;
    subtitle?: string;
    whatsappMessage?: string;
}) => {
    const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${pageId}` : `/p/${pageId}`;
    const [copied, setCopied] = useState(false);
    const { getValues } = useFormContext<PageData>();
    const qrCodeDesign = getValues('qrCodeDesign');
    const { user } = useUser();
    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
      setIsDownloading(true);
      try {
        await downloadQrCard(pageId, qrCodeDesign);
      } catch (e) {
        console.error(e);
      } finally {
        setIsDownloading(false);
      }
    };

    useEffect(() => {
        const plan = getValues('plan') as string;
        const price = plan === 'basico' ? 19.90 : 24.90;
    
        // Meta Pixel
        if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Purchase', { value: price, currency: 'BRL' });
        }
        // TikTok
        if (typeof window !== 'undefined' && (window as any).ttq) {
            (window as any).ttq.track('CompletePayment', { value: price, currency: 'BRL' });
        }
        // GA4
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('event', 'purchase', { value: price, currency: 'BRL', transaction_id: pageId });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCopy = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${whatsappMessage}\n${pageUrl}`)}`;

    return (
        <div className="flex flex-col items-center text-center gap-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold font-headline">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
            <div className="flex items-center space-x-2 w-full max-w-md p-2 rounded-lg border bg-muted">
                <Input type="text" value={pageUrl} readOnly className="bg-transparent border-0 ring-0 focus-visible:ring-0" />
                <Button onClick={handleCopy}>
                    {copied ? <CheckCircle className="mr-2" /> : <Copy className="mr-2" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                </Button>
            </div>

            {/* WHATSAPP SHARE */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-md flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-white text-lg bg-[#25D366] hover:bg-[#1ebe57] transition-all active:scale-95 shadow-lg shadow-green-900/30"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar pelo WhatsApp
            </a>

            <div className="p-4 bg-white rounded-lg border mt-4">
                <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pageUrl}`} alt="QR Code da Página" width={200} height={200} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Você também pode salvar ou imprimir o QR Code acima.</p>
            <Button asChild className="mt-4">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                    <View className="mr-2" />Ver Página
                </a>
            </Button>
            {qrCodeDesign !== 'classic' && (
              <div className="w-full mt-6 p-4 rounded-2xl border border-purple-500/20 bg-card/50 text-center space-y-3">
                <p className="font-bold text-purple-300">✨ Seu QR Code Personalizado está pronto!</p>
                <p className="text-sm text-muted-foreground">Baixe e imprima para surpreender ainda mais.</p>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isDownloading ? 'Gerando...' : 'Baixar QR Code Personalizado'}
                </button>
              </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// WIZARD INTERNAL
// ─────────────────────────────────────────────
function WizardInternal() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [showTimelinePreview, setShowTimelinePreview] = useState(false);
    const [showGiftPopup, setShowGiftPopup] = useState(false);
    const [giftPopupCredits, setGiftPopupCredits] = useState(1);
    const [showDiscountBanner, setShowDiscountBanner] = useState(false);
    const [discountBannerAmount, setDiscountBannerAmount] = useState(0);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const { auth } = useFirebase();
    const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stepEnterTimeRef = useRef<number>(Date.now());
    const [pageId, setPageId] = useState<string | null>(null);
    const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = useState(false);

    // Auto sign-in anonymously so guests can upload files and autosave without an account.
    // A real account is only linked after payment (via createGuestAccount on the backend).
    useEffect(() => {
        if (!isUserLoading && !user) {
            signInAnonymously(auth).catch((err) => {
                console.error('[AnonAuth] Falha ao fazer login anônimo:', err);
            });
        }
    }, [isUserLoading, user, auth]);

    // Detect gift token on arrival and show welcome popup
    useEffect(() => {
        const urlToken = new URLSearchParams(window.location.search).get('gift');
        const stored = localStorage.getItem('mycupid_gift_token');
        const token = urlToken || stored;
        if (!token) return;
        if (urlToken) localStorage.setItem('mycupid_gift_token', urlToken);
        fetch(`/api/gift?token=${token}`)
            .then(r => r.json())
            .then(d => { if (d.valid) { setGiftPopupCredits(d.credits ?? 1); setShowGiftPopup(true); } })
            .catch(() => {});
    }, []);

    // Detect discount code on arrival and show banner
    useEffect(() => {
        const urlCode = new URLSearchParams(window.location.search).get('discount');
        const stored = localStorage.getItem('mycupid_discount_code');
        const code = urlCode || stored;
        if (!code) return;
        if (urlCode) localStorage.setItem('mycupid_discount_code', urlCode);
        fetch(`/api/discount?code=${code}`)
            .then(r => r.json())
            .then(d => {
                if (d.valid) {
                    setDiscountBannerAmount(d.discount ?? 10);
                    setShowDiscountBanner(true);
                    setTimeout(() => setShowDiscountBanner(false), 5000);
                } else {
                    localStorage.removeItem('mycupid_discount_code');
                }
            })
            .catch(() => {});
    }, []);

    const plan = searchParams.get('plan') || 'avancado';
    const segmentKey = searchParams.get('segment') as WizardSegmentKey | null;
    const segCfg = (segmentKey && WIZARD_SEGMENTS[segmentKey]) ? WIZARD_SEGMENTS[segmentKey] : DEFAULT_WIZARD_CONFIG;

    const steps = useMemo(() => [
        { id: "title",      title: segCfg.titleStepTitle,       description: segCfg.titleStepDescription,    fields: ["title", "titleColor"] },
        { id: "message",    title: segCfg.messageStepTitle,     description: segCfg.messageStepDescription,  fields: ["message", "messageFontSize", "messageFormatting"] },
        { id: "specialDate",title: segCfg.dateStepTitle,        description: segCfg.dateStepDescription,     fields: ["specialDate", "countdownStyle", "countdownColor"] },
        { id: "gallery",    title: 'Galeria de Fotos',          description: segCfg.galleryStepDescription,  fields: ["galleryImages", "galleryStyle"] },
        { id: "timeline",   title: 'Linha do Tempo 3D',         description: segCfg.timelineStepDescription, fields: ["timelineEvents"] },
        { id: "music",      title: 'Música Dedicada',           description: segCfg.musicStepDescription,    fields: ["musicOption", "youtubeUrl", "audioRecording"] },
        { id: "background", title: 'Animação de Fundo',         description: 'Escolha um efeito especial para o fundo.',        fields: ["backgroundAnimation", "heartColor"] },
        { id: "intro",      title: 'Introdução do Site',        description: 'Adicione uma animação interativa antes da página abrir.',  fields: ["introType"] },
        { id: "puzzle",     title: 'Quebra-Cabeça Interativo',  description: segCfg.puzzleStepDescription,   fields: ["enablePuzzle", "puzzleImage"] },
        { id: "memory",     title: 'Jogo da Memória',           description: segCfg.memoryStepDescription,   fields: ["enableMemoryGame", "memoryGameImages"] },
        { id: "quiz",       title: segCfg.quizStepTitle,        description: segCfg.quizStepDescription,     fields: ["enableQuiz", "quizQuestions"] },
        { id: "word-game",  title: 'Adivinhe a Palavra 💘',     description: 'Crie palavras secretas para a pessoa amada descobrir letra por letra.',  fields: ["enableWordGame", "wordGameQuestions"] },
        { id: "plan",       title: 'Escolha seu Plano',         description: 'Selecione o plano ideal para sua página.',        fields: ["plan"] },
        { id: "payment",    title: 'Finalizar',                 description: 'Pague para gerar o link e QR Code.',              fields: ["payment", "qrCodeDesign"] },
    // eslint-disable-line react-hooks/exhaustive-deps
    ], [segmentKey]);

    const methods = useForm<PageData>({
        resolver: zodResolver(pageSchema),
        mode: 'onChange',
        defaultValues: {
            plan: plan,
            title: "Seu Título Aqui",
            message: "Sua mensagem de amor...",
            messageFontSize: "text-base",
            backgroundAnimation: "none",
            galleryStyle: "Coverflow",
            galleryImages: [],
            timelineEvents: [],
            enablePuzzle: false,       // exige upload de imagem — fica opt-in
            enableMemoryGame: true,
            enableQuiz: true,
            quizQuestions: [],
            enableWordGame: true,
            wordGameQuestions: [],
            musicOption: 'none',
            qrCodeDesign: "classic",
        }
    });

    const { watch, trigger, setValue, getValues } = methods;
    const formData = watch();
    const intentId = watch('intentId');

    const handleAutosave = useCallback(async () => {
        if (!user || isUserLoading) return;
        const data = getValues();
        const utmSource = sessionStorage.getItem('last_utm_source');
        const dataToSave = { ...data, userId: user.uid, utmSource: utmSource || undefined };
        try {
            const result = await createOrUpdatePaymentIntent(dataToSave);
            if (result.success) {
                localStorage.setItem('amore-pages-autosave', JSON.stringify({ ...dataToSave, intentId: result.intentId }));
                if (result.intentId && !dataToSave.intentId) {
                    setValue('intentId', result.intentId, { shouldDirty: false });
                }
            } else {
                console.error("Autosave failed:", result);
                toast({
                    variant: 'destructive',
                    title: "Erro ao Salvar Rascunho",
                    description: (
                        <div>
                            <p>{result.error}</p>
                            <div className="mt-2 p-2 bg-black/30 rounded-md">
                                <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(result.details || { info: "No details from server." }, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ),
                    duration: 20000,
                });
                const errorString = (result.error || '').toLowerCase();
                if (errorString.includes("collection") || errorString.includes("500") || errorString.includes("admin")) {
                    setValue('intentId', undefined, { shouldDirty: false });
                }
            }
        } catch (e) {
            console.error("Error during autosave:", e);
        }
    }, [user, isUserLoading, getValues, setValue, toast]);

    const restoreFromLocalStorage = useCallback(() => {
        if (typeof window === 'undefined') return;
        const savedDataJSON = localStorage.getItem('amore-pages-autosave');
        if (!savedDataJSON) return;
        try {
            const parsed = JSON.parse(savedDataJSON);
            parsed.plan = plan;
            if (parsed.specialDate) parsed.specialDate = new Date(parsed.specialDate);
            if (parsed.timelineEvents) {
                parsed.timelineEvents.forEach((ev: any) => { if (ev.date) ev.date = new Date(ev.date); });
            }
            if (parsed.puzzleImage && typeof parsed.puzzleImage?.url !== 'string') delete parsed.puzzleImage;
            if (parsed.audioRecording && typeof parsed.audioRecording?.url !== 'string') delete parsed.audioRecording;
            if (parsed.backgroundVideo && typeof parsed.backgroundVideo?.url !== 'string') delete parsed.backgroundVideo;
            methods.reset(parsed);
        } catch (e) {
            console.error("Falha ao carregar rascunho.", e);
            localStorage.removeItem('amore-pages-autosave');
            methods.reset();
            toast({ variant: "destructive", title: 'Erro ao carregar rascunho', description: 'Não foi possível carregar seu progresso salvo. Começando um novo.' });
        }
    }, [methods, plan, toast]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                window.fbq('track', 'ViewContent');
            }
        } catch (e) {
            console.warn('[Meta Pixel] Falha ao disparar ViewContent:', e);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
        // Salva gift token no localStorage se veio na URL
        const giftParam = searchParams.get('gift');
        if (giftParam) {
            localStorage.setItem('mycupid_gift_token', giftParam);
            const url = new URL(window.location.href);
            url.searchParams.delete('gift');
            window.history.replaceState({}, '', url.toString());
        }
        if (searchParams.get('new') === 'true') {
            localStorage.removeItem('amore-pages-autosave');
            methods.reset();
            const url = new URL(window.location.href);
            url.searchParams.delete('new');
            window.history.replaceState({}, '', url.toString());
        } else {
            restoreFromLocalStorage();
        }
    }, [searchParams, methods, restoreFromLocalStorage]);

    useEffect(() => {
        const subscription = watch(() => {
            if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = setTimeout(() => { handleAutosave(); }, 1500);
        });
        return () => {
            subscription.unsubscribe();
            if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        };
    }, [watch, handleAutosave]);

    const handleNext = async () => {
        const currentStepId = steps[currentStep].id;

        if (currentStepId === 'puzzle') {
            const currentData = getValues();
            if (currentData.enablePuzzle && !currentData.puzzleImage?.url) {
                toast({ variant: "destructive", title: 'Imagem Necessária', description: 'Para ativar o quebra-cabeça, você precisa enviar uma imagem.' });
                return;
            }
        } else {
            const fieldsToValidate = steps[currentStep].fields || [];
            const ok = await trigger(fieldsToValidate as any);
            if (!ok) {
                console.error("Erros de validação:", methods.formState.errors);
                toast({ variant: "destructive", title: 'Campos obrigatórios', description: 'Por favor, verifique se preencheu tudo corretamente antes de prosseguir.' });
                return;
            }
        }

        const nextStepIndex = currentStep + 1;
        const nextStepId = steps[nextStepIndex]?.id;

        // ── Funnel step tracking (all pixels) ───────────────────────
        const timeSpentMs = Date.now() - stepEnterTimeRef.current;
        trackFunnelStep(currentStepId, currentStep + 1, steps.length, {
            time_spent_seconds: Math.round(timeSpentMs / 1000),
            plan: getValues('plan'),
        });
        stepEnterTimeRef.current = Date.now();

        if (currentStepId === 'plan' && nextStepId === 'payment') {
            const planVal = getValues('plan');
            trackEvent('AddToCart', {
                value: planVal === 'avancado' ? 24.90 : 19.90,
                currency: 'BRL',
                content_ids: [planVal],
                content_type: 'product',
            });
        }

        if (nextStepId === 'payment' && user) {
            toast({ title: 'Salvando rascunho...', description: 'Preparando checkout seguro.' });
            await handleAutosave();
            const planVal = getValues('plan');
            trackEvent('InitiateCheckout', {
                value: planVal === 'avancado' ? 24.90 : 19.90,
                currency: 'BRL',
                content_ids: [planVal],
                content_type: 'product',
                content_name: planVal === 'avancado' ? 'Plano Avançado' : 'Plano Básico',
            });
        }
        setCurrentStep(Math.min(nextStepIndex, steps.length - 1));
    };

    const handleBack = () => {
        const timeSpentMs = Date.now() - stepEnterTimeRef.current;
        trackFunnelStep(steps[currentStep].id, currentStep + 1, steps.length, {
            time_spent_seconds: Math.round(timeSpentMs / 1000),
            direction: 'back',
            plan: getValues('plan'),
        });
        stepEnterTimeRef.current = Date.now();
        setCurrentStep(Math.max(0, currentStep - 1));
    };

    const timelineEventsForDisplay = useMemo(() => {
        if (!formData.timelineEvents) return [];
        return formData.timelineEvents
            .filter(event => event.image?.url)
            .map(event => ({
                id: event.id || Math.random().toString(),
                imageUrl: event.image!.url,
                alt: event.description || 'Memória',
                title: event.description || '',
                date: event.date ? new Date(event.date) : undefined,
            }));
    }, [isClient, formData.timelineEvents]);

    if (showTimelinePreview) {
        return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimelinePreview(false)} />;
    }

    const currentStepInfo = steps[currentStep];
    const currentStepId = currentStepInfo?.id;
    let StepComponent;

    if (pageId) {
        StepComponent = <SuccessStep pageId={pageId} title={segCfg.successTitle} subtitle={segCfg.successSubtitle} whatsappMessage={segCfg.whatsappMessage} />;
    } else if (currentStepId === 'payment') {
        StepComponent = <PaymentStep setPageId={setPageId} />;
    } else {
        const Comp = stepComponents[currentStep];
        if (Comp) {
            const props: any = { isVisible: currentStepId === 'background' };
            if (currentStepId === 'puzzle') props.handleAutosave = handleAutosave;
            if (currentStepId === 'title') props.titlePlaceholder = segCfg.titlePlaceholder;
            if (currentStepId === 'message') props.messagePlaceholder = segCfg.messagePlaceholder;
            StepComponent = <Comp {...props} />;
        } else {
            StepComponent = <div>Passo não encontrado.</div>;
        }
    }

    const showPuzzlePreview = currentStepId === 'puzzle' && formData.enablePuzzle && !!formData.puzzleImage?.url;
    const showEasterPreview = currentStepId === 'intro' && formData.introType === 'love';

    return (
        <FormProvider {...methods}>
            <div className="md:grid md:grid-cols-2 md:h-screen md:overflow-hidden">
                <div className="hidden md:flex relative h-screen w-full sticky top-0 items-center justify-center p-4">
                    <PreviewContent
                        isClient={isClient}
                        onShowTimeline={() => setShowTimelinePreview(true)}
                        hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
                        showPuzzlePreview={showPuzzlePreview}
                        showEasterPreview={showEasterPreview}
                        previewPuzzleRevealed={previewPuzzleRevealed}
                        setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
                    />
                </div>
                <div className="flex-grow p-6 md:p-12 md:overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0}><ArrowLeft /></Button>
                        <div className="flex-grow flex flex-col items-center gap-2 mx-4">
                            <span className="text-xs text-muted-foreground font-sans">Passo {currentStep + 1} de {steps.length}</span>
                            <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
                        </div>
                        <Button type="button" onClick={handleNext} disabled={currentStep === steps.length - 1}>
                            {steps[currentStep]?.id === 'plan' ? <><span className="mr-1 text-sm">Ir para pagamento</span><ChevronRightIcon className="w-4 h-4" /></> : <ChevronRightIcon />}
                        </Button>
                    </div>
                    <div className="mt-8 space-y-2">
                        <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                        <p className="text-muted-foreground">{steps[currentStep].description}</p>
                    </div>
                    <div className="my-8">
                        {StepComponent}
                    </div>
                    <div className="md:hidden mt-16 pb-16">
                        <div className="flex flex-col items-center text-center gap-2 text-muted-foreground mb-4">
                            <p>Ou veja como está ficando</p>
                            <ChevronDown className="w-5 h-5 animate-bounce-subtle" />
                        </div>
                        <div className="relative w-full">
                            <PreviewContent
                                isClient={isClient}
                                onShowTimeline={() => setShowTimelinePreview(true)}
                                hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
                                showPuzzlePreview={showPuzzlePreview}
                                showEasterPreview={showEasterPreview}
                                previewPuzzleRevealed={previewPuzzleRevealed}
                                setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* POPUP — Presente grátis */}
            {/* Popup de desconto */}
            {showDiscountBanner && discountBannerAmount > 0 && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.82, y: 32 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                        className="relative max-w-sm w-full rounded-3xl p-8 text-center overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, #052e16 0%, #0a1a0f 60%, #0d1117 100%)',
                            border: '1.5px solid rgba(74,222,128,0.45)',
                            boxShadow: '0 0 100px rgba(34,197,94,0.25), 0 32px 80px rgba(0,0,0,0.7)',
                        }}
                    >
                        {/* Glow background */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'rgba(34,197,94,0.12)' }} />
                        </div>

                        {/* Badge topo */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
                        >
                            ✦ CUPOM EXCLUSIVO
                        </motion.div>

                        {/* Emoji */}
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 12, stiffness: 220 }}
                            className="text-7xl mb-5 leading-none select-none"
                        >
                            🎉
                        </motion.div>

                        {/* Título */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-black text-white mb-2 leading-tight"
                        >
                            Você foi selecionado!
                        </motion.h2>

                        {/* Desconto em destaque */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="my-5 py-4 px-6 rounded-2xl"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
                        >
                            <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-1">Seu desconto especial</p>
                            <p className="text-5xl font-black text-green-400 leading-none">
                                R${discountBannerAmount.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-xs text-green-300/60 mt-1">OFF na sua página personalizada</p>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/45 text-sm mb-7 leading-relaxed"
                        >
                            Crie agora uma página única e inesquecível pra quem você ama. São poucas vagas com esse desconto!
                        </motion.p>

                        {/* Botão */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            onClick={() => setShowDiscountBanner(false)}
                            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                boxShadow: '0 0 40px rgba(22,163,74,0.5), 0 4px 20px rgba(0,0,0,0.3)',
                            }}
                        >
                            Garantir meu desconto →
                        </motion.button>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.65 }}
                            className="text-xs text-white/20 mt-4"
                        >
                            Desconto aplicado automaticamente no checkout
                        </motion.p>
                    </motion.div>
                </div>
            )}
            {showGiftPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                        className="relative max-w-sm w-full rounded-3xl p-8 text-center"
                        style={{
                            background: 'linear-gradient(145deg, #18101a 0%, #0f0a1e 100%)',
                            border: '1.5px solid rgba(168,85,247,0.5)',
                            boxShadow: '0 0 80px rgba(168,85,247,0.3), 0 24px 64px rgba(0,0,0,0.6)',
                        }}
                    >
                        <div className="text-6xl mb-4 leading-none">🎁</div>
                        <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                            Você ganhou {giftPopupCredits > 1 ? `${giftPopupCredits} páginas` : 'uma página'} grátis!
                        </h2>
                        <p className="text-white/50 text-sm mb-7 leading-relaxed">
                            Alguém especial presenteou você.<br />
                            Crie sua página agora — sem pagar nada.
                        </p>
                        <button
                            onClick={() => setShowGiftPopup(false)}
                            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                                boxShadow: '0 0 32px rgba(147,51,234,0.5)',
                            }}
                        >
                            Criar minha página grátis →
                        </button>
                    </motion.div>
                </div>
            )}
        </FormProvider>
    );
}

export default function CreatePageWizard() {
    return (
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
            <WizardInternal />
        </Suspense>
    );
}

// ─────────────────────────────────────────────
// IMAGE LIMIT WARNING
// ─────────────────────────────────────────────
const ImageLimitWarning = React.memo(({ currentCount, limit, itemType }: { currentCount: number; limit: number; itemType: string }) => {
    if (currentCount > limit) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Limite Excedido</AlertTitle>
                <AlertDescription>{`Você excedeu o limite de ${limit} ${itemType}. Remova algumas para continuar.`}</AlertDescription>
            </Alert>
        );
    }
    return (
        <Alert variant={currentCount === limit ? "destructive" : "default"}>
            <Camera className="h-4 w-4" />
            <AlertTitle>Contador de Imagens</AlertTitle>
            <AlertDescription>{`Você usou ${currentCount} de ${limit} ${itemType}.`}</AlertDescription>
        </Alert>
    );
});
ImageLimitWarning.displayName = 'ImageLimitWarning';
