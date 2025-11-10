"use client";

import Link from "next/link";
import { Files, Brush, ArrowLeft, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const [draftExists, setDraftExists] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("form-data-autosave")) {
      setDraftExists(true);
    }
  }, []);

  const handleStartNew = () => {
    // We navigate with a query param to signal the wizard to clear the draft.
    router.push("/criar/fazer-eu-mesmo?new=true");
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 container py-20 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
            Como você quer <span className="gradient-text">criar</span>?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Escolha se prefere começar com um de nossos temas prontos ou se quer montar sua página do zero.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link href="/#recursos" passHref>
            <Card className="card-glow hover:border-primary/50 hover:bg-card/100 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-8">
              <CardHeader>
                <div className="p-4 bg-primary/10 rounded-full mb-4 self-center">
                  <Files className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Usar um Modelo</CardTitle>
                <CardDescription className="text-base">
                  Navegue por nossos temas e escolha o que mais combina com sua história.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card
            onClick={handleStartNew}
            className="card-glow hover:border-primary/50 hover:bg-card/100 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer"
          >
            <CardHeader>
              <div className="p-4 bg-primary/10 rounded-full mb-4 self-center">
                <Brush className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Fazer eu Mesmo</CardTitle>
              <CardDescription className="text-base">
                Tenha controle total e personalize cada detalhe da sua página do zero.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {draftExists && (
          <div className="w-full max-w-4xl mt-8">
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
          </div>
        )}

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
