
'use client';
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useTranslation } from "@/lib/i18n";

function CreatingPageContent() {
    const searchParams = useSearchParams();
    const intentId = searchParams.get('intentId');
    const firestore = useFirestore();
    const [isFinalized, setIsFinalized] = useState(false);
    const [pageId, setPageId] = useState<string | null>(null);
    const { t } = useTranslation();

    const lovepagesQuery = useMemoFirebase(() => {
        if (!firestore || !intentId) return null;
        return query(collection(firestore, 'lovepages'), where('paymentId', '==', intentId));
    }, [firestore, intentId]);

    const { data: finalizedPage, isLoading, error } = useCollection(lovepagesQuery);

    useEffect(() => {
        if (finalizedPage && finalizedPage.length > 0) {
            setIsFinalized(true);
            setPageId(finalizedPage[0].id);
        }
    }, [finalizedPage]);
    
    if (isFinalized && pageId) {
        return (
            <div className="flex flex-col items-center text-center gap-6 animate-in fade-in duration-500">
                <CheckCircle className="w-24 h-24 text-green-500"/>
                <h1 className="text-4xl font-bold font-headline">{t('creating.page.ready.title')}</h1>
                <p className="text-muted-foreground max-w-md">
                    {t('creating.page.ready.description')}
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link href={`/p/${pageId}`}>
                        {t('creating.page.ready.cta.view')}
                    </Link>
                </Button>
                 <Button asChild size="lg" variant="outline" className="mt-2">
                    <Link href="/minhas-paginas">
                        {t('creating.page.ready.cta.myPages')}
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center text-center gap-6">
            <Loader2 className="w-24 h-24 text-primary animate-spin"/>
            <h1 className="text-4xl font-bold font-headline">{t('creating.page.finalizing.title')}</h1>
            <p className="text-muted-foreground max-w-md">
                {t('creating.page.finalizing.description')}
            </p>
            <p className="text-sm text-muted-foreground">{t('creating.page.finalizing.tip')}</p>
             <Button asChild size="lg" variant="secondary" className="mt-4">
                <Link href="/minhas-paginas">
                    {t('creating.page.finalizing.cta.myPages')}
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
