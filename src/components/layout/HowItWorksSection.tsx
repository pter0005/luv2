"use client";

import Image from 'next/image';
import { useMemo, memo } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from '@/lib/i18n';

const HowItWorksSection = () => {
    const { t } = useTranslation();

    const simpleSteps = useMemo(() => [
        { icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl, title: t('home.howitworks.step1.title'), description: t('home.howitworks.step1.description') },
        { icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl, title: t('home.howitworks.step2.title'), description: t('home.howitworks.step2.description') },
        { icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl, title: t('home.howitworks.step3.title'), description: t('home.howitworks.step3.description') },
        { icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl, title: t('home.howitworks.step4.title'), description: t('home.howitworks.step4.description') },
    ], [t]);

    return (
        <div className="container max-w-6xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">{t('home.howitworks.title').replace('4 passos simples', '')}<span className="text-primary">{t('home.howitworks.title').match(/4 passos simples/)}</span></h2>
              <p className="text-base text-muted-foreground mt-4">{t('home.howitworks.description')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {simpleSteps.map((step, i) => (
                    <div key={i} className="relative flex flex-col items-center text-center group">
                        <div className="absolute -top-5 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30 z-10">
                            {i+1}
                        </div>
                        <div className="card-glow p-6 pt-10 rounded-2xl flex flex-col items-center flex-grow w-full transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105 bg-white/5 border-white/10">
                            <div className="relative w-48 h-48 mb-4">
                                <Image src={step.icon || "https://placehold.co/160"} alt={step.title} fill className="object-contain" sizes="192px"/>
                            </div>
                            <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                            <p className="text-muted-foreground text-sm mt-2 flex-grow">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(HowItWorksSection);
