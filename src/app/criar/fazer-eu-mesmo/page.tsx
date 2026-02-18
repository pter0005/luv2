"use client";

import CreatePageWizard from './CreatePageWizard';
import { useTranslation } from '@/lib/i18n';

export default function DoItYourselfPage() {
  const { t } = useTranslation();
  return (
    <div className="flex-grow flex flex-col">
      <div className="container pt-8 md:pt-12 text-center">
          <h1 className="text-4xl font-semibold text-foreground">
            {t('diy.title')} <br />
            <span className="text-4xl md:text-6xl font-bold mt-1 leading-none gradient-text">
              {t('diy.title.highlight')}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            {t('diy.description')}
          </p>
      </div>
      <div className="flex-grow">
        <CreatePageWizard />
      </div>
    </div>
  );
}
