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
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Zap,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { computeTotalBRL } from '@/lib/price';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import type { PageData } from '@/lib/wizard-schema';
import {
  createOrUpdatePaymentIntent,
  processPixPayment,
  verifyPaymentWithMercadoPago,
  adminFinalizePage,
} from '@/app/criar/fazer-eu-mesmo/actions';
import { createMercadoPagoCardSession, dryRunMercadoPagoCardSession, type MpDryRunReport } from '@/app/chat/mp-card-action';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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

export default function PaymentField() {
  const router = useRouter();
  const { user } = useUser();
  const { control, getValues, setValue } = useFormContext<PageData>();

  const [plan, introType, audioRecording, musicOption, intentId, whatsappNumber] = useWatch({
    control,
    name: ['plan', 'introType', 'audioRecording', 'musicOption', 'intentId', 'whatsappNumber'] as const,
  }) as [
    PageData['plan'],
    PageData['introType'],
    PageData['audioRecording'],
    PageData['musicOption'],
    PageData['intentId'],
    PageData['whatsappNumber']
  ];

  const total = useMemo(
    () => computeTotalBRL({ plan, introType, audioRecording, musicOption } as any),
    [plan, introType, audioRecording, musicOption]
  );

  const [method, setMethod] = useState<Method>('pix');
  const [isProcessing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<PixState | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState(0);
  const [paid, setPaid] = useState<{ pageId: string } | null>(null);
  const [isAdminAction, startAdminAction] = useTransition();
  const [isDryRun, startDryRun] = useTransition();
  const [dryRunReport, setDryRunReport] = useState<MpDryRunReport | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Em dev, todo mundo é admin (mesma regra do admin-guard server-side)
  const isDev = process.env.NODE_ENV !== 'production';
  const isAdmin = isDev || (!!user?.email && ADMIN_EMAILS.includes(user.email));

  // Email obrigatório pra todos — pré-preenche com email da conta se existir
  const [emailInput, setEmailInput] = useState(user?.email || '');
  useEffect(() => {
    if (user?.email && !emailInput) setEmailInput(user.email);
  }, [user?.email, emailInput]);
  const phone = whatsappNumber || '';

  // Não-admin não tem opção de cartão — força pix
  useEffect(() => {
    if (!isAdmin && method === 'card') setMethod('pix');
  }, [isAdmin, method]);

  // Garantir que o rascunho exista
  useEffect(() => {
    if (!user || intentId) return;
    const data = getValues();
    createOrUpdatePaymentIntent({ ...data, userId: user.uid }).then((res) => {
      if (res.success) setValue('intentId', res.intentId, { shouldDirty: false });
    });
  }, [user, intentId, getValues, setValue]);

  // Countdown Pix
  useEffect(() => {
    if (!pixData) return;
    const tick = () => {
      const elapsed = Date.now() - pixData.createdAt;
      const remaining = Math.max(0, 15 * 60 * 1000 - elapsed);
      setPixTimeLeft(Math.ceil(remaining / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pixData]);

  // Polling
  useEffect(() => {
    if (!pixData || !intentId || paid) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await verifyPaymentWithMercadoPago(pixData.paymentId, intentId);
        if (res.status === 'approved') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaid({ pageId: res.pageId });
        } else if (res.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(res.error || 'Erro ao verificar pagamento');
        }
      } catch { /* retry */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pixData, intentId, paid]);

  const handlePix = useCallback(() => {
    setError(null);
    if (!user) { setError('Sessão carregando, tenta de novo em um instante.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setError('Preenche um email válido pra continuar.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Preenche o WhatsApp com DDD.');
      return;
    }

    startTransition(async () => {
      try {
        const data = getValues();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          userId: user.uid,
          whatsappNumber: phone.replace(/\D/g, ''),
          guestEmail: emailInput.trim().toLowerCase(),
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });

        const pix = await processPixPayment(saveRes.intentId, total, null);
        if (pix.error) { setError(pix.error); return; }
        if (pix.qrCode && pix.qrCodeBase64 && pix.paymentId) {
          setPixData({
            qrCode: pix.qrCode,
            qrCodeBase64: pix.qrCodeBase64,
            paymentId: pix.paymentId,
            createdAt: Date.now(),
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao conectar com o pagamento.');
      }
    });
  }, [user, emailInput, phone, getValues, setValue, total]);

  const handleCard = useCallback(() => {
    setError(null);
    if (!user) { setError('Sessão carregando, tenta de novo.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setError('Preenche um email válido pra continuar.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Preenche o WhatsApp com DDD.');
      return;
    }
    startTransition(async () => {
      try {
        const data = getValues();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          userId: user.uid,
          whatsappNumber: phone.replace(/\D/g, ''),
          guestEmail: emailInput.trim().toLowerCase(),
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const domain = window.location.origin;
        const session = await createMercadoPagoCardSession(saveRes.intentId, domain);
        if (!session.success) { setError(session.error || 'Erro ao criar sessão de pagamento.'); return; }
        window.location.href = session.url;
      } catch (e: any) {
        setError(e?.message || 'Erro ao conectar com o pagamento.');
      }
    });
  }, [user, emailInput, phone, getValues, setValue]);

  const handleAdminFinalize = useCallback(() => {
    if (!user || !intentId || !isAdmin) return;
    setError(null);
    startAdminAction(async () => {
      try {
        const res = await adminFinalizePage(intentId, user.uid);
        if (!res.success) { setError(res.error || 'Falha ao finalizar como admin.'); return; }
        setPaid({ pageId: res.pageId });
      } catch (e: any) {
        setError(e?.message || 'Erro ao finalizar.');
      }
    });
  }, [user, intentId, isAdmin]);

  const handleDryRunCard = useCallback(() => {
    if (!isAdmin) return;
    setError(null);
    setDryRunReport(null);
    if (!user) { setError('Sessão carregando, tenta de novo.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setError('Preenche um email válido pra continuar.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Preenche o WhatsApp com DDD.');
      return;
    }
    startDryRun(async () => {
      try {
        const data = getValues();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          userId: user.uid,
          whatsappNumber: phone.replace(/\D/g, ''),
          guestEmail: emailInput.trim().toLowerCase(),
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const domain = window.location.origin;
        const report = await dryRunMercadoPagoCardSession(saveRes.intentId, domain);
        setDryRunReport(report);
        if (!report.ok) setError(report.error || 'Dry-run falhou.');
      } catch (e: any) {
        setError(e?.message || 'Erro no dry-run.');
      }
    });
  }, [isAdmin, user, emailInput, phone, getValues, setValue]);

  const copyPix = useCallback(async () => {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [pixData]);

  // Estado "pago" — mostra celebração + botão pra ver
  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
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
          <h3 className="text-lg font-bold text-white mb-1">prontinho! sua página tá no ar 💌</h3>
          <p className="text-sm text-white/70">
            mandamos o link pro whatsapp. bora abrir pra ver?
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/p/${paid.pageId}`)}
          className="w-full h-12 rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition active:scale-[0.98]"
        >
          ver minha página
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do pedido — card dark elegante */}
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
            <span>pedido</span>
          </div>
          <span className="text-[11px] text-white/45">pagamento único</span>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-white/90 font-semibold text-sm capitalize">
              plano {plan === 'avancado' ? 'avançado' : 'básico'}
            </div>
            <div className="text-[12px] text-white/50 mt-0.5">acesso vitalício · sem mensalidade</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white tabular-nums">{BRL.format(total)}</div>
          </div>
        </div>
      </div>

      {/* Contato — email + whatsapp (obrigatórios) */}
      <div className="space-y-3 rounded-xl p-4 bg-white/[0.03] ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          <span>seus dados de contato</span>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/55 font-medium">Email</label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="seu@email.com"
            className="w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.03] ring-1 ring-white/10 focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/40 focus:outline-none transition"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/55 font-medium">WhatsApp</label>
          <input
            type="tel"
            inputMode="numeric"
            value={formatPhoneBR(phone)}
            onChange={(e) => setValue('whatsappNumber', e.target.value.replace(/\D/g, ''), { shouldDirty: true })}
            placeholder="(11) 99999-9999"
            className="w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.03] ring-1 ring-white/10 focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/40 focus:outline-none transition tabular-nums"
          />
          <p className="text-[11px] text-white/45 px-0.5">Mandamos o link da página assim que o pagamento cair.</p>
        </div>
      </div>

      {/* Como pagar — destaque visual forte */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[10.5px] uppercase tracking-[0.18em] text-white/45">
          <span>como pagar</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {/* PIX */}
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
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-white">PIX</span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 font-bold uppercase tracking-wider">
                  instantâneo
                </span>
              </div>
              <div className="text-[12px] text-white/60 mt-0.5">Aprovado em segundos · sem taxas</div>
            </div>
            {method === 'pix' && (
              <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-900" />
              </div>
            )}
          </button>

          {/* CARTÃO (MP) — só admin por enquanto */}
          {isAdmin && (
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
              <div className="absolute top-1.5 right-1.5 text-[8.5px] px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-200 font-bold uppercase tracking-wider ring-1 ring-amber-400/30">
                admin
              </div>
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
                  <span className="text-[15px] font-bold text-white">Cartão</span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 font-bold uppercase tracking-wider">
                    até 12x
                  </span>
                </div>
                <div className="text-[12px] text-white/60 mt-0.5">Crédito ou débito · via Mercado Pago</div>
              </div>
              {method === 'card' && (
                <div className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-purple-900" />
                </div>
              )}
            </button>
          )}
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
              <button
                type="button"
                onClick={handlePix}
                disabled={isProcessing}
                className={cn(
                  'w-full h-14 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400',
                  'shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)]',
                  'disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]'
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> gerando qr...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" /> gerar pix de {BRL.format(total)}
                  </>
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-4 bg-white/[0.04] ring-1 ring-emerald-400/30 space-y-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    aguardando pagamento
                  </div>
                  <span className="text-white/50 tabular-nums">
                    expira em {String(Math.floor(pixTimeLeft / 60)).padStart(2, '0')}:
                    {String(pixTimeLeft % 60).padStart(2, '0')}
                  </span>
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
                      <CheckCircle2 className="w-4 h-4" /> copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> copiar pix copia-e-cola
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-white/50 leading-relaxed">
                  abre seu app do banco, escolhe pix copia-e-cola e cola o código. <br />
                  a gente confirma automaticamente em segundos.
                </p>
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
              disabled={isProcessing}
              className={cn(
                'w-full h-14 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2',
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
                'shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]',
                'disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> abrindo checkout...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> pagar {BRL.format(total)} no cartão
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-white/45">
              checkout seguro via mercado pago · visa, master, elo, amex
            </p>

            {/* Admin: dry-run REAL no MP — cria preference e mostra o resultado */}
            {isAdmin && (
              <div className="mt-3 rounded-xl p-3 bg-amber-500/10 ring-1 ring-amber-400/30 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-amber-100/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-semibold uppercase tracking-wider text-[9.5px]">modo admin — dry-run mp</span>
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
                      <Loader2 className="w-4 h-4 animate-spin" /> testando MP...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> testar MP (dry-run real)
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
                          abrir checkout ↗
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

      {/* Admin shortcut */}
      {isAdmin && (
        <div className="rounded-xl p-3 bg-amber-500/10 ring-1 ring-amber-400/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span className="text-[12px] text-amber-100/90 font-medium">admin</span>
          </div>
          <button
            type="button"
            onClick={handleAdminFinalize}
            disabled={!intentId || isAdminAction}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 disabled:opacity-50 transition"
          >
            {isAdminAction ? 'finalizando...' : 'finalizar sem pagar'}
          </button>
        </div>
      )}

      {error && (
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
          <span>pagamento seguro</span>
        </div>
        <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>entrega imediata</span>
        </div>
      </div>
    </div>
  );
}
