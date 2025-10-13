import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FallingHearts from "@/components/effects/FallingHearts";

export default function ComoFuncionaPage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="mystic-fog-1"></div>
        <div className="mystic-fog-2"></div>
      </div>
      <FallingHearts />
      <div className="container py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Como Funciona</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Esta página explicará o passo a passo de como criar sua página de amor. Conteúdo em breve!
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>
      </div>
    </div>
  );
}
