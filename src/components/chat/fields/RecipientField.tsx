'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { WizardSegmentKey } from '@/lib/wizard-segment-config';
import { useLocale } from 'next-intl';

interface RecipientFieldProps {
  value: WizardSegmentKey;
  onChange: (value: WizardSegmentKey) => void;
}

interface Option {
  key: WizardSegmentKey;
  label: string;
  hint?: string;
}

const PRIMARY_PT: Option[] = [
  { key: 'namorade', label: 'Namorado(a)', hint: 'A pessoa que mora no seu coração' },
  { key: 'espouse', label: 'Esposo(a)', hint: 'Pra quem escolheu a vida toda' },
  { key: 'amige', label: 'Amigo(a)', hint: 'Amizade que é família' },
];

const SECONDARY_PT: Option[] = [
  { key: 'mae', label: 'Mãe' },
  { key: 'pai', label: 'Pai' },
  { key: 'avo', label: 'Avó/Avô' },
  { key: 'filho', label: 'Filho(a)' },
];

const PRIMARY_EN: Option[] = [
  { key: 'namorade', label: 'Partner', hint: 'The one who lives in your heart' },
  { key: 'espouse', label: 'Spouse', hint: 'The one you chose for life' },
  { key: 'amige', label: 'Best friend', hint: 'The friend who\'s family' },
];

const SECONDARY_EN: Option[] = [
  { key: 'mae', label: 'Mom' },
  { key: 'pai', label: 'Dad' },
  { key: 'avo', label: 'Grandparent' },
  { key: 'filho', label: 'Child' },
];

export default function RecipientField({ value, onChange }: RecipientFieldProps) {
  const locale = useLocale();
  const isEN = locale === 'en';
  const PRIMARY = isEN ? PRIMARY_EN : PRIMARY_PT;
  const SECONDARY = isEN ? SECONDARY_EN : SECONDARY_PT;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {PRIMARY.map((opt) => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                'w-full text-left rounded-xl px-4 py-3.5 ring-1 transition',
                selected
                  ? 'bg-white/[0.08] ring-white/40'
                  : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.05] hover:ring-white/20'
              )}
            >
              <div className="text-[15px] font-medium text-white">{opt.label}</div>
              {opt.hint && <div className="text-[12.5px] text-white/55 mt-0.5">{opt.hint}</div>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[10.5px] uppercase tracking-[0.2em] text-white/40">{isEN ? 'or' : 'ou'}</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SECONDARY.map((opt) => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm text-white/85 ring-1 transition',
                selected
                  ? 'bg-white/[0.08] ring-white/40 text-white'
                  : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.05] hover:ring-white/20'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
