'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X, ChevronUp, ChevronDown, FileWarning } from 'lucide-react';
import type { ErrorLog } from '@/app/admin/AdminDashboard';

interface Props {
  initialErrors?: ErrorLog[];
  initialUnresolvedCount?: number;
}

export function ErrorStatusWidget({ initialErrors = [], initialUnresolvedCount = 0 }: Props) {
  const [errors, setErrors] = useState<ErrorLog[]>(initialErrors);
  const [unresolvedCount, setUnresolvedCount] = useState(initialUnresolvedCount);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchErrors = useCallback(async () => {
    try {
      const res = await fetch('/api/error-log?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setErrors(data.errors ?? []);
      setUnresolvedCount(data.unresolvedCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchErrors, 60_000);
    return () => clearInterval(interval);
  }, [fetchErrors]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await fetch(`/api/error-log/${id}/resolve`, { method: 'POST' });
      const next = errors.map(e => e.id === id ? { ...e, resolved: true } : e);
      setErrors(next);
      const newCount = next.filter(e => !e.resolved).length;
      setUnresolvedCount(newCount);
      if (newCount === 0) setOpen(false);
    } finally {
      setResolving(null);
    }
  };

  const handleResolveAll = async () => {
    if (!confirm(`Marcar ${unresolvedCount} erro(s) como resolvido(s)?`)) return;
    setResolvingAll(true);
    try {
      await fetch('/api/error-log/resolve-all', { method: 'POST' });
      setErrors(errors.map(e => ({ ...e, resolved: true })));
      setUnresolvedCount(0);
      setOpen(false);
    } finally {
      setResolvingAll(false);
    }
  };

  const unresolved = errors.filter(e => !e.resolved);
  const hasErrors = unresolvedCount > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-80 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(15,15,20,0.97)',
              border: hasErrors ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{ borderColor: hasErrors ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)' }}
            >
              <div className="flex items-center gap-2">
                {hasErrors
                  ? <AlertTriangle className="w-4 h-4 text-red-400" />
                  : <Check className="w-4 h-4 text-emerald-400" />}
                <span className={`text-sm font-bold ${hasErrors ? 'text-red-300' : 'text-emerald-400'}`}>
                  {hasErrors ? `${unresolvedCount} erro${unresolvedCount > 1 ? 's' : ''} no site` : 'Nenhum erro no site'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {hasErrors && (
                  <button
                    onClick={handleResolveAll}
                    disabled={resolvingAll}
                    className="text-[10px] text-zinc-500 hover:text-emerald-400 px-2 py-1 rounded border border-white/5 hover:border-emerald-500/30 transition-colors disabled:opacity-40"
                  >
                    {resolvingAll ? 'resolvendo...' : 'resolver todos'}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error list */}
            {unresolved.length > 0 ? (
              <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                {unresolved.slice(0, 8).map(err => {
                  const hasExtra = err.extra && (err.extra.files || err.extra.byFolder || err.extra.byError);
                  const isExpanded = expandedId === err.id;
                  return (
                    <div
                      key={err.id}
                      className="rounded-xl text-xs"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="flex items-start gap-3 px-3 py-2">
                        <div className="flex-grow min-w-0">
                          <p className="text-red-300 font-medium" style={{ display: '-webkit-box', WebkitLineClamp: isExpanded ? 99 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {err.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {err.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500">{err.category}</span>
                            )}
                            <p className="text-zinc-600 truncate">{err.url} · {err.createdAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasExtra && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : err.id)}
                              className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-amber-400 transition-colors"
                              title="Ver detalhes"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(err.id)}
                            disabled={resolving === err.id}
                            className="text-[10px] text-zinc-600 hover:text-emerald-400 px-2 py-1 rounded border border-transparent hover:border-emerald-500/30 transition-colors disabled:opacity-40"
                          >
                            {resolving === err.id ? '...' : 'resolver'}
                          </button>
                        </div>
                      </div>
                      {isExpanded && hasExtra && (
                        <div className="px-3 pb-2 pt-0 space-y-1.5 border-t border-white/5 mt-1">
                          {err.extra.pageId && (
                            <p className="text-zinc-500"><span className="text-zinc-400">Page:</span> {err.extra.pageId}</p>
                          )}
                          {err.extra.email && (
                            <p className="text-zinc-500"><span className="text-zinc-400">Email:</span> {err.extra.email}</p>
                          )}
                          {err.extra.byError && (
                            <p className="text-zinc-500">
                              <span className="text-zinc-400">Causas:</span>{' '}
                              {Object.entries(err.extra.byError as Record<string, number>).map(([k, v]) => `${k}(${v})`).join(', ')}
                            </p>
                          )}
                          {err.extra.files && Array.isArray(err.extra.files) && (
                            <div className="mt-1">
                              <p className="text-zinc-400 mb-0.5">Arquivos:</p>
                              <div className="max-h-32 overflow-y-auto space-y-0.5 pl-1">
                                {(err.extra.files as string[]).map((f: string, i: number) => (
                                  <p key={i} className="text-zinc-600 font-mono text-[10px] break-all">
                                    <FileWarning className="w-2.5 h-2.5 inline mr-1 text-red-400/60" />{f}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-zinc-500">Tudo certo! Nenhum erro não resolvido.</p>
              </div>
            )}

            <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] text-zinc-600">monitoramento ativo · atualiza a cada 60s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pill button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all"
        style={hasErrors ? {
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.35)',
          color: '#fca5a5',
        } : {
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.25)',
          color: '#86efac',
        }}
      >
        {hasErrors ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            {unresolvedCount} erro{unresolvedCount > 1 ? 's' : ''}
            <ChevronUp className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <Check className="w-3 h-3" />
            0 erros
            <ChevronUp className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </motion.button>
    </div>
  );
}
