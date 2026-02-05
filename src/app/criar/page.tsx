"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Loader2, TestTube2, Star, DatabaseZap, Hourglass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { PlanFeature } from "@/components/layout/PlanFeature";
import { useTranslation } from "@/lib/i18n";

export default function CreatePage() {
  const [draftExists, setDraftExists] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("amore-pages-autosave")) {
      setDraftExists(true);
    }
  }, []);

  const handleStartNew = (plan: 'basico' | 'avancado') => {
    router.push(`/criar/fazer-eu-mesmo?plan=${plan}&new=true`);
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">{t('mypages.loading')}</p>
      </div>
    );
  }
  
  return (
      <div className="relative min-h-screen">
        <div className="relative z-10 container py-20 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
              {t('create.title')} <span className="gradient-text">{t('create.title.highlight')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {t('create.description')}
            </p>
          </div>

          {draftExists && (
              <Link href="/criar/fazer-eu-mesmo" passHref>
                <Card className="card-glow border-primary/50 bg-primary/10 hover:bg-primary/20 transition-all duration-300 w-full max-w-xl mb-8">
                  <CardHeader className="flex flex-row items-center justify-center text-center p-6 gap-4">
                    <RotateCcw className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{t('create.continue')}</CardTitle>
                      <CardDescription>
                        {t('create.continue.description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
               {/* Plano Avançado */}
              <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col">
                  <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                      <Star className="w-4 h-4" /> {t('home.plans.recommended')}
                  </div>
                  <h3 className="text-2xl font-bold text-primary">{t('home.plans.avancado.title')}</h3>
                  <p className="text-muted-foreground text-sm mb-8">{t('home.plans.avancado.description')}</p>
                  <ul className="space-y-4 mb-10 flex-grow">
                      <PlanFeature text={t('home.plans.feature.gallery_advanced')} />
                      <PlanFeature text={t('home.plans.feature.music')} />
                      <PlanFeature text={t('home.plans.feature.puzzle')} />
                      <PlanFeature text={t('home.plans.feature.timeline_advanced')} />
                      <PlanFeature text={t('create.feature.permanente')} icon={DatabaseZap} />
                  </ul>
                  <Button onClick={() => handleStartNew('avancado')} size="lg" className="w-full mt-auto">
                      <TestTube2 className="mr-2" />
                      {t('create.avancado.cta')}
                  </Button>
              </div>
              
              {/* Plano Básico */}
              <div className="bg-card/80 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col">
                  <h3 className="text-2xl font-bold">{t('home.plans.basico.title')}</h3>
                  <p className="text-muted-foreground text-sm mb-8">{t('home.plans.basico.description')}</p>
                  <ul className="space-y-4 mb-10 flex-grow">
                      <PlanFeature text={t('home.plans.feature.gallery_basic')} />
                      <PlanFeature text={t('home.plans.feature.timeline_basic')} />
                      <PlanFeature text={t('create.feature.temp')} icon={Hourglass} />
                      <PlanFeature text={t('home.plans.feature.music')} included={false} />
                      <PlanFeature text={t('home.plans.feature.puzzle')} included={false}/>
                      <PlanFeature text={t('create.feature.backup')} included={false} />
                  </ul>
                   <Button onClick={() => handleStartNew('basico')} size="lg" className="w-full mt-auto" variant="secondary">
                       <TestTube2 className="mr-2" />
                      {t('create.basico.cta')}
                  </Button>
              </div>
          </div>

          <Button asChild variant="outline" className="mt-12 bg-background/50 backdrop-blur-sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('create.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
}
