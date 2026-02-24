
"use client";
import Link from 'next/link';
import { Star, TestTube, Hourglass, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanFeature } from '@/components/layout/PlanFeature';
import { useTranslation } from '@/lib/i18n';
import { memo } from 'react';

const PlansSection = () => {
    const { t } = useTranslation();

    return (
        <div className="container max-w-5xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{t('home.plans.title')}</h2>
                <p className="mt-4 text-base text-muted-foreground">{t('home.plans.description')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col bg-white/5 backdrop-blur-md">
                    <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" /> {t('home.plans.recommended')}
                    </div>
                    <h3 className="text-2xl font-bold text-primary">{t('home.plans.avancado.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('home.plans.avancado.description')}</p>
                    <div className="text-center my-6 space-y-1">
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-2xl font-medium text-muted-foreground line-through">De R$59,90</span>
                            <span className="text-4xl font-bold text-foreground">por R$14,90</span>
                        </div>
                        <p className="text-sm text-primary font-bold animate-pulse">(Só hoje!)</p>
                        <p className="text-xs text-muted-foreground">{t('home.plans.payment')}</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_advanced')} />
                        <PlanFeature text={t('home.plans.feature.music')} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} />
                        <PlanFeature text={t('home.plans.feature.timeline_advanced')} />
                        <PlanFeature text={t('create.feature.permanente')} icon={DatabaseZap} />
                    </ul>
                    <Button asChild size="lg" className="w-full mt-auto">
                        <Link href="/login?redirect=/criar?plan=avancado&new=true"><TestTube className="mr-2" />{t('home.plans.avancado.cta')}</Link>
                    </Button>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">{t('home.plans.basico.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{t('home.plans.basico.description')}</p>
                    <div className="text-center my-6">
                        <p className="text-4xl font-bold text-foreground">R$9,90</p>
                        <p className="text-sm text-muted-foreground">{t('home.plans.payment')}</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text={t('home.plans.feature.gallery_basic')} />
                         <PlanFeature text={t('home.plans.feature.timeline_basic')} />
                        <PlanFeature text={t('create.feature.temp')} icon={Hourglass} />
                        <PlanFeature text={t('home.plans.feature.music')} included={false} />
                        <PlanFeature text={t('home.plans.feature.puzzle')} included={false}/>
                    </ul>
                     <Button asChild size="lg" className="w-full mt-auto" variant="secondary">
                        <Link href="/login?redirect=/criar?plan=basico&new=true"><TestTube className="mr-2" />{t('home.plans.basico.cta')}</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default memo(PlansSection);
