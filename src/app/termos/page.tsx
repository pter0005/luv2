"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function TermosPage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen">
      <div className="container py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">{t('terms.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t('terms.description')}
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('terms.back')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
