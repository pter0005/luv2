'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';

// Usuários com crédito de cortesia
const SPECIAL_USERS: Record<string, number> = {
    'zalmirparedes@gmail.com': 2,
    'jv5089528@gmail.com': 1,
    'aljkwdawlkjd@gmail.com': 5,
};

const STORAGE_KEY = 'mycupid_credit_popup_dismissed';

export default function CreditPopup() {
    const { user, isUserLoading } = useUser();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isUserLoading || !user?.email) return;
        const credits = SPECIAL_USERS[user.email];
        if (!credits) return;

        // Mostra só uma vez por sessão
        const dismissed = sessionStorage.getItem(STORAGE_KEY);
        if (dismissed) return;

        // Delay de 1.5s pra não assustar logo de cara
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
    }, [user, isUserLoading]);

    const dismiss = () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    const credits = user?.email ? (SPECIAL_USERS[user.email] ?? 0) : 0;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
                        onClick={dismiss}
                    />

                    {/* Card */}
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
                            {/* Linha brilhante no topo */}
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }}
                            />

                            {/* Botão fechar */}
                            <button
                                onClick={dismiss}
                                className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-8 flex flex-col items-center text-center gap-5">
                                {/* Ícone */}
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                        <Gift className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-white" />
                                    </div>
                                </div>

                                {/* Texto */}
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

                                {/* Features */}
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

                                {/* CTA */}
                                <Link
                                    href="/criar?plan=avancado&new=true"
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