"use client";

import { useTranslation } from '@/lib/i18n';
import FeaturesCarousel from '@/components/layout/FeaturesCarousel';
import { memo } from 'react';

const FeaturesSection = () => {
    const { t } = useTranslation();
    return (
        <div className="container relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-0">
              <h2 className='text-4xl md:text-5xl font-semibold tracking-tight leading-tight'>{t('home.features.title')}</h2>
              <h3 className="text-5xl md:text-6xl font-bold mt-1 leading-none gradient-text">{t('home.features.subtitle')}</h3>
              <p className="text-lg text-muted-foreground mt-4">{t('home.features.description')}</p>
            </div>
            <FeaturesCarousel />
        </div>
    );
};

export default memo(FeaturesSection);
