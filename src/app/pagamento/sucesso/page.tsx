
'use client';
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "@/lib/i18n";

function SuccessContent() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center text-center gap-6">
            <CheckCircle className="w-24 h-24 text-green-500"/>
            <h1 className="text-4xl font-bold font-headline">{t('payment.success.title')}</h1>
            <p className="text-muted-foreground max-w-md">
                {t('payment.success.description')}
            </p>
            <Button asChild size="lg" className="mt-4">
                <Link href="/minhas-paginas">
                    {t('payment.success.cta')} <ArrowRight className="ml-2"/>
                </Link>
            </Button>
        </div>
    );
}


export default function SuccessPage() {
    return (
        <div className="container min-h-screen flex items-center justify-center">
            <Suspense>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
