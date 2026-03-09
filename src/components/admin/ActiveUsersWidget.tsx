'use client';

import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useFirebase } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';

export function ActiveUsersWidget() {
  const { firebaseApp: app } = useFirebase();
  const [count, setCount] = useState<number | null>(null);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'same'>('same');

  useEffect(() => {
    if (!app) return;
    const db = getDatabase(app);
    const presenceRef = ref(db, 'presence');

    const unsub = onValue(presenceRef, (snap) => {
      const newCount = snap.exists() ? Object.keys(snap.val()).length : 0;
      setCount(prev => {
        if (prev !== null) {
          setTrend(newCount > prev ? 'up' : newCount < prev ? 'down' : 'same');
          setPrevCount(prev);
        }
        return newCount;
      });
    });

    return () => unsub();
  }, [app]);

  const isLoading = count === null;

  return (
    <div
      className="relative flex flex-col gap-3 p-5 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(34,197,94,0.25)',
        boxShadow: '0 0 40px rgba(34,197,94,0.08)',
      }}
    >
      {/* Pulse indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Ao Vivo</span>
        </div>
        <Wifi size={14} className="text-emerald-500/60" />
      </div>

      {/* Count */}
      <div className="flex items-end gap-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="h-12 w-16 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <motion.span
              key={count}
              initial={{ opacity: 0, y: trend === 'up' ? 12 : -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-5xl font-black text-white tabular-nums leading-none"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>

        <div className="flex flex-col pb-1">
          <span className="text-sm font-semibold text-white/70">pessoas</span>
          <span className="text-xs text-white/40">no site agora</span>
        </div>

        {/* Trend arrow */}
        {trend !== 'same' && prevCount !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-black ml-auto pb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {trend === 'up' ? '↑' : '↓'}
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-white/30" />
        <span className="text-[11px] text-white/30">atualiza em tempo real</span>
      </div>
    </div>
  );
}
