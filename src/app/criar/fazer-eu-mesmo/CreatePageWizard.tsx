"use client";

import { useState, useEffect, useCallback, ChangeEvent, useRef, useTransition } from "react";
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart } from "lucide-react";
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
  specialDate: z.date().optional(),
  countdownStyle: z.string().default("Padrão"),
  galleryImages: z.array(z.object({ file: z.any(), preview: z.string() })).default([]),
  galleryStyle: z.string().default("Cube"),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: z.string().optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("Roxo"),
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
    fields: ["message", "messageFontSize", "messageFormatting"],
  },
  {
    id: "specialDate",
    title: "Data Especial",
    description: "Informe a data que simboliza o início de uma união ou um momento marcante.",
    fields: ["specialDate", "countdownStyle"],
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
    fields: ["backgroundAnimation", "heartColor"],
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
        </div>
    );
};

const SpecialDateStep = () => {
    const specialDate = useWatch({ name: "specialDate" });

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
            )}
        </div>
    );
};

const GalleryStep = () => {
  const { control, setValue, getValues } = useFormContext<PageData>();
  const images = useWatch({ control, name: "galleryImages" });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImages = getValues("galleryImages") || [];
      
      const newImages = filesArray.slice(0, 8 - currentImages.length).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

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
                  alt={`Preview ${index}`}
                  fill
                  className="rounded-md object-cover"
                  onLoad={() => URL.revokeObjectURL(image.preview)}
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
    const { control, setValue, getValues } => useFormContext<PageData>();
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
    { id: "mystic-vortex", name: "Vórtice Púrpura" }
];

const BackgroundStep = () => {
    const { control } = useFormContext<PageData>();
    const backgroundAnimation = useWatch({ control, name: "backgroundAnimation" });

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
                                            <div className="absolute inset-0 w-full h-full opacity-30 group-hover/item:opacity-40 -z-10">
                                                {option.id === "falling-hearts" && <div className="w-full h-full relative overflow-hidden"><FallingHearts count={10} color="hsl(var(--primary))" /></div>}
                                                {option.id === "starry-sky" && <div className="w-full h-full relative overflow-hidden"><StarrySky /></div>}
                                                {option.id === "floating-dots" && <div className="w-full h-full relative overflow-hidden"><FloatingDots /></div>}
                                                {option.id === "mystic-fog" && <div className="w-full h-full relative overflow-hidden"><div className="mystic-fog-1 !opacity-50 !-z-0"></div><div className="mystic-fog-2 !opacity-50 !-z-0"></div></div>}
                                                {option.id === "mystic-vortex" && <div className="w-full h-full relative overflow-hidden"><MysticVortex /></div>}
                                            </div>
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
                        <FormItem className="space-y-3">
                            <FormLabel>Cor dos Corações</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="Roxo" id="heart-roxo" className="peer sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor="heart-roxo"
                                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                                        >
                                            <Heart className="h-5 w-5 text-primary" fill="hsl(var(--primary))" /> Roxo
                                        </Label>
                                    </FormItem>
                                    <FormItem>
                                        <FormControl>
                                            <RadioGroupItem value="Vermelho" id="heart-vermelho" className="peer sr-only" />
                                        </FormControl>
                                        <Label
                                            htmlFor="heart-vermelho"
                                            className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                                        >
                                            <Heart className="h-5 w-5 text-red-500" fill="currentColor" /> Vermelho
                                        </Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};


