'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, ArrowRight } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

const STORAGE_KEY = 'mycupid_credit_popup_dismissed';

export default function CreditPopup() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const [visible, setVisible] = useState(false);
    const [credits, setCredits] = useState(0);

    useEffect(() => {
        console.log('[CreditPopup] effect rodou', { isUserLoading, email: user?.email, hasFirestore: !!firestore });
        if (isUserLoading) { console.log('[CreditPopup] aguardando auth...'); return; }
        if (!user?.email) { console.log('[CreditPopup] sem email, saindo'); return; }
        if (!firestore) { console.log('[CreditPopup] sem firestore, saindo'); return; }

        const dismissed = sessionStorage.getItem(STORAGE_KEY);
        if (dismissed) { console.log('[CreditPopup] já foi dispensado via sessionStorage'); return; }

        const email = user.email.toLowerCase().trim();
        console.log('[CreditPopup] buscando créditos para', email);
        getDoc(firestoreDoc(firestore, 'user_credits', email))
          .then((snap) => {
            console.log('[CreditPopup] snap.exists:', snap.exists(), snap.exists() ? snap.data() : '—');
            if (snap.exists()) {
              const d = snap.data();
              const available = Math.max(0, (d.totalCredits ?? 0) - (d.usedCredits ?? 0));
              console.log('[CreditPopup] créditos disponíveis:', available);
              if (available > 0) {
                setCredits(available);
                setVisible(true);
              }
            }
          })
          .catch((err) => {
            console.error('[CreditPopup] erro:', err);
          });
    }, [user?.email, isUserLoading, !!firestore]); // eslint-disable-line react-hooks/exhaustive-deps

    const dismiss = () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    if (!credits) return null;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
                        onClick={dismiss}
                    />

                    <motion.div
                        key="popup"
                        initial={{ opacity: 0, scale: 0.85, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-sm rounded-3xl overflow-hidden pointer-events-auto"
                            style={{
                                background: 'linear-gradient(145deg, #1a0533 0%, #0d0120 100%)',
                                border: '1px solid rgba(168,85,247,0.4)',
                                boxShadow: '0 0 60px rgba(139,92,246,0.25), 0 25px 50px rgba(0,0,0,0.6)',
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }}
                            />

                            <button
                                onClick={dismiss}
                                className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-8 flex flex-col items-center text-center gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                        <Gift className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                                        Presente especial pra você
                                    </p>
                                    <h2 className="text-2xl font-black text-white leading-tight">
                                        {credits === 1
                                            ? 'Você tem 1 crédito grátis!'
                                            : `Você tem ${credits} créditos grátis!`}
                                    </h2>
                                    <p className="text-sm text-white/55 leading-relaxed">
                                        {credits === 1
                                            ? 'Crie 1 página no Plano Avançado completamente de graça — sem precisar pagar nada.'
                                            : `Crie ${credits} páginas no Plano Avançado completamente de graça — sem precisar pagar nada.`}
                                    </p>
                                </div>

                                <div className="w-full space-y-2 text-left py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                                    {[
                                        'Página permanente (nunca expira)',
                                        'Galeria, timeline, músicas e jogos',
                                        'Link e QR Code imediatos',
                                    ].map(item => (
                                        <div key={item} className="flex items-center gap-2 text-xs text-white/70">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="/criar/fazer-eu-mesmo?plan=avancado&new=true"
                                    onClick={dismiss}
                                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-white text-base transition-all active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                                        boxShadow: '0 0 24px rgba(147,51,234,0.5)',
                                    }}
                                >
                                    <Gift className="w-5 h-5" />
                                    Usar meu crédito agora
                                    <ArrowRight className="w-4 h-4" />
                                </Link>

                                <button
                                    onClick={dismiss}
                                    className="text-xs text-white/25 hover:text-white/50 transition-colors"
                                >
                                    Fechar e usar depois
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
