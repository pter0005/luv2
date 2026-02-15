
'use client';
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function CanceledPage() {
    const { t } = useTranslation();
    return (
        <div className="container min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-6">
                <XCircle className="w-24 h-24 text-destructive"/>
                <h1 className="text-4xl font-bold font-headline">{t('payment.canceled.title')}</h1>
                <p className="text-muted-foreground max-w-md">
                    {t('payment.canceled.description')}
                </p>
                <Button asChild variant="outline" size="lg" className="mt-4">
                    <Link href="/criar">
                       <ArrowLeft className="mr-2"/> {t('payment.canceled.cta')}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
