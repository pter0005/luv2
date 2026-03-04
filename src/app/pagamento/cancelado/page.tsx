'use client';
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CanceledPage() {
    return (
        <div className="container min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-6">
                <XCircle className="w-24 h-24 text-destructive"/>
                <h1 className="text-4xl font-bold font-headline">Pagamento Cancelado</h1>
                <p className="text-muted-foreground max-w-md">
                    Seu pagamento não foi concluído. Você pode voltar e tentar novamente.
                </p>
                <Button asChild variant="outline" size="lg" className="mt-4">
                    <Link href="/criar">
                       <ArrowLeft className="mr-2"/> Voltar para o Criador de Páginas
                    </Link>
                </Button>
            </div>
        </div>
    );
}
