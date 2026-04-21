'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

type BgValue =
  | 'none'
  | 'falling-hearts'
  | 'starry-sky'
  | 'nebula'
  | 'mystic-flowers'
  | 'floating-dots';

interface BgOption {
  value: BgValue;
  label: string;
}

const OPTIONS: BgOption[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'falling-hearts', label: 'Corações' },
  { value: 'starry-sky', label: 'Céu estrelado' },
  { value: 'nebula', label: 'Nebulosa' },
  { value: 'mystic-flowers', label: 'Flores místicas' },
  { value: 'floating-dots', label: 'Pontos flutuantes' },
];

// ──────────────── Previews animados CSS ────────────────

function PreviewNone() {
  return <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />;
}

function PreviewHearts({ color = '#ec4899' }: { color?: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-rose-900/70 to-pink-900/70 overflow-hidden">
      {[
        { left: '12%', delay: '0s', size: 12 },
        { left: '32%', delay: '1.1s', size: 8 },
        { left: '55%', delay: '0.4s', size: 14 },
        { left: '72%', delay: '1.6s', size: 10 },
        { left: '88%', delay: '0.8s', size: 9 },
      ].map((h, i) => (
        <span
          key={i}
          className="absolute animate-bg-fall"
          style={{
            left: h.left,
            top: '-10%',
            color,
            fontSize: `${h.size}px`,
            animationDelay: h.delay,
            animationDuration: `${3 + (i % 3)}s`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

function PreviewStarry() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-black overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const delay = `${(i * 0.23) % 2.5}s`;
        const size = 1 + (i % 3);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: delay,
              animationDuration: `${1.4 + (i % 4) * 0.4}s`,
              opacity: 0.4 + ((i * 7) % 60) / 100,
            }}
          />
        );
      })}
    </div>
  );
}

function PreviewNebula() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-slate-950" />
      <div
        className="absolute -top-6 -left-4 w-24 h-24 rounded-full blur-2xl opacity-70 animate-bg-drift"
        style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.9), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-60 animate-bg-drift"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.85), transparent 70%)',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="absolute top-1/3 left-1/3 w-16 h-16 rounded-full blur-xl opacity-50 animate-bg-drift"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.9), transparent 70%)',
          animationDelay: '0.8s',
        }}
      />
    </div>
  );
}

function PreviewMysticFlowers() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/60 via-fuchsia-500/50 to-purple-600/60 overflow-hidden">
      {['🌸', '💮', '🌺', '🌷', '🌼'].map((f, i) => (
        <span
          key={i}
          className="absolute animate-bg-float"
          style={{
            left: `${10 + i * 20}%`,
            top: `${20 + (i % 2) * 40}%`,
            fontSize: '14px',
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3.5 + (i % 3)}s`,
            textShadow: '0 0 6px rgba(255,255,255,0.45)',
          }}
        >
          {f}
        </span>
      ))}
    </div>
  );
}

function PreviewFloatingDots() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => {
        const left = (i * 31) % 100;
        const top = (i * 47) % 100;
        const delay = `${(i * 0.2) % 2}s`;
        return (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-200 animate-bg-float"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: delay,
              animationDuration: `${2.5 + (i % 3)}s`,
              boxShadow: '0 0 8px rgba(34,211,238,0.8)',
              opacity: 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

function Preview({ value, color }: { value: BgValue; color?: string }) {
  switch (value) {
    case 'none': return <PreviewNone />;
    case 'falling-hearts': return <PreviewHearts color={color} />;
    case 'starry-sky': return <PreviewStarry />;
    case 'nebula': return <PreviewNebula />;
    case 'mystic-flowers': return <PreviewMysticFlowers />;
    case 'floating-dots': return <PreviewFloatingDots />;
  }
}

export default function BackgroundField() {
  const { control, watch } = useFormContext<PageData>();
  const bg = watch('backgroundAnimation');
  const heartColor = watch('heartColor') || '#ec4899';
  const hearts = bg === 'falling-hearts';

  return (
    <div className="space-y-3">
      {/* Animations locais — keyframes pra previews */}
      <style jsx global>{`
        @keyframes bg-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(140px) rotate(360deg); opacity: 0; }
        }
        @keyframes bg-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8px, -6px) scale(1.08); }
        }
        @keyframes bg-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bg-fall { animation: bg-fall linear infinite; }
        .animate-bg-drift { animation: bg-drift ease-in-out infinite; }
        .animate-bg-float { animation: bg-float ease-in-out infinite; }
      `}</style>

      <Controller
        control={control}
        name="backgroundAnimation"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2.5">
            {OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'relative aspect-[4/3] rounded-xl overflow-hidden transition ring-2 group',
                    selected
                      ? 'ring-purple-400 shadow-[0_10px_28px_-8px_rgba(168,85,247,0.7)]'
                      : 'ring-white/10 hover:ring-purple-400/50'
                  )}
                >
                  <Preview value={opt.value} color={opt.value === 'falling-hearts' ? heartColor : undefined} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2.5 pt-6 pb-2">
                    <span className="text-[12px] font-semibold text-white drop-shadow">{opt.label}</span>
                  </div>
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 bg-purple-500 rounded-full p-1 shadow-md">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      />

      {hearts && (
        <Controller
          control={control}
          name="heartColor"
          render={({ field }) => (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.05] ring-1 ring-white/10">
              <label htmlFor="heart-color" className="text-sm font-medium text-white">Cor dos corações</label>
              <input
                id="heart-color"
                type="color"
                {...field}
                className="h-9 w-14 cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
              />
            </div>
          )}
        />
      )}
    </div>
  );
}
