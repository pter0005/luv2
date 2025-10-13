import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermosPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Termos de Uso</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Nossos termos de uso serão detalhados aqui. Conteúdo em breve!
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
