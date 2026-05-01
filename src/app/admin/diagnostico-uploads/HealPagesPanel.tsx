'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Wrench, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type HealJob = {
  id: string;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  hoursWindow: number | null;
  totalPages: number;
  pagesProcessed: number;
  pagesHealed: number;
  filesHealed: number;
  filesFailed: number;
  errors: string[];
  done: boolean;
};

const WINDOW_OPTIONS: Array<{ label: string; hours: number | null }> = [
  { label: '24h', hours: 24 },
  { label: '72h', hours: 72 },
  { label: '7 dias', hours: 24 * 7 },
  { label: 'Tudo', hours: null },
];

export default function HealPagesPanel() {
  const [hoursWindow, setHoursWindow] = useState<number | null>(72);
  const [scanResult, setScanResult] = useState<{ pagesScanned: number; pagesWithTempRefs: number; totalTempRefs: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [job, setJob] = useState<HealJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function scan() {
    setScanning(true);
    setScanError('');
    setScanResult(null);
    try {
      const res = await fetch('/api/admin/heal-pages-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, hoursWindow }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `http_${res.status}`);
      setScanResult({ pagesScanned: data.pagesScanned, pagesWithTempRefs: data.pagesWithTempRefs, totalTempRefs: data.totalTempRefs });
    } catch (err: any) {
      setScanError(err?.message || 'erro desconhecido');
    } finally {
      setScanning(false);
    }
  }

  async function start() {
    setStarting(true);
    setConfirming(false);
    try {
      const res = await fetch('/api/admin/heal-pages-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursWindow }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) throw new Error(data.message || data.error || 'falhou');
      setJob({ id: data.jobId, status: 'running', startedAt: Date.now(), hoursWindow, totalPages: 0, pagesProcessed: 0, pagesHealed: 0, filesHealed: 0, filesFailed: 0, errors: [], done: false });
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/admin/heal-pages-batch?jobId=${data.jobId}`);
          const j: HealJob = await r.json();
          setJob(j);
          if (j.done && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch { /* retenta */ }
      }, 1500);
    } catch (err: any) {
      setScanError(err?.message || 'falhou ao iniciar');
    } finally {
      setStarting(false);
    }
  }

  const elapsed = job ? Math.round(((job.finishedAt || Date.now()) - job.startedAt) / 1000) : 0;
  const progress = job && job.totalPages > 0 ? Math.round((job.pagesProcessed / job.totalPages) * 100) : 0;

  return (
    <div className="rounded-xl mb-5 p-4 sm:p-5" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.25)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.18)' }}>
          <Wrench className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">Reconectar imagens nas páginas</h2>
          <p className="text-[11px] text-zinc-400 leading-tight">Pega lovepages que ainda têm refs <code className="text-[10px] bg-black/40 px-1 rounded">temp/</code> e move pros paths definitivos. Roda DEPOIS do restore.</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mr-1">Páginas das últimas:</span>
        {WINDOW_OPTIONS.map(opt => {
          const active = hoursWindow === opt.hours;
          const disabled = scanning || starting || job?.status === 'running';
          return (
            <button
              key={opt.label}
              onClick={() => { setHoursWindow(opt.hours); setScanResult(null); }}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-bold transition disabled:opacity-50',
                active ? 'bg-blue-500/25 text-blue-200 border border-blue-500/50' : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={scan}
        disabled={scanning || starting || job?.status === 'running'}
        className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] font-bold text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        Verificar páginas afetadas
      </button>

      {scanError && (
        <p className="text-[11px] text-red-300 font-mono mt-2 break-all">{scanError}</p>
      )}

      {scanResult && !job && (
        <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10">
          <p className="text-[12px] text-white font-bold mb-1">
            {scanResult.pagesWithTempRefs.toLocaleString('pt-BR')} páginas com imagens em <code className="text-[10px] bg-black/40 px-1 rounded">temp/</code>
          </p>
          <p className="text-[10px] text-zinc-400">
            Total: <b>{scanResult.totalTempRefs.toLocaleString('pt-BR')}</b> arquivos pra mover (de {scanResult.pagesScanned.toLocaleString('pt-BR')} páginas escaneadas)
          </p>
          {scanResult.pagesWithTempRefs > 0 && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-[12px] font-bold text-blue-300 inline-flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Reconectar {scanResult.totalTempRefs.toLocaleString('pt-BR')} arquivos
            </button>
          )}
          {confirming && (
            <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30">
              <p className="text-[11px] text-amber-200 mb-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Vai mover <b>{scanResult.totalTempRefs.toLocaleString('pt-BR')}</b> arquivos pra <code className="text-[9px]">lovepages/</code> e atualizar os docs. Confirma?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={start}
                  disabled={starting}
                  className="flex-1 px-3 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/40 border border-blue-500/50 text-[11px] font-bold text-blue-200 disabled:opacity-50"
                >
                  {starting ? 'iniciando...' : 'Sim, reconectar'}
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
              {job.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
              {job.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
              {job.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              {job.status === 'running' ? 'Reconectando...' : job.status === 'done' ? 'Concluído' : 'Erro'}
            </p>
            <span className="text-[10px] text-zinc-400 font-mono">{elapsed}s</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Páginas</p>
              <p className="text-[14px] text-white font-black">{job.pagesProcessed}/{job.totalPages}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Curadas</p>
              <p className="text-[14px] text-blue-300 font-black">{job.pagesHealed}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Arquivos</p>
              <p className="text-[14px] text-green-300 font-black">{job.filesHealed}</p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Falhou</p>
              <p className="text-[14px] text-red-300 font-black">{job.filesFailed}</p>
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
