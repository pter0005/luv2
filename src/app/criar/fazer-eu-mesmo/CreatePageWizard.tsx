
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition, DragEvent, useMemo } from "react";
import { useForm, FormProvider, useWatch, useFormContext, useFieldArray, useFormState } from "react-hook-form";
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
import { ArrowLeft, ChevronDown, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download, Plus, Trash, CalendarIcon, Info, AlertTriangle, Copy, Terminal, Clock, TestTube2, View, Camera, Eye, Lock, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { handleSuggestContent, createOrUpdatePaymentIntent, processPixPayment, checkFinalPageStatus, verifyPaymentWithMercadoPago, adminFinalizePage, createStripeCheckoutSession, createPaypalOrder } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams, useRouter } from 'next/navigation'
import { fileToBase64, compressImage, base64ToBlob } from "@/lib/image-utils";
import { SuggestContentOutput } from "@/ai/flows/ai-powered-content-suggestion";
import { useUser, useFirebase } from "@/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
import { useTranslation } from "@/lib/i18n";
import PayPalButton from "@/components/PayPalButton";

const RealPuzzle = dynamic(() => import("@/components/puzzle/Puzzle"), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />
});


const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

const cpfMask = (v: string) => {
    v = v.replace(/\D/g, ""); // Remove tudo que não é número
    if (v.length > 11) v = v.slice(0, 11); // Limita aos 11 dígitos do CPF
    
    return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};


const MAX_GALLERY_IMAGES_BASICO = 2;
const MAX_GALLERY_IMAGES_AVANCADO = 6;
const MAX_TIMELINE_IMAGES_BASICO = 5;
const MAX_TIMELINE_IMAGES_AVANCADO = 20;


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


// Esquema do formulário completo
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
  galleryImages: z.array(fileWithPreviewSchema).default([]),
  galleryStyle: z.string().default("Cube"),
  timelineEvents: z.array(timelineEventSchema).default([]),
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
  payment: paymentSchema.optional(),
});


export type PageData = z.infer<typeof pageSchema>;

const PlanLockWrapper = ({ children, requiredPlan }: { children: React.ReactNode, requiredPlan?: string }) => {
    const { watch } = useFormContext<PageData>();
    const { t } = useTranslation();
    const plan = watch('plan');
    const isLocked = requiredPlan && plan !== plan;

    if (isLocked) {
        return (
            <div className="relative blur-sm pointer-events-none opacity-60">
                {children}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg z-50">
                    <Lock className="w-12 h-12 text-primary mb-4" />
                    <p className="font-semibold text-center text-white">{t('wizard.plan.locked')}</p>
                </div>
            </div>
        );
    }
    return <>{children}</>;
}


// Componentes de Passo simplificados para o Wizard
const TitleStep = () => {
    const { control } = useFormContext<PageData>();
    const { t } = useTranslation();
    return (
        <div className="space-y-8">
            <FormField control={control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('wizard.title.label')}</FormLabel>
                    <FormControl><Input placeholder={t('wizard.title.placeholder')} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="titleColor" render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('wizard.title.color.label')}</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center gap-4">
                            <Input type="color" className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0" {...field} />
                            <span className="text-sm">{t('wizard.title.color.description')}</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );
};

const MessageStep = () => {
  const form = useFormContext<PageData>();
  const { t } = useTranslation();  
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <FormLabel>{t('wizard.message.label')}</FormLabel>
                <FormField control={form.control} name="messageFormatting" render={({ field }) => (
                    <ToggleGroup type="multiple" variant="outline" className="justify-start" value={field.value} onValueChange={field.onChange}>
                        <ToggleGroupItem value="bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                    <FormControl><Textarea placeholder={t('wizard.message.placeholder')} className="min-h-[288px]" {...field} /></FormControl>
                )} />
            </div>
        </div>
    );
};


const SpecialDateStep = () => {
  const { control, setValue, watch } = useFormContext<PageData>();
  const { t } = useTranslation();
  const countdownStyle = watch("countdownStyle");
  const titleColor = watch("titleColor");

  return (
    <div className="space-y-12">
      {/* Calendar Section */}
      <div className="space-y-4">
        <FormLabel>{t('wizard.date.label')}</FormLabel>
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
                locale={ptBR}
                className="rounded-md border"
                captionLayout="dropdown-buttons"
                fromYear={1960}
                toYear={new Date().getFullYear()}
              />
            </FormItem>
          )}
        />
        <FormDescription className="text-center">
          {t('wizard.date.description')}
        </FormDescription>
      </div>

      {/* Countdown Style Section */}
      <div className="space-y-4">
        <FormLabel>{t('wizard.date.countdownStyle')}</FormLabel>
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
                  <RadioGroupItem value="Padrão" id="countdown-style-default" className="sr-only" />
                </FormControl>
                <Label
                  htmlFor="countdown-style-default"
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                    field.value === "Padrão" ? "border-primary" : "border-muted"
                  )}
                >
                  {t('wizard.date.countdownStyle.default')}
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
                  {t('wizard.date.countdownStyle.simple')}
                </Label>
              </FormItem>
            </RadioGroup>
          )}
        />
      </div>

      {/* Countdown Color Section */}
      <div className="space-y-4">
        <FormLabel>{t('wizard.date.countdownColor')}</FormLabel>
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
                  <span>{t('wizard.date.countdownColor.description')}</span>
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
          {t('wizard.date.useTitleColor')}
        </Button>
      </div>
    </div>
  );
};

// Helper function to upload a file to Firebase Storage
const uploadFile = async (storage: any, userId: string, file: File | Blob, folderName: string): Promise<FileWithPreview> => {
    if (!userId) throw new Error("Usuário não identificado para upload.");

    const timestamp = Date.now();
    // Limpa o nome do arquivo para evitar caracteres estranhos
    const safeName = (file instanceof File ? file.name : 'audio.webm').replace(/[^a-zA-Z0-9.]/g, "_");
    const fileName = `${timestamp}-${safeName}`;
    
    // O SEGREDO ESTÁ AQUI: O caminho TEM que começar com temp/{userId}
    // Exemplo final: temp/12345/gallery/foto.jpg
    const fullPath = `temp/${userId}/${folderName}/${fileName}`;
    const fileRef = storageRef(storage, fullPath);

    try {
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        return { url: downloadURL, path: fullPath };
    } catch (error: any) {
        console.error("Erro detalhado no upload:", error);
        // Se der erro aqui, é certeza que a regra do Storage bloqueou ou o caminho tá errado
        throw error;
    }
};


