
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition, DragEvent } from "react";
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
import { ArrowLeft, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download } from "lucide-react";
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
import { handleSuggestContent, createPaymentPreference } from "./actions";
import { Switch } from "@/components/ui/switch";
import RealPuzzle from "@/components/puzzle/Puzzle";
import Timeline, { CardProvider } from "./Timeline";
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import QRCode from "qrcode.react";

const YoutubePlayer = dynamic(() => import('./YoutubePlayer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center bg-zinc-800/50 rounded-lg"><Loader2 className="animate-spin text-primary" /></div>
});


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
  galleryImages: z.array(z.object({ file: z.any(), preview: z.string() })).default([]),
  galleryStyle: z.string().default("Cube"),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: z.string().optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("#8B5CF6"),
  backgroundVideo: z.any().optional(),
  enablePuzzle: z.boolean().default(false),
  puzzleImage: z.object({ file: z.any(), preview: z.string() }).optional(),
  timelineEvents: z.array(z.object({
    date: z.date(),
    description: z.string().min(1, "A descrição é obrigatória."),
    image: z.object({ file: z.any(), preview: z.string() }).optional(),
  })).default([]),
});

type PageData = z.infer<typeof pageSchema>;

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
    id: "timeline",
    title: "Linha do Tempo",
    description: "Adicione os momentos marcantes do relacionamento. Este recurso adiciona R$ 5,00 ao valor final.",
    fields: ["timelineEvents"],
  },
  {
    id: "payment",
    title: "Finalizar e Pagar",
    description: "Sua página está quase pronta! Realize o pagamento para gerar o link e o QR Code.",
    fields: [],
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

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const GalleryStep = () => {
  const { control, setValue, getValues } = useFormContext<PageData>();
  const images = useWatch({ control, name: "galleryImages" });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImages = getValues("galleryImages") || [];
      const availableSlots = 8 - currentImages.length;

      const newImagesPromises = filesArray.slice(0, availableSlots).map(async (file) => {
          const base64Preview = await fileToBase64(file);
          return {
              file,
              preview: base64Preview
          };
      });
      
      const newImages = await Promise.all(newImagesPromises);

      setValue("galleryImages", [...currentImages, ...newImages], { shouldValidate: true, shouldDirty: true });
    }
  };

  const removeImage = (index: number) => {
    const currentImages = getValues("galleryImages") || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setValue("galleryImages", updatedImages, { shouldValidate: true, shouldDirty: true });
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
              (images?.length ?? 0) >= 8 && "cursor-not-allowed opacity-50"
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
              disabled={(images?.length ?? 0) >= 8}
            />
          </label>
        </FormControl>
        {images && images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={image.preview}
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setValue("audioRecording", url, { shouldDirty: true, shouldValidate: true });
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecordingStatus("recording");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
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
             <div className="space-y-2">
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
        const videoUrl = URL.createObjectURL(file);
        setValue("backgroundVideo", videoUrl, { shouldValidate: true, shouldDirty: true });
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
    const { control, setValue } = useFormContext<PageData>();
    const enablePuzzle = useWatch({ control, name: "enablePuzzle" });
    const puzzleImage = useWatch({ control, name: "puzzleImage" });
    
    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const base64Preview = await fileToBase64(file);
            const newImage = {
                file,
                preview: base64Preview
            };
            setValue("puzzleImage", newImage, { shouldValidate: true, shouldDirty: true });
        }
    };

    const removePuzzleImage = () => {
        setValue("puzzleImage", undefined, { shouldValidate: true, shouldDirty: true });
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
                     {!puzzleImage?.preview ? (
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
                                src={puzzleImage.preview}
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

const TimelineStep = () => {
    const { control, getValues, setValue } = useFormContext<PageData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "timelineEvents"
    });

    const [newEvent, setNewEvent] = useState<{ date: Date, description: string, image?: { file: any, preview: string } }>({
        date: new Date(),
        description: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const base64Preview = await fileToBase64(file);
            setNewEvent(prev => ({
                ...prev,
                image: { file, preview: base64Preview }
            }));
        }
    };

    const handleAddEvent = () => {
        if (newEvent.date && newEvent.description && newEvent.image) {
            append({
                date: newEvent.date,
                description: newEvent.description,
                image: newEvent.image,
            });
            setNewEvent({ date: new Date(), description: "" });
            if(fileInputRef.current) fileInputRef.current.value = "";
        } else {
            // TODO: show some error to the user
            console.error("Missing fields for timeline event");
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card/80">
                <CardHeader>
                    <CardTitle>Novo Momento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Foto do Momento</Label>
                        {newEvent.image?.preview ? (
                             <div className="relative group aspect-video w-full">
                                <Image
                                    src={newEvent.image.preview}
                                    alt="Timeline event preview"
                                    fill
                                    className="rounded-md object-contain"
                                    unoptimized
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                                    onClick={() => setNewEvent(prev => ({...prev, image: undefined}))}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                             <label
                                htmlFor="timeline-photo-upload"
                                className={cn("border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors block")}
                            >
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="font-semibold text-sm">Adicionar foto</p>
                                <input id="timeline-photo-upload" ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                     <div className="space-y-2 flex flex-col items-center">
                        <Label>Data do Momento</Label>
                        <Calendar
                            mode="single"
                            selected={newEvent.date}
                            onSelect={(date) => setNewEvent(prev => ({ ...prev, date: date || new Date() }))}
                            locale={ptBR}
                            captionLayout="dropdown-buttons"
                            fromYear={1960}
                            toYear={new Date().getFullYear()}
                             className="border rounded-md bg-card/80"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-event-description">Descrição</Label>
                        <Input
                            id="new-event-description"
                            placeholder="Ex: Nosso primeiro beijo"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                    <Button type="button" onClick={handleAddEvent} className="w-full">Adicionar Momento</Button>
                </CardContent>
            </Card>

            {fields.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Momentos Adicionados</h3>
                    <ul className="space-y-2">
                        {fields.map((field, index) => (
                            <li key={field.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-4">
                                    {field.image?.preview && (
                                        <Image src={field.image.preview} alt={field.description} width={40} height={40} className="rounded object-cover aspect-square" unoptimized/>
                                    )}
                                    <div>
                                        <p className="font-semibold">{format(field.date, "dd/MM/yyyy")}</p>
                                        <p className="text-sm text-muted-foreground">{field.description}</p>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const PaymentStep = ({ preferenceId }: { preferenceId: string | null }) => {
    const { toast } = useToast();

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
            initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
        } else {
            console.error("Mercado Pago public key is not set.");
            toast({
                variant: 'destructive',
                title: 'Erro de Configuração',
                description: 'A chave pública do Mercado Pago não foi configurada.',
            });
        }
    }, [toast]);
    
    if (!preferenceId) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full gap-4">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
                <p className="text-muted-foreground">Aguarde, estamos preparando seu pagamento...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Wallet 
                initialization={{ preferenceId: preferenceId }}
                customization={{ 
                    texts: { valueProp: 'security_details' },
                    visual: {
                        style: {
                            theme: 'dark',
                            customVariables: {
                                formBackgroundColor: 'transparent',
                                baseColor: 'hsl(var(--primary))',
                            }
                        }
                    }
                }} 
            />
        </div>
    );
};

const SuccessStep = ({ pageId }: { pageId: string }) => {
    const { toast } = useToast();
    const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/p/${pageId}`;
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            toast({ title: 'Link copiado!', description: 'O link para sua página foi copiado para a área de transferência.' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o link.' });
        });
    };

    return (
        <div className="flex flex-col items-center text-center gap-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 }}}>
                <CheckCircle className="h-20 w-20 text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-bold font-headline">Página Criada com Sucesso!</h2>
            <p className="text-muted-foreground max-w-sm">Sua declaração de amor está pronta para ser compartilhada com o mundo (ou com aquela pessoa especial).</p>
            
            <Card className="p-6 bg-card/80 flex flex-col items-center gap-4 w-full max-w-sm">
                <h3 className="font-semibold">Seu QR Code Exclusivo</h3>
                <div className="p-2 bg-white rounded-lg">
                    <QRCode value={pageUrl} size={160} />
                </div>
                <p className="text-xs text-muted-foreground">Aponte a câmera do celular para o código.</p>
            </Card>

             <Card className="p-4 bg-card/80 w-full max-w-sm">
                <h3 className="font-semibold mb-2">Link da sua Página</h3>
                <div className="flex gap-2">
                    <Input readOnly value={pageUrl} className="bg-background/50"/>
                    <Button onClick={copyToClipboard}>Copiar</Button>
                </div>
            </Card>

            <Button asChild size="lg" className="mt-4">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                    Visualizar minha página
                    <ChevronRight className="ml-2" />
                </a>
            </Button>
        </div>
    )
}

const stepComponents: React.ReactElement[] = [
    <TitleStep key="title" />, 
    <MessageStep key="message" />, 
    <SpecialDateStep key="specialDate" />, 
    <GalleryStep key="gallery" />, 
    <MusicStep key="music" />, 
    <BackgroundStep key="background" isVisible={false} />, 
    <PuzzleStep key="puzzle" />, 
    <TimelineStep key="timeline" />,
    <PaymentStep key="payment" preferenceId={null} />,
];

const CustomAudioPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.5;
    }
  }, []);

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);
  const [puzzleDimension, setPuzzleDimension] = useState(360);


  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth < 640) {
            setPuzzleDimension(screenWidth * 0.8);
        } else {
            setPuzzleDimension(360);
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      timelineEvents: [],
    },
  });

  const { watch, trigger, getValues, formState } = methods;
  const formData = watch();

  useEffect(() => {
    if (cloudsVideoRef.current) {
      cloudsVideoRef.current.playbackRate = 0.6;
    }
  }, [formData.backgroundAnimation]);

  useEffect(() => {
    if (customVideoRef.current) {
      customVideoRef.current.playbackRate = 0.5;
    }
  }, [formData.backgroundVideo]);

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
       if (steps[currentStep + 1].id === 'payment') {
            const pageData = getValues();
            // This would be where you save the page data to a DB and get an ID
            // For now, we simulate this by creating a mock ID and passing data to payment
            const mockPageId = `page-${Date.now()}`;
            const result = await createPaymentPreference(pageData, mockPageId);
            
            if (result.preferenceId) {
                setPreferenceId(result.preferenceId);
                // We'll set the createdPageId here to be used after payment success
                setCreatedPageId(mockPageId); 
                setCurrentStep((prev) => prev + 1);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro de Pagamento',
                    description: result.error || 'Não foi possível iniciar o checkout.',
                });
            }
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    }
  };

  // This effect simulates listening for a successful payment webhook/callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');

    if (paymentStatus === 'approved' && createdPageId) {
      setPaymentComplete(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [createdPageId]);


  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  const progressValue = ((currentStep + 1) / (steps.length || 1)) * 100;

  let StepComponent;
    if (paymentComplete && createdPageId) {
      StepComponent = <SuccessStep pageId={createdPageId} />;
    } else if (steps[currentStep].id === 'payment') {
        StepComponent = <PaymentStep preferenceId={preferenceId} />;
    } else {
        StepComponent = React.cloneElement(stepComponents[currentStep], { 
            isVisible: currentStep === steps.findIndex(s => s.id === 'background') 
        });
    }

  const isPuzzleActive = isClient && formData.enablePuzzle && formData.puzzleImage?.preview;
  
  const handlePuzzleReveal = () => {
    setPuzzleRevealed(true);
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col md:grid md:grid-cols-2 w-full min-h-screen">
        {/* Right Panel: Preview */}
        <div className="w-full md:sticky md:top-0 md:h-screen p-4 order-1 flex items-center justify-center">
            {/* Mobile: Landscape container */}
            <div className="md:hidden w-full aspect-[16/10] rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} isTimelineVisible={isTimelineVisible} setIsTimelineVisible={setIsTimelineVisible} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef}/>
            </div>
            {/* Desktop: Standard container */}
            <div className="hidden md:block w-full h-full rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} isTimelineVisible={isTimelineVisible} setIsTimelineVisible={setIsTimelineVisible} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef}/>
            </div>
        </div>

        {/* Left Panel: Form - Order 2 on mobile */}
        <div className="w-full flex flex-col items-center p-4 md:p-8 bg-card rounded-t-3xl -mt-8 md:mt-0 z-10 md:bg-transparent md:rounded-none order-2">
          <div className="w-full max-w-md">
             {(paymentComplete && createdPageId) ? (
                <div className="text-center py-8">
                     <h2 className="text-2xl md:text-3xl font-bold">Tudo Pronto!</h2>
                     <p className="mt-2 text-muted-foreground text-sm md:text-base">Sua página foi criada com sucesso.</p>
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

                <div className="flex items-center gap-4 my-8">
                  <Button onClick={handleBack} disabled={currentStep === 0} type="button" variant="secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  {steps[currentStep].id !== 'payment' && (
                    <Button onClick={handleNext} type="button" className="w-full" disabled={formState.isSubmitting}>
                      {currentStep === steps.length - 2 ? "Ir para o Pagamento" : "Próxima Etapa"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
            
            <div id="main-form" className="mt-8 space-y-8">
              <div className="min-h-[350px] md:min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
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


const PreviewContent = ({ formData, isClient, puzzleRevealed, isPuzzleActive, handlePuzzleReveal, puzzleDimension, isTimelineVisible, setIsTimelineVisible, cloudsVideoRef, customVideoRef }: any) => {
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
                {isClient && formData.backgroundAnimation === 'custom-video' && formData.backgroundVideo && (
                <video key={formData.backgroundVideo} ref={customVideoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src={formData.backgroundVideo} />
                </video>
                )}
            </div>

            {/* Puzzle Overlay */}
             <AnimatePresence>
                {isPuzzleActive && !puzzleRevealed && (
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
                                imageSrc={formData.puzzleImage!.preview} 
                                showControls={false}
                                onReveal={handlePuzzleReveal}
                                dimension={puzzleDimension}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
             {/* Timeline Modal */}
            <AnimatePresence>
            {isTimelineVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <CardProvider events={formData.timelineEvents}>
                        <Timeline />
                    </CardProvider>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsTimelineVisible(false)}
                        className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/75 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </Button>
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
                            
                            {formData.timelineEvents && formData.timelineEvents.length > 0 && (
                                 <div className="flex justify-center">
                                    <Button onClick={() => setIsTimelineVisible(true)} variant="outline" className="bg-background/50 backdrop-blur-sm">
                                        <CalendarDays className="mr-2" />
                                        Nossa linha do tempo
                                    </Button>
                                </div>
                            )}

                            {formData.specialDate && (
                                <Countdown 
                                    targetDate={formData.specialDate.toISOString()} 
                                    style={formData.countdownStyle as "Padrão" | "Clássico" | "Simples"}
                                    color={formData.countdownColor}
                                />
                            )}
                            {formData.galleryImages && formData.galleryImages.length > 0 && (
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
                                    {formData.galleryImages.map((img, index) => (
                                        <SwiperSlide key={index} className="bg-transparent">
                                            <div className="relative w-full aspect-square">
                                                <Image src={img.preview} alt={`Pré-visualização da imagem ${index + 1}`} fill className="object-cover" unoptimized />
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
