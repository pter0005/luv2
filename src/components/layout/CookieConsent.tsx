
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
    // Check if the cookie consent has already been given.
    // If not, make the banner visible after a short delay.
    if (!hasCookie('cookie_consent')) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie to expire in 1 year.
    setCookie('cookie_consent', 'true', { maxAge: 60 * 60 * 24 * 365, path: '/' });
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: '0%' }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-[200] md:bottom-4 md:px-4"
        >
          <div className="w-full bg-background/80 backdrop-blur-md text-foreground p-5 md:p-6 shadow-lg border-t border-border/20 md:max-w-lg md:mx-auto md:rounded-xl md:border">
            <div className="flex items-start md:items-center gap-4">
              <Cookie className="h-6 w-6 shrink-0 mt-1 md:mt-0" />
              <div>
                <h3 className="font-semibold text-base">{t('cookie.title')}</h3>
                 <p className="mt-2 text-sm text-muted-foreground">
                  {t('cookie.description')}{' '}
                  <Link href="/privacidade" className="underline hover:text-primary">
                    {t('cookie.privacyLink')}
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
               <Button onClick={handleAccept} className="w-full sm:w-auto">{t('cookie.accept')}</Button>
               <Button variant="ghost" className="w-full sm:w-auto text-muted-foreground hover:text-foreground">
                {t('cookie.manage')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
