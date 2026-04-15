'use client';

import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getApp } from 'firebase/app';
import { motion } from 'framer-motion';
import { Users, Wifi, Pencil } from 'lucide-react';

type Variant = 'online' | 'creating';

const VARIANTS: Record<Variant, {
  path: string;
  label: string;
  sub: string;
  tint: string;
  border: string;
  dot: string;
  pill: string;
  Icon: typeof Users;
}> = {
  online: {
    path: 'presence',
    label: 'pessoas',
    sub: 'no site agora',
    tint: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)',
    border: '1px solid rgba(34,197,94,0.25)',
    dot: 'bg-emerald-400',
    pill: 'text-emerald-400',
    Icon: Wifi,
  },
  creating: {
    path: 'creating',
    label: 'pessoas',
    sub: 'criando uma página',
    tint: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(236,72,153,0.08) 100%)',
    border: '1px solid rgba(168,85,247,0.28)',
    dot: 'bg-purple-400',
    pill: 'text-purple-300',
    Icon: Pencil,
  },
};

export function ActiveUsersWidget({ variant = 'online' }: { variant?: Variant }) {
  const [count, setCount] = useState<number | null>(null);
  const v = VARIANTS[variant];

  useEffect(() => {
    let db: any;
    try {
      db = getDatabase(getApp());
    } catch (e) {
      console.error('Firebase Realtime DB não inicializado:', e);
      return;
    }

    const presenceRef = ref(db, v.path);
    const unsub = onValue(presenceRef, (snap) => {
      // Top-level keys = unique visitorIds. Child keys (tabIds) are ignored,
      // so 1 person with 5 tabs counts as 1.
      const n = snap.exists() ? Object.keys(snap.val()).length : 0;
      setCount(n);
    });

    return () => unsub();
  }, [v.path]);

  return (
    <div
      className="relative flex flex-col gap-3 p-5 rounded-2xl overflow-hidden"
      style={{ background: v.tint, border: v.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${v.dot} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${v.dot}`} />
          </span>
          <span className={`text-xs font-bold uppercase tracking-widest ${v.pill}`}>Ao Vivo</span>
        </div>
        <v.Icon size={14} className="text-white/40" />
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
          <span className="text-sm font-semibold text-white/70">{v.label}</span>
          <span className="text-xs text-white/40">{v.sub}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-white/30" />
        <span className="text-[11px] text-white/30">atualiza em tempo real</span>
      </div>
    </div>
  );
}
