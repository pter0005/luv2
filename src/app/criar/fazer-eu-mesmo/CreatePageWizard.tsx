
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition, DragEvent, useMemo } from "react";
import { useForm, FormProvider, useWatch, useFormContext, useFieldArray } from "react-hook-form";
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
import { ArrowLeft, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download, Plus, Trash, CalendarIcon, Info, AlertTriangle, Copy, Terminal, Clock, TestTube2, View, Camera, Eye } from "lucide-react";
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
import { handleSuggestContent, createOrUpdatePaymentIntent, processPixPayment, checkFinalPageStatus, verifyPaymentWithMercadoPago } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from 'next/navigation'
import { fileToBase64, compressImage } from "@/lib/image-utils";
import { SuggestContentOutput } from "@/ai/flows/ai-powered-content-suggestion";
import { useUser, useFirebase } from "@/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PreviewContent from "./PreviewContent";
import FallingHearts from "@/components/effects/FallingHearts";
import StarrySky from "@/components/effects/StarrySky";
import MysticVortex from "@/components/effects/MysticVortex";
import FloatingDots from "@/components/effects/FloatingDots";


const YoutubePlayer = dynamic(() => import('./YoutubePlayer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center bg-zinc-800/50 rounded-lg"><Loader2 className="animate-spin text-primary" /></div>
});

const RealPuzzle = dynamic(() => import("@/components/puzzle/Puzzle"), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />
});


const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

const cpfMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value.slice(0, 14);
};

const MAX_GALLERY_IMAGES = 5;
const MAX_TIMELINE_IMAGES = 20;


const paymentSchema = z.object({
  payerFirstName: z.string().min(1, "Nome é obrigatório."),
  payerLastName: z.string().min(1, "Sobrenome é obrigatório."),
  payerEmail: z.string().email("E-mail inválido."),
  payerCpf: z.string().min(14, "O CPF é obrigatório e deve ser completo.").max(14, "O CPF deve ter o formato 000.000.000-00."),
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
  intentId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().default("Seu Título Aqui"),
  titleColor: z.string().default("#FFFFFF"),
  message: z.string().min(1, "A mensagem não pode estar vazia.").default(""),
  messageFontSize: z.string().default("text-base"),
  messageFormatting: z.array(z.string()).default([]),
  aiPrompt: z.string().optional(),
  specialDate: z.date().optional(),
  countdownStyle: z.string().default("Padrão"),
  countdownColor: z.string().default("#FFFFFF"),
  galleryImages: z.array(fileWithPreviewSchema).max(MAX_GALLERY_IMAGES, `Máximo ${MAX_GALLERY_IMAGES} fotos.`).default([]),
  galleryStyle: z.string().default("Cube"),
  timelineEvents: z.array(timelineEventSchema).max(MAX_TIMELINE_IMAGES, `Máximo ${MAX_TIMELINE_IMAGES} momentos.`).default([]),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: z.string().optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("#8B5CF6"),
  backgroundVideo: fileWithPreviewSchema.optional(),
  enablePuzzle: z.boolean().default(false),
  puzzleImage: fileWithPreviewSchema.optional(),
  payment: paymentSchema.optional(),
});

export type PageData = z.infer<typeof pageSchema>;

const steps = [
  { id: "title", title: "Título da página", description: "Escreva o título dedicatório. Ex: João & Maria.", fields: ["title", "titleColor"] },
  { id: "message", title: "Sua Mensagem de Amor", description: "Escreva a mensagem principal.", fields: ["message", "messageFontSize", "messageFormatting", "aiPrompt"] },
  { id: "specialDate", title: "Data Especial", description: "Informe a data que simboliza o início de tudo.", fields: ["specialDate", "countdownStyle", "countdownColor"] },
  { id: "gallery", title: "Galeria de Fotos", description: `Adicione até ${MAX_GALLERY_IMAGES} fotos.`, fields: ["galleryImages", "galleryStyle"] },
  { id: "timeline", title: "Linha do Tempo 3D", description: `Até ${MAX_TIMELINE_IMAGES} momentos flutuantes.`, fields: ["timelineEvents"] },
  { id: "music", title: "Música Dedicada", description: "Escolha uma trilha sonora ou grave sua voz.", fields: ["musicOption", "youtubeUrl", "audioRecording", "songName", "artistName"] },
  { id: "background", title: "Animação de Fundo", description: "Escolha um efeito especial para o fundo.", fields: ["backgroundAnimation", "heartColor", "backgroundVideo"] },
  { id: "puzzle", title: "Quebra-Cabeça Interativo", description: "Um desafio antes de revelar a surpresa!", fields: ["enablePuzzle", "puzzleImage"] },
  { id: "payment", title: "Finalizar", description: "Pague com PIX para gerar o link e QR Code.", fields: ["payment"] },
];

