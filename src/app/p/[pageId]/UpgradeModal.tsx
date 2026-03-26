'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createUpgradePayment, verifyUpgradePayment } from './upgradeActions';
import { X, Copy, Check, Infinity, Sparkles, Clock, Shield, Heart } from 'lucide-react';

function getTimeLeft(expireAt: any): { h: number; m: number; s: number } | null {
  if (!expireAt) return null;
  let ms: number;
  if (typeof expireAt === 'object' && (expireAt.seconds || expireAt._seconds)) {
    ms = ((expireAt.seconds || expireAt._seconds) * 1000) - Date.now();
  } else {
    ms = new Date(expireAt).getTime() - Date.now();
  }
  if (ms <= 0) return null;
  return {
    h: Math.floor(ms / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

export default function UpgradeModal({ pageId, expireAt }: { pageId: string; expireAt: any }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'offer' | 'pix' | 'success'>('offer');
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expireAt));
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrBase64, setQrBase64] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [polling, setPolling] = useState(false);

  // Mostra depois de 4 segundos, só uma vez por sessão
  useEffect(() => {
    const key = `upgrade_dismissed_${pageId}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [pageId]);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(expireAt)), 1000);
    return () => clearInterval(id);
  }, [expireAt]);

  // Polling pagamento
  const pollPayment = useCallback(async (pid: string) => {
    setPolling(true);
    let attempts = 0;
    const id = setInterval(async () => {
      attempts++;
      const result = await verifyUpgradePayment(pageId, pid);
      if (result.success) {
        clearInterval(id);
        setPolling(false);
        setStep('success');
        setTimeout(() => window.location.reload(), 3000);
      }
      if (attempts >= 120) { clearInterval(id); setPolling(false); }
    }, 5000);
  }, [pageId]);

  const handleDismiss = () => {
    sessionStorage.setItem(`upgrade_dismissed_${pageId}`, '1');
    setVisible(false);
  };

  const handlePay = async () => {
    if (!email || !email.includes('@')) { setError('Informe seu e-mail para receber o comprovante.'); return; }
    setLoading(true);
    setError('');
    const result = await createUpgradePayment(pageId, email);
    setLoading(false);
    if ('error' in result) { setError(result.error); return; }
    setQrCode(result.qrCode);
    setQrBase64(result.qrCodeBase64);
    setPaymentId(result.paymentId);
    setStep('pix');
    pollPayment(result.paymentId);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #0f0520 0%, #160a2e 50%, #0a0014 100%)',
              border: '1px solid rgba(168,85,247,0.25)',
              boxShadow: '0 0 80px rgba(168,85,247,0.2), 0 0 0 1px rgba(168,85,247,0.1)',
            }}
          >
            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.8),transparent)' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 rounded-full"
              style={{ background: 'rgba(168,85,247,0.08)', filter: 'blur(20px)' }} />

            {/* Fechar */}
            {step !== 'success' && (
              <button onClick={handleDismiss}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            )}

            <div className="p-6 pt-7">
              {/* ── OFERTA ── */}
              {step === 'offer' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Header */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                      <Clock size={10} />
                      {timeLeft
                        ? `Expira em ${pad(timeLeft.h)}h ${pad(timeLeft.m)}m ${pad(timeLeft.s)}s`
                        : 'Expirando em breve'}
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-2">
                      Torne sua página <span style={{ color: '#c084fc' }}>permanente</span> 💜
                    </h2>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Essa página some em breve. Por apenas <strong className="text-white">R$9,99</strong> ela fica online pra sempre.
                    </p>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2">
                    {[
                      { icon: Infinity, text: 'Página online para sempre, sem prazo' },
                      { icon: Shield, text: 'Todas as fotos e jogos preservados' },
                      { icon: Heart, text: 'A pessoa amada pode revisitar quando quiser' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.12)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(168,85,247,0.2)' }}>
                          <Icon size={14} className="text-purple-400" />
                        </div>
                        <p className="text-sm text-white/80">{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      placeholder="Seu e-mail (para comprovante)"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,85,247,0.25)' }}
                    />
                    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
                  </div>

                  {/* CTA */}
                  <button onClick={handlePay} disabled={loading}
                    className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                      boxShadow: '0 0 40px rgba(168,85,247,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando PIX...</>
                      : <><Sparkles size={18} /> Tornar permanente por R$9,99</>}
                  </button>

                  <p className="text-center text-[10px] text-white/25">Pagamento único via PIX · Sem mensalidade</p>
                </motion.div>
              )}

              {/* ── PIX ── */}
              {step === 'pix' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                  <div>
                    <p className="text-xs font-black tracking-widest uppercase text-purple-400 mb-1">PIX</p>
                    <h3 className="text-xl font-black text-white">Escaneie o QR Code</h3>
                    <p className="text-sm text-white/40 mt-1">R$9,99 · Pagamento único</p>
                  </div>

                  {qrBase64 && (
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-2xl">
                        <Image src={`data:image/png;base64,${qrBase64}`} alt="QR PIX" width={200} height={200} unoptimized />
                      </div>
                    </div>
                  )}

                  <button onClick={handleCopy}
                    className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
                    {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar código PIX</>}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                    <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    {polling ? 'Aguardando pagamento...' : 'Verificando...'}
                  </div>
                </motion.div>
              )}

              {/* ── SUCESSO ── */}
              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: 2, duration: 0.5 }}
                    className="text-6xl">💜</motion.div>
                  <h3 className="text-2xl font-black text-white">Página permanente!</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Sua página agora fica online para sempre. A pessoa amada pode revisitar a qualquer momento. 🎉
                  </p>
                  <div className="text-xs text-white/25">Recarregando a página...</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
