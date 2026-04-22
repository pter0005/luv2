'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { useLocale } from 'next-intl';

const SESSION_KEY = 'mycupid_exit_intent_shown';

export default function ExitIntentPopup() {
    const [visible, setVisible] = useState(false);
    const [countdown, setCountdown] = useState(15 * 60); // 15 min
    const listenerAttached = useRef(false);
    const activationDelay = useRef(false);
    const locale = useLocale();
    const isEN = locale === 'en';

    const show = useCallback(() => {
        if (sessionStorage.getItem(SESSION_KEY)) return;
        sessionStorage.setItem(SESSION_KEY, '1');
        setVisible(true);
        trackEvent('exit_intent_shown');
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
    }, []);

    // Desktop: mouseleave (cursor above viewport)
    useEffect(() => {
        const delay = setTimeout(() => {
            activationDelay.current = true;
        }, 3000); // wait 3s before enabling

        const handler = (e: MouseEvent) => {
            if (!activationDelay.current) return;
            if (e.clientY <= 0) show();
        };

        document.documentElement.addEventListener('mouseleave', handler);
        listenerAttached.current = true;

        return () => {
            clearTimeout(delay);
            document.documentElement.removeEventListener('mouseleave', handler);
        };
    }, [show]);

    // Countdown timer
    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [visible]);

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div
                        key="exit-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99]"
                        onClick={dismiss}
                    />

                    <motion.div
                        key="exit-popup"
                        initial={{ opacity: 0, scale: 0.85, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-sm rounded-3xl overflow-hidden pointer-events-auto p-8 text-center"
                            style={{
                                background: 'linear-gradient(160deg, #1a0533 0%, #0d0120 60%, #0d1117 100%)',
                                border: '1.5px solid rgba(168,85,247,0.45)',
                                boxShadow: '0 0 80px rgba(139,92,246,0.25), 0 32px 80px rgba(0,0,0,0.7)',
                            }}
                        >
                            {/* Glow */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px]"
                                    style={{ background: 'rgba(139,92,246,0.12)' }} />
                            </div>

                            {/* Close button */}
                            <button onClick={dismiss}
                                className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            {/* Heart icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.15, type: 'spring', damping: 12 }}
                                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
                                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
                            >
                                <Heart className="w-8 h-8 text-purple-400 fill-purple-400" />
                            </motion.div>

                            {/* Title */}
                            <h3 className="text-xl font-black text-white mb-2">
                                {isEN ? 'Wait! Your surprise isn\'t ready yet' : 'Espera! Sua surpresa ainda não está pronta'}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                {isEN
                                  ? 'You\'ve already started something special. Don\'t let it go — your loved one deserves this gift.'
                                  : 'Você já começou algo especial. Não deixe isso se perder — a pessoa amada merece esse presente.'}
                            </p>

                            {/* Countdown */}
                            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-2xl"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                <Clock className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-300">
                                    {isEN ? 'Offer expires in' : 'Oferta expira em'} {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                </span>
                            </div>

                            {/* CTA */}
                            <Link href={isEN ? '/chat' : '/criar'} className="block">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={dismiss}
                                    className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 relative overflow-hidden group"
                                    style={{
                                        background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                                        boxShadow: '0 0 30px rgba(147,51,234,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <span className="relative">{isEN ? 'Back and finish' : 'Voltar e finalizar'}</span>
                                    <ArrowRight className="w-4 h-4 relative" />
                                </motion.button>
                            </Link>

                            {/* Dismiss */}
                            <button onClick={dismiss} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                                {isEN ? 'No thanks' : 'Não, obrigado'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
