'use client';
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';

declare global {
  interface Window {
    ttq?: {
      track: (eventName: string, eventData?: any) => void;
      page: () => void;
    };
  }
}

// Preço por plano — mantém em sincronia com o wizard
const PLAN_PRICES: Record<string, number> = {
  avancado: 24.90,
  basico: 14.90,
};

function CreatingPageContent() {
    const searchParams = useSearchParams();
    const intentId = searchParams.get('intentId');
    const firestore = useFirestore();
    const [isFinalized, setIsFinalized] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);
    const pixelFired = useRef(false); // evita disparar duas vezes por re-render

    const lovepagesQuery = useMemoFirebase(() => {
        if (!firestore || !intentId) return null;
        return query(collection(firestore, 'lovepages'), where('paymentId', '==', intentId));
    }, [firestore, intentId]);

    const { data: finalizedPage, isLoading, error } = useCollection(lovepagesQuery);

    useEffect(() => {
        if (finalizedPage && finalizedPage.length > 0 && !pixelFired.current) {
            const page = finalizedPage[0];
            setIsFinalized(true);
            setPageId(page.id);

            // ─── TIKTOK PIXEL: Purchase ───────────────────────────────────
            // Evento padrão TikTok para conversão de compra.
            // 'value' é obrigatório para ROAS e otimização de lance.
            // 'content_id' é obrigatório para Video Shopping Ads (VSA).
            if (typeof window !== 'undefined' && window.ttq?.track) {
                pixelFired.current = true;

                const plan = page.plan || 'avancado';
                const value = PLAN_PRICES[plan] ?? 24.90;

                window.ttq.track('Purchase', {
                    value,
                    currency: 'BRL',
                    content_id: plan,           // ex: "avancado" ou "basico"
                    content_type: 'product',
                    content_name: `MyCupid - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                    quantity: 1,
                });

                console.log('[TikTok Pixel] Purchase disparado:', { value, currency: 'BRL', content_id: plan });
            }
        }
    }, [finalizedPage]);
    
    if (isFinalized && pageId) {
        return (
            <div className="flex flex-col items-center text-center gap-6 animate-in fade-in duration-500">
                <CheckCircle className="w-24 h-24 text-green-500"/>
                <h1 className="text-4xl font-bold font-headline">Sua página está pronta!</h1>
                <p className="text-muted-foreground max-w-md">
                    O pagamento foi confirmado e sua surpresa foi criada com sucesso.
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link href={`/p/${pageId}`}>
                        Ver minha página
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="mt-2">
                    <Link href="/minhas-paginas">
                        Ir para Minhas Páginas
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center gap-6">
            <Loader2 className="w-24 h-24 text-primary animate-spin"/>
            <h1 className="text-4xl font-bold font-headline">Finalizando sua página...</h1>
            <p className="text-muted-foreground max-w-md">
                Recebemos a aprovação do seu pagamento e estamos preparando tudo. Isso pode levar alguns momentos.
            </p>
            <p className="text-sm text-muted-foreground">Você pode esperar ou voltar para o site.</p>
            <Button asChild size="lg" variant="secondary" className="mt-4">
                <Link href="/minhas-paginas">
                    Ir para Minhas Páginas
                </Link>
            </Button>
        </div>
    );
}

export default function CreatingPage() {
    return (
        <div className="container min-h-screen flex items-center justify-center">
            <Suspense fallback={<Loader2 className="w-24 h-24 text-primary animate-spin"/>}>
                <CreatingPageContent />
            </Suspense>
        </div>
    );
}
