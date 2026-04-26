'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAllCredits, addCredits, setTotalCredits, removeUserCredits, getEmailByPageId, type CreditEntry, type CreditPlan } from './actions';
import { Gift, Trash2, Plus, RefreshCw, ChevronDown, ChevronUp, Pencil, X, Check, Search, Crown, Star, Sparkles } from 'lucide-react';

const PLAN_OPTIONS: { value: CreditPlan; label: string; color: string; bg: string; border: string; icon: typeof Star }[] = [
  { value: 'basico', label: 'Básico', color: 'text-zinc-300', bg: 'bg-zinc-700/50', border: 'border-zinc-600', icon: Sparkles },
  { value: 'avancado', label: 'Avançado', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/40', icon: Star },
  { value: 'vip', label: 'VIP', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', icon: Crown },
];

function PlanBadge({ plan }: { plan: CreditPlan }) {
  const opt = PLAN_OPTIONS.find(p => p.value === plan) || PLAN_OPTIONS[1];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.bg} ${opt.color} border ${opt.border}`}>
      <Icon className="w-2.5 h-2.5" />
      {opt.label}
    </span>
  );
}

function PlanSelector({ value, onChange }: { value: CreditPlan; onChange: (v: CreditPlan) => void }) {
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

export default function AdminCreditosPage() {
  const [credits, setCreditsState] = useState<CreditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(1);
  const [plan, setPlan] = useState<CreditPlan>('avancado');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [pageIdInput, setPageIdInput] = useState('');
  const [pageIdFeedback, setPageIdFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const data = await getAllCredits();
    setCreditsState(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSearchPageId = async () => {
    if (!pageIdInput.trim()) return;
    setIsSearching(true);
    setPageIdFeedback(null);
    const result = await getEmailByPageId(pageIdInput.trim());
    setIsSearching(false);
    if (result.email) {
      setEmail(result.email);
      setPageIdFeedback({ type: 'success', msg: `Email encontrado: ${result.email}` });
    } else {
      setPageIdFeedback({ type: 'error', msg: result.error ?? 'Não encontrado.' });
    }
  };

  const handleAdd = () => {
    if (!email.trim()) { showFeedback('error', 'Informe um email.'); return; }
    startTransition(async () => {
      const result = await addCredits(email.trim(), amount, note || undefined, plan);
      if (result.success) {
        showFeedback('success', `${amount} crédito(s) ${PLAN_OPTIONS.find(p => p.value === plan)?.label} adicionado(s) para ${email}`);
        setEmail(''); setAmount(1); setNote('');
        await load();
      } else {
        showFeedback('error', result.error ?? 'Erro desconhecido.');
      }
    });
  };

  const handleDelete = (targetEmail: string) => {
    startTransition(async () => {
      const result = await removeUserCredits(targetEmail);
      if (result.success) {
        showFeedback('success', `Créditos de ${targetEmail} removidos.`);
        await load();
      } else {
        showFeedback('error', result.error ?? 'Erro.');
      }
      setConfirmDelete(null);
    });
  };

  const handleEdit = (entry: CreditEntry) => {
    setEditingEmail(entry.email);
    setEditValue(entry.totalCredits);
  };

  const handleEditSave = (email: string) => {
    startTransition(async () => {
      const result = await setTotalCredits(email, editValue);
      if (result.success) {
        showFeedback('success', `Créditos de ${email} atualizados para ${editValue}.`);
        await load();
      } else {
        showFeedback('error', result.error ?? 'Erro.');
      }
      setEditingEmail(null);
    });
  };

  const totalEmitido = credits.reduce((a, c) => a + c.totalCredits, 0);
  const totalUsado = credits.reduce((a, c) => a + c.usedCredits, 0);
  const totalDisp = credits.reduce((a, c) => a + c.availableCredits, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Créditos de Cortesia</h1>
          <p className="text-xs text-zinc-500">Dê páginas gratuitas para quem você quiser</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="ml-auto p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Emitido', value: totalEmitido, color: 'text-blue-400', gradient: 'from-blue-500/10 to-blue-500/5' },
          { label: 'Já Usados', value: totalUsado, color: 'text-red-400', gradient: 'from-red-500/10 to-red-500/5' },
          { label: 'Disponíveis', value: totalDisp, color: 'text-green-400', gradient: 'from-green-500/10 to-green-500/5' },
        ].map(({ label, value, color, gradient }) => (
          <div key={label} className={`bg-gradient-to-b ${gradient} rounded-2xl p-4 text-center border border-zinc-800/80`}>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Buscar por ID da página */}
      <div className="bg-zinc-900/60 backdrop-blur rounded-2xl p-5 border border-zinc-800/80 mb-4">
        <h2 className="text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Buscar por ID da Página</h2>
        <p className="text-[11px] text-zinc-600 mb-3">Pessoa sem email? Cole o ID da página dela aqui.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={pageIdInput}
            onChange={e => setPageIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchPageId()}
            placeholder="Ex: CLOGMrAk66u79KpyJHRK"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-zinc-600"
          />
          <button
            onClick={handleSearchPageId}
            disabled={isSearching || !pageIdInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
        {pageIdFeedback && (
          <div className={`mt-3 px-3.5 py-2 rounded-xl text-xs font-medium ${pageIdFeedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {pageIdFeedback.msg}
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="bg-zinc-900/60 backdrop-blur rounded-2xl p-5 border border-zinc-800/80 mb-6">
        <h2 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">Dar Créditos</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Email do usuário</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="usuario@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Plano do presente</label>
            <PlanSelector value={plan} onChange={setPlan} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Quantidade</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmount(a => Math.max(1, a - 1))}
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black text-green-400 w-8 text-center tabular-nums">{amount}</span>
                <button
                  onClick={() => setAmount(a => a + 1)}
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5 font-medium">Observação (opcional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: parceiro, influencer..."
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 placeholder-zinc-600"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending || !email.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
          >
            <Plus className="w-4 h-4" />
            {isPending ? 'Salvando...' : `Dar ${amount} crédito${amount > 1 ? 's' : ''} de cortesia`}
          </button>
        </div>

        {feedback && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
          Usuários com Crédito ({credits.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-10 text-zinc-600 text-sm">Carregando...</div>
        ) : credits.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            Nenhum crédito emitido ainda.
          </div>
        ) : (
          credits.map(entry => (
            <div key={entry.email} className="bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-800/80 p-4 flex items-center gap-4">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white truncate">{entry.email}</p>
                  <PlanBadge plan={entry.plan || 'avancado'} />
                </div>
                {entry.note && <p className="text-[11px] text-zinc-500 mb-1">{entry.note}</p>}
                {entry.lastUsedPageId && (
                  <p className="text-[10px] text-zinc-600 mb-1">Último uso: <span className="text-zinc-500 font-mono">{entry.lastUsedPageId}</span></p>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500">Total: <span className="text-blue-400 font-bold">{entry.totalCredits}</span></span>
                  <span className="text-[11px] text-zinc-500">Usado: <span className="text-red-400 font-bold">{entry.usedCredits}</span></span>
                  <span className="text-[11px] text-zinc-500">Disponível: <span className="text-green-400 font-bold">{entry.availableCredits}</span></span>
                </div>
              </div>

              {editingEmail === entry.email ? (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(Number(e.target.value))}
                    min={0}
                    className="w-16 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-sm text-center"
                  />
                  <button onClick={() => handleEditSave(entry.email)} className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 transition-colors">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => setEditingEmail(null)} className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors">
                    <X className="w-3.5 h-3.5 text-zinc-300" />
                  </button>
                </div>
              ) : (
                <div className="text-center shrink-0">
                  <p className="text-2xl font-black text-green-400 tabular-nums">{entry.availableCredits}</p>
                  <p className="text-[9px] text-zinc-600 font-medium">restantes</p>
                </div>
              )}

              <div className="flex gap-1 shrink-0">
                {editingEmail !== entry.email && (
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {confirmDelete === entry.email ? (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleDelete(entry.email)} disabled={isPending} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors">
                      Sim
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-colors">
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(entry.email)}
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/15 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
