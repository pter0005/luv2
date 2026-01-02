
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Sparkles, Loader2, Wand2 } from "lucide-react";
import { useTransition, useState } from "react";
import { handleSuggestContent } from "./actions";
import { SuggestContentOutput } from "@/ai/flows/ai-powered-content-suggestion";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "O título deve ter pelo menos 2 caracteres.",
  }),
  message: z.string().min(10, {
    message: "A mensagem deve ter pelo menos 10 caracteres.",
  }),
  image: z.any().optional(),
  aiPrompt: z.string().optional(),
});

export default function CreatePageForm() {
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<SuggestContentOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      aiPrompt: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // This is where you would handle form submission, e.g., save to a database.
    console.log(values);
    alert("Página criada com sucesso! (Verifique o console para os dados)");
  }

  const handleAiAction = (formData: FormData) => {
    startTransition(async () => {
      setAiError(null);
      setSuggestions(null);
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
  
  const renderSuggestions = (title: string, items: string[]) => (
    <div className="space-y-3">
        <h4 className="font-semibold text-primary">{title}</h4>
        <ul className="space-y-3">
            {items.map((s, i) => (
                <li key={i} className="p-3 bg-muted/50 rounded-md border text-sm text-muted-foreground flex justify-between items-center gap-2">
                    <p className="italic">"{s}"</p>
                    <Button variant="ghost" size="sm" onClick={() => appendSuggestion(s)}>
                        Usar
                    </Button>
                </li>
            ))}
        </ul>
    </div>
  );

  return (
    <Card className="bg-card/80 border-border/60">
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Título da Página</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Para o amor da minha vida" {...field} />
                  </FormControl>
                  <FormDescription>
                    O grande título que aparecerá no topo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Sua Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva aqui sua declaração de amor..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card className="bg-background/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  Inspiração com IA
                </CardTitle>
                <FormDescription>
                  Não sabe o que escrever? Descreva o que você sente e nossa IA criará sugestões.
                </FormDescription>
              </CardHeader>
              <CardContent>
                <form action={handleAiAction} className="space-y-4">
                  <Textarea
                    name="userInput"
                    placeholder="Ex: 'um poema curto sobre nosso primeiro encontro na cafeteria'"
                    className="min-h-[100px]"
                  />
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Wand2 className="mr-2" />
                    )}
                    Gerar Sugestões
                  </Button>
                </form>
                {aiError && <p className="text-destructive mt-4">{aiError}</p>}
                {suggestions && (
                    <div className="mt-6 space-y-6">
                        {suggestions.romanticPhrases && renderSuggestions("Frases Românticas", suggestions.romanticPhrases)}
                        {suggestions.shortPoems && renderSuggestions("Poemas Curtos", suggestions.shortPoems)}
                        {suggestions.famousQuotes && renderSuggestions("Citações", suggestions.famousQuotes)}
                    </div>
                )}
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Foto Especial</FormLabel>
                  <FormControl>
                    <Button type="button" variant="outline" className="w-full">
                      <ImageIcon className="mr-2" />
                      Carregar uma foto
                    </Button>
                  </FormControl>
                  <FormDescription>
                    Adicione uma foto de um momento inesquecível de vocês.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full">
              Criar minha página de amor
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
