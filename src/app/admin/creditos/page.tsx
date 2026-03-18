'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAllCredits, addCredits, setTotalCredits, removeUserCredits, type CreditEntry } from './actions';
import { Gift, Trash2, Plus, RefreshCw, ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react';

export default function AdminCreditosPage() {
  const [credits, setCreditsState] = useState<CreditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

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

  const handleAdd = () => {
    if (!email.trim()) { showFeedback('error', 'Informe um email.'); return; }
    startTransition(async () => {
      const result = await addCredits(email.trim(), amount, note || undefined);
      if (result.success) {
        showFeedback('success', `✅ ${amount} crédito(s) adicionado(s) para ${email}`);
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
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Créditos de Cortesia</h1>
          <p className="text-xs text-zinc-400">Dê páginas gratuitas para quem você quiser</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="ml-auto p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Emitido', value: totalEmitido, color: 'text-blue-400' },
          { label: 'Já Usados', value: totalUsado, color: 'text-red-400' },
          { label: 'Disponíveis', value: totalDisp, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
        <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Dar Créditos</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Email do usuário</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="usuario@email.com"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-zinc-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Quantidade</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmount(a => Math.max(1, a - 1))}
                  className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <span className="text-xl font-black text-green-400 w-8 text-center">{amount}</span>
                <button
                  onClick={() => setAmount(a => a + 1)}
                  className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Observação (opcional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: parceiro, influencer..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-zinc-500"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending || !email.trim()}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isPending ? 'Salvando...' : `Dar ${amount} crédito${amount > 1 ? 's' : ''} de cortesia`}
          </button>
        </div>

        {feedback && (
          <div className={`mt-3 px-4 py-2.5 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Usuários com Crédito ({credits.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">Carregando...</div>
        ) : credits.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm bg-zinc-900 rounded-xl border border-zinc-800">
            Nenhum crédito emitido ainda.
          </div>
        ) : (
          credits.map(entry => (
            <div key={entry.email} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-4">
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-white truncate">{entry.email}</p>
                {entry.note && <p className="text-xs text-zinc-500 mt-0.5">📝 {entry.note}</p>}
                {entry.lastUsedPageId && (
                  <p className="text-xs text-zinc-600 mt-0.5">Último uso: <span className="text-zinc-500">{entry.lastUsedPageId}</span></p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-zinc-500">Total: <span className="text-blue-400 font-bold">{entry.totalCredits}</span></span>
                  <span className="text-xs text-zinc-500">Usado: <span className="text-red-400 font-bold">{entry.usedCredits}</span></span>
                  <span className="text-xs text-zinc-500">Disponível: <span className="text-green-400 font-bold">{entry.availableCredits}</span></span>
                </div>
              </div>

              {/* Editar total */}
              {editingEmail === entry.email ? (
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(Number(e.target.value))}
                    min={0}
                    className="w-16 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-sm text-center"
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
                  <p className="text-2xl font-black text-green-400">{entry.availableCredits}</p>
                  <p className="text-[10px] text-zinc-500">restantes</p>
                </div>
              )}

              <div className="flex gap-1 shrink-0">
                {editingEmail !== entry.email && (
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
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
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
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
