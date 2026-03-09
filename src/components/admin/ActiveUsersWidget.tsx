'use client';

import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getApp } from 'firebase/app';
import { motion } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';

export function ActiveUsersWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let db: any;
    try {
      db = getDatabase(getApp());
    } catch (e) {
      console.error('Firebase Realtime DB não inicializado:', e);
      return;
    }

    const presenceRef = ref(db, 'presence');
    const unsub = onValue(presenceRef, (snap) => {
      const n = snap.exists() ? Object.keys(snap.val()).length : 0;
      setCount(n);
    });

    return () => unsub();
  }, []);

  return (
    <div
      className="relative flex flex-col gap-3 p-5 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(34,197,94,0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Ao Vivo</span>
        </div>
        <Wifi size={14} className="text-emerald-500/60" />
      </div>

      <div className="flex items-end gap-3">
        {count === null ? (
          <div className="h-12 w-16 bg-white/5 rounded-lg animate-pulse" />
        ) : (
          <motion.span
            key={count}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-black text-white tabular-nums leading-none"
          >
            {count}
          </motion.span>
        )}
        <div className="flex flex-col pb-1">
          <span className="text-sm font-semibold text-white/70">pessoas</span>
          <span className="text-xs text-white/40">no site agora</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-white/30" />
        <span className="text-[11px] text-white/30">atualiza em tempo real</span>
      </div>
    </div>
  );
}
