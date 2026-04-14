'use client';
import { CheckCircle, Loader2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

declare global {
  interface Window {
    ttq?: { track: (eventName: string, eventData?: any) => void; page: () => void; };
    fbq: (...args: any[]) => void;
  }
}

// Fallback price by plan (used ONLY when the server didn't return paidAmount,
// e.g. for very old intents). Normal flow uses the real charged amount.
const PLAN_PRICES: Record<string, number> = {
  avancado: 24.90,
  basico: 19.90,
};

// Poll the server every 3 seconds — doesn't depend on client auth, works
// even if the user opens this page on a different device than the wizard.
const POLL_INTERVAL_MS = 3000;
// Stop polling after 30 minutes. PIX can take several minutes to confirm
// (user opens bank app, types, validates) + webhook + finalization. Real
// users were losing their page when the old 90s/10min timeout fired before
// their payment cleared, so be VERY generous before showing the fallback.
const TIMEOUT_MS = 30 * 60 * 1000;

function CreatingPageContent() {
    const searchParams = useSearchParams();
    const intentId = searchParams.get('intentId');
    const [isFinalized, setIsFinalized] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [paidAmount, setPaidAmount] = useState<number | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const pixelFired = useRef(false);
    const [timedOut, setTimedOut] = useState(false);

    // ─── POLLING ─────────────────────────────────────────────
    // Hit our own API (admin SDK) instead of the firestore client, so a
    // user who paid on mobile and opens this URL on desktop still sees
    // their page. Server-side reads don't require the anon session.
    useEffect(() => {
        if (!intentId || isFinalized || timedOut) return;

        let cancelled = false;
        let pollTimer: NodeJS.Timeout | null = null;
        const startTime = Date.now();

        const poll = async () => {
            if (cancelled) return;
            try {
                const res = await fetch(`/api/payment-intent-status?intentId=${encodeURIComponent(intentId)}`, {
                    cache: 'no-store',
                });
                if (cancelled) return;
                if (res.ok) {
                    const data = await res.json();
                    setFetchError(false);
                    if (data?.lovePageId) {
                        setPageId(data.lovePageId);
                        setPlan(data.plan || null);
                        setPaidAmount(typeof data.paidAmount === 'number' ? data.paidAmount : null);
                        setIsFinalized(true);
                        return;
                    }
                } else if (res.status === 404) {
                    // Intent doesn't exist — bad link, show error eventually.
                    setFetchError(true);
                }
            } catch {
                // Network error — keep retrying silently, only surface if we never recover.
            }

            if (cancelled) return;
            if (Date.now() - startTime >= TIMEOUT_MS) {
                setTimedOut(true);
                return;
            }
            pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
        };

        poll();

        return () => {
            cancelled = true;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [intentId, isFinalized, timedOut]);

    // ─── PIXEL FIRE ──────────────────────────────────────────
    useEffect(() => {
        if (pageId && !pixelFired.current) {
            pixelFired.current = true;
            const dedupeKey = `purchase_fired_${pageId}`;
            try {
                if (sessionStorage.getItem(dedupeKey)) {
                    console.log('[Pixel] Purchase já disparado pra', pageId, '— pulando.');
                    return;
                }
                sessionStorage.setItem(dedupeKey, '1');
            } catch (_) { /* sessionStorage bloqueado */ }

            const effectivePlan = plan || 'avancado';
            // Prefer the real charged amount so the pixel event matches what
            // actually hit the bank (coupons, add-ons). Fall back to plan base.
            const value = (paidAmount && paidAmount > 0)
                ? paidAmount
                : (PLAN_PRICES[effectivePlan] ?? 24.90);

            if (typeof window !== 'undefined' && window.ttq?.track) {
                window.ttq.track('Purchase', {
                    value,
                    currency: 'BRL',
                    contents: [{
                        content_id: effectivePlan,
                        content_type: 'product',
                        content_name: `MyCupid - Plano ${effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)}`,
                        quantity: 1,
                        price: value,
                    }],
                });
            }

            const fireMeta = (retries = 5) => {
                if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                    window.fbq('track', 'Purchase', {
                        value,
                        currency: 'BRL',
                        content_ids: [effectivePlan],
                        content_type: 'product',
                    }, { eventID: pageId });
                } else if (retries > 0) {
                    setTimeout(() => fireMeta(retries - 1), 500);
                }
            };
            fireMeta();
        }
    }, [pageId, plan, paidAmount]);

    if (!intentId) {
        return (
            <Alert variant="destructive" className="max-w-lg text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Link Inválido</AlertTitle>
                <AlertDescription>
                    <p>Não encontramos as informações da sua compra neste link.</p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/minhas-paginas">Ir para Minhas Páginas</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (fetchError && !isFinalized) {
        return (
            <Alert variant="destructive" className="max-w-lg text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Não encontramos sua compra</AlertTitle>
                <AlertDescription>
                    <p>Isso pode acontecer se o link estiver incorreto ou se o pagamento não foi registrado.</p>
                    <p className="mt-4">
                        Se você já pagou, acesse <strong>"Minhas Páginas"</strong>. Se nada aparecer em alguns minutos, entre em contato pelo WhatsApp.
                    </p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/minhas-paginas">Ir para Minhas Páginas</Link>
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
