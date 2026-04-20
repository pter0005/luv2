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
  createStripeCheckoutSession,
} from '@/app/criar/fazer-eu-mesmo/actions';

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);
  const isAnonymous = !!user && !user.email;

  const [guestEmail, setGuestEmail] = useState('');
  const phone = whatsappNumber || '';

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
    if (isAnonymous && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
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
          ...(isAnonymous ? { guestEmail } : {}),
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
  }, [user, isAnonymous, guestEmail, phone, getValues, setValue, total]);

  const handleCard = useCallback(() => {
    setError(null);
    if (!user) { setError('Sessão carregando, tenta de novo.'); return; }
    if (isAnonymous && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      setError('Preenche um email válido pra continuar.');
      return;
    }
    startTransition(async () => {
      try {
        const data = getValues();
        const saveRes = await createOrUpdatePaymentIntent({
          ...data,
          userId: user.uid,
          ...(isAnonymous ? { guestEmail } : {}),
        });
        if (!saveRes.success) { setError(saveRes.error || 'Erro ao salvar rascunho.'); return; }
        setValue('intentId', saveRes.intentId, { shouldDirty: false });
        const domain = window.location.origin;
        const session = await createStripeCheckoutSession(saveRes.intentId, (plan as 'basico' | 'avancado') ?? 'basico', domain);
        if (!session.success) { setError(session.error || 'Erro ao criar sessão de pagamento.'); return; }
        window.location.href = session.url;
      } catch (e: any) {
        setError(e?.message || 'Erro ao conectar com o pagamento.');
      }
    });
  }, [user, isAnonymous, guestEmail, getValues, setValue, plan]);

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

      {/* Email guest (se anônimo) */}
      {isAnonymous && (
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-white/50 font-medium">email</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.04] ring-1 ring-white/10 backdrop-blur focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/40 focus:outline-none transition"
          />
          <p className="text-[11px] text-white/45 px-1">
            pra criarmos sua conta e mandarmos o link da página
          </p>
        </div>
      )}

      {/* WhatsApp */}
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-wider text-white/50 font-medium">whatsapp</label>
        <input
          type="tel"
          inputMode="numeric"
          value={formatPhoneBR(phone)}
          onChange={(e) => setValue('whatsappNumber', e.target.value.replace(/\D/g, ''), { shouldDirty: true })}
          placeholder="(11) 99999-9999"
          className="w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/40 bg-white/[0.04] ring-1 ring-white/10 backdrop-blur focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/40 focus:outline-none transition tabular-nums"
        />
        <p className="text-[11px] text-white/45 px-1">mandamos o link assim que o pagamento cair</p>
      </div>

      {/* Seleção de método */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod('pix')}
          className={cn(
            'h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 transition ring-1',
            method === 'pix'
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 ring-emerald-400/60 shadow-[0_4px_20px_-8px_rgba(16,185,129,0.5)]'
              : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]'
          )}
        >
          <QrCode className={cn('w-5 h-5', method === 'pix' ? 'text-emerald-300' : 'text-white/60')} />
          <div className="flex items-center gap-1">
            <span className={cn('text-[13px] font-semibold', method === 'pix' ? 'text-white' : 'text-white/75')}>
              pix
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
              instantâneo
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMethod('card')}
          className={cn(
            'h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 transition ring-1',
            method === 'card'
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 ring-purple-400/60 shadow-[0_4px_20px_-8px_rgba(168,85,247,0.5)]'
              : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]'
          )}
        >
          <CreditCard className={cn('w-5 h-5', method === 'card' ? 'text-purple-300' : 'text-white/60')} />
          <span className={cn('text-[13px] font-semibold', method === 'card' ? 'text-white' : 'text-white/75')}>
            cartão
          </span>
        </button>
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
            <p className="text-[11px] text-center text-white/45 mt-2">
              checkout seguro via stripe · visa, master, elo, amex
            </p>
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
