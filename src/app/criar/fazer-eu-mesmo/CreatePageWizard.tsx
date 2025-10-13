"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
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
import { ArrowLeft, ChevronRight } from "lucide-react";

// Define the schema for the entire wizard
const pageSchema = z.object({
  title: z.string().default("Seu Título Aqui"),
  titleColor: z.string().default("#FFFFFF"),
  // Add other fields for subsequent steps here
});

type PageData = z.infer<typeof pageSchema>;

const steps = [
  {
    id: "title",
    title: "Título da página",
    description: "Escreva o título dedicatório. Ex: João & Maria, Feliz Aniversário, etc.",
    fields: ["title", "titleColor"],
  },
  // Add other steps here
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
              <span>Clique no quadrado para escolher uma cor</span>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const stepComponents = [<TitleStep key="title" />];

export default function CreatePageWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "Seu Título Aqui",
      titleColor: "#FFFFFF",
    },
  });

  const { watch, trigger, handleSubmit } = methods;
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
      setCurrentStep((prev) => prev - 1);
    }
  };

  const processForm = (data: PageData) => {
    console.log("Form data:", data);
    // Handle form submission logic
  };
  
  const progressValue = ((currentStep + 1) / (steps.length || 8)) * 100;

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col-reverse md:grid md:grid-cols-2 w-full min-h-screen">
        {/* Left Panel: Form */}
        <div className="w-full flex flex-col items-center p-4 md:p-8 bg-card md:bg-transparent rounded-t-3xl md:rounded-none order-2 md:order-1">
          <div className="w-full max-w-md">
             <div className="mb-8">
              <Progress value={progressValue} />
              <p className="mt-2 text-right text-sm text-muted-foreground">{currentStep + 1}/{steps.length || 8}</p>
            </div>
            
            <div>
                <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                <p className="mt-2 text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            <div className="flex items-center gap-4 my-8">
              <Button onClick={handleBack} disabled={currentStep === 0} type="button" variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleNext} type="button" className="w-full">
                {currentStep === steps.length - 1 ? "Finalizar" : "Próxima Etapa"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <form id="main-form" onSubmit={handleSubmit(processForm)} className="mt-8 space-y-8">
              <div className="min-h-[350px]">
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
        <div className="w-full h-auto md:h-screen p-4 md:p-8 bg-background md:sticky md:top-0 order-1 md:order-2 flex items-center justify-center">
            <div className="w-full h-full max-w-full md:max-w-xl aspect-auto md:aspect-[9/16] mx-auto">
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
                                https://luv.com/p/pagina
                            </div>
                        </div>

                        {/* Page Content */}
                        <div className="flex-grow bg-black rounded-b-lg overflow-hidden relative">
                            <div className="w-full h-full flex flex-col relative overflow-hidden bg-black">
                                <div className="w-full h-full flex flex-col relative overflow-hidden">
                                <div className="flex-grow p-4 flex flex-col items-center justify-center text-center relative overflow-y-auto">
                                    <div className="relative z-10 w-full max-w-4xl mx-auto">
                                    <h1
                                        className="text-5xl md:text-6xl font-handwriting break-words"
                                        style={{ color: formData.titleColor }}
                                    >
                                        {formData.title || 'Seu Título Aqui'}
                                    </h1>
                                    </div>
                                </div>
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
