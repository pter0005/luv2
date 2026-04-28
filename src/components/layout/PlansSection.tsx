"use client";
import Link from 'next/link';
import { Star, Hourglass, DatabaseZap, Gamepad2, Puzzle, ShieldCheck, Zap, Users, ArrowRight, Sparkles, Crown, Gem, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanFeature } from '@/components/layout/PlanFeature';
import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GuaranteeBadge from '@/components/layout/GuaranteeBadge';
import ScarcityIndicator from '@/components/layout/ScarcityIndicator';
import { useLocale } from 'next-intl';
import { getBuyersToday } from '@/lib/scarcity';

function useOfferExpired() {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('mycupid_offer_deadline');
    if (!stored) { setExpired(false); return; }
    setExpired(Date.now() > parseInt(stored));
  }, []);
  return expired;
}

/* ─── Contador de compradores (social proof em tempo real falso mas verossímil) ─ */
function BuyerCount() {
  const [count, setCount] = useState(getBuyersToday());

  useEffect(() => {
    setCount(getBuyersToday());
    // Simula variação orgânica a cada 8–18s
    const tick = () => {
      setCount(c => c + (Math.random() > 0.4 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1));
      setTimeout(tick, 8000 + Math.random() * 10000);
    };
    const t = setTimeout(tick, 12000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key={count}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span>{(() => { try { return typeof window !== 'undefined' && window.location.hostname.endsWith('mycupid.net') ? `${count} people bought today` : `${count} pessoas compraram hoje`; } catch { return `${count} pessoas compraram hoje`; } })()}</span>
    </motion.div>
  );
}

/* ─── Badge de urgência pulsando ────────────────────────────────────────────── */
function UrgencyBadge() {
  const locale = useLocale();
  const isEN = locale === 'en';
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5',
      }}>
      <motion.span
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"
      />
      {isEN ? 'Limited-time offer' : 'Oferta por tempo limitado'}
    </div>
  );
}