const GalleryStep = () => {
    const { control, formState: { errors }, watch } = useFormContext<PageData>();
    const plan = watch('plan');
    const { fields, append, remove } = useFieldArray({
        control,
        name: "galleryImages",
    });
    const { user } = useUser();
    const { storage } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();
    
    const MAX_GALLERY_IMAGES = plan === 'avancado' ? MAX_GALLERY_IMAGES_AVANCADO : MAX_GALLERY_IMAGES_BASICO;
    const isLimitReached = fields.length >= MAX_GALLERY_IMAGES;

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !user || !storage) return;

        const availableSlots = MAX_GALLERY_IMAGES - fields.length;
        if (availableSlots <= 0) return;

        const filesArray = Array.from(event.target.files).slice(0, availableSlots);
        setIsUploading(true);
        
        try {
            const uploadPromises = filesArray.map(async file => {
                const compressedFile = await compressImage(file, 1280, 0.8);
                return uploadFile(storage, user.uid, compressedFile, 'gallery');
            });

            const newImageObjects = await Promise.all(uploadPromises);
            append(newImageObjects);
            toast({ title: t('toast.upload.success'), description: t('toast.upload.success.description') });
        } catch (error: any) {
            console.error("Error uploading files:", error);
            const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
            toast({
                variant: 'destructive',
                title: t('toast.upload.error'),
                description: (
                    <div>
                        <p>{t('toast.upload.error.description')}</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                    </div>
                )
            });
        } finally {
            setIsUploading(false);
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
            <ImageLimitWarning currentCount={fields.length} limit={MAX_GALLERY_IMAGES} itemType={t('wizard.imageLimit.item.gallery')} />
            
            <div className="space-y-2">
                <FormLabel>{t('wizard.gallery.label')}</FormLabel>
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
                        <p className="font-semibold">{isUploading ? t('wizard.gallery.uploading') : t('wizard.gallery.upload')}</p>
                        <p className="text-xs text-muted-foreground">{t('wizard.gallery.upload.description')}</p>
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
                <FormLabel className="text-base font-semibold">{t('wizard.gallery.style')}</FormLabel>
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
};