// Componentes de Passo simplificados para o Wizard
const TitleStep = () => {
    const { control } = useFormContext<PageData>();
    return (
        <div className="space-y-8">
            <FormField control={control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder="Ex: João & Maria" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="titleColor" render={({ field }) => (
                <FormItem>
                    <FormLabel>Cor do título</FormLabel>
                    <FormControl>
                        <div className="relative flex items-center gap-4">
                            <Input type="color" className="h-10 w-14 cursor-pointer" {...field} />
                            <span className="text-sm">Escolha uma cor para o texto</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
    );
};

const MessageStep = () => {
    const [isPending, startTransition] = useTransition();
    const [suggestions, setSuggestions] = useState<SuggestContentOutput | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const form = useFormContext<PageData>();

    const handleAiAction = () => {
        const userInput = form.getValues("aiPrompt");
        if (!userInput) return;
        const formData = new FormData();
        formData.append("userInput", userInput);
        startTransition(async () => {
            setAiError(null); setSuggestions(null);
            const result = await handleSuggestContent(formData);
            if (result.error) setAiError(result.error);
            else if (result.suggestions) setSuggestions(result.suggestions);
        });
    };

    const appendSuggestion = (suggestion: string) => {
        const currentMessage = form.getValues("message");
        form.setValue("message", (currentMessage ? currentMessage + "\n\n" : "") + suggestion);
    };

    const renderSuggestions = (title: string, items: string[]) => (
        <div className="space-y-3">
            <h4 className="font-semibold text-primary">{title}</h4>
            <ul className="space-y-3">
                {items.map((s, i) => (
                    <li key={i} className="p-3 bg-muted/50 rounded-md border text-sm flex justify-between items-center gap-2">
                        <p className="italic">"{s}"</p>
                        <Button variant="ghost" size="sm" onClick={() => appendSuggestion(s)}>Usar</Button>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="space-y-8">
            <FormField control={form.control} name="messageFontSize" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tamanho do Texto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="text-sm">Pequeno</SelectItem>
                            <SelectItem value="text-base">Padrão</SelectItem>
                            <SelectItem value="text-lg">Grande</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
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
                    <FormControl><Textarea placeholder="Sua declaração..." className="min-h-[200px]" {...field} /></FormControl>
                )} />
            </div>
            <Card className="bg-card/80">
                <CardHeader><CardTitle className="text-lg">Bot IA</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="aiPrompt" render={({ field }) => (
                        <FormControl><Textarea {...field} placeholder="Ex: poema sobre nosso primeiro beijo" /></FormControl>
                    )} />
                    <Button type="button" onClick={handleAiAction} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Wand2 className="mr-2" />} Gerar Texto
                    </Button>
                    {suggestions && renderSuggestions("Sugestões", suggestions.romanticPhrases || [])}
                </CardContent>
            </Card>
        </div>
    );
};

const SpecialDateStep = () => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const titleColor = watch("titleColor");
  
    return (
      <div className="space-y-12">
        {/* Calendar Section */}
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
            Essa data será usada para o contador.
          </FormDescription>
        </div>
  
        {/* Countdown Style Section */}
        <div className="space-y-4">
            <FormLabel>Modo de Exibição do Contador</FormLabel>
            <FormField
            control={control}
            name="countdownStyle"
            render={({ field }) => (
                <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-2 gap-4"
                >
                <FormItem>
                    <FormControl>
                    <RadioGroupItem value="Padrão" className="sr-only" />
                    </FormControl>
                    <Label className={cn(
                        "flex h-full w-full items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                        field.value === "Padrão" ? "border-primary" : "border-muted"
                    )}>
                    Padrão
                    </Label>
                </FormItem>
                <FormItem>
                    <FormControl>
                    <RadioGroupItem value="Simples" className="sr-only" />
                    </FormControl>
                    <Label className={cn(
                        "flex h-full w-full items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                        field.value === "Simples" ? "border-primary" : "border-muted"
                    )}>
                    Simples
                    </Label>
                </FormItem>
                </RadioGroup>
            )}
            />
        </div>
  
        {/* Countdown Color Section */}
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
                        className="h-10 w-14 cursor-pointer p-1"
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
};

// Helper function to upload a file to Firebase Storage
const uploadFile = async (storage: any, userId: string, file: Blob, path: string): Promise<{ downloadURL: string; fullPath: string }> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${(file as File).name}`;
    const fileRef = storageRef(storage, `temp/${userId}/${path}/${fileName}`);

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { downloadURL, fullPath: fileRef.fullPath };
};

const GalleryStep = () => {
    const { control, formState: { errors } } = useFormContext<PageData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "galleryImages",
    });
    const { user } = useUser();
    const { storage } = useFirebase();
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const isLimitReached = fields.length >= MAX_GALLERY_IMAGES;

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !user || !storage) return;

        const availableSlots = MAX_GALLERY_IMAGES - fields.length;
        if (availableSlots <= 0) return;

        const filesArray = Array.from(event.target.files).slice(0, availableSlots);
        setIsUploading(true);
        
        try {
            const uploadPromises = filesArray.map(async file => {
                const compressedFile = await compressImage(file);
                const { downloadURL, fullPath } = await uploadFile(storage, user.uid, compressedFile, 'gallery-images');
                return { url: downloadURL, path: fullPath };
            });

            const newImageObjects = await Promise.all(uploadPromises);
            append(newImageObjects);
            toast({ title: 'Imagens enviadas!', description: 'Suas fotos foram adicionadas à galeria.' });
        } catch (error) {
            console.error("Error uploading files:", error);
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar as imagens.' });
        } finally {
            setIsUploading(false);
        }
    };


    const removeImage = (index: number) => {
        remove(index);
    };
    
    
    return (
        <div className="space-y-8">
            <ImageLimitWarning currentCount={fields.length} limit={MAX_GALLERY_IMAGES} itemType="fotos na galeria" />
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
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
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
                {errors.galleryImages?.root && (
                    <p className="text-sm font-medium text-destructive">{errors.galleryImages.root.message}</p>
                )}
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
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TimelineStep = () => {
    const { control, trigger, formState: { errors } } = useFormContext<PageData>();
    const { fields, append: appendTimeline, remove, update } = useFieldArray({
        control,
        name: "timelineEvents",
    });

    const { user } = useUser();
    const { storage } = useFirebase();
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const { toast } = useToast();

    const isLimitReached = fields.length >= MAX_TIMELINE_IMAGES;

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
        if (event.target.files && event.target.files[0] && user && storage) {
            const file = event.target.files[0];
            setUploadingIndex(index);
            
            try {
                const compressedFile = await compressImage(file, 800, 0.7);
                const { downloadURL, fullPath } = await uploadFile(storage, user.uid, compressedFile, 'timeline-images');

                const newImageObject = { url: downloadURL, path: fullPath };
                const currentEvent = fields[index];
                update(index, { ...currentEvent, image: newImageObject });
                trigger(`timelineEvents.${index}.image`);
                toast({ title: "Imagem enviada!", description: "A imagem do momento foi atualizada." });
            } catch (error) {
                console.error("Error uploading timeline image:", error);
                toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar a imagem.' });
            } finally {
                setUploadingIndex(null);
            }
        }
    };


    const handleRemove = (index: number) => {
        remove(index);
    }

    const handleAddNewMoment = () => {
        if (isLimitReached) return;
        appendTimeline({ description: "", date: new Date(), id: new Date().toISOString() });
    }

    return (
        <div className="space-y-6">
            <ImageLimitWarning currentCount={fields.length} limit={MAX_TIMELINE_IMAGES} itemType="momentos na linha do tempo" />
            {errors.timelineEvents?.root && (
                <p className="text-sm font-medium text-destructive">{errors.timelineEvents.root.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Adicione momentos importantes. Cada momento terá uma imagem, data e uma breve descrição.</p>
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                {fields.map((field, index) => {
                    const imagePreview = (field as any).image && (field as any).image.url;

                    return (
                        <Card key={field.id} className="p-4 bg-card/80 flex flex-col sm:flex-row gap-4 items-start relative">
                             <div className="flex-shrink-0">
                                <FormLabel htmlFor={`timeline-image-${index}`}>
                                    <div className={cn(
                                        "w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary relative",
                                        imagePreview && "border-solid",
                                        uploadingIndex === index && "opacity-50 cursor-not-allowed"
                                    )}>
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Preview" width={96} height={96} className="object-cover rounded-md" unoptimized />
                                        ) : (
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                        )}
                                        {uploadingIndex === index && <Loader2 className="absolute w-6 h-6 text-primary animate-spin" />}
                                    </div>
                                </FormLabel>
                                <FormControl>
                                    <Input id={`timeline-image-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, index)} disabled={uploadingIndex === index} />
                                </FormControl>
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
                                                variant={"outline"}
                                                className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(new Date(field.value), "PPP", { locale: ptBR })
                                                ) : (
                                                    <span>Escolha a data</span>
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
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(index)}>
                                <Trash className="w-4 h-4" />
                            </Button>
                        </Card>
                    )
                })}
            </div>
            <Button onClick={handleAddNewMoment} disabled={isLimitReached} className="w-full">
                <Plus className="mr-2" />
                Adicionar Momento
            </Button>
        </div>
    );
};

