"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Images, Puzzle as PuzzleIcon, CheckCircle } from "lucide-react";
import Puzzle from "@/components/puzzle/Puzzle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export default function ComoFuncionaPage() {
  const { t, locale } = useTranslation();
  const puzzleImage = locale === 'pt' 
    ? "https://i.imgur.com/q5O2ztQ.png" 
    : "https://res.cloudinary.com/dncoxm1it/image/upload/v1771041578/puzzle_ula9hb.png";

  return (
    <div className="relative min-h-screen">
      <div className="container py-12 md:py-20 text-center">
        <Button asChild variant="outline" className="absolute top-8 left-8 bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('howitworks.back')}
          </Link>
        </Button>
        <div className="flex flex-col items-center pt-16 md:pt-0">
            <PuzzleIcon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
            {t('howitworks.title')} <span className="gradient-text">{t('howitworks.title.highlight')}</span>
            </h1>
            <p className="text-md md:text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            {t('howitworks.description')}
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            <Card className="card-glow text-left p-6">
                <CardHeader className="p-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                           <Images className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>{t('howitworks.puzzle.title')}</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('howitworks.puzzle.description')}
                    </p>
                </CardHeader>
            </Card>
            <Card className="card-glow text-left p-6">
                 <CardHeader className="p-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                           <Gift className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>{t('howitworks.reward.title')}</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('howitworks.reward.description')}
                    </p>
                </CardHeader>
            </Card>
        </div>

        <div className="max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2">{t('howitworks.demo.title')}</h2>
            <h3 className="text-xl md:text-2xl text-muted-foreground font-script mb-2">{t('howitworks.demo.subtitle')}</h3>
            <p className="text-muted-foreground mb-8">{t('howitworks.demo.description')}</p>
            <Puzzle imageSrc={puzzleImage} />
        </div>

      </div>
    </div>
  );
}
