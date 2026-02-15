
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { setCookie, hasCookie } from 'cookies-next';
import { useTranslation } from '@/lib/i18n';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!hasCookie('cookie_consent')) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookie_consent', 'true', { maxAge: 60 * 60 * 24 * 365, path: '/' });
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-4 inset-x-0 z-[200] px-4"
        >
          <div className="max-w-lg mx-auto bg-background/80 backdrop-blur-md text-foreground rounded-xl border border-border/20 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Cookie className="h-5 w-5 shrink-0" />
              <h3 className="font-semibold text-base">{t('cookie.title')}</h3>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t('cookie.description')}{' '}
              <Link href="/privacidade" className="underline hover:text-primary">
                {t('cookie.privacyLink')}
              </Link>
            </p>
            
            <div className="mt-6 flex items-center justify-between gap-4">
              <Button variant="link" className="p-0 text-muted-foreground hover:no-underline">
                {t('cookie.manage')}
              </Button>
              <Button onClick={handleAccept}>{t('cookie.accept')}</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
