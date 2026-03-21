'use client';

import { useState, useEffect, useTransition } from 'react';
import { createDiscountCode, getDiscountCodes, toggleDiscountCode, deleteDiscountCode } from './actions';
import { Tag, Plus, Copy, Check, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

type DiscountCode = {
  code: string; discount: number; maxUses: number; usedCount: number;
  active: boolean; usedEmails: string[]; createdAt: string; url: string;
};

export default function AdminDiscountPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newCode, setNewCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [maxUses, setMaxUses] = useState(90);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try { setCodes(await getDiscountCodes()); } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    if (!newCode.trim()) return;
    startTransition(async () => {
      const result = await createDiscountCode(newCode.trim(), discount, maxUses);
      if (result.success) {
        setNewCode('');
        setFeedback('✅ Código criado!');
        setTimeout(() => setFeedback(null), 3000);
        await load();
      } else {
        setFeedback(`❌ ${result.error}`);
      }
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggle = (code: string, active: boolean) => {
    startTransition(async () => { await toggleDiscountCode(code, !active); await load(); });
  };

  const handleDelete = (code: string) => {
    startTransition(async () => { await deleteDiscountCode(code); await load(); });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Tag className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Códigos de Desconto</h1>
          <p className="text-xs text-zinc-400">Links com desconto fixo, limite de usos e proteção por email</p>
        </div>
        <button onClick={load} disabled={isLoading} className="ml-auto p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Criar */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
        <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Criar novo código</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Código (ex: CUPIDO10)</label>
            <input
              type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="CUPIDO10"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-zinc-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Desconto (R$)</label>
              <input
                type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={1}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Limite de usos</label>
              <input
                type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} min={1}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
          </div>
          <button onClick={handleCreate} disabled={isPending || !newCode.trim()}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {isPending ? 'Criando...' : `Criar código com R$${discount} de desconto`}
          </button>
          {feedback && <p className="text-sm text-center">{feedback}</p>}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Códigos criados ({codes.length})</h2>
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">Carregando...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm bg-zinc-900 rounded-xl border border-zinc-800">Nenhum código criado ainda.</div>
        ) : codes.map(c => (
          <div key={c.code} className={`bg-zinc-900 rounded-xl border p-4 ${!c.active ? 'opacity-50' : 'border-green-500/20'}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-white text-base">{c.code}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">-R${c.discount}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.active ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-500'}`}>
                  {c.usedCount}/{c.maxUses} usos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggle(c.code, c.active)} disabled={isPending}
                  className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title={c.active ? 'Desativar' : 'Ativar'}>
                  {c.active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(c.code)} disabled={isPending}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded-lg truncate">{c.url}</code>
              <button onClick={() => handleCopy(c.url)} className="shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                {copied === c.url ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </button>
            </div>
            {c.usedEmails.length > 0 && (
              <button onClick={() => setExpandedEmails(expandedEmails === c.code ? null : c.code)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {expandedEmails === c.code ? 'Ocultar' : `Ver ${c.usedEmails.length} email(s) que usaram`}
              </button>
            )}
            {expandedEmails === c.code && (
              <div className="mt-2 space-y-1">
                {c.usedEmails.map(email => (
                  <p key={email} className="text-[10px] text-zinc-500 font-mono">{email}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