const MusicStep = () => {
    const { control, setValue, getValues } = useFormContext<PageData>();
    const { toast } = useToast();
    const musicOption = useWatch({ control, name: "musicOption" });
    const youtubeUrl = useWatch({ control, name: "youtubeUrl" });
    const [songName, setSongName] = useState("");
    const [artistName, setArtistName] = useState("");
    const [isSearching, startTransition] = useTransition();
    const [showManualLinkInput, setShowManualLinkInput] = useState(false);
    const manualLinkInputRef = useRef<HTMLInputElement>(null);
    
    // Audio recording state
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
    const [audioURL, setAudioURL] = useState<string>('');


    const handleSearchMusic = () => {
        if (!songName || !artistName) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios",
                description: "Por favor, preencha o nome da música e do artista.",
            });
            return;
        }
        startTransition(async () => {
            try {
                const result = await findYoutubeVideo({ songName, artistName });
                if (result.url && result.url.startsWith('http')) {
                    setValue("youtubeUrl", result.url, { shouldDirty: true, shouldValidate: true });
                    setShowManualLinkInput(false);
                    toast({
                        title: "Música encontrada!",
                        description: `A música "${songName}" foi adicionada.`,
                    });
                } else {
                    throw new Error("Nenhuma URL válida retornada.");
                }
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Erro ao buscar música",
                    description: "Não foi possível encontrar a música. Tente usar o link direto.",
                });
                setShowManualLinkInput(true);
            }
        });
    }
    
    const handleSetManualLink = () => {
      const manualUrl = manualLinkInputRef.current?.value;
      if (manualUrl && manualUrl.startsWith("http")) {
        setValue("youtubeUrl", manualUrl, { shouldDirty: true, shouldValidate: true });
         toast({
            title: "Link adicionado!",
            description: "A música do link foi adicionada.",
         });
      } else {
         toast({
            variant: "destructive",
            title: "Link inválido",
            description: "Por favor, insira um link válido do YouTube.",
         });
      }
    }


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; // Limpa os pedaços anteriores
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64Audio = reader.result as string;
            setAudioURL(base64Audio);
            setValue("audioRecording", base64Audio, { shouldDirty: true, shouldValidate: true });
        };
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setRecordingStatus("recording");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ variant: "destructive", title: "Erro de Microfone", description: "Não foi possível acessar o microfone. Verifique as permissões do seu navegador." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("recorded");
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
                    Nenhum Som
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
                    Gravar Mensagem de Voz <Mic className="h-5 w-5" />
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
                    Usar Música do YouTube <Youtube className="h-5 w-5" />
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
                        <FormLabel>Nome da Música</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Perfect" {...field} onChange={(e) => {field.onChange(e); setSongName(e.target.value)}} />
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
                        <FormLabel>Nome do Artista</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Ed Sheeran" {...field} onChange={(e) => {field.onChange(e); setArtistName(e.target.value)}} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
                  <FormLabel htmlFor="manual-link">Link do YouTube</FormLabel>
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
                {recordingStatus === "idle" && (
                    <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Gravar</Button>
                )}
                {recordingStatus === "recording" && (
                    <Button type="button" onClick={stopRecording} variant="destructive"><StopCircle className="mr-2 h-4 w-4" />Parar</Button>
                )}
                 {recordingStatus === "recorded" && (
                    <Button type="button" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Gravar Novamente</Button>
                )}
                {audioURL && (
                   <audio src={audioURL} controls className="w-full" />
                )}
             </div>
             <p className="text-sm text-muted-foreground text-center sm:text-left mt-2">
                {recordingStatus === 'recording' && 'Gravando...'}
                {recordingStatus === 'recorded' && 'Gravação concluída. Ouça acima.'}
            </p>
        </div>
      )}
    </div>
  );
};


