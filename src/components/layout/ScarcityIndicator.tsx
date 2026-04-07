'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'mycupid_scarcity';

function getInitialCount(): number {
    if (typeof window === 'undefined') return 12;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const { count, ts } = JSON.parse(stored);
            // Reset if older than 6 hours
            if (Date.now() - ts < 6 * 3600 * 1000) return count;
        }
    } catch { /* ignore */ }
    return 7 + Math.floor(Math.random() * 9); // 7–15
}

export default function ScarcityIndicator() {
    const [count, setCount] = useState(12);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        setCount(getInitialCount());
    }, []);

    useEffect(() => {
        const tick = () => {
            setCount(prev => {
                const next = Math.max(2, prev - 1);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: next, ts: Date.now() }));
                } catch { /* ignore */ }
                return next;
            });
            timeout = setTimeout(tick, 30000 + Math.random() * 90000); // 30–120s
        };
        let timeout = setTimeout(tick, 20000 + Math.random() * 40000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
            }}
        >
            <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"
            />
            <AnimatePresence mode="wait">
                <motion.span
                    key={count}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="text-red-300"
                >
                    Apenas {count} vagas com desconto restantes hoje
                </motion.span>
            </AnimatePresence>
        </div>
    );
}
