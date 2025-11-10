
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
import { ArrowLeft, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download, Plus, Trash, CalendarIcon, Info, AlertTriangle, Copy, Terminal, Clock, TestTube2 } from "lucide-react";
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
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import { findYoutubeVideo } from "@/ai/flows/find-youtube-video";
import { useToast } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import FallingHearts from "@/components/effects/FallingHearts";
import StarrySky from "@/components/effects/StarrySky";
import MysticVortex from "@/components/effects/MysticVortex";
import FloatingDots from "@/components/effects/FloatingDots";
import { handleSuggestContent, initiatePayment, checkPaymentStatus } from "./actions";
import { Switch } from "@/components/ui/switch";
import RealPuzzle from "@/components/puzzle/Puzzle";
import { initMercadoPago } from '@mercadopago/sdk-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from 'next/navigation'
import { base64ToFile, fileToBase64 } from "@/lib/image-utils";
import { doc } from "firebase/firestore";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";


const YoutubePlayer = dynamic(() => import('./YoutubePlayer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center bg-zinc-800/50 rounded-lg"><Loader2 className="animate-spin text-primary" /></div>
});

const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });

const cpfMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value.slice(0, 14);
};


const paymentSchema = z.object({
  payerFirstName: z.string().min(1, "Nome é obrigatório."),
  payerLastName: z.string().min(1, "Sobrenome é obrigatório."),
  payerEmail: z.string().email("E-mail inválido."),
  payerCpf: z.string().min(14, "O CPF é obrigatório e deve ser completo.").max(14, "O CPF deve ter o formato 000.000.000-00."),
});


export const fileWithPreviewSchema = z.object({
    preview: z.string().url({ message: "URL de pré-visualização inválida." }),
});
export type FileWithPreview = z.infer<typeof fileWithPreviewSchema>;


