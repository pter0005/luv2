'use client';

import { useState, useEffect, useTransition } from 'react';
import { createGiftToken, getAllGiftTokens, deleteGiftToken, type GiftToken } from './actions';
import { Gift, Plus, Copy, Check, Trash2, RefreshCw, ChevronDown, ChevronUp, Link } from 'lucide-react';

export default function AdminGiftPage() {
  const [tokens, setTokens] = useState<GiftToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [credits, setCredits] = useState(1);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setTokens(await getAllGiftTokens());
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createGiftToken(credits, note || undefined);
      if (result.success) {
        setNote('');
        setFeedback('✅ Link criado!');
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
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Link className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Links de Presente</h1>
          <p className="text-xs text-zinc-400">Gere links que dão páginas grátis para qualquer pessoa</p>
        </div>
        <button onClick={load} disabled={isLoading} className="ml-auto p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700">
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
          <p className="text-2xl font-black text-green-400">{available}</p>
          <p className="text-xs text-zinc-500 mt-1">Disponíveis</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
          <p className="text-2xl font-black text-zinc-500">{used}</p>
          <p className="text-xs text-zinc-500 mt-1">Já usados</p>
        </div>
      </div>

      {/* Criar */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
        <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Gerar novo link</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Quantas páginas grátis?</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setCredits(c => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700">
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="text-2xl font-black text-purple-400 w-8 text-center">{credits}</span>
              <button onClick={() => setCredits(c => c + 1)}
                className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Observação (opcional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Yasmin, parceiro influencer..."
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-zinc-500" />
          </div>
          <button onClick={handleCreate} disabled={isPending}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {isPending ? 'Gerando...' : `Gerar link com ${credits} página${credits > 1 ? 's' : ''} grátis`}
          </button>
          {feedback && <p className="text-sm text-green-400 text-center">{feedback}</p>}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Links gerados ({tokens.length})</h2>
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">Carregando...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm bg-zinc-900 rounded-xl border border-zinc-800">
            Nenhum link criado ainda.
          </div>
        ) : (
          tokens.map(t => (
            <div key={t.token} className={`bg-zinc-900 rounded-xl border p-4 ${t.used ? 'border-zinc-800 opacity-60' : 'border-purple-500/20'}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.used ? 'bg-zinc-700 text-zinc-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {t.used ? 'Usado' : `${t.credits} grátis`}
                  </span>
                  {t.note && <span className="text-xs text-zinc-500">· {t.note}</span>}
                </div>
                <button onClick={() => handleDelete(t.token)} disabled={isPending}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-2 rounded-lg truncate">
                  {t.url}
                </code>
                <button onClick={() => handleCopy(t.url)}
                  className="shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                  {copied === t.url
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>
              {t.usedAt && (
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  Usado em: {new Date(t.usedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
