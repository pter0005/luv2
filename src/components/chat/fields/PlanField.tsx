'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Check, Sparkles, Heart, Image as ImageIcon, Clock, Gamepad2, Mic, Wand2, Music, Infinity as InfinityIcon, Timer, Crown, Gem, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';
import { getPricesForMarket, computeVipSavingsForMarket } from '@/lib/price';
import { formatCurrencyForMarket } from '@/lib/format';
import { useMarket } from '@/i18n/use-market';
import type { Locale } from '@/i18n/config';

type Feature = { icon: React.ReactNode; text: string };

const BASICO_FEATURES_PT: Feature[] = [
  { icon: <Heart className="w-3.5 h-3.5" />, text: 'Página dedicada com título e mensagem' },
  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: 'Galeria de fotos (até 10)' },
  { icon: <Clock className="w-3.5 h-3.5" />, text: 'Contador de tempo juntos' },
  { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Linha do tempo dos momentos' },
];
const AVANCADO_EXTRAS_PT: Feature[] = [
  { icon: <Gamepad2 className="w-3.5 h-3.5" />, text: 'Joguinhos: quebra-cabeça, memória, quiz' },
  { icon: <Mic className="w-3.5 h-3.5" />, text: 'Mensagem de voz gravada por você' },
  { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'Intros especiais (coelho/poema)' },
  { icon: <Music className="w-3.5 h-3.5" />, text: 'Música de fundo personalizada' },
];
const VIP_FEATURES_PT: Feature[] = [
  { icon: <Pencil className="w-3.5 h-3.5" />, text: 'Edite a página quando quiser, pra sempre ✨' },
  { icon: <Gem className="w-3.5 h-3.5" />, text: 'TUDO do Avançado incluído' },
  { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'Todas as intros liberadas 💐🐰' },
  { icon: <Mic className="w-3.5 h-3.5" />, text: 'Mensagem de voz já incluída' },
  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: 'QR Code personalizado (qualquer tema)' },
  { icon: <Gamepad2 className="w-3.5 h-3.5" />, text: 'Jogo "adivinhe a palavra" incluso' },
];
const BASICO_FEATURES_EN: Feature[] = [
  { icon: <Heart className="w-3.5 h-3.5" />, text: 'Dedicated page with title and message' },
  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: 'Photo gallery (up to 10)' },
  { icon: <Clock className="w-3.5 h-3.5" />, text: 'Time-together counter' },
  { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Timeline of your moments' },
];
const AVANCADO_EXTRAS_EN: Feature[] = [
  { icon: <Gamepad2 className="w-3.5 h-3.5" />, text: 'Games: puzzle, memory match, quiz' },
  { icon: <Mic className="w-3.5 h-3.5" />, text: 'Voice message recorded by you' },
  { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'Special intros (bunny / poem)' },
  { icon: <Music className="w-3.5 h-3.5" />, text: 'Custom background music' },
];
const VIP_FEATURES_EN: Feature[] = [
  { icon: <Pencil className="w-3.5 h-3.5" />, text: 'Edit your page anytime, forever ✨' },
  { icon: <Gem className="w-3.5 h-3.5" />, text: 'EVERYTHING in Advanced included' },
  { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'All intros unlocked 💐🐰' },
  { icon: <Mic className="w-3.5 h-3.5" />, text: 'Voice message already included' },
  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: 'Custom QR Code (any theme)' },
  { icon: <Gamepad2 className="w-3.5 h-3.5" />, text: '"Guess the word" game included' },
];

