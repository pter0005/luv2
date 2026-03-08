
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
import { Image as ImageIcon } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "O título deve ter pelo menos 2 caracteres.",
  }),
  message: z.string().min(10, {
    message: "A mensagem deve ter pelo menos 10 caracteres.",
  }),
  image: z.any().optional(),
});

export default function CreatePageForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // This is where you would handle form submission, e.g., save to a database.
    console.log(values);
    alert("Página criada com sucesso! (Verifique o console para os dados)");
  }

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
                      className="min-h-[250px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
