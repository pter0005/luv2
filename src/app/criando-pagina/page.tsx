'use client';
import { CheckCircle, Loader2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

declare global {
  interface Window {
    ttq?: { track: (eventName: string, eventData?: any) => void; page: () => void; };
    fbq: (...args: any[]) => void;
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
    const [timedOut, setTimedOut] = useState(false);

    const lovepagesQuery = useMemoFirebase(() => {
        if (!firestore || !intentId) return null;
        return query(collection(firestore, 'lovepages'), where('paymentId', '==', intentId));
    }, [firestore, intentId]);

    const { data: finalizedPage, isLoading, error } = useCollection(lovepagesQuery);

    useEffect(() => {
        if (finalizedPage && finalizedPage.length > 0 && !pixelFired.current) {
            const page = finalizedPage[0];
            pixelFired.current = true; // seta ANTES de qualquer pixel pra evitar disparos duplicados
            setIsFinalized(true);
            setPageId(page.id);

            // ─── TIKTOK PIXEL ───────────────────────────────────────
            if (typeof window !== 'undefined' && window.ttq?.track) {
                const plan = page.plan || 'avancado';
                const value = PLAN_PRICES[plan] ?? 24.90;
                window.ttq.track('Purchase', {
                    value,
                    currency: 'BRL',
                    contents: [{
                        content_id: plan,
                        content_type: 'product',
                        content_name: `MyCupid - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                        quantity: 1,
                        price: value,
                    }],
                });
            }

            // ─── META PIXEL ─────────────────────────────────────────
            const fireMeta = (retries = 5) => {
                if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                    const plan = page.plan || 'avancado';
                    const value = PLAN_PRICES[plan] ?? 24.90;
                    window.fbq('track', 'Purchase', {
                        value,
                        currency: 'BRL',
                        content_ids: [plan],
                        content_type: 'product',
                    });
                } else if (retries > 0) {
                    setTimeout(() => fireMeta(retries - 1), 500);
                }
            };
            fireMeta();
        }
    }, [finalizedPage]);
    
    // Timeout effect
    useEffect(() => {
        if (!isFinalized) {
            const timer = setTimeout(() => {
                if (!isFinalized) { // Double check inside timeout
                    setTimedOut(true);
                }
            }, 90000); // 1.5 minutes
            return () => clearTimeout(timer);
        }
    }, [isFinalized]);

    // Handle Firestore query error (e.g., missing index)
    if (error) {
        return (
            <Alert variant="destructive" className="max-w-lg text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ocorreu um Erro</AlertTitle>
                <AlertDescription>
                    <p>Não foi possível verificar o status da sua página. Isso pode acontecer se o banco de dados precisar de um momento para indexar as informações.</p>
                    <p className="mt-4">
                        Por favor, acesse a seção <strong>"Minhas Páginas"</strong> para ver sua criação. Se ela não aparecer em alguns minutos, entre em contato com nosso suporte.
                    </p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/minhas-paginas">
                            Ir para Minhas Páginas
                        </Link>
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }
    
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

    if (timedOut) {
        return (
            <div className="flex flex-col items-center text-center gap-6 animate-in fade-in duration-500">
                <Info className="w-24 h-24 text-amber-500"/>
                <h1 className="text-4xl font-bold font-headline">Um momento...</h1>
                <p className="text-muted-foreground max-w-md">
                    O processamento está demorando um pouco mais que o esperado.
                </p>
                <p className="text-sm text-muted-foreground">
                    Não se preocupe, seu pagamento foi recebido! Sua página está sendo criada e aparecerá em "Minhas Páginas" assim que estiver pronta.
                </p>
                <Button asChild size="lg" variant="secondary" className="mt-4">
                    <Link href="/minhas-paginas">
                        Verificar em Minhas Páginas
                    </Link>
                </Button>
            </div>
        )
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
