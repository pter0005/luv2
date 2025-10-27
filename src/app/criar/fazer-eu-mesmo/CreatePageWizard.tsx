

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
import { ArrowLeft, ChevronRight, Bold, Italic, Strikethrough, Upload, X, Mic, Youtube, Play, Pause, StopCircle, Search, Loader2, LinkIcon, Heart, Bot, Wand2, Puzzle, CalendarClock, Pipette, CalendarDays, QrCode, CheckCircle, Download, Plus, Trash, CalendarIcon, Info, AlertTriangle, Copy } from "lucide-react";
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
import { handleSuggestContent, createPixPayment, checkPaymentStatus } from "./actions";
import { Switch } from "@/components/ui/switch";
import RealPuzzle from "@/components/puzzle/Puzzle";
import { initMercadoPago } from '@mercadopago/sdk-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const YoutubePlayer = dynamic(() => import('./YoutubePlayer'), {
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center bg-zinc-800/50 rounded-lg"><Loader2 className="animate-spin text-primary" /></div>
});

const Timeline = dynamic(() => import('./Timeline'), { ssr: false });

const paymentSchema = z.object({
  payerFirstName: z.string().min(1, "Nome é obrigatório."),
  payerLastName: z.string().min(1, "Sobrenome é obrigatório."),
  payerEmail: z.string().email("E-mail inválido."),
  payerCpf: z.string().min(11, "CPF inválido.").max(14, "CPF inválido."),
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
  galleryImages: z.array(z.any()).default([]),
  galleryStyle: z.string().default("Cube"),
  timelineEvents: z.array(z.object({
    image: z.any().optional(),
    description: z.string().min(1, "A descrição é obrigatória."),
    date: z.date().optional(),
  })).default([]),
  musicOption: z.string().default("none"),
  youtubeUrl: z.string().optional().or(z.literal('')),
  audioRecording: z.string().optional(),
  songName: z.string().optional(),
  artistName: z.string().optional(),
  backgroundAnimation: z.string().default("none"),
  heartColor: z.string().default("#8B5CF6"),
  backgroundVideo: z.any().optional(),
  enablePuzzle: z.boolean().default(false),
  puzzleImage: z.any().optional(),
  payment: paymentSchema,
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
  const { control, setValue, getValues } = useFormContext<PageData>();
  const images = useWatch({ control, name: "galleryImages" });
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!images || images.length === 0) {
        setPreviews([]);
        return;
    }

    const objectUrls = images.map(file => {
        if (file instanceof File) {
            return URL.createObjectURL(file);
        }
        return null;
    }).filter(Boolean) as string[];
    
    setPreviews(objectUrls);

    // Cleanup
    return () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImages = getValues("galleryImages") || [];
      const availableSlots = 8 - currentImages.length;
      const newImages = filesArray.slice(0, availableSlots);
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
        {previews && previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 mt-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={preview}
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
    const { control, getValues, setValue, trigger } = useFormContext<PageData>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "timelineEvents",
    });
    
    const [previews, setPreviews] = useState<Record<string, string>>({});

    useEffect(() => {
        const newPreviews: Record<string, string> = {};
        const urlsToRevoke: string[] = [];
        fields.forEach((field) => {
            if (field.image instanceof File) {
                const url = URL.createObjectURL(field.image);
                newPreviews[field.id] = url;
                urlsToRevoke.push(url);
            }
        });
        setPreviews(newPreviews);

        return () => {
            urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        };
    }, [fields]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, index: number) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const currentEvent = fields[index];
            update(index, { ...currentEvent, image: file });
            trigger(`timelineEvents.${index}.image`);
        }
    };
    
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Adicione momentos importantes. Cada momento terá uma imagem, data e uma breve descrição.</p>
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-card/80 flex flex-col sm:flex-row gap-4 items-start relative">
                         <div className="flex-shrink-0">
                            <FormLabel htmlFor={`timeline-image-${index}`}>
                                <div className={cn("w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary", previews[field.id] && "border-solid")}>
                                    {previews[field.id] ? (
                                        <Image src={previews[field.id]} alt="Preview" width={96} height={96} className="object-cover rounded-md" unoptimized />
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
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                            <Trash className="w-4 h-4" />
                         </Button>
                    </Card>
                ))}
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={() => append({ image: null, description: "", date: new Date() })}>
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
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Video = reader.result as string;
            setValue("backgroundVideo", base64Video, { shouldValidate: true, shouldDirty: true });
            setValue("backgroundAnimation", "custom-video", { shouldValidate: true, shouldDirty: true });
        }
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
    const puzzleImageFile = useWatch({ control, name: "puzzleImage" });
    const [preview, setPreview] = useState<string | undefined>();

    useEffect(() => {
        let url: string | undefined;
        if (puzzleImageFile instanceof File) {
            url = URL.createObjectURL(puzzleImageFile);
            setPreview(url);
        } else {
            setPreview(undefined);
        }
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [puzzleImageFile]);

    const handlePuzzleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setValue("puzzleImage", file, { shouldValidate: true, shouldDirty: true });
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
                     {!preview ? (
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
                                src={preview}
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

type PixData = {
    paymentId: number;
    qrCodeBase64: string;
    qrCode: string;
}

const PaymentStep = ({ setPaymentComplete, setCreatedPageId }: { setPaymentComplete: (v: boolean) => void, setCreatedPageId: (id: string) => void }) => {
    const { getValues, control, handleSubmit } = useFormContext<PageData>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pixData, setPixData] = useState<PixData | null>(null);
    const { toast } = useToast();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const isPaymentConfigured = !!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

    const handleFinalizeAndPay = async (data: z.infer<typeof paymentSchema>) => {
        setIsProcessing(true);
        setError(null);
        setPixData(null);
        
        const mockPageId = `page-${Date.now()}`;
        
        try {
            const allPageData = getValues();
            // This is a critical step. JSON.stringify cannot serialize File objects.
            // This will cause them to become empty objects {} in the stored data,
            // which will break the final page rendering.
            const serializableData = JSON.stringify(allPageData, (key, value) => {
                if (value instanceof File) {
                    // We can't serialize files directly. This was the source of the crash.
                    // The new architecture handles files on the client-side on the final page.
                    // For localStorage, we will just store the File object as is.
                    return value;
                }
                return value;
            });
            localStorage.setItem(`form-data-${mockPageId}`, serializableData);
            
            const plainPayerData = {
                payerFirstName: data.payerFirstName,
                payerLastName: data.payerLastName,
                payerEmail: data.payerEmail,
                payerCpf: data.payerCpf,
            };

            const result = await createPixPayment(plainPayerData, allPageData.title, mockPageId);

            if (result.pixData) {
                setPixData(result.pixData);
                setCreatedPageId(mockPageId); 
                startPolling(result.pixData.paymentId);
            } else {
                setError(result.error || 'Não foi possível gerar o pagamento PIX.');
                localStorage.removeItem(`form-data-${mockPageId}`);
            }
        } catch (e: any) {
             console.error("Failed to process payment:", e);
             setError("Ocorreu um erro ao processar os dados da sua página. Isso geralmente acontece com muitas imagens ou vídeos. Por favor, tente recarregar a página e simplificar um pouco.");
             localStorage.removeItem(`form-data-${mockPageId}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const startPolling = (paymentId: number) => {
      pollingIntervalRef.current = setInterval(async () => {
          try {
              const statusResult = await checkPaymentStatus(paymentId);
              if (statusResult.status === 'approved') {
                  if (pollingIntervalRef.current) {
                      clearInterval(pollingIntervalRef.current);
                  }
                  setPaymentComplete(true);
              }
          } catch (pollError) {
              console.error("Polling error:", pollError);
          }
      }, 5000); 
    };

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Código PIX copiado!' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o código.' });
        });
    };
    
    if (pixData) {
        return (
            <div className="flex flex-col items-center gap-6">
                <h3 className="text-xl font-semibold">Pague com PIX para liberar sua página</h3>
                <p className="text-muted-foreground text-center text-sm">Escaneie o QR Code com o app do seu banco.</p>
                <div className="p-4 bg-white rounded-lg border-4 border-primary">
                    <Image src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="PIX QR Code" width={200} height={200} />
                </div>
                <div className="w-full">
                    <Label htmlFor="pix-code" className="text-xs text-muted-foreground">Ou use o código Copia e Cola:</Label>
                     <div className="flex gap-2 mt-1">
                        <Input id="pix-code" readOnly value={pixData.qrCode} className="bg-background/50 text-xs"/>
                        <Button onClick={() => copyToClipboard(pixData.qrCode)} size="icon">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Aguardando Pagamento...</AlertTitle>
                    <AlertDescription>
                        Após o pagamento ser aprovado, esta tela será atualizada automaticamente.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <form onSubmit={handleSubmit(handleFinalizeAndPay)} className="space-y-6">
            {!isPaymentConfigured ? (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pagamento Desconfigurado</AlertTitle>
                    <AlertDescription>
                        O sistema de pagamento não está configurado. Por favor, contate o suporte.
                    </AlertDescription>
                </Alert>
            ) : error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Pagamento</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
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
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="000.000.000-00" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </Card>
            
            <Button type="submit" disabled={isProcessing || !isPaymentConfigured} size="lg" className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : "Finalizar e Pagar com PIX"}
            </Button>
        </form>
    );
};

const SuccessStep = ({ pageId }: { pageId: string }) => {
    const { toast } = useToast();
    const pageUrl = `${window.location.origin}/p/${pageId}`;
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(pageUrl).then(() => {
            toast({ title: 'Link copiado!', description: 'O link para sua página foi copiado para a área de transferência.' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o link.' });
        });
    };

    return (
        <div className="flex flex-col items-center text-center gap-6">
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.2 } }}
            >
                <div className="relative">
                    <CheckCircle className="h-20 w-20 text-green-400" />
                    <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping -z-10"></div>
                </div>
            </motion.div>
            <h2 className="text-3xl font-bold font-headline">Pagamento Aprovado!</h2>
            <p className="text-muted-foreground max-w-sm">Sua declaração de amor está pronta. Compartilhe com aquela pessoa especial!</p>
            
            <Card className="p-6 bg-card/80 w-full max-w-sm">
                <h3 className="font-semibold mb-4">Compartilhe sua Página</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(pageUrl)}`} alt="URL QR Code" width={120} height={120} />
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

const stepComponents = [
    <TitleStep key="title" />,
    <MessageStep key="message" />,
    <SpecialDateStep key="specialDate" />,
    <GalleryStep key="gallery" />,
    <TimelineStep key="timeline" />,
    <MusicStep key="music" />,
    <BackgroundStep key="background" isVisible={false} />,
    <PuzzleStep key="puzzle" />,
    <PaymentStep setPaymentComplete={() => {}} setCreatedPageId={() => {}} />,
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
  const { toast } = useToast();
  const cloudsVideoRef = useRef<HTMLVideoElement>(null);
  const customVideoRef = useRef<HTMLVideoElement>(null);
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [createdPageId, setCreatedPageId] = useState<string | null>(null);
  const [puzzleDimension, setPuzzleDimension] = useState(360);
  const [showTimeline, setShowTimeline] = useState(false);
  
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

  useEffect(() => {
    setIsClient(true);
     if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
            initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
    } else {
      console.warn("Mercado Pago Public Key not found. Payment step will be disabled.");
    }

    const savedData = localStorage.getItem('form-data');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // You need to handle file reconstruction if you save file placeholders
            methods.reset(parsedData);
        } catch (e) {
            console.error("Failed to parse saved form data", e);
        }
    }

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

    const unsubscribe = methods.watch((value) => {
        // This is a potential performance bottleneck with large data.
        // For now, we accept it for state persistence.
        try {
            // Using a reviver to handle File objects correctly
            const serializableValue = JSON.stringify(value, (key, value) => {
                // Don't serialize File objects, keep them as is for react-hook-form state
                if (typeof value === 'object' && value !== null && value.constructor.name === 'File') {
                    return value;
                }
                return value;
            });
            localStorage.setItem('form-data', serializableValue);
        } catch (e) {
            console.warn("Could not save form data to localStorage.", e);
        }
    });
    return () => {
        unsubscribe.unsubscribe();
        window.removeEventListener('resize', handleResize);
    }
  }, [methods]);


  const { watch, trigger, getValues, formState } = methods;
  const formData = watch();

  useEffect(() => {
    if (cloudsVideoRef.current) {
      cloudsVideoRef.current.playbackRate = 0.6;
    }
  }, [formData.backgroundAnimation]);

  useEffect(() => {
    if (customVideoRef.current) {
      const videoElement = customVideoRef.current;
      if(formData.backgroundVideo) {
          videoElement.src = formData.backgroundVideo;
          videoElement.load();
          videoElement.play().catch(e => console.error("Video play failed:", e));
      }
    }
  }, [formData.backgroundVideo]);

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
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  const progressValue = ((currentStep + 1) / (steps.length || 1)) * 100;

  let StepComponent;
    if (paymentComplete && createdPageId) {
      StepComponent = <SuccessStep pageId={createdPageId} />;
    } else {
        const currentStepId = steps[currentStep].id;
        if (currentStepId === 'payment') {
            StepComponent = <PaymentStep setPaymentComplete={setPaymentComplete} setCreatedPageId={setCreatedPageId} />;
        } else {
            StepComponent = React.cloneElement(stepComponents[currentStep], { 
                key: currentStepId,
                isVisible: currentStep === steps.findIndex(s => s.id === 'background') 
            });
        }
    }

  const isPuzzleActive = isClient && formData.enablePuzzle && formData.puzzleImage;
  
  const handlePuzzleReveal = () => {
    setPuzzleRevealed(true);
  };
  
  if (showTimeline) {
      return <Timeline events={formData.timelineEvents} onClose={() => setShowTimeline(false)} />;
  }


  return (
    <FormProvider {...methods}>
      <div className="flex flex-col md:grid md:grid-cols-2 w-full min-h-screen">
        {/* Right Panel: Preview */}
        <div className="w-full md:sticky md:top-0 md:h-screen p-4 order-1 flex items-center justify-center">
            {/* Mobile: Landscape container */}
            <div className="md:hidden w-full aspect-[16/10] rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef} onShowTimeline={() => setShowTimeline(true)} />
            </div>
            {/* Desktop: Standard container */}
            <div className="hidden md:block w-full h-full rounded-2xl shadow-2xl bg-background group/preview overflow-hidden relative">
                 <PreviewContent formData={formData} isClient={isClient} puzzleRevealed={puzzleRevealed} isPuzzleActive={isPuzzleActive} handlePuzzleReveal={handlePuzzleReveal} puzzleDimension={puzzleDimension} cloudsVideoRef={cloudsVideoRef} customVideoRef={customVideoRef} onShowTimeline={() => setShowTimeline(true)} />
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
                  
                   {currentStep < steps.length - 1 && (
                    <Button onClick={handleNext} type="button" className="w-full" disabled={formState.isSubmitting}>
                        Próxima Etapa
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


const PreviewContent = ({ formData, isClient, puzzleRevealed, isPuzzleActive, handlePuzzleReveal, puzzleDimension, cloudsVideoRef, customVideoRef, onShowTimeline }: any) => {

    const galleryPreviews = useMemo(() => {
        if (!formData.galleryImages) return [];
        return formData.galleryImages.map((file: any) => {
            if (file instanceof File) return URL.createObjectURL(file);
            return null;
        }).filter(Boolean);
    }, [formData.galleryImages]);

    const puzzlePreview = useMemo(() => {
        if (formData.puzzleImage instanceof File) {
            return URL.createObjectURL(formData.puzzleImage);
        }
        return null;
    }, [formData.puzzleImage]);

    useEffect(() => {
        // This effect is crucial for cleanup to avoid memory leaks.
        return () => {
            galleryPreviews.forEach((url: string) => URL.revokeObjectURL(url));
            if (puzzlePreview) {
                URL.revokeObjectURL(puzzlePreview);
            }
        };
    }, [galleryPreviews, puzzlePreview]);

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
                </video>
                )}
            </div>

            {/* Puzzle Overlay */}
             <AnimatePresence>
                {isPuzzleActive && !puzzleRevealed && puzzlePreview && (
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
                                imageSrc={puzzlePreview} 
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
                            
                            {formData.timelineEvents && formData.timelineEvents.length > 0 && (
                                <div className="text-center">
                                    <Button onClick={onShowTimeline}>Nossa Linha do Tempo</Button>
                                </div>
                            )}

                            {galleryPreviews.length > 0 && (
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
                                    {galleryPreviews.map((preview: string, index: number) => (
                                        <SwiperSlide key={index} className="bg-transparent">
                                            <div className="relative w-full aspect-square">
                                                <Image src={preview} alt={`Pré-visualização da imagem ${index + 1}`} fill className="object-cover" unoptimized />
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
