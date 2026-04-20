'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WizardSegmentKey } from '@/lib/wizard-segment-config';

interface RecipientFieldProps {
  value: WizardSegmentKey;
  onChange: (value: WizardSegmentKey) => void;
}

interface Option {
  key: WizardSegmentKey;
  emoji: string;
  label: string;
  hint: string;
  accent: string; // gradient tailwind pair
  popular?: boolean;
}

const PRIMARY: Option[] = [
  {
    key: 'namorade',
    emoji: '💘',
    label: 'Namorado(a)',
    hint: 'A pessoa que mora no seu coração',
    accent: 'from-pink-500 to-fuchsia-500',
    popular: true,
  },
  {
    key: 'espouse',
    emoji: '💍',
    label: 'Esposo(a)',
    hint: 'Pra quem escolheu a vida toda',
    accent: 'from-rose-500 to-pink-500',
  },
  {
    key: 'amige',
    emoji: '🤍',
    label: 'Amigo(a)',
    hint: 'Amizade que é família',
    accent: 'from-purple-500 to-indigo-500',
  },
];

const SECONDARY: Option[] = [
  { key: 'mae', emoji: '🌸', label: 'Mãe', hint: '', accent: 'from-pink-400 to-rose-400' },
  { key: 'pai', emoji: '💙', label: 'Pai', hint: '', accent: 'from-blue-500 to-cyan-500' },
  { key: 'avo', emoji: '🌻', label: 'Avó/Avô', hint: '', accent: 'from-amber-400 to-orange-400' },
  { key: 'filho', emoji: '💛', label: 'Filho(a)', hint: '', accent: 'from-yellow-400 to-amber-400' },
];

export default function RecipientField({ value, onChange }: RecipientFieldProps) {
  return (
    <div className="space-y-5">
      {/* Cards principais — destaque */}
      <div className="space-y-2.5">
        {PRIMARY.map((opt, idx) => {
          const selected = value === opt.key;
          return (
            <motion.button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                'relative w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all',
                'ring-1 backdrop-blur-md',
                selected
                  ? 'bg-white/[0.08] ring-white/40 shadow-[0_0_0_1px_rgba(236,72,153,0.4),0_20px_60px_-20px_rgba(236,72,153,0.5)]'
                  : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.07] hover:ring-white/20'
              )}
            >
              {opt.popular && (
                <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30">
                  ★ Mais popular
                </span>
              )}

              {/* Emoji em círculo com gradient */}
              <div
                className={cn(
                  'relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-2xl',
                  'bg-gradient-to-br',
                  opt.accent,
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-8px_rgba(0,0,0,0.4)]'
                )}
              >
                <span className="drop-shadow">{opt.emoji}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-white">{opt.label}</div>
                <div className="text-[12.5px] text-white/60 truncate">{opt.hint}</div>
              </div>

              {/* Check / chevron */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0',
                  selected
                    ? 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/40'
                    : 'bg-white/[0.05] ring-1 ring-white/15 text-white/40'
                )}
              >
                {selected ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L4 10.4a1 1 0 1 1 1.4-1.4L8.5 12l6.8-6.8a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Divider sutil */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[10.5px] uppercase tracking-[0.2em] text-white/40 font-medium">
          ou homenageie
        </span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* Cards secundários — pills compactas */}
      <div className="grid grid-cols-2 gap-2">
        {SECONDARY.map((opt, idx) => {
          const selected = value === opt.key;
          return (
            <motion.button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.04, duration: 0.25 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 ring-1 backdrop-blur transition-all',
                selected
                  ? 'bg-white/[0.08] ring-white/40 shadow-[0_8px_28px_-10px_rgba(236,72,153,0.4)]'
                  : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] hover:ring-white/20'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-lg bg-gradient-to-br',
                  opt.accent,
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                )}
              >
                {opt.emoji}
              </div>
              <span className="text-sm font-medium text-white/90 truncate">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
