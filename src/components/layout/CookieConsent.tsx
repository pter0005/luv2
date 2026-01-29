'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { setCookie, hasCookie } from 'cookies-next';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

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
          className="fixed bottom-4 right-4 z-[200] w-full max-w-sm"
        >
          <div className="bg-popover text-popover-foreground rounded-lg border border-border p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 shrink-0 text-foreground mt-1" />
              <div>
                <h3 className="text-lg font-semibold">Aviso de Cookies</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Esses cookies não quebram dieta. Só melhoram seu tempo. Nós os usamos para garantir a melhor experiência em nosso site.{' '}
                  <Link href="/privacidade" className="underline text-primary hover:text-primary/80">
                    Leia nossa política de privacidade.
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <Button variant="link" className="p-0 text-muted-foreground hover:no-underline">
                Gerenciar preferências
              </Button>
              <Button onClick={handleAccept}>Aceitar</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
