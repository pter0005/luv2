'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRemainingSpots } from '@/lib/scarcity';

export default function ScarcityIndicator() {
    const [count, setCount] = useState(getRemainingSpots());

    useEffect(() => {
        setCount(getRemainingSpots());

        const tick = () => {
            setCount(prev => {
                if (prev <= 2) return prev;
                return prev - 1;
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