/* ─── Card VIP — destaque máximo, ancoragem psicológica ────────────────────── */
function VipCard() {
  const locale = useLocale();
  const isEN = locale === 'en';
  const price = '34';
  const cents = isEN ? '.99' : ',99';
  const currency = isEN ? '$' : 'R$';
  // Preço "riscado" — ancoragem de "quanto custaria comprar avançado + todos
  // os add-ons separados" pra destacar o valor do bundle VIP.
  const strikePrice = isEN ? '$49.90' : 'R$49,90';
  const savings = isEN ? '$14.91' : 'R$14,91';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative flex flex-col rounded-3xl overflow-hidden md:col-span-2 max-w-2xl mx-auto w-full"
      style={{
        background: 'linear-gradient(160deg, rgba(251,191,36,0.20) 0%, rgba(236,72,153,0.18) 45%, rgba(168,85,247,0.22) 100%)',
        border: '2px solid rgba(251,191,36,0.55)',
        boxShadow: '0 0 80px rgba(236,72,153,0.35), 0 0 160px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Shimmer animado */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-11/12 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

      {/* Badge VIP Crown */}
      <div className="absolute -top-0 left-0 right-0 flex justify-center">
        <div className="relative -top-0 flex items-center gap-2 px-5 py-2 rounded-b-2xl text-xs font-black uppercase tracking-widest text-white"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #ec4899, #a855f7)',
            boxShadow: '0 4px 24px rgba(236,72,153,0.6)',
          }}>
          <Crown className="w-3.5 h-3.5 fill-white" />
          {isEN ? 'Best Value · All Inclusive' : 'Melhor Custo · Tudo Incluso'}
          <Crown className="w-3.5 h-3.5 fill-white" />
        </div>
      </div>

      <div className="p-8 pt-14 flex flex-col flex-grow">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start mb-6">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {isEN ? 'VIP Bundle' : 'Bundle VIP'}
              <Gem className="w-6 h-6 text-amber-300" />
            </h3>
            <p className="text-amber-100/80 text-sm mt-1 font-medium">
              {isEN ? 'Everything unlocked. One flat price. No upsells.' : 'Tudo liberado. Preço fechado. Sem pegadinhas.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <p className="text-zinc-400 text-sm line-through font-medium">{strikePrice}</p>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-zinc-300 text-lg font-bold">{currency}</span>
              <span className="text-5xl font-black text-white leading-none">{price}</span>
              <span className="text-2xl font-black text-white">{cents}</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-300 mt-1">
              {isEN ? `Save ${savings}` : `Economize ${savings}`}
            </p>
          </div>
        </div>

        {/* Features em grid 2 colunas — compacto mas denso */}
        <ul className="grid sm:grid-cols-2 gap-y-1 gap-x-6 mb-8">
          <PlanFeature text={isEN ? 'Photo gallery (up to 10)' : 'Galeria de fotos (até 10)'} included highlight />
          <PlanFeature text={isEN ? '3D Timeline (up to 20)' : 'Linha do Tempo 3D (até 20)'} included highlight />
          <PlanFeature text={isEN ? 'Voice message recording' : 'Mensagem de voz gravada'} icon={Mic} included highlight />
          <PlanFeature text={isEN ? 'Digital Bouquet intro 💐' : 'Intro Buquê Digital 💐'} icon={Sparkles} included highlight />
          <PlanFeature text={isEN ? 'Puzzle + Memory + Quiz' : 'Quebra-cabeça + Memória + Quiz'} icon={Gamepad2} included highlight />
          <PlanFeature text={isEN ? '"Guess the word" game' : 'Jogo "Adivinhe a palavra"'} icon={Puzzle} included highlight />
          <PlanFeature text={isEN ? 'Custom QR Code design' : 'QR Code personalizado'} included highlight />
          <PlanFeature text={isEN ? 'Permanent page + backup' : 'Página permanente + backup'} icon={DatabaseZap} included highlight />
        </ul>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mb-5 text-xs text-zinc-300 flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEN ? 'Secure payment' : 'Pagamento seguro'}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            {isEN ? 'Instant access' : 'Acesso imediato'}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEN ? '7-day guarantee' : 'Garantia 7 dias'}
          </span>
        </div>

        {/* CTA principal — gradient forte */}
        <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
          <Link href={isEN ? '/chat?plan=vip&new=true' : '/criar?plan=vip&new=true'} className="block">
            <button className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ec4899, #a855f7)',
                boxShadow: '0 0 40px rgba(236,72,153,0.6), 0 4px 20px rgba(0,0,0,0.3)',
              }}>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Crown className="w-4 h-4 relative fill-white" />
              <span className="relative">{isEN ? 'Unlock VIP experience' : 'Desbloquear experiência VIP'}</span>
              <ArrowRight className="w-4 h-4 relative" />
            </button>
          </Link>
        </motion.div>

        <p className="text-center text-[11px] text-amber-100/60 mt-3 font-medium">
          {isEN
            ? '✨ Recommended for special dates · Valentine\'s, anniversaries, proposals'
            : '✨ Recomendado pras datas mais especiais · namoro, casamento, pedidos'}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Card Recomendado ──────────────────────────────────────────────────────── */