const stepComponents = [<TitleStep key="title" />, <MessageStep key="message" />, <SpecialDateStep key="specialDate" />, <GalleryStep key="gallery" />, <MusicStep key="music" />, <BackgroundStep key="background" />];

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "Seu Título Aqui",
      titleColor: "#FFFFFF",
      message: "",
      messageFontSize: "text-base",
      messageFormatting: [],
      specialDate: undefined,
      countdownStyle: "Padrão",
      galleryImages: [],
      galleryStyle: "Cube",
      musicOption: "none",
      youtubeUrl: "",
      audioRecording: "",
      songName: "",
      artistName: "",
      backgroundAnimation: "none",
      heartColor: "Roxo"
    },
  });

  const { watch, trigger, handleSubmit, formState } = methods;
  const formData = watch();

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });

    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final submission
      handleSubmit(processForm)();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const processForm = (data: PageData) => {
    console.log("Form data:", data);
    const serializedData = {
        ...data,
        galleryImages: data.galleryImages.map(img => img.preview), // apenas para log
        specialDate: data.specialDate?.toISOString(),
    }
    alert("Página criada com sucesso! (Verifique o console para os dados)");
    console.log("Serialized Form data:", serializedData);
  };
  
  const progressValue = ((currentStep + 1) / (steps.length || 1)) * 100;

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col-reverse md:grid md:grid-cols-2 w-full min-h-screen">
        {/* Left Panel: Form */}
        <div className="w-full flex flex-col items-center p-4 md:p-8 bg-card md:bg-transparent rounded-t-3xl md:rounded-none order-2 md:order-1">
          <div className="w-full max-w-md">
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
              <Button onClick={handleNext} type="button" className="w-full" disabled={formState.isSubmitting}>
                {currentStep === steps.length - 1 ? "Finalizar" : "Próxima Etapa"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <form id="main-form" onSubmit={handleSubmit(processForm)} className="mt-8 space-y-8">
              <div className="min-h-[350px] md:min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {stepComponents[currentStep]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="w-full h-[60vh] md:h-screen p-4 md:p-8 bg-background md:sticky md:top-0 order-1 md:order-2 flex items-center justify-center">
            <div className="w-full h-full max-w-full md:max-w-md aspect-auto md:aspect-[9/16] mx-auto">
                <div className="relative w-full h-full group/preview">
                    <div className="relative z-10 w-full h-full bg-zinc-950 rounded-2xl flex flex-col shadow-2xl">
                        {/* Browser Chrome */}
                        <div className="bg-zinc-800 rounded-t-lg p-2 flex items-center gap-1.5 border-b border-zinc-700">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="flex-grow bg-zinc-700 rounded-sm px-2 py-1 text-xs text-zinc-400 text-center truncate">
                                https://amorepages.com/p/pagina
                            </div>
                        </div>

                        {/* Page Content */}
                        <div className="flex-grow bg-black rounded-b-lg overflow-hidden relative">
                             {/* Background Animations */}
                             <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none">
                                {isClient && formData.backgroundAnimation === 'falling-hearts' && <FallingHearts color={formData.heartColor === "Vermelho" ? "#EF4444" : "hsl(var(--primary))"} />}
                                {isClient && formData.backgroundAnimation === 'starry-sky' && <StarrySky />}
                                {isClient && formData.backgroundAnimation === 'mystic-fog' && <><div className="mystic-fog-1"></div><div className="mystic-fog-2"></div></>}
                                {isClient && formData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                                {isClient && formData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
                            </div>

                            <div className="w-full h-full flex flex-col relative overflow-y-auto">
                                <div className="flex-grow p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
                                    <div className="relative z-10 w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
                                    <h1
                                        className="text-3xl md:text-4xl font-handwriting break-words"
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
                                            targetDate={formData.specialDate.toISOString()} 
                                            style={formData.countdownStyle as "Padrão" | "Clássico" | "Simples"}
                                        />
                                    )}
                                    {formData.galleryImages && formData.galleryImages.length > 0 && (
                                       <div className="w-full max-w-xs mx-auto">
                                        <h2 className="text-xl md:text-2xl font-bold mb-4">Nossos Momentos</h2>
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
                                                <SwiperSlide key={index} style={{ backgroundImage: `url(${img.preview})` }}>
                                                   {/* A imagem agora é um background */}
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                         <p className="text-xs text-muted-foreground mt-2">Estilo: {formData.galleryStyle}</p>
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
                </div>
            </div>
        </div>
      </div>
    </FormProvider>
  );
}
