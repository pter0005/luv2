

"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition, DragEvent, useMemo } from "react";
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { reportWizardStuck } from '@/lib/wizard-stuck';
import { computeTotalBRL, computeTotalUSD, PRICES } from '@/lib/price';
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
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { signInAnonymously } from 'firebase/auth';
import { useCreatingPresence } from '@/hooks/usePresence';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
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
import NebulosaPoema from "@/components/effects/NebulosaPoema";
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
  _uploadingCount: z.number().default(0),
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
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — must match storage.rules

const deleteFileWithRetry = (storage: any, path: string) => {
    const attempt = (n: number) => {
        deleteObject(storageRef(storage, path)).catch(() => {
            if (n > 0) setTimeout(() => attempt(n - 1), 2000);
        });
    };
    attempt(2);
};

// Best-effort log pra eu ver no /admin/diagnostico-uploads quando ambas
// estratégias falham. Sem isso, erro fica só no console do client.
const logUploadFailure = async (reason: string, fileName: string, fileSize: number, folder: string, serverErr?: unknown, sdkErr?: unknown) => {
    try {
        await fetch('/api/error-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Upload falhou completamente: ${reason}`,
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                extra: {
                    fileName, fileSize, folder,
                    serverErr: serverErr instanceof Error ? serverErr.message : String(serverErr || ''),
                    sdkErr: sdkErr instanceof Error ? sdkErr.message : String(sdkErr || ''),
                },
            }),
        });
    } catch { /* best effort */ }
};

// Upload com 2 estratégias em cascata + retry inteligente:
// 1) /api/upload-image (server-side, fonte da verdade)
//    - Token refresh em 401, empty_file retryable, 5xx/429 retryable
// 2) FALLBACK: SDK direto + storage-check pra confirmar visibilidade real
// 3) Se ambas falham: loga central pra observabilidade
const confirmStorageVisible = async (path: string, idToken: string): Promise<boolean> => {
    const MAX_TRIES = 6;
    const DELAY = 2000;
    for (let i = 0; i < MAX_TRIES; i++) {
        try {
            const res = await fetch('/api/storage-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, idToken }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.exists && Number(data.size) > 0) return true;
        } catch { /* retenta */ }
        if (i < MAX_TRIES - 1) await new Promise(r => setTimeout(r, DELAY));
    }
    return false;
};

const uploadFile = async (storage: any, userId: string, file: File | Blob, folderName: string): Promise<FileWithPreview> => {
    if (!userId) throw new Error("Usuário não identificado para upload.");
    if (file.size > MAX_FILE_SIZE) throw new Error(`file_too_large:${Math.round(file.size / 1024 / 1024)}MB`);

    const authMod = await import('firebase/auth');
    const auth = authMod.getAuth(storage.app);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('no_auth_user');

    const origFileName = file instanceof File ? file.name : 'audio.webm';
    const fileSize = file.size;

    // ── ESTRATÉGIA 1: server-side com retry inteligente ──
    let serverErr: unknown;
    let idToken = await currentUser.getIdToken();

    for (let attempt = 0; attempt <= 2; attempt++) {
        try {
            const fd = new FormData();
            fd.append('file', file as Blob, origFileName);
            fd.append('folder', folderName);
            fd.append('idToken', idToken);

            const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                if (!data.ok || !data.path || !data.url) throw new Error('invalid_response');
                return { url: data.url, path: data.path };
            }

            if (res.status === 413) throw new Error(`file_too_large:${data.sizeMB || '?'}MB`);

            // 401: força refresh do token e tenta novamente uma vez.
            if (res.status === 401) {
                if (attempt === 0) {
                    idToken = await currentUser.getIdToken(true);
                    serverErr = new Error(`auth_refreshing (was ${data.error || res.status})`);
                    continue;
                }
                throw new Error('auth_failed');
            }

            // 400: empty_file pode ser FormData corrompido em mobile, retenta
            if (res.status === 400) {
                const e = String(data?.error || '');
                if (e === 'empty_file' && attempt < 2) {
                    serverErr = new Error('empty_file_retry');
                    await new Promise(r => setTimeout(r, 800));
                    continue;
                }
                throw new Error(`invalid:${e || 'unknown'}`);
            }

            // 429, 5xx, network errors → retryable
            throw new Error(data?.error || `http_${res.status}`);
        } catch (err: any) {
            serverErr = err;
            const msg = String(err?.message || '');
            if (msg.startsWith('file_too_large') || msg === 'auth_failed' || msg.startsWith('invalid:')) throw err;
            if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
    }

    // ── ESTRATÉGIA 2 (FALLBACK): SDK direto + storage-check ──
    console.warn('[uploadFile] /api/upload-image falhou após 3 tentativas, fallback SDK:', serverErr);
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = origFileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const sdkFileName = `${timestamp}-${random}-${safeName}`;
    const fullPath = `temp/${userId}/${folderName}/${sdkFileName}`;
    const fileRef = storageRef(storage, fullPath);
    let lastSdkErr: unknown;
    for (let attempt = 0; attempt <= 2; attempt++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const task = uploadBytesResumable(fileRef, file);
                task.on('state_changed', null, (err) => reject(err), () => resolve());
            });
            await getMetadata(fileRef);
            const downloadURL = await getDownloadURL(fileRef);
            const visible = await confirmStorageVisible(fullPath, idToken);
            if (!visible) throw new Error('upload_not_visible_after_polling');
            return { url: downloadURL, path: fullPath };
        } catch (err) {
            lastSdkErr = err;
            if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
    }

    // Ambas falharam: loga central pra observabilidade. Sem isso o erro
    // só aparece no console do user — invisível pro admin.
    await logUploadFailure(
        'server + fallback SDK falharam',
        origFileName, fileSize, folderName,
        serverErr, lastSdkErr,
    );
    throw lastSdkErr || serverErr;
};

