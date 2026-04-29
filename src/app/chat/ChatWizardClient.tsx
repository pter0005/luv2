'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { lookupIntentStatus } from '@/app/chat/lookup-intent';
import { getLatestPageForUser } from '@/app/chat/latest-page';
import { useUser } from '@/firebase';
import { useCreatingPresence } from '@/hooks/usePresence';
import { trackFunnelStep, trackEvent } from '@/lib/analytics';
import { captureAttribution } from '@/lib/attribution';
import { pageSchema, chatDefaultValues, type PageData } from '@/lib/wizard-schema';
import { CHAT_STEP_ORDER, getCupidLine, type ChatStepKey } from '@/lib/chat-script';
import { WIZARD_SEGMENTS, getWizardSegments, type WizardSegmentKey } from '@/lib/wizard-segment-config';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/config';
import CupidVideo from '@/components/chat/CupidVideo';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatProgress from '@/components/chat/ChatProgress';
import AutosaveBadge from '@/components/chat/AutosaveBadge';
import { useConfetti } from '@/components/chat/useConfetti';
import StepField, { getFieldsForStep, getPrefetchForStep } from '@/components/chat/StepField';
import PreviewButton from '@/components/chat/PreviewButton';
import PreviewModal from '@/components/chat/PreviewModal';
import DesktopPreviewPane from '@/components/chat/DesktopPreviewPane';

const STORAGE_KEY = 'chat-wizard-draft-v1';
const STEP_KEY_STORAGE = 'chat-wizard-step-v1';
const SEGMENT_STORAGE = 'chat-wizard-segment-v1';
const PERSIST_DEBOUNCE_MS = 600;

function stripNonPersistable(values: PageData): Partial<PageData> {
  const clone: any = { ...values };
  delete clone._uploadingCount;
  return clone;
}