function AdvancedCard() {
  const offerExpired = useOfferExpired();
  const locale = useLocale();
  const isEN = locale === 'en';
  const price = offerExpired ? '29' : '24';
  const cents = isEN ? '.90' : ',90';
  const currency = isEN ? '$' : 'R$';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative flex flex-col rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, rgba(109,40,217,0.25) 0%, rgba(15,10,30,0.95) 50%)',
        border: '1px solid rgba(139,92,246,0.5)',
        boxShadow: '0 0 60px rgba(109,40,217,0.35), 0 0 120px rgba(109,40,217,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Glow top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }} />

      {/* Badge RECOMENDADO */}
      <div className="absolute -top-0 left-0 right-0 flex justify-center">
        <div className="relative -top-0 flex items-center gap-2 px-5 py-2 rounded-b-2xl text-xs font-black uppercase tracking-widest text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: '0 4px 24px rgba(139,92,246,0.6)',
          }}>
          <Star className="w-3.5 h-3.5 fill-white" />
          {isEN ? 'Most Popular' : 'Mais Popular'}
          <Star className="w-3.5 h-3.5 fill-white" />
        </div>
      </div>

      <div className="p-8 pt-14 flex flex-col flex-grow">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-black text-white tracking-tight">{isEN ? 'Advanced Plan' : 'Plano Avançado'}</h3>
          <p className="text-zinc-400 text-sm mt-1">{isEN ? 'The full, forever-lasting experience.' : 'A experiência completa e eterna.'}</p>
        </div>

        {/* Preço com ancoragem */}
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-start gap-3 justify-center">
            <div className="text-center">
              <p className="text-zinc-500 text-lg line-through font-medium">{isEN ? 'From $39.90' : 'De R$39,90'}</p>
              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-zinc-400 text-lg font-bold">{currency}</span>
                <span className="text-5xl font-black text-white leading-none">{price}</span>
                <span className="text-2xl font-black text-white">{cents}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{isEN ? 'One-time payment • No subscription' : 'Pagamento único • Sem mensalidade'}</p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="flex justify-center mb-6">
          <BuyerCount />
        </div>

        {/* Features */}
        <ul className="space-y-1 mb-8 flex-grow">
          <PlanFeature text={isEN ? 'Photo gallery (up to 10 photos)' : 'Galeria de fotos (até 10 fotos)'} included />
          <PlanFeature text={isEN ? 'Background music + voice note' : 'Música de fundo + gravação de voz'} included />
          <PlanFeature text={isEN ? '3D Timeline (up to 20 moments)' : 'Linha do Tempo 3D (até 20 momentos)'} included />
          <PlanFeature text={isEN ? 'Interactive Puzzle' : 'Quebra-cabeça Interativo'} icon={Puzzle} included highlight />
          <PlanFeature text={isEN ? 'Memory Match + Couple\'s Quiz' : 'Jogo da Memória + Quiz do Casal'} icon={Gamepad2} included highlight />
          <PlanFeature text={isEN ? 'Permanent page + unlimited backup' : 'Página permanente + backup infinito'} icon={DatabaseZap} included highlight />
        </ul>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mb-6 text-xs text-zinc-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {isEN ? 'Secure payment' : 'Pagamento seguro'}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            {isEN ? 'Instant access' : 'Acesso imediato'}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isEN ? '7-day guarantee' : 'Garantia 7 dias'}
          </span>
        </div>

        {/* CTA */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href={isEN ? '/chat?plan=avancado&new=true' : '/criar?plan=avancado&new=true'} className="block">
            <button className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                boxShadow: '0 0 30px rgba(147,51,234,0.5), 0 4px 16px rgba(0,0,0,0.3)',
              }}>
              {/* Shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles className="w-4 h-4 relative" />
              <span className="relative">{isEN ? 'Surprise the one I love' : 'Surpreender quem eu amo'}</span>
              <ArrowRight className="w-4 h-4 relative" />
            </button>
          </Link>
        </motion.div>

        <div className="mt-4">
          <GuaranteeBadge compact />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Card Básico ───────────────────────────────────────────────────────────── */
function EconomicCard() {
  const locale = useLocale();
  const isEN = locale === 'en';
  const price = '19';
  const cents = isEN ? '.90' : ',90';
  const currency = isEN ? '$' : 'R$';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
      className="relative flex flex-col rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="p-8 flex flex-col flex-grow">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-200 tracking-tight">{isEN ? 'Basic Plan' : 'Plano Básico'}</h3>
          <p className="text-zinc-500 text-sm mt-1">{isEN ? 'An exciting surprise with a time limit.' : 'Uma surpresa emocionante com prazo definido.'}</p>
        </div>

        {/* Preço */}
        <div className="mb-6 text-center">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-zinc-500 text-base font-bold">{currency}</span>
            <span className="text-4xl font-black text-zinc-300 leading-none">{price}</span>
            <span className="text-xl font-black text-zinc-300">{cents}</span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">{isEN ? 'One-time payment' : 'Pagamento único'}</p>
        </div>

        {/* Features */}
        <ul className="space-y-1 mb-8 flex-grow">
          <PlanFeature text={isEN ? 'Photo gallery (up to 10 photos)' : 'Galeria de fotos (até 10 fotos)'} included />
          <PlanFeature text={isEN ? 'Background music + voice note' : 'Música de fundo + gravação de voz'} included />
          <PlanFeature text={isEN ? '3D Timeline (up to 20 moments)' : 'Linha do Tempo 3D (até 20 momentos)'} included />
          <PlanFeature text={isEN ? 'Interactive Puzzle' : 'Quebra-cabeça Interativo'} icon={Puzzle} included />
          <PlanFeature text={isEN ? 'Memory Match + Couple\'s Quiz' : 'Jogo da Memória + Quiz do Casal'} icon={Gamepad2} included />
          <PlanFeature text={isEN ? 'Page available for only 25h' : 'Página disponível por apenas 25h'} icon={Hourglass} included={false} />
          <PlanFeature text={isEN ? 'Permanent page + unlimited backup' : 'Página permanente + backup infinito'} icon={DatabaseZap} included={false} />
        </ul>

        {/* Aviso de limitação */}
        <div className="mb-6 p-3 rounded-xl flex items-start gap-2.5"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <Hourglass className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-300/70 leading-relaxed">
            {isEN
              ? 'Heads up: the page expires 25h after sending. No recovery possible after that.'
              : 'Atenção: a página expira após 25h do envio. Sem possibilidade de recuperação depois disso.'}
          </p>
        </div>

        <Link href={isEN ? '/chat?plan=basico&new=true' : '/criar?plan=basico&new=true'} className="block">
          <button className="w-full py-3.5 rounded-2xl font-bold text-sm text-zinc-300 transition-all hover:text-white hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isEN ? 'Start my surprise →' : 'Começar minha surpresa →'}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────────────────────── */
const PlansSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  return (
    <div className="container max-w-5xl relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto mb-6"
      >
        <div className="flex justify-center mb-4">
          <UrgencyBadge />
        </div>

        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
          {isEN ? 'Immortalize your story' : 'Eternize sua história'}{' '}
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
            {isEN ? 'for less than a meal' : 'por menos de um lanche'}
          </span>
        </h2>
        <p className="mt-4 text-base text-zinc-400">
          {isEN
            ? 'Pick the right plan and build a page that will move them — in minutes.'
            : 'Escolha o plano certo e crie uma página que vai emocionar — em minutos.'}
        </p>
      </motion.div>

      {/* Social proof aggregate */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="flex justify-center items-center gap-6 mb-12 flex-wrap"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <span className="font-bold text-white">4.9</span>
          <span>{isEN ? '/ 5 stars' : '/ 5 estrelas'}</span>
        </div>
        <div className="w-px h-4 bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users className="w-4 h-4 text-purple-400" />
          <span>
            {isEN
              ? <><strong className="text-white">10,000+</strong> happy couples</>
              : <>+<strong className="text-white">10.000</strong> casais felizes</>}
          </span>
        </div>
        <div className="w-px h-4 bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isEN ? '7-day guarantee' : 'Garantia de 7 dias'}</span>
        </div>
      </motion.div>

      {/* Scarcity */}
      <div className="flex justify-center mb-8">
        <ScarcityIndicator />
      </div>

      {/* VIP — destaque principal, largura total */}
      <div className="max-w-4xl mx-auto mb-6">
        <VipCard />
      </div>

      {/* ── ou escolha uma das opções tradicionais ── */}
      <div className="flex items-center justify-center gap-3 mb-6 max-w-3xl mx-auto">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">
          {isEN ? 'or pick a single plan' : 'ou escolha um plano único'}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Cards — recomendado maior e elevado */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-6 max-w-4xl mx-auto items-start">
        {/* Básico — primeira coluna */}
        <EconomicCard />
        {/* Avançado — segunda coluna, mais largo */}
        <AdvancedCard />
      </div>

      {/* Garantia */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25 }}
        className="max-w-md mx-auto mt-10"
      >
        <GuaranteeBadge />
      </motion.div>

      {/* Rodapé de confiança */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center text-xs text-zinc-600 mt-6"
      >
        {isEN
          ? 'Payments processed safely · No subscription · Cancel anytime'
          : 'Pagamentos processados com segurança · Sem assinatura · Cancele quando quiser'}
      </motion.p>
    </div>
  );
};

export default memo(PlansSection);
