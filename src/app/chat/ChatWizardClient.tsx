'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { pageSchema, chatDefaultValues, type PageData } from '@/lib/wizard-schema';
import { CHAT_STEP_ORDER, getCupidLine, type ChatStepKey } from '@/lib/chat-script';
import { WIZARD_SEGMENTS, type WizardSegmentKey } from '@/lib/wizard-segment-config';
import CupidVideo from '@/components/chat/CupidVideo';
import ChatBubble from '@/components/chat/ChatBubble';
import StepField, { getFieldsForStep, getPrefetchForStep } from '@/components/chat/StepField';
import PreviewButton from '@/components/chat/PreviewButton';
import PreviewModal from '@/components/chat/PreviewModal';

const STORAGE_KEY = 'chat-wizard-draft-v1';
const STEP_KEY_STORAGE = 'chat-wizard-step-v1';
const PERSIST_DEBOUNCE_MS = 600;

// Campos que contêm blob URLs / File-like que não sobrevivem ao reload e gastam quota
// localStorage. Uploads persistem em Firebase; Stripped aqui pra não serializar lixo.
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

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const segmentParam = searchParams.get('segment') as WizardSegmentKey | null;
  const segment: WizardSegmentKey =
    segmentParam && segmentParam in WIZARD_SEGMENTS ? segmentParam : 'namorade';
  const segmentConfig = WIZARD_SEGMENTS[segment];

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: chatDefaultValues as PageData,
    shouldUnregister: false,
  });

  const [currentStep, setCurrentStep] = useState<ChatStepKey>('title');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  const stepIndex = CHAT_STEP_ORDER.indexOf(currentStep);
  const totalSteps = CHAT_STEP_ORDER.length;
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const cupidText = getCupidLine(segment, currentStep);
  const cupidVariant = currentStep === 'title' || currentStep === 'payment' ? 'idle' : 'asking';

  useEffect(() => {
    const next = CHAT_STEP_ORDER[stepIndex + 1];
    if (!next) return;
    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 300));
    const handle = idle(() => { getPrefetchForStep(next)().catch(() => {}); });
    return () => {
      const cancel = (window as any).cancelIdleCallback || clearTimeout;
      cancel(handle);
    };
  }, [stepIndex]);

  const handleBack = useCallback(() => {
    if (isFirst) {
      router.back();
      return;
    }
    setCurrentStep(CHAT_STEP_ORDER[stepIndex - 1]);
  }, [isFirst, stepIndex, router]);

  const handleNext = useCallback(async () => {
    const fields = getFieldsForStep(currentStep);
    const valid = fields.length === 0 ? true : await methods.trigger(fields as any, { shouldFocus: true });
    if (!valid) return;
    if (isLast) return;
    setCurrentStep(CHAT_STEP_ORDER[stepIndex + 1]);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, isLast, stepIndex, methods]);

  const showPreviewButton = stepIndex >= 1 && currentStep !== 'payment';

  const titlePlaceholder = segmentConfig.titlePlaceholder;
  const messagePlaceholder = segmentConfig.messagePlaceholder;

  const stepLabel = useMemo(() => `${stepIndex + 1} de ${totalSteps}`, [stepIndex, totalSteps]);

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-purple-100">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <Progress value={progressPct} className="h-1.5" />
            </div>
            <div className="text-[11px] font-semibold text-purple-700 tabular-nums whitespace-nowrap">
              {stepLabel}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-6 pb-36">
          <motion.div
            key={`cupid-${currentStep}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 mb-6"
          >
            <CupidVideo size="md" variant={cupidVariant} />
            <ChatBubble text={cupidText} />
          </motion.div>

          <motion.div
            key={`field-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.08 }}
            className="rounded-2xl bg-white ring-1 ring-purple-100 shadow-sm p-4"
          >
            <StepField
              step={currentStep}
              titlePlaceholder={titlePlaceholder}
              messagePlaceholder={messagePlaceholder}
            />
          </motion.div>
        </div>

        <PreviewButton onClick={() => setPreviewOpen(true)} visible={showPreviewButton} />

        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-purple-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1 h-12"
            >
              Voltar
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              disabled={isLast}
              className={cn(
                'flex-[2] h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold',
                isLast && 'opacity-60'
              )}
            >
              {isLast ? 'Último passo' : 'Continuar'}
              {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
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
