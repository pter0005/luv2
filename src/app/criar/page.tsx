'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Paintbrush, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function CreateOptionsPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-16 md:py-24 text-center min-h-[80vh] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-semibold text-foreground">
          {t('create.title')}{' '}
          <span className="text-4xl md:text-6xl font-bold mt-1 leading-none gradient-text">
            {t('create.title.highlight')}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
          {t('create.description')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full"
        >
          <Link href="/criar/fazer-eu-mesmo?plan=avancado&new=true" className="h-full">
            <Card className="card-glow text-left h-full flex flex-col hover:border-primary transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Paintbrush className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{t('create.diy.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('create.diy.description')}
                </CardDescription>
              </CardHeader>
              <div className="flex-grow" />
              <div className="p-6 pt-0">
                <Button className="w-full">
                  {t('create.diy.cta')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="h-full"
        >
          <Card className="card-glow text-left h-full flex flex-col border-dashed border-primary/30 bg-card/50 opacity-70">
            <CardHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{t('create.templates.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('create.templates.description')}
              </CardDescription>
            </CardHeader>
            <div className="flex-grow" />
            <div className="p-6 pt-0">
              <Button className="w-full" disabled>
                {t('create.templates.cta')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
