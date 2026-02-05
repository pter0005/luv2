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

export function ErrorState({ messageKey, messageVars }: { messageKey: string, messageVars?: any }) {
    const { t } = useTranslation();
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