export default function PlanField() {
  const { control, setValue } = useFormContext<PageData>();
  const locale = useLocale() as Locale;
  const market = useMarket();
  const isEN = locale === 'en';
  const BASICO_FEATURES = isEN ? BASICO_FEATURES_EN : BASICO_FEATURES_PT;
  const AVANCADO_EXTRAS = isEN ? AVANCADO_EXTRAS_EN : AVANCADO_EXTRAS_PT;
  const VIP_FEATURES = isEN ? VIP_FEATURES_EN : VIP_FEATURES_PT;
  const prices = getPricesForMarket(market);
  const savings = computeVipSavingsForMarket(market);

  // Ao escolher VIP: ativa TODOS os add-ons automaticamente (flat price de verdade).
  // Ao sair de VIP: NÃO reseta os add-ons — o user pode ter escolhido algum antes.
  const handlePickVip = () => {
    setValue('plan', 'vip', { shouldDirty: true });
  };

  const handlePickAvancado = () => {
    setValue('plan', 'avancado', { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="plan"
        render={({ field }) => (
          <div className="space-y-3">
            {/* ─────────────────────────────────────────── */}
            {/* VIP — topo, destaque máximo (ancoragem) */}
            {/* ─────────────────────────────────────────── */}
            {/* Wrapper com pt-3 pra dar espaço ao badge "MELHOR CUSTO" que
                fica em cima. O button tem overflow-hidden (pro shimmer), o que
                cortaria o badge se ele ficasse dentro — por isso o badge mora
                aqui fora como sibling absoluto. */}
            <div className="relative pt-3">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-white uppercase tracking-wider ring-1 ring-white/40 shadow-md flex items-center gap-1 whitespace-nowrap pointer-events-none">
                <Crown className="w-3 h-3 fill-white" />
                {isEN ? 'Best value' : 'Melhor custo'}
                <Crown className="w-3 h-3 fill-white" />
              </span>
            <button
              type="button"
              onClick={handlePickVip}
              className={cn(
                'w-full rounded-2xl p-4 text-left transition relative overflow-hidden',
                field.value === 'vip'
                  ? 'bg-gradient-to-br from-amber-500/25 via-pink-500/20 to-purple-500/25 ring-2 ring-amber-400 shadow-[0_14px_40px_-10px_rgba(251,191,36,0.55)]'
                  : 'bg-gradient-to-br from-amber-500/12 via-pink-500/8 to-purple-500/12 ring-2 ring-amber-400/60 hover:ring-amber-400'
              )}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="flex items-start justify-between mb-1.5 mt-1">
                <div>
                  <div className="font-black text-[17px] text-white leading-tight flex items-center gap-1.5">
                    VIP
                    <Gem className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-[11.5px] text-amber-100/90 mt-0.5 font-medium">
                    {isEN ? 'Everything unlocked · flat price' : 'Tudo liberado · preço fechado'}
                  </div>
                </div>
                <div className="text-right">
                  {/* Preço "de" (riscado) → "por" — ancoragem clássica.
                      Preço "de" = avancado + todos os add-ons premium
                      separados. "por" = VIP. Só mostra o riscado se a
                      economia valer a pena (>= R$10) — senão fica ridículo. */}
                  {savings >= (market === 'BR' ? 10 : 5) && (
                    <div className="text-[11.5px] font-medium text-white/40 line-through leading-none mb-1 tabular-nums">
                      {formatCurrencyForMarket(Number((prices.vip + savings).toFixed(2)), market)}
                    </div>
                  )}
                  <div className="text-[19px] font-black text-white leading-none tabular-nums">
                    {formatCurrencyForMarket(prices.vip, market)}
                  </div>
                  {savings >= (market === 'BR' ? 10 : 5) && (
                    <div className="text-[10.5px] font-bold text-emerald-300 mt-1 whitespace-nowrap">
                      {isEN
                        ? `Save ${formatCurrencyForMarket(savings, market)}`
                        : `Economize ${formatCurrencyForMarket(savings, market)}`}
                    </div>
                  )}
                </div>
              </div>

              {field.value === 'vip' && (
                <div className="absolute top-3 right-3 bg-gradient-to-br from-amber-400 to-pink-500 rounded-full p-1 ring-2 ring-white/30 shadow-md">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Forever badge — destaca o diferencial VIP #1: editar quando quiser */}
              <div className="mt-2 mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 ring-1 ring-amber-300/40">
                <InfinityIcon className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="text-[11.5px] font-bold text-amber-50">
                  {isEN
                    ? <>Online <span className="underline decoration-amber-300/60">forever</span> · <span className="underline decoration-amber-300/60">edit anytime</span></>
                    : <>No ar <span className="underline decoration-amber-300/60">pra sempre</span> · <span className="underline decoration-amber-300/60">edite quando quiser</span></>}
                </span>
              </div>

              <ul className="space-y-1.5">
                {VIP_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-white/90">
                    <span className="text-amber-300/90">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </button>
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* AVANÇADO — meio, pré-selecionado default */}
            {/* ─────────────────────────────────────────── */}
            {/* Wrapper com pt-3 pro badge "MAIS POPULAR" respirar (mesmo
                padrão do VIP — badge fica fora do overflow-hidden do button). */}
            <div className="relative pt-3">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wider ring-1 ring-white/30 shadow-md flex items-center gap-1 whitespace-nowrap pointer-events-none">
                <Sparkles className="w-3 h-3 fill-white" />
                {isEN ? 'Most popular' : 'Mais popular'}
                <Sparkles className="w-3 h-3 fill-white" />
              </span>
            <button
              type="button"
              onClick={handlePickAvancado}
              className={cn(
                'w-full rounded-2xl p-4 text-left transition relative overflow-hidden',
                field.value === 'avancado'
                  ? 'bg-gradient-to-br from-purple-500/25 via-fuchsia-500/15 to-pink-500/20 ring-2 ring-purple-400 shadow-[0_14px_40px_-10px_rgba(168,85,247,0.65)]'
                  : 'bg-gradient-to-br from-purple-500/10 via-fuchsia-500/6 to-pink-500/10 ring-2 ring-purple-400/50 hover:ring-purple-400'
              )}
            >
              {/* Shimmer — mesmo efeito do VIP pra manter consistência visual */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="flex items-start justify-between mb-1.5 mt-1 relative">
                <div>
                  <div className="font-black text-[17px] text-white leading-tight flex items-center gap-1.5">
                    {isEN ? 'Advanced' : 'Avançado'}
                    <Sparkles className="w-4 h-4 text-pink-300" />
                  </div>
                  <div className="text-[11.5px] text-pink-100/90 mt-0.5 font-medium">
                    {isEN ? 'The full experience' : 'A experiência completa'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-black text-white leading-none tabular-nums">
                    {formatCurrencyForMarket(prices.avancado, market)}
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">
                    {isEN ? '+ optional add-ons' : '+ add-ons opcionais'}
                  </div>
                </div>
              </div>

              {field.value === 'avancado' && (
                <div className="absolute top-3 right-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 ring-2 ring-white/30 shadow-md">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}

              <div className="mt-2 mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-pink-500/20 ring-1 ring-pink-400/40">
                <InfinityIcon className="w-3.5 h-3.5 text-pink-200 shrink-0" />
                <span className="text-[11.5px] font-bold text-pink-50">
                  {isEN ? <>Stays online <span className="underline decoration-pink-300/60">forever</span></> : <>Fica no ar <span className="underline decoration-pink-300/60">pra sempre</span></>}
                </span>
              </div>

              <ul className="space-y-1.5">
                {AVANCADO_EXTRAS.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-white/90">
                    <span className="text-pink-300/90">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </button>
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* BÁSICO — rodapé, com aviso de expiração */}
            {/* ─────────────────────────────────────────── */}
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
                  <div className="font-bold text-[15px] text-white leading-tight">{isEN ? 'Basic' : 'Básico'}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{isEN ? 'The essentials to move them' : 'O essencial pra emocionar'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-white/85">
                    {formatCurrencyForMarket(prices.basico, market)}
                  </div>
                </div>
              </div>

              {field.value === 'basico' && (
                <div className="absolute top-3 right-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 ring-2 ring-white/20">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}

              <div className="mt-2 mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-amber-500/10 ring-1 ring-amber-400/30">
                <Timer className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[11.5px] font-bold text-amber-100">
                  {isEN ? <>Expires in <span className="underline decoration-amber-300/60">25 hours</span></> : <>Expira em <span className="underline decoration-amber-300/60">25 horas</span></>}
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