export const timelineEventSchema = z.object({
    id: z.string().optional(),
    image: fileWithPreviewSchema.optional(),
    description: z.string().min(1, "A descrição é obrigatória."),
    date: z.date().optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;


// Define the schema for the entire wizard
const pageSchema = z.object({
  title: z.string().default("Seu Título Aqui"),
  titleColor: z.string().default("#FFFFFF"),
  message: z.string().min(1, "A mensagem não pode estar vazia.").default(""),
  messageFontSize: z.string().default("text-base"),
  messageFormatting: z.array(z.string()).default([]),
  aiPrompt: z.string().optional(),
  specialDate: z.date().optional(),
  countdownStyle: z.string().default("Padrão"),
  countdownColor: z.string().default("#FFFFFF"),
  galleryImages: z.array(fileWithPreviewSchema).default([]),
  galleryStyle: z.string().default("Cube"),
  timelineEvents: z.array(timelineEventSchema).default([]),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: z.string().optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("#8B5CF6"),
  backgroundVideo: z.any().optional(),
  enablePuzzle: z.boolean().default(false),
  puzzleImage: fileWithPreviewSchema.optional(),
  payment: paymentSchema,
});

export type PageData = z.infer<typeof pageSchema>;

const steps = [
  {
    id: "title",
    title: "Título da página",
    description: "Escreva o título dedicatório. Ex: João & Maria, Feliz Aniversário, etc.",
    fields: ["title", "titleColor"],
  },
  {
    id: "message",
    title: "Sua Mensagem de Amor",
    description: "Escreva a mensagem principal que você quer compartilhar.",
    fields: ["message", "messageFontSize", "messageFormatting", "aiPrompt"],
  },
  {
    id: "specialDate",
    title: "Data Especial",
    description: "Informe a data que simboliza o início de uma união ou um momento marcante.",
    fields: ["specialDate", "countdownStyle", "countdownColor"],
  },
  {
    id: "gallery",
    title: "Galeria de Fotos",
    description: "Adicione fotos para personalizar a galeria.",
    fields: ["galleryImages", "galleryStyle"],
  },
  {
    id: "timeline",
    title: "Linha do Tempo 3D",
    description: "Adicione momentos marcantes que flutuarão em uma galáxia 3D.",
    fields: ["timelineEvents"],
  },
  {
    id: "music",
    title: "Música Dedicada",
    description: "Escolha uma trilha sonora para sua página ou grave uma mensagem de voz.",
    fields: ["musicOption", "youtubeUrl", "audioRecording", "songName", "artistName"],
  },
  {
    id: "background",
    title: "Animação de Fundo",
    description: "Escolha uma animação para o fundo da página para um toque especial.",
    fields: ["backgroundAnimation", "heartColor", "backgroundVideo"],
  },
   {
    id: "puzzle",
    title: "Quebra-Cabeça Interativo",
    description: "Crie um enigma! A pessoa amada monta uma foto para revelar sua página.",
    fields: ["enablePuzzle", "puzzleImage"],
  },
  {
    id: "payment",
    title: "Finalizar",
    description: "Sua página está quase pronta! Realize o pagamento para gerar o link e o QR Code.",
    fields: ["payment"],
  },
];

const TitleStep = () => (
  <div className="space-y-8">
    <FormField
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Título</FormLabel>
          <FormControl>
            <Input placeholder="Ex: João & Maria ou Feliz Aniversário" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      name="titleColor"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cor do título</FormLabel>
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
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const MessageStep = () => {
    const [isPending, startTransition] = useTransition();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const form = useFormContext<PageData>();

    const handleAiAction = () => {
        const userInput = form.getValues("aiPrompt");
        if (!userInput) return;

        const formData = new FormData();
        formData.append("userInput", userInput);

        startTransition(async () => {
            setAiError(null);
            setSuggestions([]);
            const result = await handleSuggestContent(formData);
            if (result.error) {
                setAiError(result.error);
            } else if (result.suggestions) {
                setSuggestions(result.suggestions);
            }
        });
    };

    const appendSuggestion = (suggestion: string) => {
        const currentMessage = form.getValues("message");
        form.setValue("message", (currentMessage ? currentMessage + "\n\n" : "") + suggestion);
    };

    return (
        <div className="space-y-8">
            <FormField
                name="messageFontSize"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tamanho do Texto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um tamanho" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="text-sm">Pequeno</SelectItem>
                                <SelectItem value="text-base">Padrão</SelectItem>
                                <SelectItem value="text-lg">Grande</SelectItem>
                                <SelectItem value="text-xl">Extra Grande</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <FormLabel>Sua Mensagem</FormLabel>
                <FormField
                    name="messageFormatting"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ToggleGroup
                                    type="multiple"
                                    variant="outline"
                                    className="justify-start"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <ToggleGroupItem value="bold" aria-label="Negrito">
                                        <Bold className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="italic" aria-label="Itálico">
                                        <Italic className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="strikethrough" aria-label="Tachado">
                                        <Strikethrough className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder="Escreva aqui sua declaração..."
                                    className="min-h-[200px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <Card className="bg-card/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-primary" /> Sugestões com IA</CardTitle>
                    <CardDescription>Sem inspiração? Descreva o que você sente e peça para a IA criar algo para você.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="aiPrompt"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea 
                                        {...field}
                                        placeholder="Ex: 'um poema curto sobre nosso primeiro beijo na praia'" 
                                        className="bg-background" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        <Button type="button" onClick={handleAiAction} disabled={isPending}>
                            {isPending ? (
                            <Loader2 className="animate-spin" />
                            ) : (
                            <Wand2 className="mr-2" />
                            )}
                            Gerar Sugestões
                        </Button>
                    </div>
                    {aiError && <p className="text-destructive mt-4">{aiError}</p>}
                    {suggestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="font-semibold">Sugestões:</h4>
                        <ul className="space-y-3">
                        {suggestions.map((s, i) => (
                            <li key={i} className="p-4 bg-muted/50 rounded-md border text-sm text-muted-foreground flex justify-between items-center">
                            <p className="italic">"{s}"</p>
                            <Button variant="ghost" size="sm" onClick={() => appendSuggestion(s)}>
                                Usar
                            </Button>
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const SpecialDateStep = () => {
    const { watch, setValue, getValues } = useFormContext<PageData>();
    const specialDate = watch("specialDate");
    const titleColor = watch("titleColor");

    return (
        <div className="space-y-8">
            <FormField
                name="specialDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                        <FormLabel>Início do relacionamento</FormLabel>
                         <FormControl>
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={ptBR}
                                captionLayout="dropdown-buttons"
                                fromYear={1960}
                                toYear={new Date().getFullYear()}
                                className="border rounded-md bg-card/80"
                            />
                        </FormControl>
                        <FormDescription>
                            Essa data será usada para o contador.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {specialDate && (
              <>
                <FormField
                    name="countdownStyle"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-center block">Modo de Exibição do Contador</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col items-center"
                                >
                                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Padrão" id="style-default" className="peer sr-only" />
                                            </FormControl>
                                            <Label htmlFor="style-default" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full">
                                                Padrão
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Clássico" id="style-classic" className="peer sr-only" />
                                            </FormControl>
                                            <Label htmlFor="style-classic" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full">
                                                Clássico
                                            </Label>
                                        </FormItem>
                                    </div>
                                    <div className="w-full max-w-sm px-[calc(25%_+_0.5rem)]">
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Simples" id="style-simple" className="peer sr-only" />
                                            </FormControl>
                                            <Label htmlFor="style-simple" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full">
                                                Simples
                                            </Label>
                                        </FormItem>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  name="countdownColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Contador</FormLabel>
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
                            onClick={() => setValue("countdownColor", titleColor, { shouldDirty: true })}
                        >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Usar a cor do título
                        </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
        </div>
    );
};


const GalleryStep = () => {
  const { control, setValue, getValues, trigger } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({
      control,
      name: "galleryImages",
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const availableSlots = 8 - fields.length;
      if (availableSlots <= 0) return;

      const filesArray = Array.from(event.target.files).slice(0, availableSlots);
      
      const newImageObjects = await Promise.all(
          filesArray.map(async file => {
              const base64Preview = await fileToBase64(file);
              return { preview: base64Preview };
          })
      );
      
      append(newImageObjects);
    }
  };

  const removeImage = (index: number) => {
    remove(index);
  };
  
    return (
        <div className="space-y-8">
        <div className="space-y-2">
            <FormLabel>Suas Fotos</FormLabel>
            <FormControl>
            <label
                htmlFor="photo-upload"
                className={cn(
                "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block",
                fields.length >= 8 && "cursor-not-allowed opacity-50"
                )}
            >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-semibold">Clique para adicionar fotos</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF (máx. 8 fotos)</p>
                <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={fields.length >= 8}
                />
            </label>
            </FormControl>
            {fields && fields.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 mt-4">
                {fields.map((field, index) => (
                <div key={field.id} className="relative group aspect-square">
                    <Image
                    src={(field as any).preview}
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

      <FormField
        control={control}
        name="galleryStyle"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="font-semibold">Modo de Exibição da Galeria</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-2 gap-4"
              >
                {["Coverflow", "Cards", "Flip", "Cube"].map((style) => (
                  <FormItem key={style}>
                    <FormControl>
                      <RadioGroupItem value={style} id={`gallery-${style.toLowerCase()}`} className="peer sr-only" />
                    </FormControl>
                    <Label
                      htmlFor={`gallery-${style.toLowerCase()}`}
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                    >
                      {style}
                    </Label>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};


const TimelineStep = () => {
    const { control, setValue, trigger, getValues } = useFormContext<PageData>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "timelineEvents",
    });

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const base64Preview = await fileToBase64(file);
            const newImageObject = {
                preview: base64Preview
            };
            const currentEvent = fields[index];
            update(index, { ...currentEvent, image: newImageObject });
            trigger(`timelineEvents.${index}.image`);
        }
    };
    
    const handleRemove = (index: number) => {
        remove(index);
    }
    
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Adicione momentos importantes. Cada momento terá uma imagem, data e uma breve descrição.</p>
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                {fields.map((field, index) => {
                    const imagePreview = (field as any).image && (field as any).image.preview;

                    return (
                        <Card key={field.id} className="p-4 bg-card/80 flex flex-col sm:flex-row gap-4 items-start relative">
                            <div className="flex-shrink-0">
                                <FormLabel htmlFor={`timeline-image-${index}`}>
                                    <div className={cn(
                                        "w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary",
                                        imagePreview && "border-solid"
                                    )}>
                                        {imagePreview ? (
                                            <Image src={imagePreview} alt="Preview" width={96} height={96} className="object-cover rounded-md" unoptimized />
                                        ) : (
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                </FormLabel>
                                <FormControl>
                                    <Input id={`timeline-image-${index}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, index)} />
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
                                                    format(field.value, "PPP", { locale: ptBR })
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
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                                locale={ptBR}
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

            <Button type="button" variant="outline" className="w-full" onClick={() => append({ description: "", date: new Date(), id: new Date().toISOString() })}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Momento
            </Button>
        </div>
    )
}

const MusicStep = () => {
    const { control, setValue, getValues } = useFormContext<PageData>();
    const musicOption = useWatch({ control, name: "musicOption" });
    const youtubeUrl = useWatch({ control, name: "youtubeUrl" });
    const [isSearching, startTransition] = useTransition();
    const { toast } = useToast();

    const [showManualLinkInput, setShowManualLinkInput] = useState(false);
    const manualLinkInputRef = useRef<HTMLInputElement>(null);

    const [recordingStatus, setRecordingStatus] = useState("idle");
    const [audioURL, setAudioURL] = useState("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleSearchMusic = () => {
        const songName = getValues("songName");
        const artistName = getValues("artistName");

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
                            <Input placeholder="Ex: Perfect" {...field} />
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
                            <Input placeholder="Ex: Ed Sheeran" {...field} />
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
    const customVideoInputRef = useRef<HTMLInputElement>(null);
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        setValue("backgroundVideo", file, { shouldValidate: true, shouldDirty: true });
        setValue("backgroundAnimation", "custom-video", { shouldValidate: true, shouldDirty: true });
      }
    };

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
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value !== 'custom-video') {
                                        setValue('backgroundVideo', null);
                                        if (customVideoInputRef.current) {
                                            customVideoInputRef.current.value = '';
                                        }
                                    }
                                }}
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
            <div className="pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">Não gostou de nenhum? Anexe o seu agora mesmo!</p>
              <label htmlFor="video-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Anexar Vídeo
                  <input id="video-upload" ref={customVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
              </label>
            </div>
        </div>
    );
};

const PuzzleStep = () => {
    const { control, setValue, getValues, watch } = useFormContext<PageData>();
    const enablePuzzle = watch("enablePuzzle");
    const puzzleImage = watch("puzzleImage");
    
    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const base64Preview = await fileToBase64(file);
            const newImageObject: FileWithPreview = {
                preview: base64Preview
            };
            setValue("puzzleImage", newImageObject, { shouldValidate: true, shouldDirty: true });
        }
    };

    const removePuzzleImage = () => {
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
    };

    const puzzlePreviewUrl = useMemo(() => {
        return puzzleImage?.preview || null;
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
                            "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block"
                            )}
                        >
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                            <p className="font-semibold">Clique para adicionar uma foto</p>
                            <p className="text-xs text-muted-foreground">A imagem que será transformada em quebra-cabeça</p>
                            <input
                            id="puzzle-photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePuzzleImageChange}
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
    <TitleStep />,
    <MessageStep />,
    <SpecialDateStep />,
    <GalleryStep />,
    <TimelineStep />,
    <MusicStep />,
    <BackgroundStep isVisible={true} />, // isVisible prop is passed for conditional rendering inside
    <PuzzleStep />,
    // PaymentStep is handled separately
];

type PixData = {
    paymentId: number;
    qrCodeBase64: string;
    qrCode: string;
}

const PaymentStep = ({ setPixData, setPageId, setPaymentComplete, pageId }: { 
    setPixData: (data: PixData) => void;
    setPageId: (id: string) => void;
    setPaymentComplete: (v: boolean) => void;
    pageId: string | null;
}) => {
    const { getValues, control, trigger } = useFormContext<PageData>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { firestore } = useFirebase();

    // The single source of truth for the created page ID
    const lovePageRef = useMemoFirebase(() => {
        if (!firestore || !pageId) return null;
        return doc(firestore, 'lovepages', pageId);
    }, [firestore, pageId]);

    // This hook will listen to the lovepages document.
    // When the webhook creates it, this `data` will become available.
    const { data: createdPageData } = useDoc(lovePageRef);

    // This effect runs when the page data is successfully fetched,
    // indicating the page has been created on the backend.
    useEffect(() => {
        if (createdPageData && pageId) {
            setPaymentComplete(true);
            localStorage.removeItem('form-data-autosave');
        }
    }, [createdPageData, pageId, setPaymentComplete]);

    const handleFinalizeAndPay = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isPaymentConfigured = !!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
        if (!isPaymentConfigured) {
            setError("O sistema de pagamento não está configurado. Por favor, contate o suporte.");
            return;
        }
        
        const isFormValid = await trigger("payment");
        if (!isFormValid) {
            toast({
                variant: 'destructive',
                title: 'Campos Inválidos',
                description: 'Por favor, corrija os erros no formulário do pagador.'
            })
            return;
        }

        setIsProcessing(true);
        setError(null);
        
        try {
            const payerData = getValues("payment");
            const allPageData = getValues();
            
            // This action now only creates the payment, not the page.
            const result = await initiatePayment(payerData, allPageData);

            if (result.pageId && result.pixData) {
                setPageId(result.pageId); // Set the pageId to start listening
                setPixData(result.pixData);
            } else {
                setError(result.error || 'Não foi possível gerar o pagamento PIX.');
            }
        } catch (e: any) {
             console.error("Failed to process payment:", e);
             setError("Ocorreu um erro ao processar sua requisição. Por favor, tente novamente.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <form onSubmit={handleFinalizeAndPay} className="space-y-6">
            {error && (
                <Card className="bg-destructive/10 border-destructive/50 text-destructive-foreground p-4">
                    <CardHeader className="p-0 flex flex-row items-center gap-2">
                         <Terminal className="w-6 h-6 flex-shrink-0" />
                         <CardTitle className="text-lg">Erro ao Processar</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 mt-4">
                        <p className="font-mono text-sm bg-black/30 p-3 rounded-md overflow-x-auto">
                            {error}
                        </p>
                         <p className="text-xs mt-3 opacity-80">
                            Este é um erro técnico. Se o problema persistir, por favor contate o suporte.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card className="text-left bg-card/80 p-6">
                <CardHeader className="p-0 mb-4">
                    <CardTitle>Dados do Pagador</CardTitle>
                    <CardDescription>
                        Essas informações são necessárias para gerar o PIX.
                    </CardDescription>
                </CardHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="payment.payerFirstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Seu nome" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                            <FormField
                            control={control}
                            name="payment.payerLastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sobrenome</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Seu sobrenome" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={control}
                        name="payment.payerEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="seu@email.com" type="email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="payment.payerCpf"
                        render={({ field: { onChange, ...restField } }) => (
                            <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                    <Input
                                      {...restField}
                                      placeholder="000.000.000-00"
                                      onChange={(e) => {
                                        onChange(cpfMask(e.target.value))
                                      }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </Card>
            
            <Button type="submit" disabled={isProcessing} size="lg" className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : "Finalizar e Pagar com PIX"}
            </Button>
        </form>
    );
};

const WaitingForPaymentStep = ({ pixData, pageId, setPaymentComplete }: { pixData: PixData, pageId: string | null, setPaymentComplete: (v: boolean) => void }) => {
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(false);
    const { firestore } = useFirebase();

    const lovePageRef = useMemoFirebase(() => {
        if (!firestore || !pageId) return null;
        return doc(firestore, 'lovepages', pageId);
    }, [firestore, pageId]);

    const { data: createdPageData } = useDoc(lovePageRef);

    useEffect(() => {
        if (createdPageData && pageId) {
            setPaymentComplete(true);
        }
    }, [createdPageData, pageId, setPaymentComplete]);

    const copyPixCode = () => {
        navigator.clipboard.writeText(pixData.qrCode).then(() => {
            toast({ title: 'Código PIX Copiado!', description: 'Use a opção "PIX Copia e Cola" no seu banco.' });
        }).catch(() => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o código PIX.' });
        });
    }

    const handleCheckPayment = async () => {
        if (!pixData?.paymentId || isChecking) return;

        setIsChecking(true);
        try {
            const result = await checkPaymentStatus(String(pixData.paymentId));
            if (result.status === 'approved') {
                toast({ title: 'Pagamento Aprovado!', description: 'Sua página está sendo liberada.' });
                // The useDoc hook will handle setting paymentComplete
            } else {
                toast({ variant: 'default', title: 'Pagamento Pendente', description: 'A confirmação do pagamento ainda não foi recebida. Tente novamente em alguns segundos.' });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao Verificar', description: error.message || 'Não foi possível verificar o status do pagamento.' });
        } finally {
            setIsChecking(false);
        }
    };


    return (
        <div className="flex flex-col items-center text-center gap-6">
            <div className="p-4 bg-primary/10 rounded-full border-2 border-primary/30">
                <Clock className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-headline">Aguardando Pagamento</h2>
            <p className="text-muted-foreground max-w-sm">Escaneie o QR Code abaixo ou use o "copia e cola" para pagar.</p>
            
            <Card className="p-6 bg-card/80 w-full max-w-xs">
                <h3 className="font-semibold mb-4 text-center">Pague com PIX</h3>
                <div className="flex flex-col items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                        <Image src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="PIX QR Code" width={200} height={200} />
                    </div>
                    <Button onClick={copyPixCode} variant="outline" className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código PIX
                    </Button>
                </div>
            </Card>

            <Button onClick={handleCheckPayment} disabled={isChecking} className="w-full max-w-xs mt-4" size="lg">
                {isChecking ? <Loader2 className="animate-spin" /> : 'Já fiz o pagamento'}
            </Button>
             <p className="text-xs text-muted-foreground max-w-xs">
                Após pagar, sua página será liberada automaticamente. Se preferir, pode clicar no botão acima para verificar.
            </p>
        </div>
    );
}

const SuccessStep = ({ pageId }: { pageId: string }) => {
    const { toast } = useToast();
    const [pageUrl, setPageUrl] = useState('');

    useEffect(() => {
        setPageUrl(`${window.location.origin}/p/${pageId}`);
    }, [pageId]);
    
    const copyToClipboard = () => {
        if (!pageUrl) return;
        navigator.clipboard.writeText(pageUrl).then(() => {
            toast({ title: 'Link copiado!', description: 'O link para sua página foi copiado para a área de transferência.' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o link.' });
        });
    };

    if (!pageUrl) {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Gerando seu link...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center gap-6">
             <div className="p-4 bg-green-500/10 rounded-full border-2 border-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold font-headline">Página Pronta para Compartilhar!</h2>
            <p className="text-muted-foreground max-w-sm">Sua página foi criada com sucesso e já está no ar!</p>

            <Card className="p-6 bg-card/80 w-full max-w-sm">
                <h3 className="font-semibold mb-4">Compartilhe sua Declaração</h3>
                <div className="flex flex-col items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pageUrl)}`} alt="URL QR Code" width={150} height={150} />
                    </div>
                    <div className="flex-grow w-full">
                        <Label htmlFor="page-link" className="text-left text-xs text-muted-foreground">Link da Página:</Label>
                         <div className="flex gap-2 mt-1">
                            <Input id="page-link" readOnly value={pageUrl} className="bg-background/50 text-xs"/>
                            <Button onClick={copyToClipboard} size="icon" variant="outline">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Button asChild size="lg" className="mt-4">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                    Acessar a Página
                    <ChevronRight className="ml-2" />
                </a>
            </Button>
        </div>
    )
}

const WizardInternal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  
  // State for payment flow
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);


  const [createdPageId, setCreatedPageId] = useState<string | null>(null);
  const [puzzleDimension, setPuzzleDimension] = useState(360);
  const [showTimeline, setShowTimeline] = useState(false);
  const searchParams = useSearchParams()

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "Seu Título Aqui",
      titleColor: "#FFFFFF",
      message: "",
      messageFontSize: "text-base",
      messageFormatting: [],
      aiPrompt: "",
      specialDate: undefined,
      countdownStyle: "Padrão",
      countdownColor: "#FFFFFF",
      galleryImages: [],
      galleryStyle: "Cube",
      timelineEvents: [],
      musicOption: "none",
      youtubeUrl: "",
      audioRecording: "",
      songName: "",
      artistName: "",
      backgroundAnimation: "none",
      heartColor: "#8B5CF6",
      backgroundVideo: null,
      enablePuzzle: false,
      puzzleImage: undefined,
      payment: {
          payerFirstName: "",
          payerLastName: "",
          payerEmail: "",
          payerCpf: ""
      }
    },
  });
  

  const restoreFromLocalStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const savedDataJSON = localStorage.getItem('form-data-autosave');
    if (!savedDataJSON) return;

    try {
        const savedData = JSON.parse(savedDataJSON);
        const restoredData: Partial<PageData> = JSON.parse(JSON.stringify(savedData));

        if (restoredData.specialDate) {
            restoredData.specialDate = new Date(restoredData.specialDate);
        }
        
        if (restoredData.galleryImages && Array.isArray(restoredData.galleryImages)) {
             restoredData.galleryImages = restoredData.galleryImages.map((img: FileWithPreview) => img);
        }

        if (restoredData.puzzleImage?.preview) {
             restoredData.puzzleImage = { preview: restoredData.puzzleImage.preview };
        }
        
        if (restoredData.backgroundVideo && typeof restoredData.backgroundVideo === 'string' && (restoredData.backgroundVideo as string).startsWith('data:')) {
             restoredData.backgroundVideo = await base64ToFile(restoredData.backgroundVideo, `background-video.mp4`);
        }
        
        if (restoredData.timelineEvents) {
            restoredData.timelineEvents = restoredData.timelineEvents.map((event: any) => ({
                ...event,
                date: event.date ? new Date(event.date) : undefined,
            }));
        }


        methods.reset(restoredData);
    } catch (e) {
        console.error("Could not parse or restore saved form data:", e);
        localStorage.removeItem('form-data-autosave');
    }
  }, [methods]);
  
  useEffect(() => {
    setIsClient(true);
    
    if (searchParams.get('new') === 'true') {
        localStorage.removeItem('form-data-autosave');
        methods.reset();
    } else {
        restoreFromLocalStorage();
    }

    if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
        initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
    } else {
        console.warn("Mercado Pago Public Key not found. Payment functionality might be affected.");
    }

    const handleResize = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth < 640) setPuzzleDimension(screenWidth * 0.8);
        else setPuzzleDimension(360);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const subscription = methods.watch(async (value) => {
        try {
            const dataToSave = JSON.parse(JSON.stringify(value));
            
            if (dataToSave.backgroundVideo instanceof File) {
                dataToSave.backgroundVideo = await fileToBase64(dataToSave.backgroundVideo);
            }
             if (dataToSave.puzzleImage && dataToSave.puzzleImage.preview) {
                // This logic is tricky, assuming puzzleImage is a File object initially in form state, but stored as base64
                // Let's assume it's already a base64 string from the file input handler
            }


            localStorage.setItem('form-data-autosave', JSON.stringify(dataToSave));
        } catch (e) {
            console.warn("Could not save form data to localStorage.", e);
        }
    });
    
    return () => {
        subscription.unsubscribe();
        window.removeEventListener('resize', handleResize);
    }
  }, [searchParams, methods, restoreFromLocalStorage]);


  const { watch, trigger, formState } = methods;
  const formData = watch();

  useEffect(() => {
    if (cloudsVideoRef.current) {
      cloudsVideoRef.current.playbackRate = 0.6;
    }
  }, [formData.backgroundAnimation]);

  const backgroundVideoPreview = useMemo(() => {
      if (formData.backgroundVideo instanceof File) {
          return URL.createObjectURL(formData.backgroundVideo);
      }
      return null;
  }, [formData.backgroundVideo]);

  useEffect(() => {
    if (customVideoRef.current && backgroundVideoPreview) {
      const videoElement = customVideoRef.current;
      videoElement.src = backgroundVideoPreview;
      videoElement.load();
      videoElement.play().catch(e => console.error("Video play failed:", e));
    }
     return () => {
        if (backgroundVideoPreview) {
            URL.revokeObjectURL(backgroundVideoPreview);
        }
    }
  }, [backgroundVideoPreview]);


  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      if (pixData) { // If user goes back from waiting screen, cancel payment flow
          setPixData(null);
          setPageId(null);
      }
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  const progressValue = ((currentStep + 1) / (steps.length || 1)) * 100;

  let StepComponent;
  const currentStepId = steps[currentStep].id;
  
  if (paymentComplete && pageId) {
      StepComponent = <SuccessStep pageId={pageId} />;
  } else if (pixData && pageId) {
      StepComponent = <WaitingForPaymentStep pixData={pixData} pageId={pageId} setPaymentComplete={setPaymentComplete} />;
  } else if (currentStepId === 'payment') {
      StepComponent = <PaymentStep setPixData={setPixData} setPageId={setPageId} setPaymentComplete={setPaymentComplete} pageId={pageId} />;
  } else {
      StepComponent = React.cloneElement(stepComponents[currentStep], { 
          key: currentStepId,
          isVisible: currentStep === steps.findIndex(s => s.id === 'background') 
      });
  }

  const isPuzzleActive = isClient && formData.enablePuzzle && formData.puzzleImage?.preview;
  
  const handlePuzzleReveal = () => {
    setPuzzleRevealed(true);
  };
  
  const timelineEventsForPreview = useMemo(() => {
    if (!isClient || !formData.timelineEvents) return [];
    return formData.timelineEvents
        .filter(event => event.image?.preview)
        .map(event => ({
            id: event.id || Math.random().toString(),
            imageUrl: event.image!.preview, // Pass the Base64 data URI directly
            alt: event.description,
            title: event.description,
            date: event.date ? new Date(event.date) : undefined,
        }));
    }, [isClient, formData.timelineEvents]);

  const hasValidTimelineEvents = timelineEventsForPreview.length > 0;

  if (showTimeline) {
    if (hasValidTimelineEvents) {
        return <Timeline events={timelineEventsForPreview} onClose={() => setShowTimeline(false)} />;
    } else {
        toast({
            variant: "destructive",
            title: "Nenhum momento adicionado",
            description: "Adicione pelo menos um momento com imagem para ver a linha do tempo."
        });
        setShowTimeline(false); // prevent empty timeline from showing
    }
  }


  return (
    <FormProvider {...methods}>
      <div className="flex flex-col md:grid md:grid-cols-2 w-full min-h-screen">
        {/* Right Panel: Preview */}
        <div className="w-full md:sticky md:top-0 md:h-screen p-4 order-1 flex items-center justify-center">
            {/* Mobile: Landscape container */}
            <div className="md:hidden w-full aspect-[16/10] rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef} onShowTimeline={() => hasValidTimelineEvents && setShowTimeline(true)} hasValidTimelineEvents={hasValidTimelineEvents}/>
            </div>
            {/* Desktop: Standard container */}
            <div className="hidden md:block w-full h-full rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef} onShowTimeline={() => hasValidTimelineEvents && setShowTimeline(true)} hasValidTimelineEvents={hasValidTimelineEvents}/>
            </div>
        </div>

        {/* Left Panel: Form - Order 2 on mobile */}
        <div className="w-full flex flex-col items-center p-4 md:p-8 bg-card rounded-t-3xl -mt-8 md:mt-0 z-10 md:bg-transparent md:rounded-none order-2">
          <div className="w-full max-w-md">
             {(paymentComplete || pixData) ? (
                <div className="text-center py-8">
                </div>
             ) : (
                <>
                 <div className="mb-8">
                  <Progress value={progressValue} />
                  <p className="mt-2 text-right text-sm text-muted-foreground">{currentStep + 1}/{steps.length}</p>
                </div>
                
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{steps[currentStep].title}</h2>
                    <p className="mt-2 text-muted-foreground text-sm md:text-base">{steps[currentStep].description}</p>
                </div>
                </>
             )}

            <div className="flex items-center gap-4 my-8">
                <Button onClick={handleBack} disabled={currentStep === 0 && !pixData} type="button" variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
                </Button>
                
                {currentStep < steps.length - 1 && !pixData && (
                <Button onClick={handleNext} type="button" className="w-full" disabled={formState.isSubmitting}>
                    Próxima Etapa
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                )}
                
            </div>
            
            <div id="main-form" className="mt-8 space-y-8">
              <div className="min-h-[350px] md:min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep + (pixData ? '_waiting' : '') + (paymentComplete ? '_complete' : '')}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                   {StepComponent}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

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

const PreviewContent = ({ formData, isClient, puzzleRevealed, isPuzzleActive, handlePuzzleReveal, puzzleDimension, cloudsVideoRef, customVideoRef, onShowTimeline, hasValidTimelineEvents }: any) => {
    
    const puzzlePreviewUrl = useMemo(() => {
        return formData.puzzleImage?.preview || null;
    }, [formData.puzzleImage]);

    const backgroundVideoPreview = useMemo(() => {
      if (formData.backgroundVideo instanceof File) {
          return URL.createObjectURL(formData.backgroundVideo);
      }
      return null;
    }, [formData.backgroundVideo]);

    useEffect(() => {
        // Cleanup function for object URLs
        return () => {
            if (backgroundVideoPreview) {
                URL.revokeObjectURL(backgroundVideoPreview);
            }
        };
    }, [backgroundVideoPreview]);

    return (
        <>
            {/* Background Animations */}
            <div className="absolute inset-0 w-full h-full z-0">
                {isClient && formData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={formData.heartColor} />}
                {isClient && formData.backgroundAnimation === 'starry-sky' && <StarrySky />}
                {isClient && formData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
                {isClient && formData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                {isClient && formData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
                {isClient && formData.backgroundAnimation === 'clouds' && (
                    <video ref={cloudsVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                        <source src="https://i.imgur.com/mKlEZYZ.mp4" type="video/mp4" />
                    </video>
                )}
                {isClient && formData.backgroundAnimation === 'custom-video' && backgroundVideoPreview && (
                <video key={backgroundVideoPreview} ref={customVideoRef} autoPlay loop muted playsInline src={backgroundVideoPreview} className="absolute inset-0 w-full h-full object-cover">
                </video>
                )}
            </div>

            {/* Puzzle Overlay */}
             <AnimatePresence>
                {isPuzzleActive && !puzzleRevealed && puzzlePreviewUrl && (
                    <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.5 }}
                         className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-8 bg-black/80 backdrop-blur-sm"
                    >
                        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 md:gap-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold font-headline mb-2">Um enigma para você...</h2>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    Resolva o quebra-cabeça para revelar a <span className="text-primary font-semibold">surpresa</span>.
                                </p>
                            </div>
                            <RealPuzzle 
                                imageSrc={puzzlePreviewUrl} 
                                showControls={false}
                                onReveal={handlePuzzleReveal}
                                dimension={puzzleDimension}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            

            {/* Main Content */}
            <div className={cn("relative z-10 w-full h-full flex flex-col", isPuzzleActive && !puzzleRevealed && "blur-sm pointer-events-none")}>
                {/* Browser Chrome */}
                <div className="bg-zinc-800 rounded-t-lg p-2 flex items-center gap-1.5 border-b border-zinc-700 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-grow bg-zinc-700 rounded-sm px-2 py-1 text-xs text-zinc-400 text-center truncate">
                        https://b2gether.com/p/pagina
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-grow rounded-b-lg overflow-hidden relative">
                     <div className="w-full h-full flex flex-col relative overflow-y-auto z-20">
                        <div className="w-full max-w-4xl mx-auto p-6 md:p-8 space-y-8 md:space-y-12">
                            <div className="relative z-10 space-y-6 text-center">
                            <h1
                                className="text-3xl md:text-4xl font-handwriting break-words pt-8 md:pt-12"
                                style={{ color: formData.titleColor }}
                            >
                                {formData.title || 'Seu Título Aqui'}
                            </h1>
                            <p className={cn(
                                "text-white/80 whitespace-pre-wrap break-words text-sm md:text-base",
                                formData.messageFontSize,
                                formData.messageFormatting?.includes("bold") && "font-bold",
                                formData.messageFormatting?.includes("italic") && "italic",
                                formData.messageFormatting?.includes("strikethrough") && "line-through"
                            )}>
                                {formData.message || 'Sua mensagem de amor...'}
                            </p>
                            </div>
                            

                            {formData.specialDate && (
                                <Countdown 
                                    targetDate={new Date(formData.specialDate).toISOString()} 
                                    style={formData.countdownStyle as "Padrão" | "Clássico" | "Simples"}
                                    color={formData.countdownColor}
                                />
                            )}
                            
                            {hasValidTimelineEvents && (
                                <div className="text-center">
                                    <Button onClick={onShowTimeline}>Nossa Linha do Tempo</Button>
                                </div>
                            )}

                            {formData.galleryImages.length > 0 && (
                            <div className="w-full max-w-xs mx-auto">
                                
                                <Swiper
                                    key={formData.galleryStyle}
                                    effect={formData.galleryStyle.toLowerCase() as 'coverflow' | 'cards' | 'flip' | 'cube'}
                                    grabCursor={true}
                                    centeredSlides={formData.galleryStyle === 'Coverflow'}
                                    slidesPerView={'auto'}
                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                    coverflowEffect={{
                                        rotate: 50,
                                        stretch: 0,
                                        depth: 100,
                                        modifier: 1,
                                        slideShadows: true,
                                    }}
                                    cardsEffect={{
                                        perSlideRotate: 2,
                                        perSlideOffset: 8,
                                        slideShadows: true,
                                    }}
                                    cubeEffect={{
                                        shadow: true,
                                        slideShadows: true,
                                        shadowOffset: 20,
                                        shadowScale: 0.94,
                                    }}
                                    pagination={{ clickable: true }}
                                    modules={[EffectCoverflow, EffectCards, EffectFlip, EffectCube, Pagination, Autoplay]}
                                    className="mySwiper-small"
                                >
                                    {formData.galleryImages.map((image: any, index: number) => (
                                        <SwiperSlide key={index} className="bg-transparent">
                                            <div className="relative w-full aspect-square">
                                                <Image src={image.preview} alt={`Pré-visualização da imagem ${index + 1}`} fill className="object-cover" unoptimized />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                            )}
                            
                            {isClient && formData.musicOption === 'youtube' && formData.youtubeUrl && (
                            <YoutubePlayer url={formData.youtubeUrl} />
                            )}

                            {isClient && formData.musicOption === 'record' && formData.audioRecording && (
                            <CustomAudioPlayer src={formData.audioRecording} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function CreatePageWizard() {
  return (
    <React.Suspense>
      <WizardInternal />
    </React.Suspense>
  )
}

    