const animationOptions = [
    { id: "none", name: "Nenhuma" },
    { id: "falling-hearts", name: "Chuva de Corações" },
    { id: "starry-sky", name: "Céu Estrelado" },
    { id: "floating-dots", name: "Pontos Coloridos" },
    { id: "mystic-fog", name: "Névoa Mística" },
    { id: "mystic-vortex", name: "Vórtice Púrpura" },
    { id: "clouds", name: "Nuvens" },
];

const BackgroundStep = ({ isVisible }: { isVisible: boolean }) => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const backgroundAnimation = watch("backgroundAnimation");
    const titleColor = watch("titleColor");
    const [isClient, setIsClient] = useState(false);

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
                        <FormLabel>Escolha a Animação</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                            >
                                {animationOptions.map((option) => (
                                    <FormItem key={option.id}>
                                        <FormControl>
                                            <RadioGroupItem value={option.id} id={`anim-${option.id}`} className="peer sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor={`anim-${option.id}`}
                                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24 text-sm relative overflow-hidden group/item"
                                        >
                                            {isClient && isVisible && (
                                                <div className="absolute inset-0 w-full h-full opacity-30 group-hover/item:opacity-40 -z-10">
                                                    {option.id === "falling-hearts" && <div className="w-full h-full relative overflow-hidden"><FallingHearts count={10} color="hsl(var(--primary))" /></div>}
                                                    {option.id === "starry-sky" && <div className="w-full h-full relative overflow-hidden"><StarrySky /></div>}
                                                    {option.id === "floating-dots" && <div className="w-full h-full relative overflow-hidden"><FloatingDots /></div>}
                                                    {option.id === "mystic-fog" && <div className="w-full h-full relative overflow-hidden"><div className="mystic-fog-1 !opacity-50 !-z-0"></div><div className="mystic-fog-2 !opacity-50 !-z-0"></div></div>}
                                                    {option.id === "mystic-vortex" && <div className="w-full h-full relative overflow-hidden"><MysticVortex /></div>}
                                                    {option.id === "clouds" && <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover"><source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4"/></video>}
                                                </div>
                                            )}
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
                            <Input
                                type="color"
                                className="h-10 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                                {...field}
                            />
                            <span className="text-sm">Clique no quadrado para escolher uma cor</span>
                            </div>
                        </FormControl>
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => setValue("heartColor", titleColor, { shouldDirty: true })}
                        >
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
};

const PuzzleStep = () => {
    const { control, setValue, watch } = useFormContext<PageData>();
    const enablePuzzle = watch("enablePuzzle");
    const puzzleImage = watch("puzzleImage");

    const { user } = useUser();
    const { storage } = useFirebase();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && user && storage) {
            const file = event.target.files[0];
            setIsUploading(true);
            
            try {
                const compressedFile = await compressImage(file);
                const { downloadURL, fullPath } = await uploadFile(storage, user.uid, compressedFile, 'puzzle-images');
                const newImageObject: FileWithPreview = { url: downloadURL, path: fullPath };
                setValue("puzzleImage", newImageObject, { shouldValidate: true, shouldDirty: true });
                toast({ title: 'Imagem enviada!', description: 'A imagem para o quebra-cabeça foi definida.' });
            } catch (error) {
                console.error("Error uploading puzzle image:", error);
                toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar a imagem.' });
            } finally {
                setIsUploading(false);
            }
        }
    };


    const removePuzzleImage = () => {
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
    };

    const puzzlePreviewUrl = useMemo(() => {
        return puzzleImage?.url || null;
    }, [puzzleImage]);
    
    return (
        <div className="space-y-8">
            <FormField
                control={control}
                name="enablePuzzle"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativar Quebra-Cabeça</FormLabel>
                            <FormDescription>
                                Exigir que o quebra-cabeça seja resolvido para ver a página.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            {enablePuzzle && (
                 <div className="space-y-2">
                    <FormLabel>Imagem do Quebra-Cabeça</FormLabel>
                     {!puzzlePreviewUrl ? (
                        <FormControl>
                        <label
                            htmlFor="puzzle-photo-upload"
                            className={cn(
                                "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block",
                                isUploading && "cursor-not-allowed opacity-50"
                            )}
                        >
                            {isUploading ? (
                                <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-2 animate-spin" />
                            ) : (
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                            )}
                            <p className="font-semibold">{isUploading ? 'Enviando...' : 'Clique para adicionar uma foto'}</p>
                            <p className="text-xs text-muted-foreground">A imagem que será transformada em quebra-cabeça</p>
                            <input
                                id="puzzle-photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePuzzleImageChange}
                                disabled={isUploading}
                            />
                        </label>
                        </FormControl>
                     ) : (
                        <div className="relative group aspect-video w-full">
                            <Image
                                src={puzzlePreviewUrl}
                                alt="Puzzle preview"
                                fill
                                className="rounded-md object-contain"
                                unoptimized
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                                onClick={removePuzzleImage}
                            >
                                <X className="h-4 w-4" />
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

const PaymentStep = ({ setPageId, setPixData, setIntentId }: {
    setPageId: (id: string) => void;
    setPixData: (data: { qrCode: string; qrCodeBase64: string, paymentId: string } | null) => void;
    setIntentId: (id: string) => void;
}) => {
    const { getValues, control, trigger, setValue } = useFormContext<PageData>();
    const { user } = useUser();
    const [isProcessing, startTransition] = useTransition();
    const [error, setError] = useState<{ message: string, details?: any } | null>(null);
    const { toast } = useToast();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handlePaymentSuccess = useCallback((pageId: string) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        toast({ title: 'Pagamento Aprovado!', description: 'Sua página foi criada com sucesso.' });
        setPageId(pageId);
        localStorage.removeItem('amore-pages-autosave');
    }, [setPageId, toast]);
    

    const startPolling = useCallback((intentId: string) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            const statusResult = await checkFinalPageStatus(intentId);
            if (statusResult.status === 'completed' && statusResult.pageId) {
                handlePaymentSuccess(statusResult.pageId);
            } else if (statusResult.error || statusResult.status === 'error' || statusResult.status === 'expired') {
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                setError({ message: statusResult.error || 'Ocorreu um erro ou a sessão expirou.' });
                setPixData(null); // Limpa os dados do PIX em caso de erro
            }
        }, 5000); // Poll every 5 seconds
    }, [handlePaymentSuccess, setPixData]);

    // This effect cleans up the polling when the component unmounts
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const handleGeneratePix = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPixData(null);
        
        const isFormValid = await trigger("payment");
        if (!isFormValid) {
            toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, corrija os erros no formulário do pagador.' });
            return;
        }

        const currentIntentId = getValues("intentId");
        if (!currentIntentId) {
            setError({ message: 'Não foi possível encontrar o rascunho salvo. Por favor, volte e tente novamente.' });
            return;
        }

        setIntentId(currentIntentId);
        
        startTransition(async () => {
            const paymentResult = await processPixPayment(currentIntentId);
            
            if (paymentResult.error) {
                setError({ message: paymentResult.error, details: paymentResult.details || {} });
            } else if (paymentResult.qrCode && paymentResult.qrCodeBase64 && paymentResult.paymentId) {
                setPixData({ qrCode: paymentResult.qrCode, qrCodeBase64: paymentResult.qrCodeBase64, paymentId: paymentResult.paymentId });
                startPolling(currentIntentId);
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <CardHeader>
                    <CardTitle>Dados do Pagador</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                     <FormField control={control} name="payment.payerFirstName" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                     <FormField control={control} name="payment.payerLastName" render={({ field }) => <FormItem><FormLabel>Sobrenome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                     <FormField control={control} name="payment.payerEmail" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>} />
                     <FormField control={control} name="payment.payerCpf" render={({ field: { onChange, ...rest } }) => <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...rest} onChange={e => onChange(cpfMask(e.target.value))} /></FormControl><FormMessage /></FormItem>} />
                </div>
            </Card>
            <form onSubmit={handleGeneratePix}>
                <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : "Pagar com PIX R$ 24,99"}
                </Button>
            </form>
            {error && <Alert variant="destructive" className="mt-4"><AlertTitle>Erro!</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>}
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
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [pageId, setPageId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string, paymentId: string } | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [isManualVerificationLoading, setManualVerificationLoading] = useState(false);

  const [puzzleDimension, setPuzzleDimension] = useState(360);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);


  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    defaultValues: { 
        title: "Seu Título Aqui", 
        backgroundAnimation: "none", 
        galleryImages: [], 
        timelineEvents: [],
        payment: { payerCpf: "", payerEmail: "", payerFirstName: "", payerLastName: "" }
    }
  });
  
  const { watch, trigger, formState, setValue, getValues } = methods;
  const formData = watch();


  const restoreFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    const savedDataJSON = localStorage.getItem('amore-pages-autosave');
    if (!savedDataJSON) return;

    try {
        const parsed = JSON.parse(savedDataJSON);
        if (parsed.specialDate) parsed.specialDate = new Date(parsed.specialDate);
        if (parsed.timelineEvents) {
            parsed.timelineEvents.forEach((ev: any) => { if(ev.date) ev.date = new Date(ev.date) });
        }
        methods.reset(parsed);
    } catch(e) {
        console.error("Failed to parse autosaved data:", e);
        localStorage.removeItem('amore-pages-autosave');
    }
  }, [methods]);
  
  useEffect(() => {
    setIsClient(true);
    
    if (searchParams.get('new') === 'true') {
        localStorage.removeItem('amore-pages-autosave');
        methods.reset(); // Resets to default values
    } else {
        restoreFromLocalStorage();
    }

    const handleResize = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth < 640) setPuzzleDimension(screenWidth * 0.8);
        else setPuzzleDimension(360);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
    }
  }, [searchParams, methods, restoreFromLocalStorage]);


  // --- AUTOSAVE LOGIC ---
  const handleAutosave = useCallback(async (data: PageData) => {
    if (!user || isUserLoading) return; // Don't save if no user or still loading
    
    try {
        const currentData = { ...data, userId: user.uid };
        const result = await createOrUpdatePaymentIntent(currentData);

        if (result.intentId && !currentData.intentId) {
            // This ensures we set the intentId in the form state only once
            // and subsequent saves will update the existing document.
            setValue('intentId', result.intentId, { shouldDirty: false });
        }
        if(result.error) {
            console.warn("Autosave failed:", result.error);
        } else {
            // Save to localStorage as a fallback and for offline state
            localStorage.setItem('amore-pages-autosave', JSON.stringify(currentData));
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
    await handleAutosave(getValues());
    const ok = await trigger(steps[currentStep].fields as any);
    if (ok) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  
  const handleBack = async () => {
      await handleAutosave(getValues());
      setCurrentStep(s => Math.max(0, s - 1))
  };
  
  if (!user && !isUserLoading) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8">
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sessão Expirada</AlertTitle>
                  <AlertDescription>Você precisa estar logado para criar uma página.</AlertDescription>
              </Alert>
              <Button asChild className="mt-4"><a href="/login?redirect=/criar">Ir para o Login</a></Button>
          </div>
      )
  }

  const timelineEventsForDisplay = useMemo(() => {
    if (!formData.timelineEvents) return [];
    return formData.timelineEvents
        .filter(event => event.image?.url)
        .map(event => ({
            id: event.id || Math.random().toString(),
            imageUrl: event.image!.url,
            alt: event.description || 'Timeline image',
            title: event.description || '',
            date: event.date ? new Date(event.date) : undefined,
        }));
    }, [isClient, formData.timelineEvents]);

  if (showTimelinePreview) {
      return <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimelinePreview(false)} />;
  }

  const currentStepId = steps[currentStep]?.id;
  let StepComponent;

  if (pageId) {
      StepComponent = <SuccessStep pageId={pageId} />;
  } else if (currentStepId === 'payment') {
      if (pixData) {
          const handleCopyPix = () => {
            navigator.clipboard.writeText(pixData.qrCode).then(() => {
                toast({ title: "Código PIX copiado!" });
            }).catch(err => {
                toast({ variant: 'destructive', title: "Falha ao copiar" });
            });
          };

          const handleManualVerification = async () => {
            const currentIntentId = getValues("intentId");
            if(!currentIntentId) {
                toast({ variant: 'destructive', title: 'Erro Interno', description: 'ID da Intenção de pagamento não encontrado.' });
                return;
            }
            setManualVerificationLoading(true);
            const result = await verifyPaymentWithMercadoPago(pixData.paymentId, currentIntentId);
            setManualVerificationLoading(false);

            if (result.status === 'approved' && result.pageId) {
                setPageId(result.pageId);
                localStorage.removeItem('amore-pages-autosave');
                toast({ title: 'Pagamento Confirmado!', description: 'Sua página foi criada com sucesso.' });
            } else if (result.status === 'pending') {
                toast({ title: 'Pagamento Pendente', description: 'O pagamento ainda não foi aprovado. Por favor, aguarde um pouco mais.' });
            } else {
                toast({ variant: 'destructive', title: 'Verificação Falhou', description: result.error || 'Não foi possível confirmar o pagamento. Tente novamente em alguns instantes.' });
            }
          };

          StepComponent = (
              <div className="flex flex-col items-center text-center gap-6">
                   <h3 className="text-xl font-bold font-headline">Pague com PIX para Finalizar</h3>
                   <p className="text-muted-foreground max-w-sm">Escaneie o QR Code com o app do seu banco ou use o código "Copia e Cola".</p>
                  <div className="p-4 bg-white rounded-lg border">
                      <Image 
                        src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`}
                        alt="PIX QR Code"
                        width={256}
                        height={256}
                      />
                  </div>
                  <Button onClick={handleCopyPix} className="w-full max-w-xs">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código PIX
                  </Button>
                   <p className="text-xs text-muted-foreground">Aguardando pagamento... A página será liberada automaticamente.</p>
                    <div className="border-t w-full pt-4 mt-2 flex flex-col items-center gap-2">
                         <p className="text-xs text-muted-foreground">Se já pagou, aguarde ou clique abaixo para verificar.</p>
                         <Button onClick={handleManualVerification} disabled={isManualVerificationLoading} variant="outline" size="sm">
                             {isManualVerificationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Verificar Pagamento
                         </Button>
                    </div>
              </div>
          );
      } else {
          StepComponent = <PaymentStep setPageId={setPageId} setPixData={setPixData} setIntentId={setIntentId} />;
      }
  } else {
      const Comp = stepComponents[currentStep];
      StepComponent = <Comp isVisible={currentStepId === 'background'} />;
  }

  const isPuzzleActive = isClient && formData.enablePuzzle && formData.puzzleImage?.url;

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid md:grid-cols-2 gap-8 min-h-[calc(100vh_-_10rem)]">
          {/* Coluna da Esquerda: Preview */}
          <div className="hidden md:flex h-full w-full md:sticky top-24 items-center justify-center p-4">
             <PreviewContent 
                formData={formData} 
                isClient={isClient}
                onShowTimeline={() => setShowTimelinePreview(true)}
                hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
            />
          </div>

          {/* Coluna da Direita: Wizard */}
          <div className="p-6 md:p-12 space-y-8">
            <div className="flex justify-between items-center">
                <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep===0}><ArrowLeft /></Button>
                <div className="flex-grow flex flex-col items-center gap-2 mx-4">
                    <span className="text-xs text-muted-foreground">Passo {currentStep + 1} de {steps.length}</span>
                    <Progress value={(currentStep + 1) / steps.length * 100} className="w-full" />
                </div>
                <Button type="button" onClick={handleNext} disabled={currentStep===steps.length-1}><ChevronRight /></Button>
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>
             {/* Mobile Preview Button */}
            <div className="md:hidden sticky top-24 z-30">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full shadow-lg">
                           <Eye className="mr-2 h-4 w-4" /> Ver Preview
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] h-[80vh] flex flex-col p-2">
                        <DialogHeader className="p-2 pb-0">
                           <DialogTitle>Preview da Página</DialogTitle>
                        </DialogHeader>
                        <div className="flex-grow overflow-hidden">
                           <PreviewContent 
                                formData={formData} 
                                isClient={isClient}
                                onShowTimeline={() => setShowTimelinePreview(true)}
                                hasValidTimelineEvents={timelineEventsForDisplay.length > 0}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="min-h-[400px]">
                {StepComponent}
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}




const ImageLimitWarning = ({ currentCount, limit, itemType }: { currentCount: number, limit: number, itemType: string }) => {
    if (currentCount > limit) {
         return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Limite Excedido</AlertTitle>
                <AlertDescription>Você excedeu o limite de {limit} {itemType}. Remova alguns para continuar.</AlertDescription>
            </Alert>
         )
    }
    return (
        <Alert variant={currentCount === limit ? "destructive" : "default"}>
            <Camera className="h-4 w-4" />
            <AlertTitle>Contador de Imagens</AlertTitle>
            <AlertDescription>Você usou {currentCount} de {limit} {itemType}.</AlertDescription>
        </Alert>
    )
};

const SuccessStep = ({ pageId }: { pageId: string }) => {
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
            <h2 className="text-2xl font-bold font-headline">Página Criada com Sucesso!</h2>
            <p className="text-muted-foreground">Sua obra de arte está pronta. Compartilhe o link abaixo com seu amor.</p>
            <div className="flex items-center space-x-2 w-full max-w-md p-2 rounded-lg border bg-muted">
                <Input type="text" value={pageUrl} readOnly className="flex-1 bg-transparent border-0 ring-0 focus-visible:ring-0"/>
                <Button onClick={handleCopy}>
                    {copied ? <CheckCircle className="mr-2"/> : <Copy className="mr-2"/>}
                    {copied ? 'Copiado!' : 'Copiar'}
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
            <p className="text-xs text-muted-foreground mt-2">Você também pode salvar ou imprimir o QR Code acima.</p>
            <Button asChild className="mt-4">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                    <View className="mr-2" />
                    Visualizar Página
                </a>
            </Button>
        </div>
    );
};

const CustomAudioPlayer = ({ src }: { src: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlayPause = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };
  
    useEffect(() => {
      const audio = audioRef.current;
      if (audio) {
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => {
          audio.removeEventListener('ended', handleEnded);
        };
      }
    }, []);
  
    return (
      <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <audio ref={audioRef} src={src} className="hidden" />
        <Button onClick={togglePlayPause} size="icon" variant="ghost" className="text-primary-foreground bg-primary/80 hover:bg-primary">
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <p className="text-sm text-primary-foreground font-semibold">Sua mensagem de voz</p>
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