const ENTER_TO_CONTINUE_STEPS: Set<ChatStepKey> = new Set(['recipient', 'title']);

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fireConfetti = useConfetti();
  const locale = useLocale() as Locale;
  const { user } = useUser();

  const segmentParam = searchParams.get('segment') as WizardSegmentKey | null;
  const initialSegment: WizardSegmentKey =
    segmentParam && segmentParam in WIZARD_SEGMENTS ? segmentParam : 'namorade';

  const [segment, setSegment] = useState<WizardSegmentKey>(initialSegment);
  const segmentConfig = getWizardSegments(locale)[segment];

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: chatDefaultValues as PageData,
    shouldUnregister: false,
  });

  const [currentStep, setCurrentStep] = useState<ChatStepKey>(CHAT_STEP_ORDER[0]);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'vip' || planParam === 'avancado' || planParam === 'basico') {
      methods.setValue('plan', planParam, { shouldDirty: false });
    } else {
      methods.setValue('plan', 'vip', { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presence: conta esse visitor como "criando uma página" enquanto o /chat tá aberto
  useCreatingPresence(true, null);

  // Funnel tracking: reporta cada step visto pro /admin ver onde gente cai
  // + dispara eventos standard de Meta/TikTok em marcos-chave do funil pra
  // otimização de ads funcionar (antes só o wizard antigo disparava isso).
  // Dedup por step name em Set() previne dupla-contagem ao ir/voltar.
  const funnelPixelFired = useRef<Set<string>>(new Set());
  useEffect(() => {
    const idx = CHAT_STEP_ORDER.indexOf(currentStep);
    if (idx < 0) return;
    trackFunnelStep(currentStep, idx + 1, CHAT_STEP_ORDER.length, { segment, locale });

    const once = (key: string, fire: () => void) => {
      if (funnelPixelFired.current.has(key)) return;
      funnelPixelFired.current.add(key);
      fire();
    };

    // Primeira impressão do wizard — conta como ViewContent pra retargeting
    if (idx === 0) once('view', () => trackEvent('ViewContent', { content_name: 'chat_wizard', segment }));
    // Plano escolhido — AddToCart (é o momento que o usuário "coloca na sacola")
    if (currentStep === 'plan') once('atc', () => trackEvent('AddToCart', { content_name: 'plan_step', segment }));
    // Entrou no checkout — InitiateCheckout
    if (currentStep === 'payment') once('ic', () => trackEvent('InitiateCheckout', { content_name: 'payment_step', segment }));
  }, [currentStep, segment, locale]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveTick, setSaveTick] = useState(0);
  const [alreadyPaid, setAlreadyPaid] = useState<{ pageId: string } | null>(null);
  const milestonesFiredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.specialDate) parsed.specialDate = new Date(parsed.specialDate);
        methods.reset({ ...(chatDefaultValues as PageData), ...parsed });
      }
      const savedStep = localStorage.getItem(STEP_KEY_STORAGE) as ChatStepKey | null;
      if (savedStep && CHAT_STEP_ORDER.includes(savedStep)) {
        setCurrentStep(savedStep);
      }
      // Segment da URL tem prioridade sobre o do localStorage
      if (!segmentParam) {
        const savedSegment = localStorage.getItem(SEGMENT_STORAGE) as WizardSegmentKey | null;
        if (savedSegment && savedSegment in WIZARD_SEGMENTS) {
          setSegment(savedSegment);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, [methods]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const sub = methods.watch((values) => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        try {
          const slim = stripNonPersistable(values as PageData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
          setSaveTick((t) => t + 1);
        } catch { /* quota */ }
      }, PERSIST_DEBOUNCE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [methods, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STEP_KEY_STORAGE, currentStep); } catch { /* ignore */ }
  }, [currentStep, hydrated]);


  // Attribution capture — roda 1x no mount, lê UTMs+fbclid+ttclid da URL
  // e cookies do browser. Primeiro-touch vence (não sobrescreve captura anterior).
  useEffect(() => {
    captureAttribution();
  }, []);

  // Detecta se o user JÁ tem página paga — duas fontes:
  //   1. intentId no localStorage (mesmo device, pagou e voltou)
  //   2. userId logado (troca de device, limpou storage, etc.)
  //
  // Se ?new=true na URL, pula a detecção — user pediu explicitamente pra criar
  // uma nova (chegou via /presente/[token] ou link com new=true). Evita prender
  // usuário que quer 2ª página no estado "já tem página".
  useEffect(() => {
    if (!hydrated || alreadyPaid) return;
    if (searchParams.get('new') === 'true') return;
    let cancelled = false;
    (async () => {
      // 1) Tenta pelo intentId salvo localmente (mais rápido)
      const intentId = methods.getValues('intentId');
      if (intentId) {
        const res = await lookupIntentStatus(intentId);
        if (cancelled) return;
        if (res.exists && res.status === 'completed' && res.pageId) {
          setAlreadyPaid({ pageId: res.pageId });
          return;
        }
      }
      // 2) Fallback: busca última página paga do user logado no Firestore
      if (!user?.uid) return;
      const latest = await getLatestPageForUser(user.uid);
      if (cancelled) return;
      if (latest.exists && latest.pageId) {
        setAlreadyPaid({ pageId: latest.pageId });
      }
    })();
    return () => { cancelled = true; };
  }, [hydrated, alreadyPaid, methods, user?.uid, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SEGMENT_STORAGE, segment); } catch { /* ignore */ }
  }, [segment, hydrated]);

  const stepIndex = CHAT_STEP_ORDER.indexOf(currentStep);
  const totalSteps = CHAT_STEP_ORDER.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Nome da pessoa: snapshot ao entrar no step, não reativo ao typing — evita re-trigger
  // da animação de "digitando" do Cupido a cada caractere que o usuário digita.
  const cupidText = useMemo(() => {
    const recipientName = methods.getValues('recipientName');
    return getCupidLine(segment, currentStep, { recipientName }, locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, currentStep, locale]);

  // Alterna entre asking e idle ~4 vezes ao longo do fluxo pra ficar dinâmico.
  // Começa em 'asking' (pede o nome), alterna em blocos.
  const cupidVariant: 'idle' | 'asking' = useMemo(() => {
    // Steps onde o Cupido está "perguntando" (asking) vs "ouvindo" (idle)
    const askingSteps: ChatStepKey[] = ['recipient', 'message', 'gallery', 'voice', 'extras'];
    if (currentStep === 'payment') return 'idle';
    return askingSteps.includes(currentStep) ? 'asking' : 'idle';
  }, [currentStep]);

  useEffect(() => {
    const next = CHAT_STEP_ORDER[stepIndex + 1];
    if (!next || typeof window === 'undefined') return;
    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 300));
    const handle = idle(() => { getPrefetchForStep(next)().catch(() => {}); });
    return () => {
      const cancel = (window as any).cancelIdleCallback || clearTimeout;
      cancel(handle);
    };
  }, [stepIndex]);

  useEffect(() => {
    const pct = Math.round(((stepIndex + 1) / totalSteps) * 100);
    const fired = milestonesFiredRef.current;
    [50, 75].forEach((m) => {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        fireConfetti(60);
        haptic('success');
      }
    });
  }, [stepIndex, totalSteps, fireConfetti]);

  const handleBack = useCallback(() => {
    haptic('tap');
    if (isFirst) {
      // Primeiro step do chat: voltar significa ir pro picker de segmento
      router.push('/criar');
      return;
    }
    setDirection(-1);
    setCurrentStep(CHAT_STEP_ORDER[stepIndex - 1]);
  }, [isFirst, stepIndex, router]);

  const handleNext = useCallback(async () => {
    const fields = getFieldsForStep(currentStep);
    const valid = fields.length === 0 ? true : await methods.trigger(fields as any, { shouldFocus: true });
    if (!valid) {
      haptic('error');
      return;
    }
    if (isLast) return;
    haptic('tap');
    setDirection(1);
    setCurrentStep(CHAT_STEP_ORDER[stepIndex + 1]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, isLast, stepIndex, methods]);

  useEffect(() => {
    if (!ENTER_TO_CONTINUE_STEPS.has(currentStep)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const isTextarea = target?.tagName === 'TEXTAREA';
        if (isTextarea) return;
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentStep, handleNext]);

  const showPreviewButton = stepIndex >= 2 && currentStep !== 'payment';
  const titlePlaceholder = segmentConfig.titlePlaceholder;
  const messagePlaceholder = segmentConfig.messagePlaceholder;
  const stepLabel = useMemo(() => `${stepIndex + 1}/${totalSteps}`, [stepIndex, totalSteps]);

  // Atalho: se o backend confirmou que a compra dessa sessão já foi paga,
  // pula o wizard inteiro e entrega a página pronta. Blindagem caso a pessoa
  // dê F5 depois de pagar, volte do checkout do MP, ou abra em outra aba.
  if (alreadyPaid) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white flex items-center justify-center p-6">
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 50% -20%, hsl(275 60% 14%), transparent 70%), linear-gradient(180deg, hsl(275 50% 4%) 0%, hsl(280 40% 3%) 100%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-md w-full rounded-3xl p-7 text-center bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-emerald-500/5 ring-1 ring-emerald-400/40 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-4 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)]"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </motion.div>
          <h1 className="text-xl font-bold text-white mb-1">
            {locale === 'en' ? 'Your page is ready 💌' : 'Sua página tá pronta 💌'}
          </h1>
          <p className="text-sm text-white/70 mb-5">
            {locale === 'en'
              ? 'Payment confirmed. Open it below to see how it turned out.'
              : 'O pagamento já foi confirmado. Abre aqui embaixo pra ver como ficou.'}
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push(`/p/${alreadyPaid.pageId}`)}
              className="w-full h-12 rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition active:scale-[0.98]"
            >
              {locale === 'en' ? 'See my page' : 'Ver minha página'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(STORAGE_KEY);
                  localStorage.removeItem(STEP_KEY_STORAGE);
                  localStorage.removeItem(SEGMENT_STORAGE);
                } catch {}
                // ?new=true sinaliza pra detecção PULAR o atalho de página já
                // paga — senão o user é preso no estado "já tem página" mesmo
                // querendo criar outra.
                window.location.href = '/chat?new=true';
              }}
              className="w-full h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 text-[13px] font-medium ring-1 ring-white/10 transition"
            >
              {locale === 'en' ? 'Create a new page' : 'Criar uma nova página'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="relative min-h-screen overflow-hidden text-white">
        {/* Fundo minimalista: preto profundo com toque sutil de roxo no topo */}
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 50% -20%, hsl(275 60% 14%), transparent 70%), linear-gradient(180deg, hsl(275 50% 4%) 0%, hsl(280 40% 3%) 100%)',
          }}
        />
        {/* Brilhos ambientais estáticos — sem animação, zero overhead */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(600px 600px at 10% 0%, rgba(168,85,247,0.18), transparent 60%),
              radial-gradient(500px 500px at 95% 35%, rgba(236,72,153,0.14), transparent 60%),
              radial-gradient(550px 550px at 20% 100%, rgba(139,92,246,0.14), transparent 60%)
            `,
          }}
        />

        {/* Top bar: botão voltar (esq) · progress centralizado · autosave (dir) */}
        <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="relative max-w-4xl mx-auto px-4 py-3.5 flex items-center lg:px-6">
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white/[0.05] text-white/80 ring-1 ring-white/10 hover:bg-white/[0.1] active:scale-95 transition"
              aria-label={locale === 'en' ? 'Back' : 'Voltar'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 mx-4 flex flex-col items-center gap-1.5">
              <ChatProgress current={stepIndex} total={totalSteps} className="max-w-[280px]" />
              <div className="text-[10.5px] font-medium text-white/45 tabular-nums tracking-wide">
                {stepLabel}
              </div>
            </div>
            <div className="shrink-0 w-9 flex justify-end">
              <AutosaveBadge pulseKey={saveTick} />
            </div>
          </div>
        </div>

        {/* Layout: mobile single, desktop split */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:max-w-6xl lg:mx-auto lg:px-6">
          <div className="max-w-md mx-auto w-full px-4 pt-8 pb-36 lg:mx-0 lg:px-0 lg:pt-14 lg:pb-28">
            {/* Cupido + balão — sem motion infinito, só o typing do bubble */}
            <div className="flex items-start gap-3 mb-8">
              <CupidVideo size="md" variant={cupidVariant} />
              <ChatBubble text={cupidText} />
            </div>

            {/* Campo do step — sem card/wrapper visual, deixa respirar.
                padding-bottom reserva espaço pro PreviewButton flutuante (fixed bottom-24) não cortar conteúdo. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`field-${currentStep}`}
                initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                className="pb-24 lg:pb-0"
              >
                <StepField
                  step={currentStep}
                  titlePlaceholder={titlePlaceholder}
                  messagePlaceholder={messagePlaceholder}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:block pt-14 pb-10">
            <DesktopPreviewPane />
          </div>
        </div>

        <div className="lg:hidden">
          <PreviewButton onClick={() => { haptic('tap'); setPreviewOpen(true); }} visible={showPreviewButton} />
        </div>

        {/* Sticky bottom */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3 lg:max-w-6xl lg:px-6">
            <Button
              type="button"
              size="lg"
              onClick={handleBack}
              className="flex-1 h-12 bg-transparent hover:bg-white/[0.06] text-white/70 hover:text-white/90 ring-1 ring-white/10 border-0 font-medium transition"
            >
              {locale === 'en' ? 'Back' : 'Voltar'}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              disabled={isLast}
              className={cn(
                'flex-[2] h-12 font-semibold text-black transition active:scale-[0.98] border-0',
                'bg-white hover:bg-white/90',
                isLast && 'opacity-40 cursor-not-allowed'
              )}
            >
              {isLast ? (locale === 'en' ? 'Last step' : 'Último passo') : (locale === 'en' ? 'Continue' : 'Continuar')}
              {!isLast && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </div>
        </div>

        <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
      </div>
    </FormProvider>
  );
}

export default function ChatWizardClient() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