// ─────────────────────────────────────────────
// GALLERY STEP
// ─────────────────────────────────────────────
const GalleryStep = React.memo(() => {
    const { control, formState: { errors }, setValue, getValues } = useFormContext<PageData>();
    const { fields, append, remove } = useFieldArray({ control, name: "galleryImages" });
    const { user, storage, isUserLoading } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const uploadingRef = useRef(false);
    const lastUploadFinishedRef = useRef(0);
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
        setValue('_uploadingCount', (getValues('_uploadingCount') || 0) + 1);
        try {
            const results = await Promise.allSettled(
                uniqueFiles.map(async file => {
                    const compressedFile = await compressImage(file, 1280, 0.9);
                    return uploadFile(storage, user.uid, compressedFile, 'gallery');
                }),
            );
            const succeeded = results.filter((r): r is PromiseFulfilledResult<FileWithPreview> => r.status === 'fulfilled').map(r => r.value);
            const failed = results.filter(r => r.status === 'rejected');
            if (succeeded.length > 0) append(succeeded);
            if (failed.length > 0) {
                const reason = (failed[0] as PromiseRejectedResult).reason;
                const isTooLarge = reason?.message?.includes('file_too_large');
                toast({
                    variant: 'destructive',
                    title: succeeded.length > 0 ? `${succeeded.length} enviada${succeeded.length > 1 ? 's' : ''}, ${failed.length} falhou` : 'Erro no Upload',
                    description: isTooLarge ? 'Uma ou mais imagens são muito grandes (máx 5MB). Tente fotos menores.' : `${failed.length} imagem(ns) não puderam ser enviadas. Tente novamente.`,
                });
            } else {
                toast({ title: 'Imagens enviadas!', description: `${succeeded.length} foto${succeeded.length > 1 ? 's' : ''} adicionada${succeeded.length > 1 ? 's' : ''}.` });
            }
        } catch (error: any) {
            console.error("Error uploading files:", error);
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar as imagens.' });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
            lastUploadFinishedRef.current = Date.now();
            setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = fields[index];
        if ('path' in imageToRemove && typeof (imageToRemove as any).path === 'string' && storage) {
            deleteFileWithRetry(storage, (imageToRemove as any).path);
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
    const { control, formState: { errors }, setValue, getValues } = useFormContext<PageData>();
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
        setValue('_uploadingCount', (getValues('_uploadingCount') || 0) + 1);
        try {
            const results = await Promise.allSettled(
                filesToUpload.map(async (file) => {
                    const compressedFile = await compressImage(file, 1280, 0.85);
                    return uploadFile(storage, user.uid, compressedFile, 'timeline');
                }),
            );
            const succeeded = results.filter((r): r is PromiseFulfilledResult<FileWithPreview> => r.status === 'fulfilled').map(r => r.value);
            const failed = results.filter(r => r.status === 'rejected');
            if (succeeded.length > 0) {
                const newEvents: TimelineEvent[] = succeeded.map(fileData => ({ image: fileData, description: '', date: undefined }));
                append(newEvents);
            }
            if (failed.length > 0) {
                const reason = (failed[0] as PromiseRejectedResult).reason;
                const isTooLarge = reason?.message?.includes('file_too_large');
                toast({
                    variant: 'destructive',
                    title: succeeded.length > 0 ? `${succeeded.length} enviada${succeeded.length > 1 ? 's' : ''}, ${failed.length} falhou` : 'Erro no Upload',
                    description: isTooLarge ? 'Uma ou mais imagens são muito grandes (máx 5MB). Tente fotos menores.' : `${failed.length} imagem(ns) não puderam ser enviadas. Tente novamente.`,
                });
            } else {
                toast({ title: `${succeeded.length} foto${succeeded.length > 1 ? 's' : ''} adicionada${succeeded.length > 1 ? 's' : ''}!`, description: 'Adicione uma descrição e data para cada momento.' });
            }
        } catch (error: any) {
            console.error("Erro no upload da timeline:", error);
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar as imagens.' });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
            setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
        }
    };

    const handleRemove = (index: number) => {
        const eventToRemove = fields[index];
        if ((eventToRemove as any).image?.path && storage) {
            deleteFileWithRetry(storage, (eventToRemove as any).image.path);
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
    const { toast } = useToast();
    const musicOption = useWatch({ control, name: "musicOption" });
    const youtubeUrl = useWatch({ control, name: "youtubeUrl" });
    const [isSearching, startSearchTransition] = useTransition();
    const [showManualLinkInput, setShowManualLinkInput] = useState(false);
    const manualLinkInputRef = useRef<HTMLInputElement>(null);

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
        { id: "nebulosa", name: 'Nebulosa', isFavorite: true },
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
                                                    {option.id === "nebulosa" && <div className="w-full h-full relative overflow-hidden"><NebulosaPoema /></div>}
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
// INTRO STEP — Introdução animada do site
// ─────────────────────────────────────────────

const IntroStep = React.memo(() => {
    const { control, watch, setValue } = useFormContext<PageData>();
    const { user } = useUser();
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    const introType = watch('introType');
    const introGender = watch('introGender');
    const isLove = introType === 'love';
    const isPoema = introType === 'poema';

    const handleSelect = (type: string, fieldOnChange: (v: string | undefined) => void) => {
        if (introType === type) {
            fieldOnChange(undefined);
        } else {
            fieldOnChange(type);
            if (type === 'poema') {
                setValue('backgroundAnimation', 'nebulosa');
            }
        }
    };

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="introType"
                render={({ field }) => (
                    <FormItem className="space-y-4">
                        {/* Card 1: Buquê Digital */}
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleSelect('poema', field.onChange)}
                                    className={cn(
                                        "w-full relative rounded-2xl overflow-hidden p-5 text-left transition-all duration-300 border-2",
                                        isPoema
                                            ? "border-purple-400"
                                            : "border-white/10 hover:border-purple-400/40"
                                    )}
                                    style={{
                                        background: isPoema
                                            ? 'linear-gradient(135deg, rgba(60,10,80,0.95) 0%, rgba(30,5,50,0.95) 50%, rgba(60,10,80,0.95) 100%)'
                                            : 'rgba(255,255,255,0.03)',
                                        ...(isPoema ? { boxShadow: '0 0 15px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' } : {}),
                                    }}
                                >
                                    {isPoema && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #5ee8b5, #3dd4a0)' }}>
                                            <svg width="12" height="12" viewBox="0 0 8 8" fill="none">
                                                <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="shrink-0 text-4xl" style={{ animation: isPoema ? 'poemaFloat 3s ease-in-out infinite' : 'none' }}>
                                            🌸
                                        </div>
                                        <style>{`@keyframes poemaFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-6px) rotate(5deg)}}`}</style>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-white">Buquê Digital</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                                    style={{ background: 'linear-gradient(135deg, #c084fc, #a855f7)', color: 'white' }}>
                                                    NOVO
                                                </span>
                                            </div>
                                            <p className="text-[12px] mt-1.5 leading-snug text-white/50">
                                                Poema animado com flores revelando &quot;você é o presente mais lindo que a vida me deu&quot;
                                            </p>
                                            <ul className="mt-3 space-y-1.5">
                                                {['Poema animado com 5 flores', 'Revelação dramática do bouquet', 'Versão masculina e feminina'].map((t, i) => (
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
                                        isPoema ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-white/40"
                                    )}>
                                        {isPoema ? 'Ativado!' : 'Toque para adicionar'}
                                    </div>
                                </button>

                                {/* Sub-options when Buquê Digital is selected */}
                                {isPoema && (
                                    <div className="space-y-4 rounded-2xl p-4 border border-purple-500/20" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">De quem recebe</p>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'fem' as const, label: 'Para Ela', emoji: '💝' },
                                                    { id: 'mas' as const, label: 'Para Ele', emoji: '💙' },
                                                ].map(g => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => setValue('introGender', g.id)}
                                                        className={cn(
                                                            "flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border",
                                                            introGender === g.id
                                                                ? "border-purple-400 bg-purple-500/20 text-purple-200"
                                                                : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
                                                        )}
                                                    >
                                                        {g.label} {g.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-white/30">
                                                {introGender === 'fem' ? 'Textos: "linda, doce, rara, única, especial"' : 'Textos: "lindo, doce, raro, único, especial"'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>

                        {/* Card 2: Coelhinho Kawaii */}
                        <button
                            type="button"
                            onClick={() => handleSelect('love', field.onChange)}
                            className={cn(
                                "w-full relative rounded-2xl overflow-hidden p-5 text-left transition-all duration-300 border-2",
                                isLove
                                    ? "border-pink-400"
                                    : "border-white/10 hover:border-pink-400/40"
                            )}
                            style={{
                                background: isLove
                                    ? 'linear-gradient(135deg, rgba(45,17,82,0.95) 0%, rgba(26,10,46,0.95) 50%, rgba(45,17,82,0.95) 100%)'
                                    : 'rgba(255,255,255,0.03)',
                                ...(isLove ? { boxShadow: '0 0 15px rgba(236,72,153,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' } : {}),
                            }}
                        >
                            {isLove && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #5ee8b5, #3dd4a0)' }}>
                                    <svg width="12" height="12" viewBox="0 0 8 8" fill="none">
                                        <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="shrink-0" style={{ animation: isLove ? 'bunnyBounce 2s ease-in-out infinite' : 'none' }}>
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
                                isLove ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-white/40"
                            )}>
                                {isLove ? 'Ativado!' : 'Toque para adicionar'}
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
// VOICE MESSAGE STEP — Order bump (+R$2,90)
// ─────────────────────────────────────────────
const VOICE_MESSAGE_PRICE = 2.90;

const VoiceMessageStep = React.memo(() => {
    const { control, setValue, getValues } = useFormContext<PageData>();
    const { user, storage, isUserLoading } = useFirebase();
    const { toast } = useToast();
    const audioRecording = useWatch({ control, name: "audioRecording" });
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'recorded'>(
        audioRecording?.url ? 'recorded' : 'idle'
    );
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (audioRecording?.url && status === 'idle') setStatus('recorded');
    }, [audioRecording?.url]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    const uploadRecording = async (audioBlob: Blob) => {
        if (isUserLoading) {
            toast({ title: 'Aguarde um momento', description: 'Verificando sua sessão...' });
            return;
        }
        if (!storage || !user) {
            setStatus('idle');
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Faça login novamente pra salvar sua gravação.' });
            return;
        }
        setStatus('uploading');
        setValue('_uploadingCount', (getValues('_uploadingCount') || 0) + 1);
        try {
            const fileData = await uploadFile(storage, user.uid, audioBlob, 'audio');
            setValue("audioRecording", fileData, { shouldDirty: true, shouldValidate: true });
            setStatus('recorded');
            toast({ title: 'Mensagem salva! 💝', description: 'Sua voz vai emocionar demais.' });
        } catch (error: any) {
            console.error("Error uploading audio:", error);
            setStatus('idle');
            const isTooLarge = error?.message?.includes('file_too_large');
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: isTooLarge ? 'Gravação muito grande (máx 5MB). Tente gravar uma mensagem mais curta.' : 'Não foi possível salvar sua gravação. Tente novamente.',
            });
        } finally {
            setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
        }
    };

    const startRecording = async () => {
        if (status === 'recording' || status === 'uploading') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            let mr: MediaRecorder;
            try {
                mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            } catch {
                // Safari iOS não suporta webm — cai no default do navegador.
                mr = new MediaRecorder(stream);
            }
            mediaRecorderRef.current = mr;
            audioChunksRef.current = [];
            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.onstop = () => {
                // Usa o mimeType real do MediaRecorder (Safari pode usar mp4/aac).
                const mime = mr.mimeType || 'audio/webm;codecs=opus';
                const blob = new Blob(audioChunksRef.current, { type: mime });
                audioChunksRef.current = [];
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }
                uploadRecording(blob);
            };
            mr.start();
            setStatus('recording');
            setElapsed(0);
            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => {
                setElapsed(prev => {
                    if (prev >= 59) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            toast({
                variant: "destructive",
                title: 'Microfone bloqueado',
                description: 'Libere o microfone nas permissões do navegador pra gravar.',
            });
        }
    };

    const stopRecording = () => {
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const removeRecording = () => {
        setValue("audioRecording", undefined, { shouldDirty: true, shouldValidate: true });
        setStatus('idle');
        setElapsed(0);
    };

    const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border-2 border-pink-500/40 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/10 to-rose-500/10 p-6 shadow-2xl">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-pink-500/30 blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-tight">Mensagem de Voz</h3>
                                <p className="text-xs text-muted-foreground">A parte mais emocionante da página</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-bold shadow-lg uppercase tracking-wider">
                                Opcional
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                        Grave até <strong>60 segundos</strong> da sua voz. Imagina o rostinho dela ao abrir a página e ouvir <em>você</em> dizendo o que sente. 🥹
                    </p>

                    {status === 'idle' && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-5 text-white font-bold shadow-xl shadow-pink-500/40 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            <span className="relative flex items-center justify-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                                </span>
                                Gravar minha mensagem
                            </span>
                        </button>
                    )}

                    {status === 'recording' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/20 border border-red-500/40">
                                <span className="relative flex h-4 w-4">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                                </span>
                                <span className="font-mono text-2xl font-bold tabular-nums">{mmss}</span>
                                <span className="text-xs text-red-300 uppercase tracking-wider">Gravando</span>
                            </div>
                            <Button
                                type="button"
                                onClick={stopRecording}
                                variant="destructive"
                                className="w-full py-6 text-base font-bold"
                            >
                                <StopCircle className="mr-2 h-5 w-5" />
                                Parar gravação
                            </Button>
                        </div>
                    )}

                    {status === 'uploading' && (
                        <div className="flex items-center justify-center gap-3 py-6 rounded-2xl bg-card border border-border">
                            <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                            <span className="text-sm font-medium">Salvando sua mensagem...</span>
                        </div>
                    )}

                    {status === 'recorded' && audioRecording?.url && (
                        <div className="space-y-3">
                            <div className="rounded-2xl bg-card/80 border border-pink-500/30 p-4 backdrop-blur">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-semibold text-green-500">Mensagem gravada</span>
                                </div>
                                <audio src={audioRecording.url} controls className="w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button type="button" variant="outline" onClick={startRecording}>
                                    <Mic className="mr-2 h-4 w-4" /> Gravar de novo
                                </Button>
                                <Button type="button" variant="ghost" onClick={removeRecording} className="text-muted-foreground hover:text-destructive">
                                    <Trash className="mr-2 h-4 w-4" /> Remover
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>
                    Opcional — pode pular essa etapa sem problema.
                </p>
            </div>
        </div>
    );
});
VoiceMessageStep.displayName = "VoiceMessageStep";

// ─────────────────────────────────────────────
// PUZZLE STEP — FIX #5: toast quando !user || !storage
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// FEATURE HEADER — destaca jogos/extras com tag de preço, ícone e copy persuasivo
// ─────────────────────────────────────────────
type FeatureHeaderProps = {
  icon: React.ReactNode;
  title: string;
  hook: string;          // copy de uma linha que vende a feature
  bullets?: string[];    // 2-3 motivos pra ativar
  badge: 'free' | 'paid' | 'vip-included';
  badgePrice?: string;   // ex: "+R$ 2,00"
  accent: string;        // hex pra colorir
  enabled: boolean;
};
const FeatureHeader = ({ icon, title, hook, bullets, badge, badgePrice, accent, enabled }: FeatureHeaderProps) => {
  // Se o usuário escolheu VIP, qualquer feature paga vira "INCLUÍDO NO VIP".
  // Reduz fricção pra ativar add-ons sem o medo de "tá pagando duas vezes".
  const { control } = useFormContext<PageData>();
  const planValue = useWatch({ control, name: 'plan' });
  const isVipPlan = planValue === 'vip';
  const effectiveBadge: 'free' | 'paid' | 'vip-included' =
    badge === 'paid' && isVipPlan ? 'vip-included' : badge;

  const badgeText = effectiveBadge === 'free' ? 'GRÁTIS'
    : effectiveBadge === 'vip-included' ? 'INCLUÍDO NO VIP ✨'
    : `EXTRA ${badgePrice ?? ''}`.trim();
  const badgeColor = effectiveBadge === 'free' ? '#22c55e'
    : effectiveBadge === 'vip-included' ? '#a855f7'
    : '#fbbf24';
  return (
    <div className="rounded-2xl overflow-hidden mb-2" style={{
      background: enabled
        ? `linear-gradient(135deg, ${accent}1f, ${accent}08)`
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${enabled ? accent + '50' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: enabled ? `0 8px 28px -12px ${accent}60` : undefined,
      transition: 'all 0.3s',
    }}>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{
            background: `${accent}20`,
            border: `1px solid ${accent}50`,
          }}>
            <div style={{ color: accent }}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-[15px] font-black text-foreground leading-tight">{title}</h3>
              <span className={cn(
                "text-[9.5px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap",
                effectiveBadge === 'vip-included' && "animate-pulse"
              )} style={{
                background: `${badgeColor}20`,
                color: badgeColor,
                border: `1px solid ${badgeColor}50`,
                boxShadow: effectiveBadge === 'vip-included' ? `0 0 12px ${badgeColor}80` : undefined,
              }}>{badgeText}</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug">{hook}</p>
          </div>
        </div>
        {bullets && bullets.length > 0 && (
          <ul className="space-y-1 pl-1">
            {bullets.map((b, i) => (
              <li key={i} className="text-[11.5px] text-muted-foreground/90 flex items-start gap-1.5">
                <span style={{ color: accent }} className="mt-[3px] shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const PuzzleStep = React.memo(({ handleAutosave }: { handleAutosave?: () => Promise<void> }) => {
    const { control, setValue, getValues, watch } = useFormContext<PageData>();
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
            setValue('_uploadingCount', (getValues('_uploadingCount') || 0) + 1);
            try {
                const compressedBlob = await compressImage(file, 1280, 0.9);
                const fileData = await uploadFile(storage, user.uid, compressedBlob, 'puzzle');
                setValue("puzzleImage", fileData, { shouldValidate: true, shouldDirty: true });
                setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
                await handleAutosave?.();
                toast({ title: 'Imagem enviada!', description: 'Sua foto foi adicionada.' });
            } catch (error: any) {
                console.error("Error processing puzzle image:", error);
                setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
                const isTooLarge = error?.message?.includes('file_too_large');
                toast({
                    variant: 'destructive',
                    title: 'Erro no Upload',
                    description: isTooLarge ? 'Imagem muito grande (máx 5MB). Tente uma foto menor.' : 'Não foi possível enviar a imagem. Tente novamente.',
                });
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const removePuzzleImage = async () => {
        if (puzzleImage?.path && storage) {
            deleteFileWithRetry(storage, puzzleImage.path);
        }
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
        await handleAutosave?.();
        toast({ title: 'Imagem removida' });
    };

    return (
        <div className="space-y-6">
            <FeatureHeader
                icon={<Puzzle className="w-6 h-6" />}
                title="Quebra-cabeça surpresa 🧩"
                hook="A pessoa precisa montar um quebra-cabeça pra ver a página. É a entrada inesquecível que faz a surpresa começar com emoção."
                bullets={[
                    'Cria expectativa: a pessoa vai montando peça por peça',
                    'Toca a música assim que ele é resolvido',
                    'Bem mais marcante que abrir um link normal',
                ]}
                badge="free"
                accent="#a855f7"
                enabled={!!enablePuzzle}
            />
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
    const { control, watch, setValue, getValues } = useFormContext<PageData>();
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
        setValue('_uploadingCount', (getValues('_uploadingCount') || 0) + 1);
        try {
            const results = await Promise.allSettled(
                uniqueFiles.map(async file => {
                    const compressedFile = await compressImage(file, 400, 0.8);
                    return uploadFile(storage, user.uid, compressedFile, 'memory-game');
                }),
            );
            const succeeded = results.filter((r): r is PromiseFulfilledResult<FileWithPreview> => r.status === 'fulfilled').map(r => r.value);
            const failed = results.filter(r => r.status === 'rejected');
            if (succeeded.length > 0) append(succeeded);
            if (failed.length > 0) {
                const reason = (failed[0] as PromiseRejectedResult).reason;
                const isTooLarge = reason?.message?.includes('file_too_large');
                toast({
                    variant: 'destructive',
                    title: succeeded.length > 0 ? `${succeeded.length} enviada${succeeded.length > 1 ? 's' : ''}, ${failed.length} falhou` : 'Erro no Upload',
                    description: isTooLarge ? 'Uma ou mais imagens são muito grandes (máx 5MB). Tente fotos menores.' : `${failed.length} imagem(ns) não puderam ser enviadas. Tente novamente.`,
                });
            } else {
                toast({ title: 'Imagens enviadas!', description: `${succeeded.length} foto${succeeded.length > 1 ? 's' : ''} adicionada${succeeded.length > 1 ? 's' : ''}.` });
            }
        } catch (error: any) {
            console.error("Error uploading memory game files:", error);
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar as imagens.' });
        } finally {
            setIsUploading(false);
            uploadingRef.current = false;
            lastUploadFinishedRef.current = Date.now();
            setValue('_uploadingCount', Math.max(0, (getValues('_uploadingCount') || 0) - 1));
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = fields[index];
        if ('path' in imageToRemove && typeof (imageToRemove as any).path === 'string' && storage) {
            deleteFileWithRetry(storage, (imageToRemove as any).path);
        }
        remove(index);
    };

    return (
        <div className="space-y-6">
            <FeatureHeader
                icon={<Heart className="w-6 h-6" />}
                title="Jogo da memória de vocês 💝"
                hook="Suas fotos viram cartas de um jogo da memória. Fofo, divertido, e a pessoa vira pra te mostrar as combinações."
                bullets={[
                    'Use de 2 a 8 fotos especiais',
                    'Cada par revela uma lembrança',
                    'Hit certo pra páginas de aniversário e namoro',
                ]}
                badge="free"
                accent="#ec4899"
                enabled={!!enableMemoryGame}
            />
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
        <div className="space-y-6">
            <FeatureHeader
                icon={<HelpCircle className="w-6 h-6" />}
                title="Quiz do casal 🤔"
                hook="Perguntas que só vocês dois saberiam responder. Divertido, íntimo, e descobre quanto a pessoa te conhece de verdade."
                bullets={[
                    'Até 5 perguntas com múltipla escolha',
                    'A pessoa joga e vê o resultado no fim',
                    'Funciona muito bem pra mãe, pai, melhor amigo também',
                ]}
                badge="free"
                accent="#06b6d4"
                enabled={!!enableQuiz}
            />
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
        <div className="space-y-6">
            <FeatureHeader
                icon={<Sparkles className="w-6 h-6" />}
                title="Adivinhe a palavra 💘"
                hook="Tipo Forca: a pessoa descobre palavras secretas suas, letra por letra. Cada uma é uma pista íntima do que vocês têm."
                bullets={[
                    'Até 4 palavras com dica personalizada',
                    'Mais íntimo que quiz — letra por letra',
                    'Combina muito com plano avançado/VIP',
                ]}
                badge="paid"
                badgePrice={`+R$ ${PRICES.wordGame.toFixed(2).replace('.', ',')}`}
                accent="#fbbf24"
                enabled={!!enableWordGame}
            />
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
    const { firestore } = useFirebase();
    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);

    const [lockedPlan, setLockedPlan] = useState<string | null>(null);
    useEffect(() => {
        const giftToken = new URLSearchParams(window.location.search).get('gift') || localStorage.getItem('mycupid_gift_token');
        if (giftToken) {
            fetch(`/api/gift?token=${giftToken}`)
                .then(r => r.json())
                .then(d => {
                    if (d.valid && d.plan) {
                        const wizardPlan = d.plan === 'vip' ? 'avancado' : d.plan;
                        setLockedPlan(wizardPlan);
                        field.onChange(wizardPlan);
                    }
                })
                .catch(() => {});
            return;
        }
        const email = user?.email;
        if (!email || !firestore) return;
        getDoc(firestoreDoc(firestore, 'user_credits', email.toLowerCase().trim()))
            .then((snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    const available = Math.max(0, (d.totalCredits ?? 0) - (d.usedCredits ?? 0));
                    if (available > 0 && d.plan) {
                        const wizardPlan = d.plan === 'vip' ? 'avancado' : d.plan;
                        setLockedPlan(wizardPlan);
                        field.onChange(wizardPlan);
                    }
                }
            })
            .catch(() => {});
    }, [user?.email, !!firestore]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedPlan = field.value;
    const isBasicoSelected = selectedPlan === 'basico';
    const isAvancadoSelected = selectedPlan === 'avancado';

    // ── Flash offer countdown (10 min, per-session) ──
    const [offerLeft, setOfferLeft] = useState(0);
    useEffect(() => {
        const KEY = 'mycupid_offer_deadline_v2';
        let stored = localStorage.getItem(KEY);
        const now = Date.now();
        let deadline: number;
        if (!stored) {
            deadline = now + 10 * 60 * 1000; // 10 min
            localStorage.setItem(KEY, String(deadline));
        } else {
            deadline = parseInt(stored, 10);
            // Safety: reset if corrupted/too far in the future
            if (!Number.isFinite(deadline) || deadline - now > 10 * 60 * 1000) {
                deadline = now + 10 * 60 * 1000;
                localStorage.setItem(KEY, String(deadline));
            }
        }
        const tick = () => {
            const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setOfferLeft(left);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);
    const offerActive = offerLeft > 0;
    const mm = String(Math.floor(offerLeft / 60)).padStart(2, '0');
    const ss = String(offerLeft % 60).padStart(2, '0');
    const offerPct = Math.max(0, Math.min(100, (offerLeft / 600) * 100));

    return (
        <div className="space-y-5">
            {/* Flash offer pill — subtle, glass, with progress bar */}
            {offerActive && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(20,15,35,0.7) 100%)',
                        border: '1px solid rgba(168,85,247,0.28)',
                        boxShadow: '0 0 22px rgba(147,51,234,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.15))',
                            border: '1px solid rgba(168,85,247,0.35)',
                        }}>
                        <Sparkles className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-black text-purple-300/90">Oferta relâmpago · R$5 off</span>
                            <span className="text-sm font-black tabular-nums text-white">
                                {mm}:{ss}
                            </span>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                                style={{
                                    width: `${offerPct}%`,
                                    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                                    boxShadow: '0 0 8px rgba(168,85,247,0.5)',
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 leading-tight">Garanta o desconto antes de acabar</p>
                    </div>
                </motion.div>
            )}
            {lockedPlan && (
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-green-500/10 border border-green-500/20">
                    <Gift className="w-5 h-5 text-green-400 shrink-0" />
                    <p className="text-sm text-green-300 font-medium">
                        Você tem uma página grátis no plano <span className="font-black">{lockedPlan === 'avancado' ? 'Avançado' : 'Básico'}</span>!
                    </p>
                </div>
            )}
            <RadioGroup onValueChange={lockedPlan ? undefined : field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ── PLANO BÁSICO — tom de alerta (temporário) ── */}
                <Label htmlFor="plan-basico" className={cn(
                    "relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border-2",
                    lockedPlan && lockedPlan !== 'basico' ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer",
                    isBasicoSelected
                        ? "border-amber-500/60 shadow-lg shadow-amber-500/10"
                        : "border-white/10 hover:border-amber-500/30"
                )}
                style={{
                    background: 'linear-gradient(160deg, rgba(45,25,15,0.5) 0%, rgba(15,10,20,0.85) 100%)',
                }}>
                    <RadioGroupItem value="basico" id="plan-basico" className="sr-only peer" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-fit px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-b-lg z-10 flex items-center gap-1 uppercase tracking-wider">
                        <Hourglass className="w-3 h-3" /> Temporário
                    </div>
                    <div className="p-5 pt-10 flex-grow flex flex-col">
                        <h3 className="text-lg font-black text-white mb-1">Plano Básico</h3>
                        <p className="text-[11px] text-amber-300/70 mb-4 leading-snug">Surpresa impactante, mas com prazo.</p>
                        <div className="mb-5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[13px] text-white/35 line-through font-semibold">R$34,90</span>
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 rounded px-1 py-[1px]">-43%</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-3xl font-black text-white">R$19,90</span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-0.5">pagamento único</p>
                        </div>
                        <ul className="space-y-2.5 text-xs flex-grow">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500/80 shrink-0 mt-0.5" />
                                <span className="text-white/85 leading-tight">Todos os recursos de personalização</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500/80 shrink-0 mt-0.5" />
                                <span className="text-white/85 leading-tight">Todos os jogos inclusos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">⏰</span>
                                <span className="text-amber-300 leading-tight font-semibold">Expira em 25 horas</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" />
                                <span className="text-red-300/80 leading-tight font-semibold">Depois ela perde o acesso</span>
                            </li>
                        </ul>
                    </div>
                    <div className={cn(
                        "w-full p-3 text-center font-bold text-xs border-t transition-all",
                        isBasicoSelected
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
                            : "bg-white/[0.02] border-white/10 text-white/50"
                    )}>
                        {isBasicoSelected ? '✓ Plano Selecionado' : 'Escolher Básico'}
                    </div>
                </Label>

                {/* ── PLANO AVANÇADO — premium, eterno ── */}
                <Label htmlFor="plan-avancado" className={cn(
                    "relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border-2",
                    lockedPlan && lockedPlan !== 'avancado' ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer",
                    isAvancadoSelected
                        ? "border-purple-400 shadow-2xl shadow-purple-500/25"
                        : "border-purple-500/40 hover:border-purple-400/70"
                )}
                style={{
                    background: 'linear-gradient(160deg, rgba(88,28,135,0.35) 0%, rgba(30,15,50,0.9) 55%, rgba(15,10,30,0.95) 100%)',
                    boxShadow: isAvancadoSelected
                        ? '0 0 40px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                    <RadioGroupItem value="avancado" id="plan-avancado" className="sr-only peer" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-fit px-3 py-1 text-[10px] font-black rounded-b-lg z-10 flex items-center gap-1 uppercase tracking-wider text-white"
                        style={{
                            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                            boxShadow: '0 2px 12px rgba(168,85,247,0.4)',
                        }}>
                        ✨ Mais Popular
                    </div>
                    <div className="p-5 pt-10 flex-grow flex flex-col">
                        <h3 className="text-lg font-black text-white mb-1">Plano Avançado</h3>
                        <p className="text-[11px] text-purple-300/80 mb-4 leading-snug">A mesma surpresa — sem nunca sumir.</p>
                        <div className="mb-5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[13px] text-white/35 line-through font-semibold">R$49,90</span>
                                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 rounded px-1 py-[1px]">-50%</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-3xl font-black text-white">R$24,90</span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-0.5">pagamento único · sem renovação</p>
                        </div>
                        <ul className="space-y-2.5 text-xs flex-grow">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                <span className="text-white/95 leading-tight">Todos os recursos de personalização</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                <span className="text-white/95 leading-tight">Todos os jogos inclusos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">💎</span>
                                <span className="text-purple-200 leading-tight font-black">Online PRA SEMPRE</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                <span className="text-white/95 leading-tight">Backup infinito das fotos e mensagens</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                <span className="text-white/95 leading-tight">Ela pode rever sempre que quiser</span>
                            </li>
                        </ul>
                    </div>
                    <div className={cn(
                        "w-full p-3 text-center font-black text-xs border-t transition-all",
                        isAvancadoSelected
                            ? "bg-purple-500/25 border-purple-400/40 text-white"
                            : "bg-purple-500/10 border-purple-500/30 text-purple-200"
                    )}>
                        {isAvancadoSelected ? '✓ Plano Selecionado' : '✨ Quero pra sempre'}
                    </div>
                </Label>
            </RadioGroup>

            {/* Upsell helper quando Básico selecionado (não mostra se plano está travado por crédito) */}
            {isBasicoSelected && !lockedPlan && (
                <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => field.onChange('avancado')}
                    className="w-full relative rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(30,15,50,0.9) 100%)',
                        border: '1.5px solid rgba(168,85,247,0.4)',
                        boxShadow: '0 0 24px rgba(147,51,234,0.15)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/25 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 text-purple-300" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-white leading-tight">
                                Por só <span className="text-purple-300">R$5 a mais</span>, sua página dura <span className="text-purple-300 whitespace-nowrap">pra sempre 💜</span>
                            </p>
                            <p className="text-[11px] text-white/50 mt-1 leading-snug">
                                No Básico, depois de 25h a página some e ela não consegue rever esse momento. No Avançado fica online eternamente.
                            </p>
                            <span className="inline-block mt-2 text-[11px] font-bold text-purple-300">Fazer upgrade →</span>
                        </div>
                    </div>
                </motion.button>
            )}
        </div>
    );
});
PlanStep.displayName = "PlanStep";

// ─────────────────────────────────────────────
// stepComponents array — index-aligned com o array `steps` abaixo.
// ─────────────────────────────────────────────
const stepComponents: React.ComponentType<any>[] = [
    TitleStep,         // 0 - title
    MessageStep,       // 1 - message
    SpecialDateStep,   // 2 - specialDate
    GalleryStep,       // 3 - gallery
    TimelineStep,      // 4 - timeline
    IntroStep,         // 5 - intro
    MusicStep,         // 6 - music
    BackgroundStep,    // 7 - background
    PuzzleStep,        // 8 - puzzle
    MemoryGameStep,    // 9 - memory
    QuizStep,          // 10 - quiz
    WordGameStep,      // 11 - word game
    PlanStep,          // 12 - plan
    VoiceMessageStep,  // 13 - voice
];

// ─────────────────────────────────────────────
// PAYMENT STEP
// ─────────────────────────────────────────────
const PaymentStep = ({ setPageId }: { setPageId: (id: string) => void; }) => {
    const { getValues, watch, setValue, control } = useFormContext<PageData>();
    const plan = watch('plan') as 'basico' | 'avancado';
    const intentId = watch('intentId');
    const uploadingCount = watch('_uploadingCount') || 0;
    const { user } = useUser();
    const [isProcessing, startTransition] = useTransition();
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<{ message: string; details?: any } | null>(null);

    // Safety net: se uploadingCount ficou >0 por mais de 90s sem mudar,
    // assume que algum upload travou e força reset. NUNCA bloqueia checkout
    // por causa de contador stale.
    const lastCountChangeRef = useRef({ count: 0, t: Date.now() });
    useEffect(() => {
        if (uploadingCount !== lastCountChangeRef.current.count) {
            lastCountChangeRef.current = { count: uploadingCount, t: Date.now() };
        }
        if (uploadingCount === 0) return;
        const timer = setTimeout(() => {
            const now = Date.now();
            const stale = now - lastCountChangeRef.current.t > 90_000;
            if (stale && (getValues('_uploadingCount') || 0) > 0) {
                console.warn('[wizard] uploadingCount travado >90s, resetando pra 0');
                setValue('_uploadingCount', 0);
            }
        }, 90_000);
        return () => clearTimeout(timer);
    }, [uploadingCount, getValues, setValue]);
    const { toast } = useToast();
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; paymentId: string } | null>(null);
    const [pixExpired, setPixExpired] = useState(false);
    const [pixTimeLeft, setPixTimeLeft] = useState(0);
    const pixCreatedAtRef = useRef<number>(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Guard contra duplo-click em payment buttons — evita 2 intents/cobranças.
    const submitGuardRef = useRef(false);
    const acquireSubmitGuard = () => {
        if (submitGuardRef.current) return false;
        submitGuardRef.current = true;
        setTimeout(() => { submitGuardRef.current = false; }, 30_000);
        return true;
    };
    const releaseSubmitGuard = () => { submitGuardRef.current = false; };
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
    // Bound to form state so every saveIntent call persists it — never lost.
    const whatsappNumber = watch('whatsappNumber') || '';
    const setWhatsappNumber = useCallback((val: string) => {
        setValue('whatsappNumber', val, { shouldDirty: true });
    }, [setValue]);
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
    const WORD_GAME_PRICE = PRICES.wordGame;
    const introType = watch('introType');
    const hasIntro = introType === 'love' || introType === 'poema';
    const audioRecordingField = watch('audioRecording');
    const hasVoiceMessage = !!audioRecordingField?.url;
    const basePriceUSD = plan === 'basico' ? 9.90 : 14.90;

    const basePriceBRL = plan === 'basico' ? PRICES.basico : PRICES.avancado;
    const totalBRL = computeTotalBRL({
        plan,
        qrCodeDesign,
        enableWordGame,
        wordGameQuestions,
        introType,
        audioRecording: audioRecordingField,
        discountAmount,
    });
    const totalUSD = basePriceUSD;

    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);

    // ── CRÉDITOS DO USUÁRIO ────────────────────────────────────────
    const [userCredits, setUserCredits] = useState(0);
    const [creditPlan, setCreditPlan] = useState<string | null>(null);
    useEffect(() => {
        const emailToCheck = user?.email || confirmedGuestEmail;
        if (!emailToCheck || !firestore) return;
        getDoc(firestoreDoc(firestore, 'user_credits', emailToCheck.toLowerCase().trim()))
            .then((snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    const available = Math.max(0, (d.totalCredits ?? 0) - (d.usedCredits ?? 0));
                    setUserCredits(available);
                    if (available > 0 && d.plan) {
                        setCreditPlan(d.plan);
                        setValue('plan', d.plan);
                    }
                } else {
                    setUserCredits(0);
                    setCreditPlan(null);
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

        // ── DEDUP GUARD ───────────────────────────────────────────────
        // Impede que o mesmo pageId dispare Purchase mais de uma vez neste
        // browser, mesmo se o componente remontar, o usuário voltar pra página,
        // ou o polling bater várias vezes.
        const dedupeKey = `purchase_fired_${pageId}`;
        try {
            if (localStorage.getItem(dedupeKey)) {
                console.log('[Pixel] Purchase já disparado pra', pageId, '— pulando.');
                return;
            }
            localStorage.setItem(dedupeKey, '1');
        } catch (_) { /* localStorage bloqueado */ }

        trackFunnelStep('paid', 999, 999);

        const planVal = getValues('plan');
        // Usa o totalBRL real (inclui add-ons: voice, intro, word game, desconto).
        // Fallback defensivo caso totalBRL não esteja pronto.
        const value = Number.isFinite(totalBRL) && totalBRL > 0
            ? Number(totalBRL.toFixed(2))
            : (planVal === 'avancado' ? 24.90 : 19.90);

        // ── TIKTOK PIXEL ──────────────────────────────────────────────
        try {
            const ttq = (window as any).ttq;
            if (ttq) {
                // currency BRL hardcoded: esse wizard atende SOMENTE BR
                // (rota /criar/fazer-eu-mesmo). PT/US passam pelo /chat,
                // que tem trackEvent currency-aware via useMarket.
                ttq.track('CompletePayment', {
                    value,
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
        // eventID = pageId permite o Meta deduplicar este fire com o CAPI server-side
        // (que também usa pageId como event_id).
        const fireMeta = (retries = 15) => {
            if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                window.fbq('track', 'Purchase', {
                    value,
                    currency: 'BRL',
                    content_ids: [planVal],
                    content_type: 'product',
                }, { eventID: pageId });
                console.log('[Meta Pixel] Purchase disparado:', { value, planVal, eventID: pageId });
            } else if (retries > 0) {
                setTimeout(() => fireMeta(retries - 1), 500);
            } else {
                console.warn('[Meta Pixel] fbq não inicializou — Purchase não disparado');
            }
        };
        fireMeta();

        // ── GA4 ───────────────────────────────────────────────────────
        trackEvent('Purchase', {
            value,
            currency: 'BRL',
            transaction_id: pageId,
            items: [{ item_name: planVal === 'avancado' ? 'Plano Avançado' : 'Plano Básico' }],
        });
        // ─────────────────────────────────────────────────────────────

    }, [setPageId, toast, getValues, totalBRL]);

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

    // PIX expiry countdown (15 min)
    useEffect(() => {
        if (!pixData) { setPixExpired(false); setPixTimeLeft(0); return; }
        if (!pixCreatedAtRef.current) pixCreatedAtRef.current = Date.now();
        const PIX_TTL = 15 * 60 * 1000; // 15 min
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
        // NUNCA bloqueia venda por causa de upload em andamento — finalize tem self-heal.
        if (!user) { setError({ message: 'Sessão carregando, aguarde um instante e tente novamente.' }); return; }
        if (isAnonymousUser && !confirmedGuestEmail) { setGuestEmailError('Confirme seu e-mail antes de pagar.'); return; }
        if (!acquireSubmitGuard()) return;
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
                // Passa contato explícito pra evitar race/estado stale do intent — processPixPayment
                // exige email válido e não tem fallback silencioso.
                const payerEmail = (confirmedGuestEmail || user.email || '').trim().toLowerCase();
                const paymentResult = await processPixPayment(
                    saveResult.intentId,
                    totalBRL,
                    discountCode,
                    { whatsapp: whatsappNumber.replace(/\D/g, ''), email: payerEmail },
                );
                if (paymentResult.error) {
                    setError({ message: paymentResult.error, details: paymentResult.details || {} });
                } else if (paymentResult.qrCode && paymentResult.qrCodeBase64 && paymentResult.paymentId) {
                    setPixData({ qrCode: paymentResult.qrCode, qrCodeBase64: paymentResult.qrCodeBase64, paymentId: paymentResult.paymentId });
                    trackFunnelStep('pix_generated', 16, 15);
                    // Discount is now marked as used server-side inside
                    // processPixPayment() — before PIX generation, not after.
                    // Just clean up the localStorage flag on the client.
                    if (discountCode) {
                        localStorage.removeItem('mycupid_discount_code');
                    }
                }
            } catch (err: any) {
                setError({ message: "Erro ao conectar com o serviço de pagamento.", details: err });
            } finally {
                releaseSubmitGuard();
            }
        });
    };

    const handleStripePayment = () => {
        setError(null);
        // NUNCA bloqueia venda por causa de upload em andamento — finalize tem self-heal.
        if (!user) { setError({ message: 'Sessão carregando, aguarde um instante e tente novamente.' }); return; }
        if (!acquireSubmitGuard()) return;
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
                const formData = getValues();
                // ANTES: passava `planValue` (string 'avancado'/'basico') no slot de
                // clientClaimedTotalUSD, dava NaN no Math.abs(undefined-total) e a
                // sessão do Stripe falhava com 'Price mismatch' silencioso.
                const claimedUSD = computeTotalUSD({
                  plan: formData.plan,
                  qrCodeDesign: formData.qrCodeDesign,
                  enableWordGame: formData.enableWordGame,
                  wordGameQuestions: formData.wordGameQuestions as any,
                  introType: formData.introType,
                  audioRecording: formData.audioRecording as any,
                  discountAmount: discountAmount,
                });
                const stripeContact = {
                  email: confirmedGuestEmail || user.email || formData.payment?.payerEmail,
                  phone: whatsappNumber,
                };
                const sessionResult = await createStripeCheckoutSession(
                  saveResult.intentId,
                  claimedUSD,
                  discountCode,
                  stripeContact,
                );
                if (!sessionResult.success) {
                    setError({ message: sessionResult.error || "Could not create Stripe checkout session." });
                } else {
                    window.location.href = sessionResult.url!;
                }
            } catch (err: any) {
                setError({ message: "Error connecting to the payment service.", details: err });
            } finally {
                releaseSubmitGuard();
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
        // NUNCA bloqueia por upload em andamento — finalize tem self-heal.
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
                {introType === 'love' && (
                  <p className="text-xs text-pink-300 mt-0.5">
                    Inclui Coelhinho Kawaii (+R$5,90)
                  </p>
                )}
                {introType === 'poema' && (
                  <p className="text-xs text-purple-300 mt-0.5">
                    Inclui Buquê Digital (+R$6,90)
                  </p>
                )}
                {hasVoiceMessage && (
                  <p className="text-xs text-pink-300 mt-0.5">
                    Inclui Mensagem de Voz (+R$2,90)
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
                                Por apenas <span className="text-purple-300">R$5 a mais</span>, sua página dura <span className="whitespace-nowrap">para sempre 💜</span>
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
                        Quero que dure para sempre — R$24,90 →
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
                            <p className="text-xs text-white/50">Crie esta página no Plano {creditPlan === 'basico' ? 'Básico' : 'Avançado'} sem pagar nada</p>
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
                                        const saveResult = await createOrUpdatePaymentIntent({ ...data, userId: user.uid, guestEmail: email });
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
                <Button
                  onClick={handleOneClickPix}
                  disabled={isProcessing || whatsappNumber.replace(/\D/g, '').length < 10}
                  size="lg"
                  className="w-full h-auto py-4 text-lg font-bold bg-[#009EE3] hover:bg-[#008ac6] disabled:opacity-60 disabled:cursor-not-allowed">
                    {isProcessing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span>Gerando QR Code do Mercado Pago...</span></>
                    ) : whatsappNumber.replace(/\D/g, '').length < 10 ? (
                        <span>Preencha seu WhatsApp para continuar</span>
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
                            {pixTimeLeft > 0 && (() => {
                                const mm = Math.floor(pixTimeLeft / 60);
                                const ss = pixTimeLeft % 60;
                                const pct = Math.max(0, Math.min(100, (pixTimeLeft / 900) * 100));
                                const isCritical = pixTimeLeft <= 180; // ≤ 3min
                                const isWarning = pixTimeLeft <= 360 && pixTimeLeft > 180; // 3-6min
                                const tone = isCritical
                                    ? { border: 'border-red-500/40', bg: 'bg-red-500/10', text: 'text-red-300', label: 'text-red-300/90', bar: 'bg-red-500' }
                                    : isWarning
                                    ? { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-200', label: 'text-amber-200/90', bar: 'bg-amber-400' }
                                    : { border: 'border-zinc-700/60', bg: 'bg-zinc-900/60', text: 'text-zinc-100', label: 'text-zinc-400', bar: 'bg-zinc-400' };
                                return (
                                    <div className={cn('w-full max-w-sm rounded-2xl border backdrop-blur-sm px-4 py-3 flex items-center gap-3', tone.border, tone.bg)}>
                                        <div className={cn('shrink-0 w-9 h-9 rounded-full flex items-center justify-center border', tone.border)}>
                                            <Clock className={cn('w-4 h-4', tone.text)} />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className={cn('text-[10px] uppercase tracking-wider font-semibold', tone.label)}>
                                                {isCritical ? 'Últimos minutos!' : 'Garanta sua página'}
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={cn('text-xl font-black font-mono tabular-nums leading-none', tone.text)}>
                                                    {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                                                </span>
                                                <span className={cn('text-[10px]', tone.label)}>até expirar</span>
                                            </div>
                                            <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                                                <div className={cn('h-full transition-[width] duration-1000 ease-linear', tone.bar)} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
    const { toast } = useToast();
    const qrCodeDesign = getValues('qrCodeDesign');
    const { user } = useUser();
    const adminEmails = ADMIN_EMAILS;
    const isAdmin = user?.email && adminEmails.includes(user.email);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
      setIsDownloading(true);
      try {
        await downloadQrCard(pageId, qrCodeDesign);
      } catch (e: any) {
        console.error(e);
        // iOS Safari não suporta download programático — abre em nova aba como fallback
        const dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`https://mycupid.com.br/p/${pageId}`)}`;
        window.open(dataUrl, '_blank');
        toast({ title: 'Salve a imagem', description: 'Toque e segure a imagem para salvar no seu dispositivo.' });
      } finally {
        setIsDownloading(false);
      }
    };

    // Nota: Purchase já é disparado em handlePaymentSuccess com deduplicação por pageId.
    // Este step é só UI — não dispara pixel de novo pra não inflar contagem.

    const handleCopy = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${whatsappMessage}\n${pageUrl}`)}`;

    return (
        <div className="flex flex-col items-center text-center gap-5 max-w-lg mx-auto w-full px-2">
            {/* ── Ícone animado + título ──────────────────────────── */}
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/50">
                    <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-black font-headline bg-gradient-to-r from-green-300 via-emerald-200 to-green-400 bg-clip-text text-transparent">
                    {title}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
            </div>

            {/* ── DESTAQUE MÁXIMO: LINK DA PÁGINA ──────────────────── */}
            <div className="relative w-full mt-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-60 animate-pulse" />
                <div className="relative rounded-2xl p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <p className="text-[11px] font-bold text-green-400 uppercase tracking-widest">Seu link está pronto</p>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5 mb-3">
                        <p className="flex-grow text-left text-sm font-mono text-white truncate">{pageUrl}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "w-full py-4 rounded-xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg",
                            copied
                                ? "bg-green-500 text-white shadow-green-500/40"
                                : "bg-white text-black hover:bg-zinc-100 shadow-white/20"
                        )}
                    >
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {copied ? 'Link copiado!' : 'Copiar link da página'}
                    </button>
                </div>
            </div>

            {/* ── WHATSAPP SHARE ─────────────────────────────────── */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-white text-base bg-gradient-to-r from-[#25D366] to-[#1ebe57] hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-green-900/40"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar pelo WhatsApp
            </a>

            {/* ── BOTÃO VER PÁGINA ─────────────────────────────── */}
            <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-purple-900/40"
            >
                <View className="w-5 h-5" />
                Visualizar minha página
            </a>

            {/* ── QR CODE DOWNLOAD ──────────────────────────── */}
            <div className="w-full p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/10 text-center space-y-3">
              <p className="font-bold text-purple-200 text-sm">
                {qrCodeDesign !== 'classic' ? '✨ Seu QR Code Personalizado está pronto!' : '📲 QR Code da sua página'}
              </p>
              <p className="text-xs text-muted-foreground">Baixe, imprima ou envie para surpreender pessoalmente.</p>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-bold transition-all"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Gerando...' : 'Baixar QR Code'}
              </button>
            </div>
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
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { auth } = useFirebase();
    const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autosaveLastSnapshotRef = useRef<string>('');
    const autosaveInFlightRef = useRef<boolean>(false);
    const autosaveInflightPromiseRef = useRef<Promise<void> | null>(null);
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

    // Mark this visitor as "creating a page" in RTDB presence (dedup by
    // localStorage visitorId so 5 tabs from the same person count as 1).
    useCreatingPresence(true, user?.email ?? null);

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
        { id: "gallery",    title: 'As fotos de vocês 📸',      description: segCfg.galleryStepDescription,  fields: ["galleryImages", "galleryStyle"] },
        { id: "timeline",   title: 'Momentos que marcaram ✨',  description: segCfg.timelineStepDescription, fields: ["timelineEvents"] },
        { id: "intro",      title: 'Uma abertura especial 💫',  description: 'Uma animação antes da surpresa aparecer — pra deixar a entrada inesquecível.',  fields: ["introType", "introGender", "introFont"] },
        { id: "music",      title: 'A trilha de vocês 🎵',      description: segCfg.musicStepDescription,    fields: ["musicOption", "youtubeUrl"] },
        { id: "background", title: 'Atmosfera da página 🌸',    description: 'O efeito que vai rolar no fundo — corações, estrelas, pétalas.', fields: ["backgroundAnimation", "heartColor"] },
        { id: "puzzle",     title: 'Um desafio antes da surpresa 🧩', description: segCfg.puzzleStepDescription, fields: ["enablePuzzle", "puzzleImage"] },
        { id: "memory",     title: 'Jogo da memória 💝',        description: segCfg.memoryStepDescription,   fields: ["enableMemoryGame", "memoryGameImages"] },
        { id: "quiz",       title: segCfg.quizStepTitle,        description: segCfg.quizStepDescription,     fields: ["enableQuiz", "quizQuestions"] },
        { id: "word-game",  title: 'Adivinhe a palavra 💘',     description: 'Palavras secretas pra pessoa descobrir letra por letra.',  fields: ["enableWordGame", "wordGameQuestions"] },
        { id: "plan",       title: 'Seu plano',                 description: 'Escolhe o que faz mais sentido — dá pra trocar depois.', fields: ["plan"] },
        { id: "voice",      title: 'Grave sua voz 🎤',          description: 'Uma mensagem de voz sua vai emocionar ainda mais. Opcional — dá pra pular.',  fields: ["audioRecording"] },
        { id: "payment",    title: 'Pronto pra enviar 💌',      description: 'Última etapa — seu link e QR Code já vão tá prontos em segundos.', fields: ["payment", "qrCodeDesign"] },
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
            backgroundAnimation: "",
            galleryStyle: "",
            galleryImages: [],
            timelineEvents: [],
            enablePuzzle: false,
            enableMemoryGame: false,
            enableQuiz: false,
            quizQuestions: [],
            enableWordGame: false,
            wordGameQuestions: [],
            musicOption: '',
            qrCodeDesign: "classic",
        }
    });

    const { watch, trigger, setValue, getValues } = methods;
    const formData = watch();
    const intentId = watch('intentId');

    const doAutosave = useCallback(async () => {
        // Espera user hidratar (até 5s) em vez de retornar silencioso —
        // se isUserLoading na hora do clique Continue, autosave perdia
        // o fire e o user chegava no Payment com data stale.
        if (isUserLoading) {
            const start = Date.now();
            while (isUserLoading && Date.now() - start < 5_000) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
        if (!user) return;
        const uploadingCount = getValues('_uploadingCount') || 0;
        if (uploadingCount > 0) return;
        const data = getValues();
        const utmSource = sessionStorage.getItem('last_utm_source');
        const dataToSave = { ...data, userId: user.uid, utmSource: utmSource || undefined };
        let snapshotKey = '';
        try {
            const { intentId: _iid, _uploadingCount: _uc, ...rest } = dataToSave as any;
            snapshotKey = JSON.stringify(rest);
        } catch { snapshotKey = String(Date.now()); }
        if (snapshotKey && snapshotKey === autosaveLastSnapshotRef.current) return;
        autosaveInFlightRef.current = true;
        const p = (async () => {
            try {
                const result = await createOrUpdatePaymentIntent(dataToSave);
                if (result.success) {
                    autosaveLastSnapshotRef.current = snapshotKey;
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
            } finally {
                autosaveInFlightRef.current = false;
                autosaveInflightPromiseRef.current = null;
            }
        })();
        autosaveInflightPromiseRef.current = p;
        await p;
    }, [user, isUserLoading, getValues, setValue, toast]);

    // Debounce: descarta se já tem um em flight (fire-and-forget do watch).
    const handleAutosave = useCallback(async () => {
        if (autosaveInFlightRef.current) return;
        await doAutosave();
    }, [doAutosave]);

    // Chamada explícita pós-upload: espera o in-flight terminar e roda de novo
    // com dados frescos. Garante que o upload recém-feito está no Firestore.
    const flushAutosave = useCallback(async () => {
        if (autosaveInflightPromiseRef.current) {
            await autosaveInflightPromiseRef.current;
        }
        await doAutosave();
    }, [doAutosave]);

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

    // ── RECOVERY: paid-but-returned-here ──────────────────────────────────
    // If the user already paid this intent (PIX confirmed by webhook) and
    // then closed the tab + came back to /criar/fazer-eu-mesmo, the form
    // re-hydrates from localStorage but the success screen / pixData is gone
    // — they'd be stuck looking at a blank wizard with no idea their page
    // exists. Check the intent and redirect them straight to /p/<id>.
    const recoveryCheckedRef = useRef<string | null>(null);
    useEffect(() => {
        if (!isClient) return;
        if (!intentId || typeof intentId !== 'string') return;
        if (recoveryCheckedRef.current === intentId) return;
        // pageId state is set after a fresh in-session payment — don't fight it
        if (pageId) return;
        recoveryCheckedRef.current = intentId;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `/api/payment-intent-status?intentId=${encodeURIComponent(intentId)}`,
                    { cache: 'no-store' },
                );
                if (cancelled || !res.ok) return;
                const data = await res.json();
                if (cancelled) return; // payment may have succeeded while fetch was in-flight
                if (data?.lovePageId) {
                    // Already paid + page exists → ship them to the page they bought.
                    localStorage.removeItem('amore-pages-autosave');
                    toast({
                        title: 'Sua página já foi criada!',
                        description: 'Estamos te levando até ela.',
                    });
                    router.replace(`/p/${data.lovePageId}`);
                } else if (data?.status === 'completed') {
                    if (cancelled) return;
                    // status=completed without lovePageId is a webhook race —
                    // send them to /criando-pagina which will poll until it's ready.
                    router.replace(`/criando-pagina?intentId=${encodeURIComponent(intentId)}`);
                }
            } catch (_) {
                // network error — fall through silently, user can try again
            }
        })();
        return () => { cancelled = true; };
    }, [isClient, intentId, pageId, router, toast]);

    useEffect(() => {
        const subscription = watch(() => {
            if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
            // 4s de debounce corta writes em quem digita rápido / campos com
            // muitas mudanças (onChange em cada letra). O dedup por snapshot
            // também evita writes quando o form reidratou sem mudança real.
            autosaveTimeoutRef.current = setTimeout(() => { handleAutosave(); }, 4000);
        });
        return () => {
            subscription.unsubscribe();
            if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        };
    }, [watch, handleAutosave]);

    const isHandlingNextRef = useRef(false);
    const handleNext = async () => {
        // Double-click guard: clicar 2x rápido disparava 2 autosaves concorrentes
        if (isHandlingNextRef.current) return;
        isHandlingNextRef.current = true;
        try {
        const currentStepId = steps[currentStep].id;

        if (currentStepId === 'puzzle') {
            const currentData = getValues();
            // Race: user mandou foto MAS upload ainda em andamento. Espera
            // até 8s antes de bloquear — evita falso "envie uma imagem"
            // quando o upload já tá quase no fim.
            const uploadingCount = (getValues('_uploadingCount') as any) || 0;
            if (currentData.enablePuzzle && !currentData.puzzleImage?.url && uploadingCount > 0) {
                const start = Date.now();
                toast({ title: 'Aguardando upload...', description: 'Sua imagem do quebra-cabeça tá quase pronta.' });
                while (((getValues('_uploadingCount') as any) || 0) > 0 && Date.now() - start < 8000) {
                    await new Promise(r => setTimeout(r, 200));
                }
            }
            const finalData = getValues();
            if (finalData.enablePuzzle && !finalData.puzzleImage?.url) {
                toast({ variant: "destructive", title: 'Imagem Necessária', description: 'Para ativar o quebra-cabeça, você precisa enviar uma imagem.' });
                reportWizardStuck({ kind: 'next_blocked', step: currentStepId, detail: 'puzzle:no_image', userId: user?.uid });
                return;
            }
        } else {
            const fieldsToValidate = steps[currentStep].fields || [];
            const ok = await trigger(fieldsToValidate as any);
            if (!ok) {
                console.error("Erros de validação:", methods.formState.errors);
                toast({ variant: "destructive", title: 'Campos obrigatórios', description: 'Por favor, verifique se preencheu tudo corretamente antes de prosseguir.' });
                try {
                    const errs = methods.formState.errors as any;
                    const failed = (fieldsToValidate as string[]).filter(f => errs?.[f]).map(f => `${f}:${errs[f]?.message || 'invalid'}`);
                    reportWizardStuck({ kind: 'next_blocked', step: currentStepId, detail: failed.join(' | ').slice(0, 400), userId: user?.uid });
                } catch { /* silencioso */ }
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

        // Estimativa de valor pra eventos de funil (AddToCart/InitiateCheckout).
        // Inclui add-ons conhecidos pelo form state. Não inclui desconto/qrCode
        // porque esses vivem no PaymentStep — o valor final preciso é disparado
        // no Purchase (handlePaymentSuccess) com totalBRL real.
        const estimateValue = () => {
            const fd = getValues();
            return computeTotalBRL({
                plan: fd.plan,
                qrCodeDesign: fd.qrCodeDesign,
                enableWordGame: fd.enableWordGame,
                wordGameQuestions: fd.wordGameQuestions,
                introType: fd.introType,
                audioRecording: fd.audioRecording,
            });
        };

        // AddToCart ao sair da etapa de plano (independe do próximo step,
        // agora que 'voice' fica entre 'plan' e 'payment').
        if (currentStepId === 'plan') {
            const planVal = getValues('plan');
            trackEvent('AddToCart', {
                value: estimateValue(),
                currency: 'BRL',
                content_ids: [planVal],
                content_type: 'product',
            });
        }

        if (nextStepId === 'payment' && user) {
            toast({ title: 'Salvando rascunho...', description: 'Preparando checkout seguro.' });
            // flushAutosave NUNCA pode quebrar o avanço — se falhar, segue
            // (o checkout vai recriar o intent se necessário). Sem catch
            // aqui, falha no autosave deixava user preso "Salvando..." pra sempre.
            await flushAutosave().catch(err => console.warn('[handleNext] flushAutosave falhou (não bloqueia):', err));
            const planVal = getValues('plan');
            trackEvent('InitiateCheckout', {
                value: estimateValue(),
                currency: 'BRL',
                content_ids: [planVal],
                content_type: 'product',
                content_name: planVal === 'avancado' ? 'Plano Avançado' : 'Plano Básico',
            });
        }
        setCurrentStep(Math.min(nextStepIndex, steps.length - 1));
        } finally {
            isHandlingNextRef.current = false;
        }
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
            if (currentStepId === 'puzzle') props.handleAutosave = flushAutosave;
            if (currentStepId === 'title') props.titlePlaceholder = segCfg.titlePlaceholder;
            if (currentStepId === 'message') props.messagePlaceholder = segCfg.messagePlaceholder;
            StepComponent = <Comp {...props} />;
        } else {
            StepComponent = <div>Passo não encontrado.</div>;
        }
    }

    const showPuzzlePreview = currentStepId === 'puzzle' && formData.enablePuzzle && !!formData.puzzleImage?.url;
    const showEasterPreview = currentStepId === 'intro' && formData.introType === 'love';
    const showPoemaPreview = currentStepId === 'intro' && formData.introType === 'poema';


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
                        showPoemaPreview={showPoemaPreview}
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
                                showPoemaPreview={showPoemaPreview}
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
