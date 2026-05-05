'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext, useWatch } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  Copy,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Zap,
  AlertCircle,
  Sparkles,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { computeTotal, getPrices, PRICES, computeTotalForMarket, getPricesForMarket } from '@/lib/price';
import { useMarket } from '@/i18n/use-market';
import { getSiteConfigByMarket } from '@/lib/site-config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { getSiteConfig } from '@/lib/site-config';
import { formatCurrency, formatCurrencyForMarket } from '@/lib/format';
import { createStripeCheckoutSession } from '@/lib/payment/stripe-checkout';
import {
  createOrUpdatePaymentIntent,
  processPixPayment,
  verifyPaymentWithMercadoPago,
  adminFinalizePage,
  finalizeWithGiftToken,
} from '@/app/criar/fazer-eu-mesmo/actions';
import { createMercadoPagoCardSession, dryRunMercadoPagoCardSession, type MpDryRunReport } from '@/app/chat/mp-card-action';
import { lookupIntentStatus } from '@/app/chat/lookup-intent';
import { getIntentServerPrice, applyDiscountToIntent } from '@/app/chat/intent-price';
import { MercadoPagoLogo } from '@/components/chat/fields/MercadoPagoBadge';
import QrCodeSelector from '@/app/criar/fazer-eu-mesmo/QrCodeSelector';
import { downloadQrCard } from '@/lib/downloadQrCard';
import { useToast } from '@/hooks/use-toast';
import { trackEvent, setAdvancedMatching, trackFunnelStep } from '@/lib/analytics';
import { getAttribution, captureAttribution } from '@/lib/attribution';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Helper compat: usa o formatter do locale ativo (legacy — prefere money2 com market).
function money(v: number, locale: Locale) { return formatCurrency(v, locale); }

/**
 * Lê o MP_DEVICE_SESSION_ID injetado pelo script security.js do Mercado Pago.
 * Usado pra anti-fraude — manda no header X-meli-session-id da chamada do PIX/Card.
 * Sem isso, MP bloqueia mais transações (score de integração cai).
 */
function getMpDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = (window as any).MP_DEVICE_SESSION_ID;
  return typeof id === 'string' && id.length > 4 ? id : null;
}

type Method = 'pix' | 'card';

type PixState = {
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
  createdAt: number;
};

