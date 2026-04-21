'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

// Preview REAL das animações — mesmos componentes da página final
const FallingHearts = dynamic(() => import('@/components/effects/FallingHearts'), { ssr: false });
const StarrySky = dynamic(() => import('@/components/effects/StarrySky'), { ssr: false });
const MysticFlowers = dynamic(() => import('@/components/effects/MysticFlowers'), { ssr: false });
const FloatingDots = dynamic(() => import('@/components/effects/FloatingDots'), { ssr: false });
const NebulosaPoema = dynamic(() => import('@/components/effects/NebulosaPoema'), { ssr: false });

type BgValue =
  | 'none'
  | 'falling-hearts'
  | 'starry-sky'
  | 'nebula'
  | 'nebulosa'
  | 'mystic-flowers'
  | 'floating-dots';

interface BgOption {
  value: BgValue;
  label: string;
  emoji: string;
  sub: string;
  favorite?: boolean;
}

// Favoritos primeiro — céu estrelado + buquê digital (nebulosa do poema)
const OPTIONS: BgOption[] = [
  { value: 'nebulosa', label: 'Buquê digital', emoji: '🌌', sub: 'cinematográfico', favorite: true },
  { value: 'starry-sky', label: 'Céu estrelado', emoji: '✨', sub: 'romântico', favorite: true },
  { value: 'falling-hearts', label: 'Corações', emoji: '💖', sub: 'clássico' },
  { value: 'nebula', label: 'Nebulosa', emoji: '🪐', sub: 'mágico' },
  { value: 'mystic-flowers', label: 'Flores místicas', emoji: '🌸', sub: 'delicado' },
  { value: 'floating-dots', label: 'Pontos', emoji: '💫', sub: 'etéreo' },
  { value: 'none', label: 'Nenhum', emoji: '🚫', sub: 'limpinho' },
];

function PreviewNone() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <div className="absolute inset-0 flex items-center justify-center text-white/25 text-2xl">
        ✨
      </div>
    </div>
  );
}

function PreviewHearts({ color = '#ec4899' }: { color?: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-pink-950 to-purple-950 overflow-hidden">
      <FallingHearts count={14} color={color} />
    </div>
  );
}

function PreviewStarry() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <StarrySky />
    </div>
  );
}

function PreviewNebula() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05010a]">
      <div
        className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full opacity-30 blur-[40px] animate-[nebula-scale-1_20s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #5c1d8f 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-30 blur-[34px] animate-[nebula-scale-2_15s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #D14D72 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[50px] animate-[nebula-opacity_10s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 60%)' }}
      />
    </div>
  );
}

function PreviewNebulosaPoema() {
  // Canvas do buquê digital — é o mesmo componente real
  return (
    <div className="absolute inset-0 overflow-hidden">
      <NebulosaPoema />
    </div>
  );
}

function PreviewMysticFlowers() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-pink-900 via-fuchsia-900 to-purple-950">
      <MysticFlowers />
    </div>
  );
}

function PreviewFloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      <FloatingDots />
    </div>
  );
}

function Preview({ value, color }: { value: BgValue; color?: string }) {
  switch (value) {
    case 'none': return <PreviewNone />;
    case 'falling-hearts': return <PreviewHearts color={color} />;
    case 'starry-sky': return <PreviewStarry />;
    case 'nebula': return <PreviewNebula />;
    case 'nebulosa': return <PreviewNebulosaPoema />;
    case 'mystic-flowers': return <PreviewMysticFlowers />;
    case 'floating-dots': return <PreviewFloatingDots />;
  }
}

export default function BackgroundField() {
  const { control, watch } = useFormContext<PageData>();
  const bg = watch('backgroundAnimation');
  const heartColor = watch('heartColor') || '#ec4899';
  const hearts = bg === 'falling-hearts';

  const favorites = OPTIONS.filter((o) => o.favorite);
  const rest = OPTIONS.filter((o) => !o.favorite);

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="backgroundAnimation"
        render={({ field }) => (
          <>
            {/* Seção: Favoritos do Cupido 💘 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Favoritos do Cupido
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {favorites.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <OptionCard
                      key={opt.value}
                      opt={opt}
                      selected={selected}
                      onSelect={() => field.onChange(opt.value)}
                      heartColor={heartColor}
                    />
                  );
                })}
              </div>
            </div>

            {/* Demais opções */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  outras opções
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {rest.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <OptionCard
                      key={opt.value}
                      opt={opt}
                      selected={selected}
                      onSelect={() => field.onChange(opt.value)}
                      heartColor={heartColor}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      />

      {hearts && (
        <Controller
          control={control}
          name="heartColor"
          render={({ field }) => (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.05] ring-1 ring-white/10">
              <label htmlFor="heart-color" className="text-sm font-medium text-white flex items-center gap-1.5">
                <span>🎨</span> Cor dos corações
              </label>
              <input
                id="heart-color"
                type="color"
                {...field}
                className="ml-auto h-9 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
              />
            </div>
          )}
        />
      )}

      <p className="text-[11.5px] text-white/45 px-1 leading-relaxed">
        Os previews são reais — é exatamente assim que vai aparecer na página 💫
      </p>
    </div>
  );
}

function OptionCard({
  opt,
  selected,
  onSelect,
  heartColor,
}: {
  opt: BgOption;
  selected: boolean;
  onSelect: () => void;
  heartColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative aspect-[4/5] rounded-2xl overflow-hidden transition ring-2 group',
        selected
          ? 'ring-purple-400 shadow-[0_14px_36px_-10px_rgba(168,85,247,0.7)] scale-[1.015]'
          : 'ring-white/10 hover:ring-purple-400/50 active:scale-[0.98]'
      )}
    >
      <Preview value={opt.value} color={opt.value === 'falling-hearts' ? heartColor : undefined} />

      {/* Badge de favorito */}
      {opt.favorite && !selected && (
        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500/90 to-purple-500/90 backdrop-blur px-2 py-0.5 rounded-full text-[9.5px] font-bold text-white uppercase tracking-wider ring-1 ring-white/20">
          💘 Favorito
        </div>
      )}

      {/* Fade bottom + label */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-2.5 pt-10 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] leading-none shrink-0">{opt.emoji}</span>
          <span className="text-[11.5px] font-semibold text-white drop-shadow truncate">{opt.label}</span>
        </div>
        <div className="text-[9.5px] text-white/55 mt-0.5 pl-[19px] truncate">{opt.sub}</div>
      </div>

      {selected && (
        <div className="absolute top-2 right-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1.5 shadow-lg ring-2 ring-white/20">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
