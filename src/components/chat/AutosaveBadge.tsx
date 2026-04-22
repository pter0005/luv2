'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

type State = 'idle' | 'saving' | 'saved';

interface AutosaveBadgeProps {
  /** Increment a counter from the parent each time a save happens. */
  pulseKey: number;
  className?: string;
}

export default function AutosaveBadge({ pulseKey, className }: AutosaveBadgeProps) {
  const [state, setState] = useState<State>('idle');
  const locale = useLocale();
  const isEN = locale === 'en';

  useEffect(() => {
    if (pulseKey === 0) return;
    setState('saving');
    const t1 = setTimeout(() => setState('saved'), 300);
    const t2 = setTimeout(() => setState('idle'), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pulseKey]);

  return (
    <AnimatePresence>
      {state !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-200/80">
            {state === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isEN ? 'saving' : 'salvando'}</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>{isEN ? 'saved' : 'salvo'}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
