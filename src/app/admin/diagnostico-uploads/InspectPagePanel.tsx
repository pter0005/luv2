'use client';

import { useState } from 'react';
import { Search, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

type FileCheck = { field: string; index?: number; path: string; url: string; exists: boolean; size: number };
type InspectResult = {
  pageId: string;
  intentId: string | null;
  intentCounts: any;
  pageCounts: any;
  fileChecks: FileCheck[];
  diagnostics: string[];
  pageData?: any;
  intentData?: any;
};

export default function InspectPagePanel() {
  const [pageId, setPageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InspectResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function inspect() {
    if (!pageId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const cleanId = pageId.trim().replace(/.*\/p\//, '').split(/[?#]/)[0]; // aceita URL completa
      const res = await fetch(`/api/admin/inspect-page?pageId=${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `http_${res.status}`);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl mb-5 p-4 sm:p-5" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.25)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.18)' }}>
          <Search className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">Inspecionar página</h2>
          <p className="text-[11px] text-zinc-400 leading-tight">Cole o pageId ou URL completa pra ver intent vs lovepage e descobrir o que sumiu.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          placeholder="pageId ou https://mycupid.com.br/p/..."
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white font-mono"
          onKeyDown={(e) => { if (e.key === 'Enter') inspect(); }}
        />
        <button
          onClick={inspect}
          disabled={loading || !pageId.trim()}
          className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[12px] font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Inspecionar
        </button>
      </div>

      {error && <p className="text-[11px] text-red-300 font-mono">{error}</p>}

      {result && (
        <div className="mt-3 space-y-3">
          {/* Diagnóstico */}
          {result.diagnostics.length === 0 ? (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-[12px] text-green-300 font-bold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Página OK — intent bate com lovepage
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-[12px] text-red-300 font-bold inline-flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {result.diagnostics.length} problemas detectados
              </p>
              <ul className="text-[11px] text-red-200 space-y-1 font-mono">
                {result.diagnostics.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </div>
          )}

          {/* Comparison intent vs page */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-black/30 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2">Intent (o que user mandou)</p>
              {result.intentCounts ? (
                <ul className="text-[11px] text-zinc-300 space-y-0.5 font-mono">
                  <li>gallery: {result.intentCounts.gallery}</li>
                  <li>timeline: {result.intentCounts.timeline}</li>
                  <li>memory: {result.intentCounts.memory}</li>
                  <li>puzzle: {result.intentCounts.hasPuzzle ? '✓' : '—'} (enable: {result.intentCounts.enablePuzzle ? '✓' : '—'})</li>
                  <li>audio: {result.intentCounts.hasAudio ? '✓' : '—'}</li>
                  <li>quiz: {result.intentCounts.enableQuiz ? '✓' : '—'} ({result.intentCounts.quizCount} perguntas)</li>
                  <li>wordGame: {result.intentCounts.enableWordGame ? '✓' : '—'} ({result.intentCounts.wordGameCount} palavras)</li>
                  <li>memoryGame enable: {result.intentCounts.enableMemoryGame ? '✓' : '—'}</li>
                </ul>
              ) : (
                <p className="text-[11px] text-zinc-500">intent não encontrado</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2">Lovepage (o que foi salvo)</p>
              <ul className="text-[11px] text-zinc-300 space-y-0.5 font-mono">
                <li>gallery: {result.pageCounts.gallery}</li>
                <li>timeline: {result.pageCounts.timeline}</li>
                <li>memory: {result.pageCounts.memory}</li>
                <li>puzzle: {result.pageCounts.hasPuzzle ? '✓' : '—'} (enable: {result.pageCounts.enablePuzzle ? '✓' : '—'})</li>
                <li>audio: {result.pageCounts.hasAudio ? '✓' : '—'}</li>
                <li>quiz: {result.pageCounts.enableQuiz ? '✓' : '—'} ({result.pageCounts.quizCount} perguntas)</li>
                <li>wordGame: {result.pageCounts.enableWordGame ? '✓' : '—'} ({result.pageCounts.wordGameCount} palavras)</li>
                <li>memoryGame enable: {result.pageCounts.enableMemoryGame ? '✓' : '—'}</li>
              </ul>
            </div>
          </div>

          {/* File checks */}
          {result.fileChecks.length > 0 && (
            <div className="p-3 rounded-lg bg-black/30 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2">
                Arquivos referenciados ({result.fileChecks.filter(f => f.exists).length}/{result.fileChecks.length} existem)
              </p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {result.fileChecks.map((f, i) => (
                  <div key={i} className="text-[10px] font-mono flex items-center gap-2">
                    <span className={f.exists ? 'text-green-400' : 'text-red-400'}>{f.exists ? '✓' : '✗'}</span>
                    <span className="text-zinc-400 shrink-0">{f.field}{f.index !== undefined ? `[${f.index}]` : ''}</span>
                    <span className="text-zinc-500 truncate">{f.path}</span>
                    {f.exists && <span className="text-zinc-600 ml-auto shrink-0">{Math.round(f.size / 1024)}KB</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            {showRaw ? '▾' : '▸'} Mostrar JSON completo
          </button>
          {showRaw && (
            <pre className="text-[9px] text-zinc-400 font-mono bg-black/40 p-2 rounded border border-white/10 overflow-auto max-h-96">
              {JSON.stringify({ pageData: result.pageData, intentData: result.intentData }, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
