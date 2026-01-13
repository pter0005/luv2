
"use client";

import Link from "next/link";
import { Brush, ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";

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

  const handleStartNew = () => {
    router.push("/criar/fazer-eu-mesmo?new=true");
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
            <div className="w-full max-w-md text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
                Comece a sua <span className="gradient-text">obra de arte</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Você tem um rascunho salvo ou quer começar uma nova declaração do zero?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 w-full max-w-xl">
              <Card
                onClick={handleStartNew}
                className="card-glow hover:border-primary/50 hover:bg-card/100 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer"
              >
                <CardHeader>
                  <div className="p-4 bg-primary/10 rounded-full mb-4 self-center">
                    <Brush className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Criar uma nova página</CardTitle>
                  <CardDescription className="text-base">
                    Comece do zero e personalize cada detalhe da sua declaração.
                  </CardDescription>
                </CardHeader>
              </Card>

              {draftExists && (
                <Link href="/criar/fazer-eu-mesmo" passHref>
                  <Card className="card-glow border-primary/50 bg-primary/10 hover:bg-primary/20 transition-all duration-300 w-full">
                    <CardHeader className="flex flex-row items-center justify-center text-center p-6 gap-4">
                      <RotateCcw className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">Continuar de onde parei</CardTitle>
                        <CardDescription>
                          Você tem um rascunho salvo. Clique aqui para continuar sua criação.
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )}
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

    