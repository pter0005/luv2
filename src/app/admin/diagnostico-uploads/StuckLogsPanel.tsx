import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export const dynamic = 'force-dynamic';

type StuckLog = {
  id: string;
  kind: string;
  step?: string;
  route?: string;
  detail?: string;
  userId?: string;
  userAgent?: string;
  createdAt?: any;
};

const KIND_LABELS: Record<string, { label: string; color: string }> = {
  next_blocked: { label: 'Continuar bloqueado', color: '#fb923c' },
  button_stuck: { label: 'Botão travado', color: '#f59e0b' },
  upload_failed: { label: 'Upload falhou', color: '#ef4444' },
  counter_stuck: { label: 'Contador travado', color: '#facc15' },
};

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts._seconds) return new Date(ts._seconds * 1000);
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export default async function StuckLogsPanel() {
  let logs: StuckLog[] = [];
  let loadError = '';
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('wizard_stuck_logs').orderBy('createdAt', 'desc').limit(50).get();
    snap.forEach(doc => {
      const d = doc.data();
      logs.push({
        id: doc.id,
        kind: d.kind,
        step: d.step,
        route: d.route,
        detail: d.detail,
        userId: d.userId,
        userAgent: d.userAgent,
        createdAt: d.createdAt,
      });
    });
  } catch (err: any) {
    loadError = err?.message || 'erro ao carregar logs';
  }

  // Agrupa por kind pra sumário
  const byKind = new Map<string, number>();
  for (const log of logs) {
    byKind.set(log.kind, (byKind.get(log.kind) || 0) + 1);
  }

  return (
    <div className="rounded-xl mb-5 p-4 sm:p-5" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.25)' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251,146,60,0.18)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">Travamentos detectados</h2>
          <p className="text-[11px] text-zinc-400 leading-tight">Últimos 50 sinais de "wizard travou" capturados automaticamente. Se aparecer aqui, alguém ficou preso.</p>
        </div>
      </div>

      {loadError && (
        <p className="text-[11px] text-red-300 font-mono">{loadError}</p>
      )}

      {!loadError && logs.length === 0 && (
        <div className="rounded-lg bg-black/30 border border-white/10 p-4 text-center">
          <p className="text-[12px] text-green-300 font-bold">✓ Nenhum travamento detectado</p>
          <p className="text-[10px] text-zinc-500 mt-1">Se ninguém travou nas últimas horas, fica vazio. Bom sinal.</p>
        </div>
      )}

      {logs.length > 0 && (
        <>
          {/* Sumário por tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {Array.from(byKind.entries()).map(([kind, count]) => {
              const cfg = KIND_LABELS[kind] || { label: kind, color: '#71717a' };
              return (
                <div key={kind} className="rounded-lg bg-black/30 border border-white/10 p-2">
                  <p className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: cfg.color }}>{cfg.label}</p>
                  <p className="text-[18px] text-white font-black tabular-nums">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Lista detalhada */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {logs.map(log => {
              const cfg = KIND_LABELS[log.kind] || { label: log.kind, color: '#71717a' };
              const date = tsToDate(log.createdAt);
              return (
                <div key={log.id} className="rounded-lg bg-black/30 border border-white/10 p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {log.step && (
                      <span className="text-[10px] text-zinc-300 font-mono">step: {log.step}</span>
                    )}
                    {log.route && (
                      <span className="text-[10px] text-zinc-500 font-mono">{log.route}</span>
                    )}
                    {date && (
                      <span className="text-[10px] text-zinc-500 ml-auto">{relativeTime(date)}</span>
                    )}
                  </div>
                  {log.detail && (
                    <p className="text-[11px] text-zinc-300 font-mono break-all">{log.detail}</p>
                  )}
                  {(log.userId || log.userAgent) && (
                    <details className="mt-1">
                      <summary className="text-[9px] text-zinc-600 cursor-pointer">contexto</summary>
                      {log.userId && <p className="text-[9px] text-zinc-500 font-mono mt-0.5">uid: {log.userId}</p>}
                      {log.userAgent && <p className="text-[9px] text-zinc-500 break-all">{log.userAgent}</p>}
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