const TimelineStep = () => {
    const { control, formState: { errors }, watch } = useFormContext<PageData>();
    const plan = watch('plan');
    const { fields, remove, update, append } = useFieldArray({
        control,
        name: "timelineEvents",
    });

    const { user } = useUser();
    const { storage } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_TIMELINE_IMAGES = plan === 'avancado' ? MAX_TIMELINE_IMAGES_AVANCADO : MAX_TIMELINE_IMAGES_BASICO;
    const isLimitReached = fields.length >= MAX_TIMELINE_IMAGES;
    
    const handleBulkImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !user || !storage) return;

        const availableSlots = MAX_TIMELINE_IMAGES - fields.length;
        if (availableSlots <= 0) {
            toast({
                variant: 'destructive',
                title: t('wizard.imageLimit.exceeded'),
                description: t('wizard.imageLimit.exceeded.description', { limit: MAX_TIMELINE_IMAGES, itemType: t('wizard.imageLimit.item.timeline') }),
            });
            return;
        }

        const filesToUpload = Array.from(event.target.files).slice(0, availableSlots);
        setIsUploading(true);

        try {
            const uploadPromises = filesToUpload.map(async file => {
                const compressedFile = await compressImage(file, 1280, 0.8);
                return uploadFile(storage, user.uid, compressedFile, 'timeline');
            });

            const uploadedFiles = await Promise.all(uploadPromises);

            const newEvents = uploadedFiles.map(fileData => ({
                id: new Date().getTime().toString() + Math.random(),
                image: fileData,
                description: '',
                date: new Date(),
            }));

            append(newEvents as any);
            toast({ title: t('toast.upload.success'), description: t('toast.upload.success.description') });

        } catch (error: any) {
            console.error("Error uploading timeline images:", error);
            const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
            toast({
                variant: 'destructive',
                title: t('toast.upload.error'),
                description: (
                    <div>
                        <p>{t('toast.upload.error.description')}</p>
                        <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                    </div>
                )
            });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const handleRemove = (index: number) => {
        const imageToRemove = fields[index];
        if ('image' in imageToRemove && (imageToRemove as any).image?.path && storage) {
            const imageRef = storageRef(storage, (imageToRemove as any).image.path);
            deleteObject(imageRef).catch(err => console.error("Failed to delete image from storage:", err));
        }
        remove(index);
    }

    return (
        <div className="space-y-6">
            <ImageLimitWarning currentCount={fields.length} limit={MAX_TIMELINE_IMAGES} itemType={t('wizard.imageLimit.item.timeline')} />
            {errors.timelineEvents?.root && (
                <p className="text-sm font-medium text-destructive">{errors.timelineEvents.root.message}</p>
            )}
            <p className="text-sm text-muted-foreground">{t('wizard.timeline.description')}</p>
            
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                {fields.map((field, index) => {
                    const imagePreview = (field as any).image && (field as any).image.url;

                    return (
                        <Card key={field.id} className="p-4 bg-card/80 flex flex-col sm:flex-row gap-4 items-start relative">
                             <div className="flex-shrink-0">
                                <div className={cn(
                                    "w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center relative bg-background",
                                    imagePreview && "border-solid"
                                )}>
                                    {imagePreview ? (
                                        <Image src={imagePreview} alt="Preview" width={96} height={96} className="object-cover rounded-md" unoptimized />
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
                                                <Textarea {...field} placeholder={t('wizard.timeline.event.placeholder')} className="bg-background min-h-[50px] sm:min-h-[80px]" />
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
                                                variant={"outline"}
                                                className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP", { locale: ptBR })
                                                ) : (
                                                    <span>{t('wizard.timeline.event.date')}</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                                locale={ptBR}
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
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 p-2 h-auto w-auto text-muted-foreground hover:text-destructive" onClick={() => handleRemove(index)}>
                                <Trash className="w-4 h-4" />
                            </Button>
                        </Card>
                    )
                })}
                 {fields.length === 0 && !isUploading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <Camera className="w-10 h-10 mb-4" />
                        <p className="font-semibold">{t('wizard.timeline.empty')}</p>
                        <p className="text-sm">{t('wizard.timeline.empty.description')}</p>
                    </div>
                 )}
            </div>

            <FormControl>
              <Input
                id="timeline-images-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleBulkImageUpload}
                disabled={isLimitReached || isUploading}
                ref={fileInputRef}
              />
            </FormControl>
            <Button asChild size="lg" className="w-full" disabled={isLimitReached || isUploading}>
                <label htmlFor="timeline-images-upload" className={cn("cursor-pointer", (isLimitReached || isUploading) && "cursor-not-allowed")}>
                    {isUploading ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
                    {isUploading ? t('wizard.gallery.uploading') : t('wizard.timeline.add')}
                </label>
            </Button>
        </div>
    );
};

const MusicStep = () => {
    const { control, setValue, getValues } = useFormContext<PageData>();
    const { user, storage } = useFirebase();
    const { toast } = useToast();
    const { t } = useTranslation();
    const musicOption = useWatch({ control, name: "musicOption" });
    const youtubeUrl = useWatch({ control, name: "youtubeUrl" });
    const [isSearching, startSearchTransition] = useTransition();
    const [showManualLinkInput, setShowManualLinkInput] = useState(false);
    const manualLinkInputRef = useRef<HTMLInputElement>(null);
    
    // Audio recording state
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded' | 'uploading'>('idle');
    const audioRecording = useWatch({ control, name: "audioRecording" });


    const handleSearchMusic = () => {
        const sName = getValues("songName");
        const aName = getValues("artistName");
        if (!sName) {
            toast({
                variant: "destructive",
                title: t('toast.songName.required'),
            });
            return;
        }
    
        startSearchTransition(async () => {
            try {
                const result = await findYoutubeVideo({ songName: sName, artistName: aName || '' });
                if (result.url) {
                    setValue("youtubeUrl", result.url, { shouldDirty: true });
                    toast({ title: t('toast.youtube.success'), description: t('toast.youtube.success.description') });
                }
            } catch (e: any) { 
                toast({ 
                    variant: "destructive", 
                    title: t('toast.youtube.error'),
                    description: e.message || t('toast.youtube.error.description')
                }); 
            }
        });
    };
    
    const handleSetManualLink = () => {
      const manualUrl = manualLinkInputRef.current?.value;
      if (manualUrl && manualUrl.startsWith("http")) {
        setValue("youtubeUrl", manualUrl, { shouldDirty: true, shouldValidate: true });
         toast({
            title: t('toast.youtube.manual.success'),
            description: t('toast.youtube.manual.success.description'),
         });
      } else {
         toast({
            variant: "destructive",
            title: t('toast.youtube.manual.error'),
            description: t('toast.youtube.manual.error.description'),
         });
      }
    }

  const uploadRecording = async (audioBlob: Blob) => {
    if (!storage || !user) {
        toast({ variant: 'destructive', title: t('toast.record.error'), description: t('toast.record.error.description') });
        return;
    }
    setRecordingStatus('uploading');
    try {
        const fileData = await uploadFile(storage, user.uid, audioBlob, 'audio');
        setValue("audioRecording", fileData, { shouldDirty: true, shouldValidate: true });
        setRecordingStatus('recorded');
        toast({ title: t('toast.record.success'), description: t('toast.record.success.description') });
    } catch (error: any) {
        console.error("Error uploading audio:", error);
        setRecordingStatus('recorded');
        const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
        toast({
            variant: 'destructive',
            title: t('toast.record.error'),
            description: (
                <div>
                    <p>{t('toast.record.error.description')}</p>
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
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        uploadRecording(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setRecordingStatus("recording");
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      const errorCode = err.name || 'unknown';
      toast({
          variant: "destructive",
          title: t('toast.mic.error'),
          description: (
            <div>
                <p>{t('toast.mic.error.description')}</p>
                <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
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
            <FormLabel>{t('wizard.music.label')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                    field.onChange(value);
                    setValue("youtubeUrl", ""); // Limpa a URL ao trocar de opção
                    setShowManualLinkInput(false);
                }}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <FormItem>
                  <FormControl>
                    <RadioGroupItem value="none" id="music-none" className="peer sr-only" />
                  </FormControl>
                  <Label
                    htmlFor="music-none"
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    {t('wizard.music.none')}
                  </Label>
                </FormItem>
                <FormItem>
                  <FormControl>
                    <RadioGroupItem value="record" id="music-record" className="peer sr-only" />
                  </FormControl>
                  <Label
                    htmlFor="music-record"
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    {t('wizard.music.record')} <Mic className="h-5 w-5" />
                  </Label>
                </FormItem>
                <FormItem>
                  <FormControl>
                    <RadioGroupItem value="youtube" id="music-youtube" className="peer sr-only" />
                  </FormControl>
                  <Label
                    htmlFor="music-youtube"
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    {t('wizard.music.youtube')} <Youtube className="h-5 w-5" />
                  </Label>
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
                <FormField
                    control={control}
                    name="songName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('wizard.music.youtube.song')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('wizard.music.youtube.song.placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={control}
                    name="artistName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('wizard.music.youtube.artist')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('wizard.music.youtube.artist.placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="button" onClick={handleSearchMusic} disabled={isSearching} className="w-full">
                {isSearching ? <Loader2 className="animate-spin" /> : <Search className="mr-2" />}
                {t('wizard.music.youtube.search')}
            </Button>
            
            {youtubeUrl && !isSearching && (
                <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-center text-muted-foreground mb-2">{t('wizard.music.youtube.wrong')}</p>
                     <Button type="button" variant="secondary" className="w-full" onClick={() => setShowManualLinkInput(!showManualLinkInput)}>
                        {t('wizard.music.youtube.manual')}
                    </Button>
                </div>
            )}
            
            {showManualLinkInput && (
              <div className="mt-4 space-y-2">
                  <FormLabel htmlFor="manual-link">{t('wizard.music.youtube.manual')}</FormLabel>
                   <div className="flex gap-2">
                      <Input id="manual-link" ref={manualLinkInputRef} placeholder={t('wizard.music.youtube.manual.placeholder')} />
                      <Button type="button" onClick={handleSetManualLink}>{t('wizard.music.youtube.manual.ok')}</Button>
                   </div>
              </div>
            )}
        </div>
      )}
      {musicOption === 'record' && (
        <div className="space-y-4 rounded-lg border bg-card/80 p-4">
            <h4 className="font-semibold">{t('wizard.music.record.title')}</h4>
             <div className="flex flex-col sm:flex-row items-center gap-4">
                {recordingStatus === "idle" && (
                    <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />{t('wizard.music.record.record')}</Button>
                )}
                {recordingStatus === "recording" && (
                    <Button type="button" onClick={stopRecording} variant="destructive"><StopCircle className="mr-2 h-4 w-4" />{t('wizard.music.record.stop')}</Button>
                )}
                 {recordingStatus === "recorded" && (
                    <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />{t('wizard.music.record.rerecord')}</Button>
                )}
                {recordingStatus === 'uploading' && (
                    <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t('wizard.music.record.uploading')}</Button>
                )}
                {audioRecording?.url && (
                   <audio src={audioRecording.url} controls className="w-full" />
                )}
             </div>
             <p className="text-sm text-muted-foreground text-center sm:text-left mt-2">
                {recordingStatus === 'recording' && t('wizard.music.record.recording')}
                {recordingStatus === 'recorded' && t('wizard.music.record.done')}
            </p>
        </div>
      )}
    </div>
  );
};


const animationOptions = [
    { id: "none", name: "Nenhuma" },
    { id: "falling-hearts", name: "Chuva de Corações" },
    { id: "starry-sky", name: "Céu Estrelado", requiredPlan: "avancado" },
    { id: "nebula", name: "Nebulosa Galáctica" },
    { id: "floating-dots", name: "Pontos Coloridos", requiredPlan: "avancado" },
    { id: "clouds", name: "Nuvens", requiredPlan: "avancado" },
];

const BackgroundStep = ({ isVisible }: { isVisible: boolean }) => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const { t } = useTranslation();
    const backgroundAnimation = watch("backgroundAnimation");
    const titleColor = watch("titleColor");
    const plan = watch("plan");
    const [isClient, setIsClient] = useState(false);

    const animationOptions = [
        { id: "none", name: t('wizard.background.none') },
        { id: "falling-hearts", name: t('wizard.background.hearts') },
        { id: "starry-sky", name: t('wizard.background.stars'), requiredPlan: "avancado" },
        { id: "nebula", name: t('wizard.background.nebula') },
        { id: "floating-dots", name: t('wizard.background.dots'), requiredPlan: "avancado" },
        { id: "clouds", name: t('wizard.background.clouds'), requiredPlan: "avancado" },
    ];
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="backgroundAnimation"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>{t('wizard.background.label')}</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                            >
                                {animationOptions.map((option) => {
                                    const isDisabled = option.requiredPlan && plan !== option.requiredPlan;
                                    const labelContent = (
                                         <Label
                                            htmlFor={`anim-${option.id}`}
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 h-24 text-sm relative overflow-hidden group/item",
                                                isDisabled
                                                    ? "border-muted/50 text-muted-foreground/50 cursor-not-allowed"
                                                    : "cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                                field.value === option.id && !isDisabled ? "border-primary" : "border-muted"
                                            )}
                                        >
                                            {isClient && isVisible && !isDisabled && (
                                                <div className="absolute inset-0 w-full h-full opacity-30 group-hover/item:opacity-40 -z-10">
                                                    {option.id === "falling-hearts" && <div className="w-full h-full relative overflow-hidden"><FallingHearts count={50} color={watch("heartColor")} /></div>}
                                                    {option.id === "starry-sky" && <div className="w-full h-full relative overflow-hidden"><StarrySky /></div>}
                                                    {option.id === "nebula" && <div className="w-full h-full relative overflow-hidden"><NebulaBackground /></div>}
                                                    {option.id === "floating-dots" && <div className="w-full h-full relative overflow-hidden"><FloatingDots /></div>}
                                                    {option.id === "mystic-fog" && <><div className="mystic-fog-1 !opacity-50 !-z-0"></div><div className="mystic-fog-2 !opacity-50 !-z-0"></div></>}
                                                    {option.id === "clouds" && <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover"><source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4"/></video>}
                                                </div>
                                            )}
                                            {isDisabled && <Lock className="absolute top-2 right-2 w-4 h-4" />}
                                            <span className="relative z-10">{option.name}</span>
                                        </Label>
                                    );

                                    return (
                                        <FormItem key={option.id}>
                                            <FormControl>
                                                <RadioGroupItem value={option.id} id={`anim-${option.id}`} className="peer sr-only" disabled={isDisabled} />
                                            </FormControl>
                                            {isDisabled ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>{labelContent}</TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('wizard.background.exclusive')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                labelContent
                                            )}
                                        </FormItem>
                                    );
                                })}
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
                        <FormLabel>{t('wizard.background.heartColor')}</FormLabel>
                        <FormControl>
                            <div className="relative flex items-center gap-4">
                            <Input
                                type="color"
                                className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                                {...field}
                            />
                            <span className="text-sm">{t('wizard.background.heartColor.description')}</span>
                            </div>
                        </FormControl>
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => setValue("heartColor", titleColor, { shouldDirty: true })}
                        >
                            <Pipette className="mr-2 h-4 w-4" />
                            {t('wizard.background.useTitleColor')}
                        </Button>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};

const PuzzleStep = () => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const { user, storage } = useFirebase();
    const enablePuzzle = watch("enablePuzzle");
    const puzzleImage = watch("puzzleImage");
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && user && storage) {
            const file = event.target.files[0];
            setIsProcessing(true);
            try {
                const compressedBlob = await compressImage(file, 1280, 0.8);
                const fileData = await uploadFile(storage, user.uid, compressedBlob, 'puzzle');
                setValue("puzzleImage", fileData, { shouldValidate: true, shouldDirty: true });
                toast({ title: t('toast.upload.success'), description: t('toast.upload.success.description') });
            } catch (error: any) {
                console.error("Error processing puzzle image:", error);
                const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
                toast({
                    variant: 'destructive',
                    title: t('toast.upload.error'),
                    description: (
                        <div>
                            <p>{t('toast.upload.error.description')}</p>
                            <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {errorCode}</p>
                        </div>
                    )
                });
            } finally {
                setIsProcessing(false);
            }
        }
    };
    
    const removePuzzleImage = () => {
        if (puzzleImage?.path && storage) {
            const imageRef = storageRef(storage, puzzleImage.path);
            deleteObject(imageRef).catch(err => console.error("Failed to delete puzzle image from storage:", err));
        }
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
        toast({ title: t('wizard.puzzle.image.remove') });
    };
    
    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enablePuzzle"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{t('wizard.puzzle.enable')}</FormLabel>
                            <FormDescription>
                                {t('wizard.puzzle.description')}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            {enablePuzzle && (
                 <div className="space-y-4">
                    <FormLabel>{t('wizard.puzzle.image.label')}</FormLabel>
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
                            <p className="font-semibold">{isProcessing ? t('wizard.puzzle.image.processing') : t('wizard.puzzle.image.upload')}</p>
                            <p className="text-xs text-muted-foreground">{t('wizard.puzzle.image.description')}</p>
                            <input
                                id="puzzle-photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePuzzleImageChange}
                                disabled={isProcessing}
                            />
                        </label>
                        </FormControl>
                     ) : (
                        <div className="w-full flex flex-col items-center gap-6">
                             <div className="w-full max-w-[300px] mx-auto">
                                <RealPuzzle
                                    imageSrc={puzzleImage.url}
                                />
                             </div>
                             <Button
                                 type="button"
                                 variant="destructive"
                                 onClick={removePuzzleImage}
                                 size="sm"
                             >
                                 <X className="mr-2 h-4 w-4" />
                                 {t('wizard.puzzle.image.remove')}
                             </Button>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
};

const stepComponents = [
    TitleStep,
    MessageStep,
    SpecialDateStep,
    GalleryStep,
    TimelineStep,
    MusicStep,
    BackgroundStep,
    PuzzleStep,
];

const PaymentStep = ({ setPageId }: { setPageId: (id: string) => void; }) => {
    const { getValues, watch, setValue } = useFormContext<PageData>();
    const { t } = useTranslation();
    const plan = watch('plan') as 'basico' | 'avancado';
    const intentId = watch('intentId');
    const { user } = useUser();
    const [isProcessing, startTransition] = useTransition();
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<{ message: string, details?: any } | null>(null);
    const { toast } = useToast();
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string, paymentId: string } | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isBrazilDomain, setIsBrazilDomain] = useState<boolean | null>(null);

    // FORÇAR CRIAÇÃO DO INTENT ID ASSIM QUE ABRIR A TELA
    useEffect(() => {
        if (user && !intentId) {
            const forceSave = async () => {
                const data = getValues();
                const result = await createOrUpdatePaymentIntent({ ...data, userId: user.uid });
                if (result.intentId) setValue('intentId', result.intentId);
            };
            forceSave();
        }
    }, [user, intentId, getValues, setValue]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const isPT = navigator.language.startsWith('pt');
            setIsBrazilDomain(hostname.endsWith('.com.br') || (hostname.includes('localhost') && isPT));
        }
    }, []);

    const priceUSD = plan === 'basico' ? 14.90 : 19.90;
    const priceBRL = plan === 'basico' ? 14.99 : 24.99;

    const adminEmails = ['giibrossini@gmail.com', 'inesvalentim45@gmail.com'];
    const isAdmin = user?.email && adminEmails.includes(user.email);

    const handlePaymentSuccess = useCallback((pageId: string) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        toast({ title: t('toast.payment.success'), description: t('toast.payment.success.description') });
        setPageId(pageId);
        localStorage.removeItem('amore-pages-autosave');
    }, [setPageId, toast, t]);

    const startPolling = useCallback((paymentId: string, currentIntentId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current!);

        pollingIntervalRef.current = setInterval(async () => {
            const result = await verifyPaymentWithMercadoPago(paymentId, currentIntentId);
            console.log("Status do pagamento:", result.status);
            
            if (result.status === 'approved' && result.pageId) {
                clearInterval(pollingIntervalRef.current!);
                handlePaymentSuccess(result.pageId);
            } else if (result.status === 'error') {
                clearInterval(pollingIntervalRef.current!);
                setError({ message: result.error });
            }
        }, 3000);
    }, [handlePaymentSuccess]);

    useEffect(() => {
        if (pixData?.paymentId && intentId) {
            startPolling(pixData.paymentId, intentId);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [pixData, intentId, startPolling]);

    const handleOneClickPix = () => {
        setError(null);
        setPixData(null);

        if (!user) {
            setError({ message: t('toast.payment.session.invalid') });
            return;
        }

        if (user.email) {
            setValue('payment.payerEmail', user.email, { shouldDirty: true });
        }
    
        startTransition(async () => {
            try {
                const fullData = { ...getValues(), userId: user.uid };
                
                const saveResult = await createOrUpdatePaymentIntent(fullData);

                if (saveResult.error || !saveResult.intentId) {
                    setError({ message: saveResult.error || "Não foi possível salvar o rascunho antes do pagamento.", details: saveResult.details });
                    if (saveResult.error?.includes("NOT_FOUND")) {
                      setValue('intentId', undefined, { shouldDirty: false });
                    }
                    return;
                }
                
                setValue('intentId', saveResult.intentId);
                const paymentResult = await processPixPayment(saveResult.intentId, priceBRL);
                
                if (paymentResult.error) {
                    setError({ message: paymentResult.error, details: paymentResult.details || {} });
                } else if (paymentResult.qrCode && paymentResult.qrCodeBase64 && paymentResult.paymentId) {
                    setPixData({ 
                        qrCode: paymentResult.qrCode, 
                        qrCodeBase64: paymentResult.qrCodeBase64, 
                        paymentId: paymentResult.paymentId
                    });
                }
            } catch (err) {
                setError({ message: "Erro ao conectar com o serviço de pagamento." });
            }
        });
    };
    
    const handleStripePayment = () => {
      setError(null);
      if (!user) {
          setError({ message: t('toast.payment.session.invalid') });
          return;
      }
  
      startTransition(async () => {
          try {
              const fullData = { ...getValues(), userId: user.uid };
              const saveResult = await createOrUpdatePaymentIntent(fullData);
  
              if (saveResult.error || !saveResult.intentId) {
                  setError({ message: saveResult.error || "Could not save draft before payment." });
                  return;
              }
  
              setValue('intentId', saveResult.intentId);
              const planValue = getValues('plan') as 'basico' | 'avancado';
              const domain = window.location.origin;

              const sessionResult = await createStripeCheckoutSession(saveResult.intentId, planValue, domain);

              if (sessionResult.error || !sessionResult.url) {
                  setError({ message: sessionResult.error || "Could not create Stripe checkout session." });
              } else {
                  window.location.href = sessionResult.url;
              }
          } catch (err) {
              setError({ message: "Error connecting to the payment service." });
          }
      });
    };
    
    const handleAdminFinalize = async () => {
        if (!user || !intentId) {
            toast({ variant: 'destructive', title: 'Erro Admin', description: 'Usuário ou Rascunho não encontrado.' });
            return;
        }

        startTransition(async () => {
            try {
                const result = await adminFinalizePage(intentId, user.uid);
                if (result.error || !result.pageId) {
                    setError({ message: result.error || "Falha ao finalizar como admin." });
                } else {
                    handlePaymentSuccess(result.pageId);
                }
            } catch (e) {
                setError({ message: "Erro de servidor ao finalizar como admin." });
            }
        });
    }

    const handleManualVerification = async () => {
        if (!pixData?.paymentId || !intentId) return;
        setIsVerifying(true);
        try {
            const result = await verifyPaymentWithMercadoPago(pixData.paymentId, intentId);
            if (result.status === 'approved' && result.pageId) {
                handlePaymentSuccess(result.pageId);
            } else {
                toast({ variant: 'default', title: t('toast.payment.pending'), description: t('toast.payment.pending.description') });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: t('toast.payment.verify.error'), description: t('toast.payment.verify.error.description') });
        } finally {
            setIsVerifying(false);
        }
    };

    if (isBrazilDomain === null) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    if (!isBrazilDomain) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-white">{t('wizard.payment.title_en')}</h3>
                    <p className="text-sm text-zinc-400">Secure checkout for your digital gift.</p>
                </div>

                <div className="relative overflow-hidden p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total to Pay</p>
                    <h2 className="text-5xl font-black text-white mb-1">${priceUSD.toFixed(2)}</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        One-time payment • Lifetime access
                    </p>
                </div>

                {/* STRIPE */}
                <div className="space-y-3">
                    <Button 
                        onClick={handleStripePayment}
                        disabled={isProcessing}
                        className="w-full h-16 text-lg font-bold bg-white text-black hover:bg-zinc-200 shadow-xl transition-all active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <CreditCard size={20} />
                                <span>{t('wizard.payment.card_button')}</span>
                            </div>
                        )}
                    </Button>
                    <p className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1 uppercase">
                        <Lock size={10} className="text-green-500" /> {t('wizard.payment.secure_stripe')}
                    </p>
                </div>

                {/* PAYPAL */}
                <div className="min-h-[100px] flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                    {intentId ? (
                        <div className="w-full animate-in zoom-in-95 duration-500">
                             <PayPalButton firebaseIntentId={intentId} planType={plan} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sincronizing with PayPal...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return ( 
        <div className="space-y-6 text-center animate-in fade-in duration-700">
            <div className="space-y-2">
                 <h3 className="text-2xl font-black tracking-tight text-white">{t('wizard.payment.title')}</h3>
                 <p className="text-sm text-zinc-400">{t('wizard.payment.description')}</p>
            </div>
            
            <div className="relative overflow-hidden p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                 <div className="absolute top-0 right-0 p-2">
                     <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded-full uppercase">Plano: {plan}</span>
                 </div>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('wizard.payment.total')}</p>
                 <h2 className="text-5xl font-black text-white mb-1">R$ {priceBRL.toFixed(2).replace('.', ',')}</h2>
                 <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 uppercase">
                     <Clock size={12} /> {t('home.plans.payment')} • {t('wizard.payment.immediate_access')}
                 </p>
            </div>

            {!pixData ? (
                <Button 
                    onClick={handleOneClickPix} 
                    disabled={isProcessing}
                    className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl transition-all active:scale-95 group"
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <QrCode size={20} />
                            <span>{t('wizard.payment.pix.pay_button')}</span>
                        </div>
                    )}
                </Button>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center gap-6">
                   <h3 className="text-xl font-bold font-headline">{t('wizard.payment.pix.title')}</h3>
                    <p className="text-muted-foreground max-w-sm">{t('wizard.payment.pix.description')}</p>
                    <div className="p-4 bg-white rounded-lg border">
                        {pixData.qrCodeBase64 ? (
                            <Image 
                                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                                alt="PIX QR Code"
                                width={256}
                                height={256}
                                unoptimized
                            />
                        ) : (
                            <div className="w-64 h-64 flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                                <Loader2 className="animate-spin mb-2" />
                                <p className="text-xs">{t('wizard.payment.pix.generating_qr')}</p>
                            </div>
                        )}
                    </div>
                    <Button onClick={() => navigator.clipboard.writeText(pixData.qrCode)} className="w-full max-w-xs">
                        <Copy className="mr-2 h-4 w-4" />
                        {t('wizard.payment.pix.copy')}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t('wizard.payment.pix.waiting')}</p>
                    <Button onClick={handleManualVerification} disabled={isVerifying} variant="secondary" className="w-full max-w-xs">
                            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                            {t('wizard.payment.pix.verify')}
                    </Button>
                </div>
            )}
            
            {isAdmin && intentId && (
                <Button onClick={handleAdminFinalize} variant="outline" className="mt-4 border-yellow-500 text-yellow-500">
                    Finalizar como Admin
                </Button>
            )}
        </div>
    );
};