function formatPhoneBR(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatPhoneUS(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatPhonePT(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

// Mensagens de erro locale-aware. Centraliza pra evitar PT vazando no US.
const ERR = {
  emailInvalid: { pt: 'Preenche um email válido pra continuar.', en: 'Please enter a valid email.' },
  phoneInvalid: { pt: 'Preenche o WhatsApp com DDD.', en: 'Please enter a valid phone with area code.' },
  sessionLoading: { pt: 'Sessão carregando, tenta de novo.', en: 'Session loading, try again shortly.' },
  downloadFailed: { pt: 'Não consegui baixar', en: 'Couldn\'t download' },
  downloadHint: { pt: 'Tenta de novo, ou salva a imagem pressionando e segurando.', en: 'Try again, or save the image by pressing and holding.' },
  finalizing: { pt: 'Finalizando...', en: 'Finalizing...' },
  finalizeFree: { pt: 'Finalizar sem pagar', en: 'Finalize without paying' },
} as const;

export default function PaymentField() {
  const router = useRouter();
  const { user } = useUser();
  const firebase = useFirebase();

  // Garante que existe um user (anônimo é OK) — outros fields fazem isso sob
  // demanda; aqui precisa antes de gerar PIX/resgatar gift/abrir checkout.
  // Sem isso, user chega null em guest flows e o botão só mostra "Sessão carregando".
  const ensureUser = useCallback(async () => {
    if (user) return user;
    if (!firebase.auth) return null;
    // Retry com backoff: signInAnonymously falha em ~30% no iOS Safari
    // private/3rd-party-cookies-blocked. Na 1a falha tenta de novo, na 2a
    // retorna null com erro claro pro caller mostrar toast.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const cred = await signInAnonymously(firebase.auth);
        return cred.user;
      } catch (err: any) {
        console.warn(`[ensureUser] signInAnonymously attempt ${attempt + 1} failed:`, err?.message);
        if (attempt < 1) await new Promise(r => setTimeout(r, 800));
      }
    }
    return null;
  }, [user, firebase.auth]);

  // Guard contra duplo-click: PIX/Card/Stripe podem ser clicados 2x antes do
  // startTransition desabilitar. Cria 2 intents por engano + cobra duplicado.
  const submitGuardRef = useRef(false);
  const acquireSubmitGuard = useCallback(() => {
    if (submitGuardRef.current) return false;
    submitGuardRef.current = true;
    setTimeout(() => { submitGuardRef.current = false; }, 30_000); // libera após 30s mesmo em caso de erro
    return true;
  }, []);
  const releaseSubmitGuard = useCallback(() => { submitGuardRef.current = false; }, []);
  const { toast } = useToast();
  const { control, getValues, setValue } = useFormContext<PageData>();
  const locale = useLocale() as Locale;
  const market = useMarket();
  const siteCfg = getSiteConfigByMarket(market);
  const t = (k: keyof typeof ERR) => ERR[k][locale === 'en' ? 'en' : 'pt'];
  const isUS = market === 'US';
  const isPT = market === 'PT';

  const [plan, introType, audioRecording, musicOption, intentId, whatsappNumber, qrCodeDesign, title, enableWordGame, wordGameQuestions] = useWatch({
    control,
    name: ['plan', 'introType', 'audioRecording', 'musicOption', 'intentId', 'whatsappNumber', 'qrCodeDesign', 'title', 'enableWordGame', 'wordGameQuestions'] as const,
  }) as [
    PageData['plan'],
    PageData['introType'],
    PageData['audioRecording'],
    PageData['musicOption'],
    PageData['intentId'],
    PageData['whatsappNumber'],
    PageData['qrCodeDesign'],
    PageData['title'],
    PageData['enableWordGame'],
    PageData['wordGameQuestions']
  ];

  const clientTotal = useMemo(
    () => computeTotalForMarket({ plan, introType, audioRecording, musicOption, qrCodeDesign, enableWordGame, wordGameQuestions } as any, market),
    [plan, introType, audioRecording, musicOption, qrCodeDesign, enableWordGame, wordGameQuestions, market]
  );

  // ── SERVER-TRUSTED TOTAL ──
  // O servidor é a única fonte de verdade pro valor cobrado. Depois que o
  // intent é salvo, buscamos o total canônico e exibimos esse — nunca o do
  // cliente. Se diferirem (ex: desconto aplicado em outra aba), o UI reflete
  // o valor real antes do clique em "pagar", zerando a chance de "valor mudou".
  // Enquanto não chegou a resposta (primeira renderização), mostra clientTotal
  // como fallback — bate na esmagadora maioria dos casos.
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  // Aplica cupom de desconto AO MONTAR a tela de checkout — antes era só
  // ao clicar "Gerar PIX" → cliente via preço cheio mesmo após cupido
  // saudar com cupom. Idempotente: se já tá aplicado, não duplica.
  useEffect(() => {
    if (!intentId) return;
    const code = typeof window !== 'undefined'
      ? localStorage.getItem('mycupid_discount_code')
      : null;
    if (!code) return;
    let cancelled = false;
    applyDiscountToIntent(intentId, code).then((res) => {
      if (cancelled) return;
      // Após aplicar, refresh do total pra mostrar com desconto
      if (res.ok) {
        getIntentServerPrice(intentId).then((p) => {
          if (cancelled) return;
          if (p.ok && typeof p.total === 'number') setServerTotal(p.total);
        }).catch(() => {});
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [intentId]);

  useEffect(() => {
    if (!intentId) { setServerTotal(null); return; }
    let cancelled = false;
    getIntentServerPrice(intentId).then((res) => {
      if (cancelled) return;
      if (res.ok && typeof res.total === 'number') setServerTotal(res.total);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [intentId, plan, introType, audioRecording, qrCodeDesign, enableWordGame, wordGameQuestions]);

  const total = serverTotal ?? clientTotal;

  const uploadingCount = useWatch({ control, name: '_uploadingCount' as any }) as number | undefined;
  const isUploading = (uploadingCount ?? 0) > 0;

  // Breakdown real do pedido — só entra item que o cliente efetivamente escolheu.
  const lineItems = useMemo(() => {
    const prices = getPricesForMarket(market);
    const items: { label: string; value: number; originalValue?: number; hint?: string }[] = [];
    const isEN = locale === 'en';

    // VIP: preço flat, uma linha só — tudo já incluso no bundle.
    if (plan === 'vip') {
      const originalValue = isPT ? 24.99 : isEN ? 29.99 : 44.99;
      items.push({
        label: isEN ? 'VIP bundle' : 'Bundle VIP',
        value: prices.vip,
        originalValue,
        hint: isEN ? 'everything unlocked · best value' : 'tudo liberado · melhor custo',
      });
      return items;
    }

    const base = plan === 'avancado' ? prices.avancado : prices.basico;
    const advancedOriginal = isPT ? 19.99 : isEN ? 24.99 : 34.99;
    items.push({
      label: isEN
        ? (plan === 'avancado' ? 'Advanced plan' : 'Basic plan')
        : (plan === 'avancado' ? 'Plano Avançado' : 'Plano Básico'),
      value: base,
      originalValue: plan === 'avancado' ? advancedOriginal : undefined,
      hint: isEN
        ? (plan === 'avancado' ? 'games + voice + intros + music' : 'page + photos + countdown')
        : (plan === 'avancado' ? 'jogos + voz + intros + música' : 'página + fotos + contador'),
    });
    if (introType === 'love') items.push({ label: isEN ? 'Special intro (bunny)' : 'Abertura especial (coelho)', value: prices.introLove });
    if (introType === 'poema') items.push({ label: isEN ? 'Special intro (poem)' : 'Abertura especial (poema)', value: prices.introPoema });
    if (audioRecording?.url) items.push({ label: isEN ? 'Recorded voice note' : 'Mensagem de voz gravada', value: prices.voice });
    if (enableWordGame && Array.isArray(wordGameQuestions) && wordGameQuestions.length > 0) {
      items.push({ label: isEN ? 'Word game' : 'Jogo de palavras', value: prices.wordGame });
    }
    if (qrCodeDesign && qrCodeDesign !== 'classic') {
      items.push({ label: isEN ? 'Custom QR code' : 'QR Code personalizado', value: prices.qrCustom });
    }
    return items;
  }, [plan, introType, audioRecording, qrCodeDesign, enableWordGame, wordGameQuestions, locale, market, isPT]);

  const [method, setMethod] = useState<Method>('pix');
  const [isProcessing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const PIX_STORAGE_KEY = 'chat-pix-pending-v1';
  const [pixData, _setPixData] = useState<PixState | null>(null);
  const setPixData = useCallback((v: PixState | null) => {
    _setPixData(v);
    try {
      if (v && intentId) {
        localStorage.setItem(PIX_STORAGE_KEY, JSON.stringify({ ...v, intentId }));
      } else {
        localStorage.removeItem(PIX_STORAGE_KEY);
      }
    } catch { /* storage disabled */ }
  }, [intentId]);
  const [pixTimeLeft, setPixTimeLeft] = useState(0);
  const [pixExpired, setPixExpired] = useState(false);
  const [paid, _setPaid] = useState<{ pageId: string; isGift?: boolean } | null>(null);

  // Disparado exatamente 1x por pageId, em qualquer fluxo de sucesso
  // (PIX, stripe, admin, gift). Dedup via sessionStorage resiste a
  // re-montagens (StrictMode, back/forward). `/criando-pagina` usa a mesma
  // chave, então MP-card + PIX não duplicam entre si.
  // Gift dispara CompleteRegistration (value=0) em vez de Purchase pra não
  // contaminar o ROAS de ads pagos com conversões grátis.
  // eventId = pageId para dedup com Meta CAPI / TikTok Events API server-side.
  const setPaid = useCallback((p: { pageId: string; isGift?: boolean } | null) => {
    _setPaid(p);
    if (!p) return;
    try {
      const dedupeKey = `purchase_fired_${p.pageId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(dedupeKey)) {
        sessionStorage.setItem(dedupeKey, '1');
        const eventName = p.isGift ? 'CompleteRegistration' : 'Purchase';
        trackEvent(eventName, {
          value: p.isGift ? 0 : total,
          currency: siteCfg.currency,
          content_ids: [plan || 'avancado'],
          content_type: 'product',
          contents: [{
            content_id: plan || 'avancado',
            content_type: 'product',
            quantity: 1,
            price: p.isGift ? 0 : total,
          }],
        }, p.pageId);
        // Funnel final — marca esse device/sessão como "pago" pro painel
        // "Funil do Wizard" mostrar a conversão real. Dedup lateral em
        // trackFunnelStep (Set reportedFunnelSteps) garante 1-por-sessão.
        trackFunnelStep('paid', 999, 999);
      }
    } catch { /* ignore */ }
  }, [total, plan, siteCfg.currency]);

  const amFiredFor = useRef<string>('');
  const [giftToken, setGiftToken] = useState<string | null>(null);
  const [isRedeemingGift, startRedeemGift] = useTransition();
  const [isAdminAction, startAdminAction] = useTransition();
  const [isDryRun, startDryRun] = useTransition();
  const [dryRunReport, setDryRunReport] = useState<MpDryRunReport | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Estado intermediário: MP retornou pending/in_process (banco confirmou
  // pagamento mas MP ainda tá processando). Mostra "Detectando pagamento…"
  // pro usuário ficar tranquilo em vez de achar que travou.
  const [paymentDetected, setPaymentDetected] = useState(false);

  // Em dev, todo mundo é admin (mesma regra do admin-guard server-side)
  const isDev = process.env.NODE_ENV !== 'production';
  const isAdmin = isDev || (!!user?.email && ADMIN_EMAILS.includes(user.email));

  // Email obrigatório pra todos — pré-preenche com email da conta se existir
  const [emailInput, setEmailInput] = useState(user?.email || '');
  useEffect(() => {
    if (user?.email && !emailInput) setEmailInput(user.email);
  }, [user?.email, emailInput]);
  const phone = whatsappNumber || '';

  // Validação de contato — usada pra desabilitar botões de pagamento.
  // PT aceita 9 dígitos (móvel ou fixo); BR/US continuam exigindo 10+.
  const isContactValid = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim());
    const phoneMin = market === 'PT' ? 9 : 10;
    const phoneOk = phone.replace(/\D/g, '').length >= phoneMin;
    return emailOk && phoneOk;
  }, [emailInput, phone, market]);

  // Advanced Matching: manda email + phone hasheados pro Meta/TikTok assim
  // que o contato fica válido. Aumenta match rate de ~40% pra ~70%+ — crucial
  // pra otimização de ads funcionar pós iOS 14.5 (ATT).
  useEffect(() => {
    if (!isContactValid) return;
    const key = `${emailInput}|${phone}`;
    if (amFiredFor.current === key) return;
    amFiredFor.current = key;
    setAdvancedMatching({ email: emailInput, phone, market }).catch(() => {});
  }, [isContactValid, emailInput, phone, market]);

  // Attribution (UTMs + fbp/fbc/ttclid) lida 1x e injetada em todos os saves.
  // Persistida no intent doc pro server-side pixel (CAPI/Events API) conseguir
  // deduplicar o Purchase com o pixel do browser e atribuir ao ad correto.
  const attributionRef = useRef<Record<string, any>>({});
  useEffect(() => {
    // Captura (idempotente: first-touch vence) antes de ler. Redundância
    // defensiva — useVisitorTracking já chama, mas garante que mesmo se o hook
    // falhou (SSR race, ad blocker), a attribution é capturada aqui antes do
    // save do intent. Sem isso, vendas vindas de TikTok apareciam como "direct".
    try { captureAttribution(); } catch { /* ignore */ }
    attributionRef.current = getAttribution();
  }, []);

  // Garantir que o rascunho exista — cria user anônimo se necessário.
  useEffect(() => {
    if (intentId) return;
    let cancelled = false;
    (async () => {
      const activeUser = await ensureUser();
      if (cancelled || !activeUser) return;
      const data = getValues();
      const res = await createOrUpdatePaymentIntent({ ...data, ...attributionRef.current, userId: activeUser.uid });
      if (!cancelled && res.success) setValue('intentId', res.intentId, { shouldDirty: false });
    })();
    return () => { cancelled = true; };
  }, [intentId, getValues, setValue, ensureUser]);

  // Restaura QR do PIX se a pessoa recarregou/voltou antes de pagar
  useEffect(() => {
    if (pixData || !intentId) return;
    try {
      const raw = localStorage.getItem(PIX_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.intentId !== intentId) { localStorage.removeItem(PIX_STORAGE_KEY); return; }
      const elapsed = Date.now() - saved.createdAt;
      if (elapsed > 15 * 60 * 1000) { localStorage.removeItem(PIX_STORAGE_KEY); return; }
      _setPixData({
        qrCode: saved.qrCode,
        qrCodeBase64: saved.qrCodeBase64,
        paymentId: saved.paymentId,
        createdAt: saved.createdAt,
      });
    } catch { /* ignore */ }
  }, [intentId, pixData]);

  // Recuperação após reload / volta do checkout externo:
  // se o intent já tá "completed" (webhook processou), mostra direto o estado pago.
  // Evita o cliente precisar pedir o link por WhatsApp caso feche a aba.
  const [lookupChecked, setLookupChecked] = useState(false);
  useEffect(() => {
    if (!intentId || paid || lookupChecked) return;
    let cancelled = false;
    (async () => {
      const res = await lookupIntentStatus(intentId);
      if (cancelled) return;
      setLookupChecked(true);
      if (res.exists && res.status === 'completed' && res.pageId) {
        setPaid({ pageId: res.pageId });
        try { localStorage.removeItem(PIX_STORAGE_KEY); } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [intentId, paid, lookupChecked]);

  // Lê gift token do localStorage e valida server-side.
  // Sem isso, um token já usado ou revogado fica zumbi no storage e o botão
  // "Resgatar" aparece mas falha no submit — frustração gratuita pro user.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mycupid_gift_token');
      if (!stored) return;
      fetch(`/api/gift?token=${encodeURIComponent(stored)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((res) => {
          if (res?.valid) {
            setGiftToken(stored);
          } else {
            try { localStorage.removeItem('mycupid_gift_token'); } catch {}
          }
        })
        .catch(() => {
          // Rede falhou — mostra o botão mesmo assim (fallback otimista).
          // Se o resgate falhar no submit, o user vê erro claro.
          setGiftToken(stored);
        });
    } catch { /* storage disabled */ }
  }, []);

  // Countdown Pix + marca como expirado quando zera
  useEffect(() => {
    if (!pixData) { setPixExpired(false); setPixTimeLeft(0); return; }
    const tick = () => {
      const elapsed = Date.now() - pixData.createdAt;
      const remaining = Math.max(0, 15 * 60 * 1000 - elapsed);
      setPixTimeLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) setPixExpired(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pixData]);

  // Polling — se MP retornar cancelled/rejected, marca como expirado pra mostrar CTA.
  // TIMEOUT: para de pollar após 15 min (PIX expira em 30 min mas usuário
  // costuma desistir antes). Antes pollava pra sempre = bateria mobile drenada
  // + custo de função no servidor + spinner girando sem fim.
  // Polling adaptativo: 1.5s nos primeiros 60s (cliente acabou de pagar e
  // tá ansioso esperando) → 3s depois. Sem isso, com setInterval fixo de 3s,
  // cliente pagava e demorava 5-15s pra ver "página criada" mesmo com MP
  // já tendo confirmado em 3s. Percepção de lentidão = pedido de reembolso.
  //
  // Detecção dupla: pergunta MP API E checa se `payment_intent.status` virou
  // 'completed' (webhook chegou e finalizou ANTES do polling perguntar). Isso
  // cobre o caso onde webhook é mais rápido que polling — antes, polling
  // continuava chamando MP API mesmo com página já criada.
  useEffect(() => {
    if (!pixData || !intentId || paid || pixExpired) return;
    const startedAt = Date.now();
    const POLL_MAX_MS = 15 * 60 * 1000;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed > POLL_MAX_MS) {
        setPixExpired(true);
        return;
      }
      try {
        // Primeiro: tenta atalho via intent status (webhook pode ter
        // finalizado antes do polling — vai mais rápido que MP API).
        const intentRes = await getIntentServerPrice(intentId);
        if (!stopped && intentRes.status === 'completed' && intentRes.lovePageId) {
          setPaid({ pageId: intentRes.lovePageId });
          return;
        }
      } catch { /* segue pra MP query */ }

      try {
        const res = await verifyPaymentWithMercadoPago(pixData.paymentId, intentId);
        if (stopped) return;
        if (res.status === 'approved') {
          setPaid({ pageId: res.pageId });
          return;
        }
        if (res.status === 'cancelled' || res.status === 'rejected') {
          setPixExpired(true);
          return;
        }
        // 'in_process' / 'authorized' / 'pending' — banco confirmou mas MP
        // ainda processando. Mostra UI de "detectando" pro user ficar tranquilo.
        if (res.status === 'in_process' || res.status === 'authorized') {
          setPaymentDetected(true);
        }
        if (res.status === 'error') {
          console.warn('[pix] verify transient error:', res.error);
        }
      } catch { /* retry */ }

      // Reagenda com cadência adaptativa
      const interval = elapsed < 60_000 ? 1500 : 3000;
      pollRef.current = setTimeout(tick, interval);
    };

    // Primeira chamada imediata (1ms) pra não esperar o intervalo inicial
    pollRef.current = setTimeout(tick, 1);

    return () => {
      stopped = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [pixData, intentId, paid, pixExpired]);

  const handleGenerateNewPix = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setPixData(null);
    setPixExpired(false);
    setPaymentDetected(false);
    setError(null);
    trackEvent('PaymentRetry', { method: 'pix', reason: 'pix_expired' });
  }, [setPixData]);

  const handleRedeemGift = useCallback(() => {
    setError(null);
    if (!giftToken) { setError(isUS ? 'Gift link missing. Open the gift link again.' : 'Link do presente não encontrado. Abra o link de novo.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())) {
      setError(t('emailInvalid'));
      return;
    }
    // WhatsApp NÃO bloqueia gift redeem (presente já tá ativo, é grátis).
    // Só pede com alert friendly se faltar — pra recovery futuro.
    if (phone.replace(/\D/g, '').length < 10) {
      const wantsToContinue = typeof window !== 'undefined' && window.confirm(
        isUS
          ? 'Add your phone for support and order recovery? (Click OK to add it, Cancel to skip and redeem now)'
          : 'Quer adicionar seu WhatsApp pra suporte e recuperação? (OK pra adicionar, Cancelar pra resgatar sem)'
      );
      if (wantsToContinue) {
        // Foca no input do WhatsApp pro user preencher
        const phoneInput = typeof document !== 'undefined' ? document.querySelector<HTMLInputElement>('input[type="tel"]') : null;
        if (phoneInput) phoneInput.focus();
        return;
      }
      // Cancelou → segue sem WhatsApp
    }
    const cleanEmail = emailInput.trim().toLowerCase();
    startRedeemGift(async () => {
      try {
        const activeUser = await ensureUser();
        if (!activeUser) { setError(t('sessionLoading')); return; }
        const data = getValues();
        const whatsappDigits = phone.replace(/\D/g, '');
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          ...attributionRef.current,
          userId: activeUser.uid,
          plan: 'avancado',
          whatsappNumber: whatsappDigits,
          guestEmail: cleanEmail,
        });
        if (!saveRes.success) { setError(saveRes.error || (isUS ? 'Failed to save draft.' : 'Erro ao salvar rascunho.')); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const res = await finalizeWithGiftToken(saveRes.intentId, activeUser.uid, giftToken, cleanEmail);
        if (!res.success) { setError(res.error || (isUS ? 'Failed to redeem gift.' : 'Erro ao resgatar presente.')); return; }
        try { localStorage.removeItem('mycupid_gift_token'); } catch {}
        setGiftToken(null);
        setPaid({ pageId: res.pageId, isGift: true });
      } catch (e: any) {
        setError(e?.message || (isUS ? 'Failed to redeem gift.' : 'Erro ao resgatar presente.'));
      }
    });
  }, [giftToken, emailInput, phone, getValues, setValue, isUS, ensureUser]);

  const handlePix = useCallback(() => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())) {
      setError(t('emailInvalid'));
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError(t('phoneInvalid'));
      return;
    }
    // Guard duplo-click: usuário com touch impaciente clicava 2x e gerava 2 intents
    if (!acquireSubmitGuard()) return;

    startTransition(async () => {
      try {
        const activeUser = await ensureUser();
        if (!activeUser) {
          setError('Sessão não pôde ser iniciada. Tenta atualizar a página ou desativar bloqueadores (extensões, modo privado).');
          releaseSubmitGuard();
          return;
        }
        const data = getValues();
        const whatsappDigits = phone.replace(/\D/g, '');
        const cleanEmail = emailInput.trim().toLowerCase();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          ...attributionRef.current,
          userId: activeUser.uid,
          whatsappNumber: whatsappDigits,
          guestEmail: cleanEmail,
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });

        // Busca o preço canônico DEPOIS do save (o serverTotal do estado pode
        // estar defasado de renders anteriores). Passa esse valor pro PIX pra
        // garantir match exato — zero chance de "valor mudou".
        const freshPrice = await getIntentServerPrice(saveRes.intentId);
        const claimedTotal = freshPrice.ok && typeof freshPrice.total === 'number'
          ? freshPrice.total
          : total;
        if (freshPrice.ok && typeof freshPrice.total === 'number') {
          setServerTotal(freshPrice.total);
        }

        // Lê o cupom do localStorage (gravado quando user entra via /desconto/CODE).
        // ChatWizardClient grava aqui no localStorage.setItem('mycupid_discount_code').
        // Antes era passado null aqui — desconto NUNCA chegava no server-side, mesmo
        // o cupido mostrando "ganhou cupom" na UI. Cliente via promessa, pagava preço cheio.
        const discountCodeFromStorage = typeof window !== 'undefined'
          ? localStorage.getItem('mycupid_discount_code')
          : null;

        const pix = await processPixPayment(saveRes.intentId, claimedTotal, discountCodeFromStorage, {
          whatsapp: whatsappDigits,
          email: cleanEmail,
        }, getMpDeviceId());
        if (pix.error) {
          trackEvent('PaymentFailed', { method: 'pix', reason: pix.error, value: total });
          // Auto-recovery: se foi "valor mudou", busca o novo preço e atualiza
          // o UI silenciosamente. Usuário só precisa clicar "Gerar PIX" de novo
          // com o valor já correto — não mais "atualize a página".
          if (/valor mudou|price mismatch/i.test(pix.error)) {
            const refreshed = await getIntentServerPrice(saveRes.intentId);
            if (refreshed.ok && typeof refreshed.total === 'number') {
              setServerTotal(refreshed.total);
              setError(
                isUS
                  ? `Price updated to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(refreshed.total)}. Tap "Generate PIX" again.`
                  : `Valor atualizado pra ${BRL.format(refreshed.total)}. Clique em "Gerar PIX" de novo.`,
              );
              return;
            }
          }
          setError(pix.error);
          return;
        }
        if (pix.qrCode && pix.qrCodeBase64 && pix.paymentId) {
          trackEvent('PIXGenerated', { value: total, currency: siteCfg.currency });
          // Funnel — PIX gerado com sucesso. Alimenta o "→ PIX gerado" no
          // painel e o drop PIXGenerated→Paid (principal gargalo real).
          trackFunnelStep('pix_generated', 14, 15);
          setPixData({
            qrCode: pix.qrCode,
            qrCodeBase64: pix.qrCodeBase64,
            paymentId: pix.paymentId,
            createdAt: Date.now(),
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao conectar com o pagamento.');
      } finally {
        releaseSubmitGuard();
      }
    });
  }, [emailInput, phone, getValues, setValue, total, ensureUser, siteCfg.currency, acquireSubmitGuard, releaseSubmitGuard]);

  const handleCard = useCallback(() => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())) {
      setError(t('emailInvalid'));
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError(t('phoneInvalid'));
      return;
    }
    if (!acquireSubmitGuard()) return;
    startTransition(async () => {
      try {
        const activeUser = await ensureUser();
        if (!activeUser) {
          setError('Sessão não pôde ser iniciada. Atualize a página ou desative bloqueadores.');
          releaseSubmitGuard();
          return;
        }
        const data = getValues();
        const whatsappDigits = phone.replace(/\D/g, '');
        const cleanEmail = emailInput.trim().toLowerCase();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          ...attributionRef.current,
          userId: activeUser.uid,
          whatsappNumber: whatsappDigits,
          guestEmail: cleanEmail,
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const domain = window.location.origin;
        const session = await createMercadoPagoCardSession(saveRes.intentId, domain, {
          whatsapp: whatsappDigits,
          email: cleanEmail,
        }, getMpDeviceId());
        if (!session.success) {
          trackEvent('PaymentFailed', { method: 'card', reason: session.error, value: total });
          setError(session.error || (isUS ? 'Failed to create payment session.' : 'Erro ao criar sessão de pagamento.'));
          return;
        }
        window.location.href = session.url;
      } catch (e: any) {
        trackEvent('PaymentFailed', { method: 'card', reason: e?.message, value: total });
        setError(e?.message || 'Erro ao conectar com o pagamento.');
      } finally {
        releaseSubmitGuard();
      }
    });
  }, [emailInput, phone, getValues, setValue, total, ensureUser, isUS, acquireSubmitGuard, releaseSubmitGuard]);

  const handleStripe = useCallback(() => {
    setError(null);
    const phoneMin = market === 'PT' ? 9 : 10;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())) {
      setError(market === 'PT' ? 'Por favor introduza um email válido.' : 'Please enter a valid email.'); return;
    }
    if (phone.replace(/\D/g, '').length < phoneMin) {
      setError(market === 'PT' ? 'Por favor introduza um número de telefone válido.' : 'Please enter a valid phone number.'); return;
    }
    if (!acquireSubmitGuard()) return;
    startTransition(async () => {
      try {
        const activeUser = await ensureUser();
        if (!activeUser) {
          setError(market === 'PT' ? 'Sessão não iniciada. Atualize ou desative bloqueadores.' : 'Session could not start. Refresh or disable blockers.');
          releaseSubmitGuard();
          return;
        }
        const data = getValues();
        const phoneDigits = phone.replace(/\D/g, '');
        const cleanEmail = emailInput.trim().toLowerCase();
        const currency = market === 'PT' ? 'EUR' : 'USD';
        const intentLocale = market === 'PT' ? 'pt' : 'en';
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          ...attributionRef.current,
          userId: activeUser.uid,
          whatsappNumber: phoneDigits,
          guestEmail: cleanEmail,
          locale: intentLocale,
          currency,
          market,
        });
        if (!saveRes.success) { setError(saveRes.error || 'Failed to save draft.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        // Server-trusted price pós-save — nunca usa valor defasado do cliente.
        const freshPrice = await getIntentServerPrice(saveRes.intentId);
        const claimedTotal = freshPrice.ok && typeof freshPrice.total === 'number'
          ? freshPrice.total
          : total;
        if (freshPrice.ok && typeof freshPrice.total === 'number') {
          setServerTotal(freshPrice.total);
        }
        const stripeDiscountCode = typeof window !== 'undefined'
          ? localStorage.getItem('mycupid_discount_code')
          : null;
        const session = await createStripeCheckoutSession(saveRes.intentId, claimedTotal, stripeDiscountCode, {
          phone: phoneDigits,
          email: cleanEmail,
        }, market);
        if (!session.success || !session.url) {
          trackEvent('PaymentFailed', { method: 'stripe', reason: session.error, value: total });
          setError(session.error || 'Failed to create checkout session.'); return;
        }
        window.location.href = session.url;
      } catch (e: any) {
        trackEvent('PaymentFailed', { method: 'stripe', reason: e?.message, value: total });
        setError(e?.message || 'Payment error.');
      } finally {
        releaseSubmitGuard();
      }
    });
  }, [emailInput, phone, getValues, setValue, total, ensureUser, acquireSubmitGuard, releaseSubmitGuard, market]);

  const handleAdminFinalize = useCallback(() => {
    if (!user || !intentId || !isAdmin) return;
    setError(null);
    startAdminAction(async () => {
      try {
        const res = await adminFinalizePage(intentId, user.uid);
        if (!res.success) { setError(res.error || (isUS ? 'Failed to finalize as admin.' : 'Falha ao finalizar como admin.')); return; }
        setPaid({ pageId: res.pageId });
      } catch (e: any) {
        setError(e?.message || (isUS ? 'Failed to finalize.' : 'Erro ao finalizar.'));
      }
    });
  }, [user, intentId, isAdmin]);

  const handleDryRunCard = useCallback(() => {
    if (!isAdmin) return;
    setError(null);
    setDryRunReport(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())) {
      setError(t('emailInvalid'));
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError(t('phoneInvalid'));
      return;
    }
    startDryRun(async () => {
      try {
        const activeUser = await ensureUser();
        if (!activeUser) { setError(t('sessionLoading')); return; }
        const data = getValues();
        const whatsappDigits = phone.replace(/\D/g, '');
        const cleanEmail = emailInput.trim().toLowerCase();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          ...attributionRef.current,
          userId: activeUser.uid,
          whatsappNumber: whatsappDigits,
          guestEmail: cleanEmail,
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const domain = window.location.origin;
        const report = await dryRunMercadoPagoCardSession(saveRes.intentId, domain, {
          whatsapp: whatsappDigits,
          email: cleanEmail,
        });
        setDryRunReport(report);
        if (!report.ok) setError(report.error || 'Dry-run falhou.');
      } catch (e: any) {
        setError(e?.message || 'Erro no dry-run.');
      }
    });
  }, [isAdmin, emailInput, phone, getValues, setValue, ensureUser]);

  const copyPix = useCallback(async () => {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [pixData]);

  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const handleDownloadQr = useCallback(async () => {
    if (!paid) return;
    setIsDownloadingQr(true);
    try {
      await downloadQrCard(paid.pageId, qrCodeDesign || 'classic', `mycupid-qrcode-${paid.pageId}.png`);
    } catch (e) {
      console.error('[qr] download failed', e);
      toast({ variant: 'destructive', title: t('downloadFailed'), description: t('downloadHint') });
    } finally {
      setIsDownloadingQr(false);
    }
  }, [paid, qrCodeDesign, toast]);

  const handleShareWhatsapp = useCallback(() => {
    if (!paid) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mycupid.com.br';
    const pageUrl = `${origin}/p/${paid.pageId}`;
    const shareLine = isUS ? 'I made something special for you 💌' : 'Fiz algo especial pra você 💌';
    const msg = title
      ? `${shareLine}\n\n${title}\n\n${pageUrl}`
      : `${shareLine}\n\n${pageUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [paid, title]);

  // Estado "pago" — mostra celebração + ações reais (ver página, whatsapp, QR)
  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="rounded-2xl p-6 text-center bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-emerald-500/5 ring-1 ring-emerald-400/40">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-4 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)]"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-1">
            {paid.isGift
              ? (isUS ? 'Gift redeemed 🎁' : 'Presente resgatado 🎁')
              : (isUS ? 'Your page is ready 💌' : 'Sua página tá pronta 💌')}
          </h3>
          <p className="text-sm text-white/70">
            {paid.isGift
              ? (isUS
                  ? 'Advanced plan unlocked for free. Open it below to see how it turned out.'
                  : 'Plano Avançado liberado sem custo. Abre aqui embaixo pra ver como ficou.')
              : (isUS
                  ? 'Payment confirmed. Open it below to see how it turned out.'
                  : 'O pagamento já foi confirmado. Abre aqui embaixo pra ver como ficou.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/p/${paid.pageId}`)}
          className="w-full h-12 rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          {isUS ? 'See my page' : 'Ver minha página'}
        </button>

        {/* WhatsApp share — botão principal, bem destacado */}
        <button
          type="button"
          onClick={handleShareWhatsapp}
          className="w-full h-14 rounded-xl font-bold text-white text-[15px] transition active:scale-[0.98] flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#25D366] to-[#1ebe57] hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(37,211,102,0.7)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {isUS ? 'Share my page (WhatsApp / SMS)' : 'Compartilhar minha página no WhatsApp'}
        </button>

        {/* QR download */}
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={isDownloadingQr}
          className="w-full h-12 rounded-xl font-semibold text-white/90 transition active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 ring-1 ring-white/10 disabled:opacity-60"
        >
          {isDownloadingQr ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {isUS ? 'Generating QR...' : 'Gerando QR...'}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {qrCodeDesign && qrCodeDesign !== 'classic'
                ? (isUS ? 'Download custom QR' : 'Baixar QR personalizado')
                : (isUS ? 'Download QR Code' : 'Baixar QR Code')}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push(isUS ? '/chat' : '/criar')}
          className="w-full h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 text-white/70 hover:text-white text-[13.5px] font-medium transition"
        >
          {isUS ? 'Create a new page' : 'Criar uma nova página'}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do pedido — card dark elegante com breakdown */}
      <div
        className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur"
        style={{
          boxShadow:
            '0 10px 40px -20px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
            <Sparkles className="w-3 h-3" />
            <span>{isUS ? 'Your order' : 'Seu pedido'}</span>
          </div>
          <span className="text-[11px] text-white/45">{isUS ? 'One-time payment' : 'Pagamento único'}</span>
        </div>

        {/* Breakdown linha por linha */}
        <div className="space-y-2 mb-3">
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] text-white/90 font-medium leading-tight">{item.label}</div>
                {item.hint && (
                  <div className="text-[11px] text-white/45 mt-0.5">{item.hint}</div>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                {item.originalValue && (
                  <span className="text-[11px] text-white/35 line-through tabular-nums">
                    {formatCurrencyForMarket(item.originalValue, market)}
                  </span>
                )}
                <span className={`text-[13px] font-semibold tabular-nums ${item.originalValue ? 'text-emerald-400' : 'text-white/85'}`}>
                  {formatCurrencyForMarket(item.value, market)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/55 font-semibold">Total</div>
            <div className="text-[11px] text-white/50 mt-0.5">{isUS ? 'Lifetime access · no subscription' : 'Acesso vitalício · sem mensalidade'}</div>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{formatCurrencyForMarket(total, market)}</div>
        </div>
      </div>

      {/* QR Code templates — só aparece antes de gerar o pagamento */}
      {!pixData && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 ring-1 ring-purple-400/25">
          <QrCodeSelector
            value={qrCodeDesign || 'classic'}
            onChange={(id) => setValue('qrCodeDesign', id, { shouldDirty: true })}
            onPriceChange={() => { /* total já recalcula via watch */ }}
          />
        </div>
      )}

      {/* Trust block — garantia + segurança ANTES dos campos de contato.
          Reduz hesitação de quem chega no checkout achando que é arriscado. */}
      {!pixData && !giftToken && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-green-500/5 ring-1 ring-emerald-400/30">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white leading-tight">
                {isUS ? '7-day money-back guarantee' : 'Garantia de 7 dias'}
              </p>
              <p className="text-[11.5px] text-white/60 mt-0.5">
                {isUS
                  ? 'Don\'t love it? Full refund, no questions asked.'
                  : 'Não gostou? Devolvemos 100% do valor, sem perguntas.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
            <div className="flex flex-col items-center gap-1 text-center">
              <Lock className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[10px] text-white/65 font-medium leading-tight">
                {isUS ? 'Encrypted payment' : 'Pagamento seguro'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[10px] text-white/65 font-medium leading-tight">
                {isUS ? 'Instant access' : 'Acesso imediato'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[10px] text-white/65 font-medium leading-tight">
                {isUS ? 'No subscription' : 'Sem mensalidade'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contato — email + whatsapp (obrigatórios) */}
      <div className="space-y-3 rounded-xl p-4 bg-white/[0.03] ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          <span>{isUS ? 'Your contact info' : 'Seus dados de contato'}</span>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/55 font-medium">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={emailInput}
            onChange={(e) => {
              // Remove caracteres invisíveis/zero-width que usuários às vezes colam
              // e quebram validação do MP silenciosamente.
              const cleaned = e.target.value.normalize('NFKC').replace(/[​-‏⁠﻿]/g, '');
              setEmailInput(cleaned);
            }}
            placeholder={isUS ? 'you@email.com' : 'seu@email.com'}
            className={cn(
              'w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.03] ring-1 focus:bg-white/[0.06] focus:ring-2 focus:outline-none transition',
              emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim())
                ? 'ring-red-400/50 focus:ring-red-400/60'
                : 'ring-white/10 focus:ring-pink-500/40'
            )}
          />
          {emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim()) && (
            <p className="text-[11px] text-red-300/90 px-0.5">{isUS ? 'Double-check the email — looks like something\'s off.' : 'Confere o email — parece que tá faltando algo.'}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/55 font-medium">{isPT ? 'Telefone' : isUS ? 'Phone' : 'WhatsApp'}</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={isPT ? formatPhonePT(phone) : isUS ? formatPhoneUS(phone) : formatPhoneBR(phone)}
            onChange={(e) => setValue('whatsappNumber', e.target.value.replace(/\D/g, ''), { shouldDirty: true })}
            placeholder={isPT ? '912 345 678' : isUS ? '(555) 123-4567' : '(11) 99999-9999'}
            className={cn(
              'w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.03] ring-1 focus:bg-white/[0.06] focus:ring-2 focus:outline-none transition tabular-nums',
              phone && phone.replace(/\D/g, '').length > 0 && phone.replace(/\D/g, '').length < (isPT ? 9 : 10)
                ? 'ring-red-400/50 focus:ring-red-400/60'
                : 'ring-white/10 focus:ring-pink-500/40'
            )}
          />
          <p className="text-[11px] text-white/45 px-0.5">{isUS ? 'We\'ll email you the page link as soon as the payment clears.' : 'Mandamos o link da página assim que o pagamento cair.'}</p>
        </div>
      </div>

      {/* Gift token — se tem presente pendente, oferece resgate gratuito em vez de cobrar */}
      {giftToken && !pixData && (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-pink-500/10 ring-1 ring-purple-400/40 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 ring-1 ring-purple-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white leading-tight">{isUS ? 'You have a gift 🎁' : 'Você tem um presente 🎁'}</p>
              <p className="text-[11.5px] text-white/55 mt-0.5">{isUS ? 'Advanced plan unlocked — no payment.' : 'Plano Avançado liberado, sem pagar nada.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRedeemGift}
            disabled={isRedeemingGift}
            className={cn(
              'w-full h-12 rounded-xl font-bold text-white transition flex items-center justify-center gap-2',
              'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
              'shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)] active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isRedeemingGift ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('finalizing')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {isUS ? 'Redeem my free gift' : 'Resgatar meu presente grátis'}
              </>
            )}
          </button>
          {error && (
            <div className="rounded-xl p-3 bg-red-500/10 ring-1 ring-red-400/40 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
              <span className="text-[12.5px] text-red-100/90 leading-relaxed">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Stripe checkout (mercado US) — botão único redireciona */}
      {!giftToken && isUS && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleStripe}
            disabled={isProcessing || !isContactValid}
            className={cn(
              'w-full h-14 rounded-2xl font-bold text-white text-[15px] transition flex items-center justify-center gap-2',
              'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
              'hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400',
              'shadow-[0_14px_40px_-12px_rgba(168,85,247,0.7)] active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting...</>
            ) : !isContactValid ? (
              <>Enter email + phone first</>
            ) : (
              <><Lock className="w-4 h-4" /> Pay {formatCurrencyForMarket(total, market)} securely</>
            )}
          </button>
          <div className="flex items-center justify-center gap-3 text-[11px] text-white/45">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Powered by Stripe · 256-bit encryption</span>
          </div>
          {error && (
            <div className="rounded-xl p-3 bg-red-500/10 ring-1 ring-red-400/30 text-[12.5px] text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Como pagar — destaque visual forte (some se tem gift pendente).
          PIX só faz sentido em BR — US/PT vão direto pro Stripe (sem seletor). */}
      {!giftToken && market === 'BR' && (
      <>
      <div>
        <div className="flex items-center gap-2 mb-2 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          <span>Como pagar</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {/* PIX — checkout transparente (QR gerado aqui mesmo) */}
          <button
            type="button"
            onClick={() => setMethod('pix')}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-2xl transition text-left ring-2 overflow-hidden',
              method === 'pix'
                ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-green-500/10 ring-emerald-400 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)]'
                : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] hover:ring-emerald-400/40'
            )}
          >
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition',
              method === 'pix'
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-md'
                : 'bg-white/[0.05] text-white/60 ring-1 ring-white/10'
            )}>
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[15px] font-bold text-white">PIX</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 font-bold uppercase tracking-wider">
                  {isUS ? 'instant' : 'instantâneo'}
                </span>
              </div>
              <div className="text-[12px] text-white/60 mt-0.5">
                {isUS ? 'Approved in seconds · no fees' : 'Aprovado em segundos · sem taxas'}
              </div>
            </div>
            {method === 'pix' && (
              <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-900" />
              </div>
            )}
          </button>

          {/* CARTÃO (MP) */}
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-2xl transition text-left ring-2 overflow-hidden',
              method === 'card'
                ? 'bg-gradient-to-br from-purple-500/20 via-fuchsia-500/10 to-pink-500/10 ring-purple-400 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.55)]'
                : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] hover:ring-purple-400/40'
            )}
          >
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition',
              method === 'card'
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                : 'bg-white/[0.05] text-white/60 ring-1 ring-white/10'
            )}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-white">{isUS ? 'Card' : 'Cartão'}</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 font-bold uppercase tracking-wider">
                  {isUS ? 'credit / debit' : 'crédito / débito'}
                </span>
              </div>
              <div className="text-[12px] text-white/60 mt-0.5">
                {isUS ? 'Credit or debit' : 'Crédito ou débito'}
              </div>
            </div>
            {method === 'card' && (
              <div className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-purple-900" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo do método */}
      <AnimatePresence mode="wait" initial={false}>
        {method === 'pix' ? (
          <motion.div
            key="pix"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {!pixData ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={market === 'BR' ? handlePix : handleStripe}
                  disabled={isProcessing || !isContactValid}
                  className={cn(
                    'w-full h-14 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2',
                    'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400',
                    'shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)]',
                    'disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> {isUS ? 'Generating QR...' : isPT ? 'A processar…' : 'Gerando QR...'}
                    </>
                  ) : !isContactValid ? (
                    <>
                      <AlertCircle className="w-5 h-5" /> {isUS ? 'Enter email + phone' : isPT ? 'Preenche email + telefone' : 'Preenche email + WhatsApp'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" /> {market === 'BR' ? `Gerar PIX de ${BRL.format(total)}` : (market === 'US' ? `Pay ${formatCurrencyForMarket(total, market)}` : `Pagar ${formatCurrencyForMarket(total, market)}`)}
                    </>
                  )}
                </button>
                <div className="mt-1 flex items-center justify-center gap-3 px-4 py-2.5">
                  <MercadoPagoLogo className="h-12" />
                  <span className="h-10 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                    <span className="text-[11.5px] font-semibold text-white/80">{isUS ? 'Secure payment' : 'Pagamento seguro'}</span>
                  </div>
                </div>
              </div>
            ) : pixExpired ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-5 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 ring-1 ring-amber-400/40 space-y-3 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 ring-1 ring-amber-400/40 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Seu PIX expirou</h3>
                  <p className="text-[13px] text-white/70 leading-relaxed">
                    PIX tem validade de 15 minutos. Não se preocupa — é só gerar um novo agora.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateNewPix}
                  className={cn(
                    'w-full h-12 rounded-xl font-bold text-white transition flex items-center justify-center gap-2',
                    'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400',
                    'shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] active:scale-[0.98]'
                  )}
                >
                  <Zap className="w-4 h-4" /> Gerar novo PIX
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-4 bg-white/[0.04] ring-1 ring-emerald-400/30 space-y-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className={cn(
                    "flex items-center gap-1.5 font-medium",
                    paymentDetected ? "text-amber-300" : "text-emerald-300",
                  )}>
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full animate-pulse",
                      paymentDetected ? "bg-amber-400" : "bg-emerald-400",
                    )} />
                    {paymentDetected ? '✨ Pagamento detectado, criando sua página…' : 'Aguardando pagamento'}
                  </div>
                  {!paymentDetected && (
                    <span className="text-white/50 tabular-nums">
                      Expira em {String(Math.floor(pixTimeLeft / 60)).padStart(2, '0')}:
                      {String(pixTimeLeft % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                  <Image
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    width={220}
                    height={220}
                    className="w-full max-w-[220px] h-auto"
                    unoptimized
                  />
                </div>

                <button
                  type="button"
                  onClick={copyPix}
                  className={cn(
                    'w-full h-11 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2',
                    copied
                      ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/50'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white ring-1 ring-white/10'
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar PIX copia-e-cola
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-white/50 leading-relaxed">
                  Abre seu app do banco, escolhe PIX copia-e-cola e cola o código. <br />
                  A gente confirma automaticamente em segundos.
                </p>

                <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/10">
                  <MercadoPagoLogo className="h-12" />
                  <span className="h-10 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                    <span className="text-[11.5px] font-semibold text-white/80">{isUS ? 'Secure payment' : 'Pagamento seguro'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <button
              type="button"
              onClick={handleCard}
              disabled={isProcessing || !isContactValid}
              className={cn(
                'w-full h-14 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2',
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
                'shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]',
                'disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {isUS ? 'Opening checkout...' : 'Abrindo checkout...'}
                </>
              ) : !isContactValid ? (
                <>
                  <AlertCircle className="w-5 h-5" /> {isUS ? 'Enter email + phone' : 'Preenche email + WhatsApp'}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> {isUS ? `Pay ${formatCurrencyForMarket(total, market)} by card` : `Pagar ${BRL.format(total)} no cartão`}
                </>
              )}
            </button>
            <div className="mt-1 flex flex-col items-center justify-center gap-2 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <MercadoPagoLogo className="h-12" />
                <span className="h-10 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                  <span className="text-[11.5px] font-semibold text-white/80">Pagamento seguro</span>
                </div>
              </div>
              <p className="text-[10.5px] text-center text-white/40">
                {isUS ? 'Visa · Mastercard · Amex · Discover' : 'Visa · Master · Elo · Amex · Hipercard'}
              </p>
            </div>

            {/* Admin: dry-run REAL no MP — cria preference e mostra o resultado */}
            {isAdmin && (
              <div className="mt-3 rounded-xl p-3 bg-amber-500/10 ring-1 ring-amber-400/30 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-amber-100/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-semibold uppercase tracking-wider text-[9.5px]">Modo admin — dry-run MP</span>
                </div>
                <button
                  type="button"
                  onClick={handleDryRunCard}
                  disabled={isDryRun}
                  className={cn(
                    'w-full h-11 rounded-lg font-semibold text-[13px] transition flex items-center justify-center gap-2',
                    'bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 ring-1 ring-amber-400/40',
                    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
                  )}
                >
                  {isDryRun ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Testando MP...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Testar MP (dry-run real)
                    </>
                  )}
                </button>
                <p className="text-[10.5px] text-amber-100/60 leading-snug">
                  Chama o Mercado Pago de verdade pra criar a preference e retorna o relatório.
                  Usa um <code className="text-amber-200/90">external_reference</code> separado — não interfere no pagamento real.
                </p>

                {dryRunReport && (
                  <div className={cn(
                    'mt-2 rounded-lg p-3 text-[11px] leading-relaxed space-y-1 ring-1',
                    dryRunReport.ok
                      ? 'bg-emerald-500/10 ring-emerald-400/30 text-emerald-100'
                      : 'bg-red-500/10 ring-red-400/40 text-red-100'
                  )}>
                    <div className="flex items-center gap-2 font-bold text-[12px] mb-1">
                      {dryRunReport.ok ? (
                        <><CheckCircle2 className="w-4 h-4" /> MP OK</>
                      ) : (
                        <><AlertCircle className="w-4 h-4" /> MP falhou</>
                      )}
                    </div>
                    <div><span className="opacity-60">Token configurado:</span> <b>{String(dryRunReport.tokenConfigured)}</b></div>
                    {dryRunReport.amount !== undefined && (
                      <div><span className="opacity-60">Valor:</span> <b>{BRL.format(dryRunReport.amount)}</b></div>
                    )}
                    {dryRunReport.plan && (
                      <div><span className="opacity-60">Plano:</span> <b>{dryRunReport.plan}</b></div>
                    )}
                    {dryRunReport.email && (
                      <div><span className="opacity-60">Email:</span> <b>{dryRunReport.email}</b></div>
                    )}
                    {dryRunReport.whatsapp && (
                      <div><span className="opacity-60">WhatsApp:</span> <b>{dryRunReport.whatsapp}</b></div>
                    )}
                    {dryRunReport.preferenceId && (
                      <div className="break-all"><span className="opacity-60">preferenceId:</span> <b>{dryRunReport.preferenceId}</b></div>
                    )}
                    {dryRunReport.notificationUrl && (
                      <div className="break-all"><span className="opacity-60">webhook:</span> <span className="opacity-80">{dryRunReport.notificationUrl}</span></div>
                    )}
                    {dryRunReport.backUrls && (
                      <details className="pt-1">
                        <summary className="cursor-pointer opacity-70 hover:opacity-100">back_urls</summary>
                        <div className="pl-2 mt-1 space-y-0.5 break-all opacity-80">
                          <div>success: {dryRunReport.backUrls.success}</div>
                          <div>failure: {dryRunReport.backUrls.failure}</div>
                          <div>pending: {dryRunReport.backUrls.pending}</div>
                        </div>
                      </details>
                    )}
                    {dryRunReport.initPoint && (
                      <div className="pt-1">
                        <a
                          href={dryRunReport.initPoint}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-400/20 hover:bg-emerald-400/30 font-semibold transition"
                        >
                          Abrir checkout ↗
                        </a>
                      </div>
                    )}
                    {dryRunReport.error && (
                      <div className="pt-1"><span className="opacity-60">erro:</span> <b>{dryRunReport.error}</b></div>
                    )}
                    {dryRunReport.errorDetail && (
                      <div className="break-all opacity-80"><span className="opacity-60">detalhe:</span> {dryRunReport.errorDetail}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

      {/* Admin shortcut */}
      {isAdmin && (
        <div className="rounded-xl p-3 bg-amber-500/10 ring-1 ring-amber-400/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span className="text-[12px] text-amber-100/90 font-medium">Admin</span>
          </div>
          <button
            type="button"
            onClick={handleAdminFinalize}
            disabled={!intentId || isAdminAction || isUploading}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 disabled:opacity-50 transition"
          >
            {isAdminAction ? t('finalizing') : t('finalizeFree')}
          </button>
        </div>
      )}

      {/* Erro global — só mostra se o erro NÃO está sendo exibido dentro de um
          card específico (gift / stripe). Evita a duplicação que aparecia pro
          usuário ("Sessão carregando" duas vezes empilhadas). */}
      {error && !giftToken && !isUS && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3 bg-red-500/10 ring-1 ring-red-400/40 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
          <span className="text-[12.5px] text-red-100/90 leading-relaxed">{error}</span>
        </motion.div>
      )}

      {/* Selos de confiança */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-white/40">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isUS ? 'Secure payment' : 'Pagamento seguro'}</span>
        </div>
        <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>{isUS ? 'Instant delivery' : 'Entrega imediata'}</span>
        </div>
      </div>
    </div>
  );
}
