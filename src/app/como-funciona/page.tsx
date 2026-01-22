import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Images, Puzzle as PuzzleIcon, CheckCircle } from "lucide-react";
import Puzzle from "@/components/puzzle/Puzzle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComoFuncionaPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-12 md:py-20 text-center">
        <Button asChild variant="outline" className="absolute top-8 left-8 bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>
        <div className="flex flex-col items-center pt-16 md:pt-0">
            <PuzzleIcon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
            Uma Revelação <span className="gradient-text">Inesquecível</span>
            </h1>
            <p className="text-md md:text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            O Quebra-Cabeça Interativo é a forma mais criativa e emocionante de revelar sua página personalizada. Em vez de apenas enviar um link, você entrega uma experiência única e divertida.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            <Card className="card-glow text-left p-6">
                <CardHeader className="p-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                           <Images className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Um Enigma Personalizado</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Você escolhe uma foto especial. O sistema a transforma em um quebra-cabeça interativo. A pessoa amada precisará arrastar as peças para trocá-las de lugar e, aos poucos, montar a imagem para desvendar a surpresa.
                    </p>
                </CardHeader>
            </Card>
            <Card className="card-glow text-left p-6">
                 <CardHeader className="p-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                           <Gift className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>A Grande Recompensa</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Ao montar a imagem, a recompensa é revelada: a página de amor que você criou surge na tela, tornando a descoberta uma surpresa emocionante.
                    </p>
                </CardHeader>
            </Card>
        </div>

        <div className="max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2">Veja em Ação</h2>
            <h3 className="text-xl md:text-2xl text-muted-foreground font-script mb-2">Experimente montar!</h3>
            <p className="text-muted-foreground mb-8">Arraste as peças para trocá-las de lugar e revelar a imagem.</p>
            <Puzzle imageSrc="https://i.imgur.com/xLW8SX3.png" />
        </div>

      </div>
    </div>
  );
}