// Wizard Internal Logic
const WizardInternal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [showTimelinePreview, setShowTimelinePreview] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [pageId, setPageId] = useState<string | null>(null);
  
  const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = useState(false);

  const plan = searchParams.get('plan') || 'avancado';

  const steps = useMemo(() => [
    { id: "title", title: t('wizard.steps.1.title'), description: t('wizard.steps.1.description'), fields: ["title", "titleColor"] },
    { id: "message", title: t('wizard.steps.2.title'), description: t('wizard.steps.2.description'), fields: ["message", "messageFontSize", "messageFormatting"] },
    { id: "specialDate", title: t('wizard.steps.3.title'), description: t('wizard.steps.3.description'), fields: ["specialDate", "countdownStyle", "countdownColor"] },
    { id: "gallery", title: t('wizard.steps.4.title'), description: t('wizard.steps.4.description'), fields: ["galleryImages", "galleryStyle"] },
    { id: "timeline", title: t('wizard.steps.5.title'), description: t('wizard.steps.5.description'), fields: ["timelineEvents"], requiredPlan: 'avancado' },
    { id: "music", title: t('wizard.steps.6.title'), description: t('wizard.steps.6.description'), fields: ["musicOption", "youtubeUrl", "audioRecording"], requiredPlan: 'avancado' },
    { id: "background", title: t('wizard.steps.7.title'), description: t('wizard.steps.7.description'), fields: ["backgroundAnimation", "heartColor"] },
    { id: "puzzle", title: t('wizard.steps.8.title'), description: t('wizard.steps.8.description'), fields: ["enablePuzzle", "puzzleImage"], requiredPlan: 'avancado' },
    { id: "payment", title: t('wizard.steps.9.title'), description: t('wizard.steps.9.description'), fields: ["payment"] },
  ], [t]);

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    mode: 'onChange',
    defaultValues: { 
        plan: plan,
        title: "Seu Título Aqui",
        messageFontSize: "text-base",
        backgroundAnimation: plan === 'basico' ? 'falling-hearts' : 'none',
        galleryStyle: "Cube",
        galleryImages: [], 
        timelineEvents: [],
        enablePuzzle: plan === 'avancado',
        musicOption: plan === 'basico' ? 'none' : 'none',
    }
  });
  
  const { watch, trigger, setValue, getValues } = methods;
  const formData = watch();
  const intentId = watch('intentId');

  const restoreFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedDataJSON = localStorage.getItem('amore-pages-autosave');
    if (!savedDataJSON) return;

    try {
        const parsed = JSON.parse(savedDataJSON);
        // Ensure the plan from URL overrides the saved one if it's a new session start
        parsed.plan = plan;
        if (parsed.specialDate) parsed.specialDate = new Date(parsed.specialDate);
        if (parsed.timelineEvents) {
            parsed.timelineEvents.forEach((ev: any) => { if(ev.date) ev.date = new Date(ev.date) });
        }
        methods.reset(parsed);
    } catch(e) {
        console.error("Falha ao carregar rascunho. O rascunho pode estar corrompido.", e);
        // If parsing fails, the saved data is likely corrupt. Clear it.
        localStorage.removeItem('amore-pages-autosave');
        methods.reset(); // Reset to default state
        toast({
            variant: "destructive",
            title: t('toast.autosave.error.load'),
            description: t('toast.autosave.error.load.description')
        });
    }
  }, [methods, plan, toast, t]);
  
  useEffect(() => {
    setIsClient(true);
    
    if (searchParams.get('new') === 'true') {
        localStorage.removeItem('amore-pages-autosave');
        methods.reset(); // Resets to default values, including plan from URL
    } else {
        restoreFromLocalStorage();
    }
  }, [searchParams, methods, restoreFromLocalStorage]);


  // --- AUTOSAVE LOGIC ---
  const handleAutosave = useCallback(async (data: PageData) => {
    if (!user || isUserLoading) return; // Don't save if no user or still loading
    
    // Explicitly add user ID to the data being saved
    const dataToSave = { ...data, userId: user.uid };

    try {
        const result = await createOrUpdatePaymentIntent(dataToSave);

        if (result.error) {
            console.warn("Autosave failed:", result.error, result.details);
            const errorString = (result.error || '').toLowerCase();
            const detailsString = (result.details?.log || '').toLowerCase();

            if (errorString.includes("collection") || errorString.includes("500") || detailsString.includes("collection")) {
                setValue('intentId', undefined, { shouldDirty: false });
            }
        } else if (result.intentId && !dataToSave.intentId) {
            setValue('intentId', result.intentId, { shouldDirty: false });
            localStorage.setItem('amore-pages-autosave', JSON.stringify({ ...dataToSave, intentId: result.intentId }));
        } else {
            localStorage.setItem('amore-pages-autosave', JSON.stringify(dataToSave));
        }
    } catch (e) {
        console.error("Error during autosave:", e);
    }
  }, [user, isUserLoading, setValue]);

  useEffect(() => {
    const subscription = watch((value) => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }
        autosaveTimeoutRef.current = setTimeout(() => {
            handleAutosave(value as PageData);
        }, 1500); // Debounce autosave
    });
    
    return () => {
        subscription.unsubscribe();
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }
    };
  }, [watch, handleAutosave]);
  // --- END AUTOSAVE LOGIC ---


  const handleNext = async () => {
    const currentStepId = steps[currentStep].id;
    
    // Manual validation for puzzle step
    if (currentStepId === 'puzzle') {
        const currentData = getValues();
        if (currentData.enablePuzzle && !currentData.puzzleImage?.url) {
            toast({
                variant: "destructive",
                title: t('toast.puzzle.image.required'),
                description: t('toast.puzzle.image.required.description')
            });
            return; // Block advancement
        }
    } else {
        // Standard validation for all other steps
        const fieldsToValidate = steps[currentStep].fields || [];
        const ok = await trigger(fieldsToValidate as any);
        if (!ok) {
            const errors = methods.formState.errors;
            console.error("Erros de validação:", errors);
            toast({ variant: "destructive", title: t('toast.validation.error'), description: t('toast.validation.error.description') });
            return;
        }
    }

    // If validation passes, proceed to the next step
    let nextStepIndex = currentStep + 1;
    while(nextStepIndex < steps.length && steps[nextStepIndex].requiredPlan && plan !== steps[nextStepIndex].requiredPlan) {
        nextStepIndex++;
    }
    
    if (steps[nextStepIndex]?.id === 'payment' && user) {
        toast({ title: t('toast.payment.autosave'), description: t('toast.payment.autosave.description') });
        await handleAutosave({ ...getValues(), userId: user.uid });
    }
    
    setCurrentStep(Math.min(nextStepIndex, steps.length - 1));
  };
  
  const handleBack = async () => {
      let prevStepIndex = currentStep - 1;
      // Pula passos desabilitados ao voltar
      while(prevStepIndex > 0 && steps[prevStepIndex].requiredPlan && plan !== steps[prevStepIndex].requiredPlan) {
          prevStepIndex--;
      }
      setCurrentStep(Math.max(0, prevStepIndex));
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
      StepComponent = <SuccessStep pageId={pageId} />;
  } else if (currentStepId === 'payment') {
      StepComponent = <PaymentStep setPageId={setPageId} />;
  } else {
      const Comp = stepComponents[currentStep];
      StepComponent = (
          <PlanLockWrapper requiredPlan={currentStepInfo.requiredPlan}>
            <Comp isVisible={currentStepId === 'background'} />
          </PlanLockWrapper>
      );
  }
  
  const showPuzzlePreview = currentStepId === 'puzzle' && formData.enablePuzzle && !!formData.puzzleImage?.url;

  return (
    <FormProvider {...methods}>
      <div className="md:grid md:grid-cols-2 md:h-screen md:overflow-hidden">
        
        {/* Left Column: Preview (Desktop Only) */}
        <div className="hidden md:flex relative h-screen w-full sticky top-0 items-center justify-center p-4">
            <PreviewContent 
                formData={formData} 
                isClient={isClient}
                onShowTimeline={() => setShowTimelinePreview(true)}
                hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
                showPuzzlePreview={showPuzzlePreview}
                previewPuzzleRevealed={previewPuzzleRevealed}
                setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
            />
        </div>

        {/* Right Column: Form Content */}
        <div className="flex-grow p-6 md:p-12 md:overflow-y-auto">
          <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep===0}><ArrowLeft /></Button>
              <div className="flex-grow flex flex-col items-center gap-2 mx-4">
                  <span className="text-xs text-muted-foreground font-sans">{t('wizard.step')} {currentStep + 1} {t('wizard.of')} {steps.length}</span>
                  <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
              </div>
              <Button type="button" onClick={handleNext} disabled={currentStep===steps.length-1}><ChevronRight /></Button>
          </div>

          <div className="mt-8 space-y-2">
              <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </div>
          
          <div className="my-8">
              {StepComponent}
          </div>

          {/* Mobile Preview Section (Integrated into the scroll) */}
          <div className="md:hidden mt-16 pb-16">
            <div className="flex flex-col items-center text-center gap-2 text-muted-foreground mb-4">
                <p>{t('wizard.preview.title')}</p>
                <ChevronDown className="w-5 h-5 animate-bounce-subtle"/>
            </div>
            <div className='relative w-full'>
                <PreviewContent 
                    formData={formData} 
                    isClient={isClient}
                    onShowTimeline={() => setShowTimelinePreview(true)}
                    hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
                    showPuzzlePreview={showPuzzlePreview}
                    previewPuzzleRevealed={previewPuzzleRevealed}
                    setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
                />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}




