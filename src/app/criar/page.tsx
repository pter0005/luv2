
"use client";

import Link from "next/link";
import { Brush, ArrowLeft, RotateCcw, Loader2, TestTube2, Star, DatabaseZap, Hourglass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { PlanFeature } from "@/components/layout/PlanFeature";

export default function CreatePage() {
  const [draftExists, setDraftExists] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  // Effect to check for saved draft in localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("amore-pages-autosave")) {
      setDraftExists(true);
    }
  }, []);

  // Effect to handle redirection after auth check
  useEffect(() => {
    // Only redirect when loading is finished and there's no user
    if (!isUserLoading && !user) {
      router.push("/login?redirect=/criar");
    }
  }, [user, isUserLoading, router]);

  const handleStartNew = (plan: 'basico' | 'avancado') => {
    router.push(`/criar/fazer-eu-mesmo?plan=${plan}&new=true`);
  };

  // While checking user auth, show a loading state
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando sua sessão...</p>
      </div>
    );
  }
  
  // If loading is done and there is a user, render the page content
  if (user) {
      return (
        <div className="relative min-h-screen">
          <div className="relative z-10 container py-20 flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-2xl text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
                Comece sua <span className="gradient-text">obra de arte</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Escolha um plano para testar ou continue um rascunho salvo.
              </p>
            </div>

            {draftExists && (
                <Link href="/criar/fazer-eu-mesmo" passHref>
                  <Card className="card-glow border-primary/50 bg-primary/10 hover:bg-primary/20 transition-all duration-300 w-full max-w-xl mb-8">
                    <CardHeader className="flex flex-row items-center justify-center text-center p-6 gap-4">
                      <RotateCcw className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">Continuar de onde parei</CardTitle>
                        <CardDescription>
                          Você tem um rascunho salvo. Clique para continuar.
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                 {/* Plano Avançado */}
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col">
                    <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" /> RECOMENDADO
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Plano Avançado</h3>
                    <p className="text-muted-foreground text-sm mb-8">Todos os recursos liberados.</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text="Galeria de fotos (até 6)" />
                        <PlanFeature text="Música de fundo" />
                        <PlanFeature text="Quebra-cabeça Interativo" />
                        <PlanFeature text="Linha do Tempo 3D (até 20 momentos)" />
                        <PlanFeature text="Página permanente com backup" icon={DatabaseZap} />
                    </ul>
                    <Button onClick={() => handleStartNew('avancado')} size="lg" className="w-full mt-auto">
                        <TestTube2 className="mr-2" />
                        Testar Plano Avançado
                    </Button>
                </div>
                
                {/* Plano Básico */}
                <div className="bg-card/80 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">Plano Básico</h3>
                    <p className="text-muted-foreground text-sm mb-8">Uma opção mais simples para começar.</p>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text="Galeria de fotos (até 2)" />
                        <PlanFeature text="Linha do Tempo 3D (até 5 momentos)" />
                        <PlanFeature text="Página disponível por 24h" icon={Hourglass} />
                        <PlanFeature text="Música de fundo" included={false} />
                        <PlanFeature text="Quebra-cabeça Interativo" included={false}/>
                        <PlanFeature text="Backup na nuvem" included={false} />
                    </ul>
                     <Button onClick={() => handleStartNew('basico')} size="lg" className="w-full mt-auto" variant="secondary">
                         <TestTube2 className="mr-2" />
                        Testar Plano Básico
                    </Button>
                </div>
            </div>

            <Button asChild variant="outline" className="mt-12 bg-background/50 backdrop-blur-sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o início
              </Link>
            </Button>
          </div>
        </div>
      );
  }

  // Fallback loading state while redirecting
  return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecionando para o login...</p>
      </div>
  );
}
