'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCw, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

type Job = {
  id: string;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  prefix: string;
  totalFound: number;
  restored: number;
  failed: number;
  errors: string[];
  done: boolean;
};

export default function RestoreSoftDeletedPanel() {
  const [prefix, setPrefix] = useState('temp/');
  const [scanResult, setScanResult] = useState<{ count: number; totalSizeMB: number; sample: string[] } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function scan() {
    setScanning(true);
    setScanError('');
    setScanResult(null);
    try {
      const res = await fetch('/api/admin/restore-soft-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `http_${res.status}`);
      setScanResult({ count: data.count, totalSizeMB: data.totalSizeMB, sample: data.sample || [] });
    } catch (err: any) {
      setScanError(err?.message || 'erro desconhecido');
    } finally {
      setScanning(false);
    }
  }

  async function startRestore() {
    setStarting(true);
    setConfirming(false);
    try {
      const res = await fetch('/api/admin/restore-soft-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) throw new Error(data.message || data.error || 'falhou');
      setJob({ id: data.jobId, status: 'running', startedAt: Date.now(), prefix, totalFound: 0, restored: 0, failed: 0, errors: [], done: false });
      // Polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/admin/restore-soft-deleted?jobId=${data.jobId}`);
          const j: Job = await r.json();
          setJob(j);
          if (j.done && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch { /* ignora, retenta */ }
      }, 1500);
    } catch (err: any) {
      setScanError(err?.message || 'falhou ao iniciar');
    } finally {
      setStarting(false);
    }
  }

  const elapsed = job ? Math.round(((job.finishedAt || Date.now()) - job.startedAt) / 1000) : 0;
  const progress = job && job.totalFound > 0 ? Math.round(((job.restored + job.failed) / job.totalFound) * 100) : 0;

  return (
    <div className="rounded-xl mb-5 p-4 sm:p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.18)' }}>
          <RotateCw className="w-3.5 h-3.5 text-green-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">Restaurar arquivos excluídos</h2>
          <p className="text-[11px] text-zinc-400 leading-tight">Recupera tudo que foi soft-deleted no bucket (janela de 7 dias). Usa a JSON API do GCS.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="prefixo (ex: temp/)"
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white font-mono"
          disabled={scanning || starting || job?.status === 'running'}
        />
        <button
          onClick={scan}
          disabled={scanning || starting || job?.status === 'running'}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Verificar
        </button>
      </div>

      {scanError && (
        <p className="text-[11px] text-red-300 font-mono mt-2 break-all">{scanError}</p>
      )}

      {scanResult && !job && (
        <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10">
          <p className="text-[12px] text-white font-bold mb-1">
            {scanResult.count.toLocaleString('pt-BR')} arquivos encontrados ({scanResult.totalSizeMB} MB)
          </p>
          {scanResult.sample.length > 0 && (
            <details className="mt-1.5">
              <summary className="text-[10px] text-zinc-400 cursor-pointer">amostra ({scanResult.sample.length})</summary>
              <ul className="text-[10px] text-zinc-500 font-mono mt-1 space-y-0.5">
                {scanResult.sample.map((s, i) => <li key={i} className="truncate">{s}</li>)}
              </ul>
            </details>
          )}
          {scanResult.count > 0 && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-[12px] font-bold text-green-300 inline-flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Restaurar {scanResult.count.toLocaleString('pt-BR')} arquivos
            </button>
          )}
          {confirming && (
            <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30">
              <p className="text-[11px] text-amber-200 mb-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Vai restaurar <b>{scanResult.count.toLocaleString('pt-BR')}</b> arquivos. Confirma?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startRestore}
                  disabled={starting}
                  className="flex-1 px-3 py-1.5 rounded bg-green-500/30 hover:bg-green-500/40 border border-green-500/50 text-[11px] font-bold text-green-200 disabled:opacity-50"
                >
                  {starting ? 'iniciando...' : 'Sim, restaurar'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {job && (
        <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-white font-bold inline-flex items-center gap-1.5">
              {job.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-green-400" />}
              {job.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {job.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              {job.status === 'running' ? 'Restaurando...' : job.status === 'done' ? 'Concluído' : 'Erro'}
            </p>
            <span className="text-[10px] text-zinc-400 font-mono">{elapsed}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
              <p className="text-[14px] text-white font-black">{job.totalFound.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Restaurados</p>
              <p className="text-[14px] text-green-300 font-black">{job.restored.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Falharam</p>
              <p className="text-[14px] text-red-300 font-black">{job.failed.toLocaleString('pt-BR')}</p>
            </div>
          </div>
          {job.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-[10px] text-zinc-400 cursor-pointer">erros ({job.errors.length}{job.errors.length === 30 ? '+' : ''})</summary>
              <ul className="text-[10px] text-red-300 font-mono mt-1 space-y-0.5 max-h-40 overflow-auto">
                {job.errors.map((e, i) => <li key={i} className="truncate">{e}</li>)}
              </ul>
            </details>
          )}
          {job.done && (
            <button
              onClick={() => { setJob(null); setScanResult(null); setConfirming(false); }}
              className="mt-3 w-full px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-zinc-300"
            >
              Verificar novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
}
