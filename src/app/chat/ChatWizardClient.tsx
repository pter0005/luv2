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
import { pageSchema, chatDefaultValues, type PageData } from '@/lib/wizard-schema';
import { CHAT_STEP_ORDER, getCupidLine, type ChatStepKey } from '@/lib/chat-script';
import { WIZARD_SEGMENTS, type WizardSegmentKey } from '@/lib/wizard-segment-config';
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

const NON_PERSISTABLE_KEYS: (keyof PageData)[] = [
  'galleryImages',
  'timelineEvents',
  'memoryGameImages',
  'audioRecording',
];

function stripNonPersistable(values: PageData): Partial<PageData> {
  const clone: any = { ...values };
  for (const k of NON_PERSISTABLE_KEYS) delete clone[k];
  return clone;
}

const ENTER_TO_CONTINUE_STEPS: Set<ChatStepKey> = new Set(['title']);

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fireConfetti = useConfetti();

  const segmentParam = searchParams.get('segment') as WizardSegmentKey | null;
  const initialSegment: WizardSegmentKey =
    segmentParam && segmentParam in WIZARD_SEGMENTS ? segmentParam : 'namorade';

  const [segment, setSegment] = useState<WizardSegmentKey>(initialSegment);
  const segmentConfig = WIZARD_SEGMENTS[segment];

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: chatDefaultValues as PageData,
    shouldUnregister: false,
  });

  const [currentStep, setCurrentStep] = useState<ChatStepKey>(() => {
    // Se já veio segmento na URL, pula o step de escolher destinatário
    if (segmentParam && segmentParam in WIZARD_SEGMENTS) {
      const next = CHAT_STEP_ORDER[CHAT_STEP_ORDER.indexOf('recipient') + 1];
      return next ?? 'recipient';
    }
    return 'recipient';
  });
  const [direction, setDirection] = useState<1 | -1>(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveTick, setSaveTick] = useState(0);
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
        // Se veio ?segment= na URL, nunca volta pro step recipient (já foi escolhido)
        if (segmentParam && savedStep === 'recipient') {
          const next = CHAT_STEP_ORDER[CHAT_STEP_ORDER.indexOf('recipient') + 1];
          if (next) setCurrentStep(next);
        } else {
          setCurrentStep(savedStep);
        }
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

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SEGMENT_STORAGE, segment); } catch { /* ignore */ }
  }, [segment, hydrated]);

  const stepIndex = CHAT_STEP_ORDER.indexOf(currentStep);
  const totalSteps = CHAT_STEP_ORDER.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const cupidText = getCupidLine(segment, currentStep);
  const cupidVariant =
    currentStep === 'recipient' || currentStep === 'title' || currentStep === 'payment'
      ? 'idle'
      : 'asking';

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
      router.back();
      return;
    }
    // Se veio com segmento pré-escolhido pela URL e está no step logo após recipient,
    // voltar significa ir pro picker em /criar em vez de mostrar o step recipient de novo.
    const prevStep = CHAT_STEP_ORDER[stepIndex - 1];
    if (segmentParam && prevStep === 'recipient') {
      router.push('/criar');
      return;
    }
    setDirection(-1);
    setCurrentStep(prevStep);
  }, [isFirst, stepIndex, router, segmentParam]);

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
        {/* Blobs ambientais — roxo (topo-esquerda), rosa (direita), violeta (baixo) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-10 -top-24 -left-24 w-[620px] h-[620px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.55), transparent 65%)' }}
          animate={{ x: ['-5%', '10%', '-5%'], y: ['-5%', '8%', '-5%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-10 top-40 -right-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.45), transparent 65%)' }}
          animate={{ x: ['0%', '-8%', '0%'], y: ['0%', '10%', '0%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-10 bottom-[-10%] left-[10%] w-[520px] h-[520px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 65%)' }}
          animate={{ x: ['0%', '12%', '0%'], y: ['0%', '-6%', '0%'] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sparkles sutis — pontinhos brilhando */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {[
            { top: '12%', left: '8%', delay: 0, duration: 3.2 },
            { top: '22%', left: '82%', delay: 1.1, duration: 2.8 },
            { top: '45%', left: '18%', delay: 2.3, duration: 3.6 },
            { top: '58%', left: '72%', delay: 0.6, duration: 3.0 },
            { top: '78%', left: '28%', delay: 1.8, duration: 2.6 },
            { top: '88%', left: '88%', delay: 2.6, duration: 3.4 },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                top: s.top,
                left: s.left,
                boxShadow: '0 0 8px rgba(255,255,255,0.85), 0 0 16px rgba(168,85,247,0.5)',
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
              transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Noise grain — textura fina pra tirar o "chapado" */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* Top bar minimalista */}
        <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3 lg:max-w-none lg:px-6">
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.05] text-white/80 ring-1 ring-white/10 hover:bg-white/[0.1] active:scale-95 transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 max-w-xl">
              <ChatProgress current={stepIndex} total={totalSteps} />
            </div>
            <div className="flex items-center gap-2">
              <AutosaveBadge pulseKey={saveTick} />
              <div className="text-[11px] font-medium text-white/50 tabular-nums whitespace-nowrap">
                {stepLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Layout: mobile single, desktop split */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:max-w-6xl lg:mx-auto lg:px-6">
          <div className="max-w-md mx-auto w-full px-4 pt-8 pb-36 lg:mx-0 lg:px-0 lg:pt-14 lg:pb-28">
            {/* Cupido + balão */}
            <motion.div
              key={`cupid-${currentStep}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-3 mb-8"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CupidVideo size="md" variant={cupidVariant} />
              </motion.div>
              <ChatBubble text={cupidText} />
            </motion.div>

            {/* Campo do step — sem card/wrapper visual, deixa respirar */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`field-${currentStep}`}
                initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <StepField
                  step={currentStep}
                  titlePlaceholder={titlePlaceholder}
                  messagePlaceholder={messagePlaceholder}
                  recipientValue={segment}
                  onRecipientChange={setSegment}
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
              Voltar
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
              {isLast ? 'Último passo' : 'Continuar'}
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
