'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function LoadingState() {
    const { t } = useTranslation();
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="mt-4">{t('publicpage.loading')}</p>
        </div>
    );
}

function UnauthenticatedErrorState() {
    const { t } = useTranslation();
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground p-4">
            <div className="text-left p-6 rounded-lg bg-destructive/10 border border-destructive/50 max-w-2xl w-full font-mono shadow-2xl shadow-destructive/10">
                <div className="flex items-center gap-4 mb-4 font-sans">
                    <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
                    <div>
                        <h1 className="text-xl font-bold text-red-300">{t('publicpage.error.unauthenticated.title')}</h1>
                        <p className="text-sm text-red-300/70">{t('publicpage.error.unauthenticated.description')}</p>
                    </div>
                </div>
                <div className="space-y-3 text-sm text-red-200/80 bg-black/30 p-4 rounded-md border border-white/10">
                    <p className="font-sans font-bold text-red-300/90">&gt; {t('publicpage.error.unauthenticated.analysis')}</p>
                    <p>{t('publicpage.error.unauthenticated.cause')}</p>
                    
                    <p className="font-sans font-bold text-red-300/90 pt-2">&gt; {t('publicpage.error.unauthenticated.solution.title')}</p>
                    <p>{t('publicpage.error.unauthenticated.solution.step1')}</p>
                    <p>{t('publicpage.error.unauthenticated.solution.step2')}</p>
                    <p>{t('publicpage.error.unauthenticated.solution.step3')}</p>
                    <div className="pl-4 space-y-1">
                        <p className="font-bold">- FIREBASE_PROJECT_ID</p>
                        <p className="font-bold">- FIREBASE_CLIENT_EMAIL</p>
                        <p className="font-bold">- FIREBASE_PRIVATE_KEY</p>
                    </div>
                    <p className="font-sans font-bold text-yellow-400 pt-2">&gt; {t('publicpage.error.unauthenticated.solution.tip_title')}</p>
                    <p className="text-yellow-300/90">{t('publicpage.error.unauthenticated.solution.tip')}</p>
                </div>
            </div>
        </div>
    );
}

export function ErrorState({ messageKey, messageVars }: { messageKey: string, messageVars?: any }) {
    const { t } = useTranslation();

    if (messageKey === 'publicpage.error.unauthenticated') {
        return <UnauthenticatedErrorState />;
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive max-w-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold">{t('publicpage.error.title')}</h1>
                <p className="text-destructive-foreground/80 mt-2">
                    {t(messageKey as any, messageVars)}
                </p>
                 <p className="text-xs text-muted-foreground mt-4">
                    {t('publicpage.error.description')}
                </p>
            </div>
        </div>
    )
}
