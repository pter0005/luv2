'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Check, Sparkles, Heart, Image as ImageIcon, Clock, Gamepad2, Mic, Wand2, Music, Infinity as InfinityIcon, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';

type Feature = { icon: React.ReactNode; text: string };

const BASICO_FEATURES: Feature[] = [
  { icon: <Heart className="w-3.5 h-3.5" />, text: 'Página dedicada com título e mensagem' },
  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: 'Galeria de fotos (até 10)' },
  { icon: <Clock className="w-3.5 h-3.5" />, text: 'Contador de tempo juntos' },
  { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Linha do tempo dos momentos' },
];

const AVANCADO_EXTRAS: Feature[] = [
  { icon: <Gamepad2 className="w-3.5 h-3.5" />, text: 'Joguinhos: quebra-cabeça, memória, quiz' },
  { icon: <Mic className="w-3.5 h-3.5" />, text: 'Mensagem de voz gravada por você' },
  { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'Intros especiais (coelho/poema)' },
  { icon: <Music className="w-3.5 h-3.5" />, text: 'Música de fundo personalizada' },
];

export default function PlanField() {
  const { control } = useFormContext<PageData>();

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="plan"
        render={({ field }) => (
          <div className="space-y-3">
            {/* AVANÇADO — primeiro, pré-selecionado */}
            <button
              type="button"
              onClick={() => field.onChange('avancado')}
              className={cn(
                'w-full rounded-2xl p-4 text-left transition relative',
                field.value === 'avancado'
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/15 ring-2 ring-purple-400 shadow-[0_12px_32px_-10px_rgba(168,85,247,0.7)]'
                  : 'bg-gradient-to-br from-purple-500/8 to-pink-500/6 ring-1 ring-purple-400/30 hover:ring-purple-400/60'
              )}
            >
              <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wider ring-1 ring-white/30 shadow-md">
                Mais escolhido ✨
              </span>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="font-bold text-[15px] text-white leading-tight flex items-center gap-1.5">
                    Avançado
                    <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">A experiência completa</div>
                </div>
                {field.value === 'avancado' && (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 ring-2 ring-white/20">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Destaque: pra sempre */}
              <div className="mt-2 mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/15 ring-1 ring-pink-400/40">
                <InfinityIcon className="w-3.5 h-3.5 text-pink-200 shrink-0" />
                <span className="text-[11.5px] font-bold text-pink-100">
                  Fica no ar <span className="underline decoration-pink-300/60">pra sempre</span>
                </span>
              </div>

              <div className="text-[11px] text-white/55 font-medium">
                Tudo do Básico +
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {AVANCADO_EXTRAS.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-white/85">
                    <span className="text-pink-300/90">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </button>

            {/* BÁSICO — segundo, com aviso de expiração */}
            <button
              type="button"
              onClick={() => field.onChange('basico')}
              className={cn(
                'w-full rounded-2xl p-4 text-left transition',
                field.value === 'basico'
                  ? 'bg-purple-500/15 ring-2 ring-purple-400 shadow-[0_8px_24px_-10px_rgba(168,85,247,0.6)]'
                  : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]'
              )}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="font-bold text-[15px] text-white leading-tight">Básico</div>
                  <div className="text-[11px] text-white/55 mt-0.5">O essencial pra emocionar</div>
                </div>
                {field.value === 'basico' && (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 ring-2 ring-white/20">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Aviso: 25h */}
              <div className="mt-2 mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-amber-500/10 ring-1 ring-amber-400/30">
                <Timer className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[11.5px] font-bold text-amber-100">
                  Expira em <span className="underline decoration-amber-300/60">25 horas</span>
                </span>
              </div>

              <ul className="mt-1.5 space-y-1.5">
                {BASICO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-white/80">
                    <span className="text-purple-300/90">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </button>
          </div>
        )}
      />
    </div>
  );
}