const ImageLimitWarning = ({ currentCount, limit, itemType }: { currentCount: number, limit: number, itemType: string }) => {
    const { t } = useTranslation();
    if (currentCount > limit) {
         return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('wizard.imageLimit.exceeded')}</AlertTitle>
                <AlertDescription>{t('wizard.imageLimit.exceeded.description', { limit, itemType })}</AlertDescription>
            </Alert>
         )
    }
    return (
        <Alert variant={currentCount === limit ? "destructive" : "default"}>
            <Camera className="h-4 w-4" />
            <AlertTitle>{t('wizard.imageLimit.title')}</AlertTitle>
            <AlertDescription>{t('wizard.imageLimit.description', { currentCount, limit, itemType })}</AlertDescription>
        </Alert>
    )
};

const SuccessStep = ({ pageId }: { pageId: string }) => {
    const { t } = useTranslation();
    const pageUrl = `${window.location.origin}/p/${pageId}`;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div className="flex flex-col items-center text-center gap-6">
            <CheckCircle className="w-16 h-16 text-green-500"/>
            <h2 className="text-2xl font-bold font-headline">{t('wizard.success.title')}</h2>
            <p className="text-muted-foreground">{t('wizard.success.description')}</p>
            <div className="flex items-center space-x-2 w-full max-w-md p-2 rounded-lg border bg-muted">
                <Input type="text" value={pageUrl} readOnly className="flex-1 bg-transparent border-0 ring-0 focus-visible:ring-0"/>
                <Button onClick={handleCopy}>
                    {copied ? <CheckCircle className="mr-2"/> : <Copy className="mr-2"/>}
                    {copied ? t('wizard.success.copied') : t('wizard.success.copy')}
                </Button>
            </div>
            <div className="p-4 bg-white rounded-lg border mt-4">
                <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pageUrl}`}
                    alt="QR Code da Página"
                    width={200}
                    height={200}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('wizard.success.qr.description')}</p>
            <Button asChild className="mt-4">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                    <View className="mr-2" />
                    {t('wizard.success.cta')}
                </a>
            </Button>
        </div>
    );
};

export default function CreatePageWizard() {
  return (
    <React.Suspense>
      <WizardInternal />
    </React.Suspense>
  )
}
