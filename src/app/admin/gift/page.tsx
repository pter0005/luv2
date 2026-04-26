'use client';

import { useState, useEffect, useTransition } from 'react';
import { createGiftToken, getAllGiftTokens, deleteGiftToken, type GiftToken, type GiftPlan } from './actions';
import { Plus, Copy, Check, Trash2, RefreshCw, ChevronDown, ChevronUp, Link, Crown, Star, Sparkles } from 'lucide-react';

const PLAN_OPTIONS: { value: GiftPlan; label: string; color: string; bg: string; border: string; icon: typeof Star }[] = [
  { value: 'basico', label: 'Básico', color: 'text-zinc-300', bg: 'bg-zinc-700/50', border: 'border-zinc-600', icon: Sparkles },
  { value: 'avancado', label: 'Avançado', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/40', icon: Star },
  { value: 'vip', label: 'VIP', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', icon: Crown },
];

function PlanBadge({ plan }: { plan: GiftPlan }) {
  const opt = PLAN_OPTIONS.find(p => p.value === plan) || PLAN_OPTIONS[1];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.bg} ${opt.color} border ${opt.border}`}>
      <Icon className="w-2.5 h-2.5" />
      {opt.label}
    </span>
  );
}

function PlanSelector({ value, onChange }: { value: GiftPlan; onChange: (v: GiftPlan) => void }) {
  return (
    <div className="flex gap-2">
      {PLAN_OPTIONS.map(opt => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selected
                ? `${opt.bg} ${opt.color} border-2 ${opt.border} shadow-lg`
                : 'bg-zinc-800/50 text-zinc-500 border-2 border-transparent hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminGiftPage() {
  const [tokens, setTokens] = useState<GiftToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [credits, setCredits] = useState(1);
  const [plan, setPlan] = useState<GiftPlan>('avancado');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setTokens(await getAllGiftTokens());
    } catch (e) {
      console.error('Erro ao carregar tokens:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createGiftToken(credits, note || undefined, plan);
      if (result.success) {
        setNote('');
        setFeedback('Link criado!');
        setTimeout(() => setFeedback(null), 3000);
        await load();
      }
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (token: string) => {
    startTransition(async () => {
      await deleteGiftToken(token);
      await load();
    });
  };

  const available = tokens.filter(t => !t.used).length;
  const used = tokens.filter(t => t.used).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
          <Link className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Links de Presente</h1>
          <p className="text-xs text-zinc-500">Gere links que dão páginas grátis para qualquer pessoa</p>
        </div>
        <button onClick={load} disabled={isLoading} className="ml-auto p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-b from-green-500/10 to-green-500/5 rounded-2xl p-4 text-center border border-zinc-800/80">
          <p className="text-3xl font-black text-green-400">{available}</p>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">Disponíveis</p>
        </div>
        <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-800/30 rounded-2xl p-4 text-center border border-zinc-800/80">
          <p className="text-3xl font-black text-zinc-500">{used}</p>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">Já usados</p>
        </div>
      </div>

      {/* Criar */}
      <div className="bg-zinc-900/60 backdrop-blur rounded-2xl p-5 border border-zinc-800/80 mb-6">
        <h2 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Gerar novo link</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Plano do presente</label>
            <PlanSelector value={plan} onChange={setPlan} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Quantas páginas grátis?</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCredits(c => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black text-purple-400 w-8 text-center tabular-nums">{credits}</span>
                <button onClick={() => setCredits(c => c + 1)}
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Observação (opcional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="Ex: Yasmin, influencer..."
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder-zinc-600" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10">
            <Plus className="w-4 h-4" />
            {isPending ? 'Gerando...' : `Gerar link com ${credits} página${credits > 1 ? 's' : ''} grátis`}
          </button>
          {feedback && <p className="text-sm text-green-400 text-center font-medium">{feedback}</p>}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Links gerados ({tokens.length})</h2>
        {isLoading ? (
          <div className="text-center py-10 text-zinc-600 text-sm">Carregando...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            Nenhum link criado ainda.
          </div>
        ) : (
          tokens.map(t => (
            <div key={t.token} className={`bg-zinc-900/60 backdrop-blur rounded-2xl border p-4 ${t.used ? 'border-zinc-800/60 opacity-50' : 'border-purple-500/15'}`}>
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlanBadge plan={t.plan} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.used ? 'bg-zinc-700/50 text-zinc-400' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {t.used ? 'Usado' : `${t.credits} grátis`}
                  </span>
                  {t.note && <span className="text-[11px] text-zinc-500">{t.note}</span>}
                </div>
                <button onClick={() => handleDelete(t.token)} disabled={isPending}
                  className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-zinc-400 bg-zinc-800/60 px-3.5 py-2 rounded-xl truncate font-mono">
                  {t.url}
                </code>
                <button onClick={() => handleCopy(t.url)}
                  className="shrink-0 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 transition-colors">
                  {copied === t.url
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>
              {t.used && t.usedByEmail && (
                <p className="text-[10px] text-zinc-600 mt-2">
                  Usado por: <span className="text-zinc-500">{t.usedByEmail}</span>
                  {t.usedAt && <> em {new Date(t.usedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</>}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
