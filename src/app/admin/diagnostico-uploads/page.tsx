import Link from 'next/link';
import { ArrowLeft, FileWarning, Clock, HardDrive, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import CopyReportButton from './CopyReportButton';
import RestoreSoftDeletedPanel from './RestoreSoftDeletedPanel';
import HealPagesPanel from './HealPagesPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FileSlot = {
  field: string;
  path: string;
  url: string | null;
  pathExists: boolean;
  inTemp: boolean;
  inLovepage: boolean;
  isStripped: boolean;
};

type FailedMove = {
  oldPath: string;
  newPath: string;
  error: string;
  errorClass: 'source_missing' | 'rate_limit' | 'timeout' | 'not_found' | 'other';
};

type Diagnostic = {
  errorLogId: string;
  errorMessage: string;
  loggedAt: string;
  loggedAtMs: number;
  intentId: string;
  pageId: string | null;
  intentExists: boolean;
  intentCreatedAt: string | null;
  intentCreatedAtMs: number | null;
  finalizedAt: string | null;
  finalizedAtMs: number | null;
  gapMinutes: number | null;
  email: string;
  userId: string;
  plan: string;
  paidAmount: number | null;
  finalizeAttempts: number;
  totalExpected: number;
  filesInTemp: number;
  filesMissing: number;
  filesInLovepage: number;
  strippedFromIntent: string[];
  fileSlots: FileSlot[];
  failedMoves: FailedMove[];
  rootCauseGuess: { tag: string; label: string; color: string; explanation: string };
};

function fmtBR(d: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  // Firestore Timestamp (Admin SDK)
  if (typeof ts.toDate === 'function') {
    try { return ts.toDate(); } catch { /* fallthrough */ }
  }
  // Plain object {_seconds, _nanoseconds} (vem de serverTimestamp serializado)
  if (typeof ts === 'object' && (typeof ts._seconds === 'number' || typeof ts.seconds === 'number')) {
    const s = ts._seconds ?? ts.seconds;
    return new Date(s * 1000);
  }
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

// Recursivamente coleta todos os file refs ({path, url}) de qualquer estrutura
function collectFiles(v: any, field: string, out: Array<{ field: string; path: string; url: string | null }> = []) {
  if (Array.isArray(v)) { v.forEach(it => collectFiles(it, field, out)); return out; }
  if (v && typeof v === 'object') {
    if (typeof v.path === 'string') {
      out.push({ field, path: v.path, url: typeof v.url === 'string' ? v.url : null });
    }
    for (const k in v) if (k !== 'path' && k !== 'url') collectFiles(v[k], field, out);
  }
  return out;
}

function classifyMoveError(err: string): FailedMove['errorClass'] {
  const e = (err || '').toLowerCase();
  if (e.includes('source_missing') || e.includes('source_not_found')) return 'source_missing';
  if (e.includes('429') || e.includes('503') || e.includes('rate') || e.includes('too many')) return 'rate_limit';
  if (e.includes('timeout') || e.includes('deadline')) return 'timeout';
  if (e.includes('not_found') || e.includes('not found') || e.includes('404')) return 'not_found';
  return 'other';
}

// Heurística de root cause baseada nos sinais agregados — exatamente os
// padrões que mapeamos na investigação manual.
function guessRootCause(d: {
  gapMinutes: number | null;
  filesMissing: number;
  failedMoves: FailedMove[];
  totalExpected: number;
  intentExists: boolean;
}): Diagnostic['rootCauseGuess'] {
  if (!d.intentExists) {
    return { tag: 'no-intent', label: 'Intent deletado', color: '#71717a',
      explanation: 'O documento payment_intent não existe mais (deletado ou TTL expirou). Sem dados para diagnosticar.' };
  }
  const gap = d.gapMinutes ?? 0;
  const sourceMissing = d.failedMoves.filter(f => f.errorClass === 'source_missing').length;
  const rateLimit = d.failedMoves.filter(f => f.errorClass === 'rate_limit').length;
  const timeout = d.failedMoves.filter(f => f.errorClass === 'timeout').length;

  if (rateLimit > 0 && rateLimit >= d.failedMoves.length / 2) {
    return { tag: 'rate-limit', label: 'Rate limit do Storage', color: '#fb923c',
      explanation: `${rateLimit} arquivos falharam com 429/rate. Reduzir CONCURRENCY do moveFileWithRetry ou paralelizar menos.` };
  }
  if (timeout > 0 && timeout >= d.failedMoves.length / 2) {
    return { tag: 'timeout', label: 'Timeout no move', color: '#facc15',
      explanation: `${timeout} arquivos falharam por timeout. Pode ser página muito grande ou GCS lento — aumentar maxDuration do webhook ou retentativas.` };
  }
  if (sourceMissing > 0) {
    return { tag: 'source-missing', label: 'Source sumiu durante o move', color: '#ef4444',
      explanation: `${sourceMissing} arquivos foram pra failed_file_moves com source_missing. Race entre moveFileWithRetry e o lifecycle do bucket — o arquivo existia no upload mas sumiu antes do copy.` };
  }
  if (d.filesMissing > 0 && d.failedMoves.length === 0) {
    if (gap > 60) {
      return { tag: 'lifecycle', label: 'Lifecycle do bucket deletou', color: '#dc2626',
        explanation: `Gap intent→finalize de ${gap} min sem entries em failed_file_moves. Provavelmente o bucket deletou os temp/ antes do finalize rodar (regra de TTL agressiva).` };
    }
    if (gap < 5) {
      return { tag: 'eventual-consistency', label: 'Eventual consistency / pre-flight curto', color: '#f59e0b',
        explanation: `Gap de ${gap} min e arquivos não-visíveis no Storage. Upload terminou no client mas GCS ainda não propagou — pre-flight do PIX (4s) e do finalize (15s) não esperaram o suficiente.` };
    }
    return { tag: 'unknown-gone', label: 'Arquivo sumiu (causa indefinida)', color: '#a78bfa',
      explanation: `${d.filesMissing} arquivos não estão no Storage e não há registro de falha de move. Pode ser upload incompleto (user fechou aba), HEIC rejeitado pelas regras, ou cleanup-expired cron.` };
  }
  if (d.filesMissing === 0 && d.failedMoves.length === 0 && d.totalExpected > 0) {
    return { tag: 'recovered', label: 'Recuperado', color: '#22c55e',
      explanation: 'Os arquivos hoje estão no Storage. O strip aconteceu no momento da finalização mas o cron self-heal ou /api/page-heal recuperou depois.' };
  }
  return { tag: 'unknown', label: 'Indefinido', color: '#71717a', explanation: 'Sinais insuficientes pra classificar.' };
}

async function loadDiagnostics(): Promise<Diagnostic[]> {
  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  // Query SÓ com orderBy — combinar where + orderBy num campo diferente exigiria
  // índice composto (que pode não existir em prod e crasha tudo). Filtramos em
  // memória, que pra 150 docs é trivial.
  const snap = await db.collection('error_logs')
    .orderBy('createdAt', 'desc')
    .limit(150)
    .get();

  const stripErrors = snap.docs
    .filter(d => {
      const data = d.data();
      const msg = String(data.message || '');
      const isPageCreation = data.category === 'page_creation';
      const isStripMsg = msg.includes('arquivos faltando');
      return isPageCreation && isStripMsg;
    })
    .slice(0, 30);

  const results: Diagnostic[] = [];

  for (const errDoc of stripErrors) {
    try {
    const err = errDoc.data();
    let parsedExtra: any = null;
    try { parsedExtra = err.extra ? JSON.parse(err.extra) : null; } catch { /* ignore */ }
    const intentId: string | null = parsedExtra?.intentId
      || (typeof err.url === 'string' && err.url.startsWith('intent:') ? err.url.slice(7) : null);
    const pageId: string | null = parsedExtra?.pageId || null;
    const strippedFiles: string[] = Array.isArray(parsedExtra?.strippedFiles) ? parsedExtra.strippedFiles : [];
    const loggedAt = tsToDate(err.createdAt);

    if (!intentId) continue;

    const intentSnap = await db.collection('payment_intents').doc(intentId).get();
    const intentExists = intentSnap.exists;
    const intentData = intentExists ? intentSnap.data()! : {};

    const intentCreatedAt = tsToDate(intentData.createdAt);
    let finalizedAt: Date | null = null;
    if (pageId) {
      try {
        const lp = await db.collection('lovepages').doc(pageId).get();
        if (lp.exists) {
          const lpData = lp.data()!;
          finalizedAt = tsToDate(lpData.filesMovedAt) || tsToDate(lpData.createdAt);
        }
      } catch { /* ignore */ }
    }
    const gapMinutes = (intentCreatedAt && finalizedAt)
      ? Math.round((finalizedAt.getTime() - intentCreatedAt.getTime()) / 60_000)
      : null;

    // Coleta arquivos que deveriam estar (do intent atual + paths "stripados")
    const expected: Array<{ field: string; path: string; url: string | null }> = [];
    for (const field of ['galleryImages','timelineEvents','memoryGameImages','puzzleImage','audioRecording','backgroundVideo'] as const) {
      collectFiles(intentData[field], field, expected);
    }
    // Adiciona stripados que não estão mais no intent
    const knownPaths = new Set(expected.map(e => e.path));
    for (const stripped of strippedFiles) {
      if (!knownPaths.has(stripped)) {
        expected.push({ field: '(stripado)', path: stripped, url: null });
      }
    }

    // Checa cada path no Storage — limit pra não estourar (40 arquivos por intent é farto)
    const slots: FileSlot[] = [];
    let inTemp = 0, missing = 0, inLovepage = 0;
    const checks = await Promise.all(expected.slice(0, 40).map(async (f) => {
      try {
        const [exists] = await bucket.file(f.path).exists();
        return { f, exists };
      } catch {
        return { f, exists: false };
      }
    }));
    for (const { f, exists } of checks) {
      const isTemp = f.path.startsWith('temp/');
      const isLp = f.path.startsWith('lovepages/');
      const isStripped = strippedFiles.includes(f.path);
      slots.push({
        field: f.field,
        path: f.path,
        url: f.url,
        pathExists: exists,
        inTemp: isTemp && exists,
        inLovepage: isLp && exists,
        isStripped,
      });
      if (isTemp && exists) inTemp++;
      if (isTemp && !exists) missing++;
      if (isLp && exists) inLovepage++;
    }

    // Procura entries em failed_file_moves
    const failedMoves: FailedMove[] = [];
    if (pageId) {
      try {
        const fmSnap = await db.collection('failed_file_moves')
          .where('pageId', '==', pageId).limit(100).get();
        fmSnap.docs.forEach(d => {
          const fm = d.data();
          failedMoves.push({
            oldPath: fm.oldPath || '?',
            newPath: fm.newPath || '?',
            error: fm.error || 'unknown',
            errorClass: classifyMoveError(fm.error || ''),
          });
        });
      } catch { /* ignore */ }
    }

    const rootCauseGuess = guessRootCause({
      gapMinutes, filesMissing: missing, failedMoves,
      totalExpected: expected.length, intentExists,
    });

    results.push({
      errorLogId: errDoc.id,
      errorMessage: String(err.message || ''),
      loggedAt: fmtBR(loggedAt),
      loggedAtMs: loggedAt?.getTime() ?? 0,
      intentId,
      pageId,
      intentExists,
      intentCreatedAt: intentCreatedAt ? fmtBR(intentCreatedAt) : null,
      intentCreatedAtMs: intentCreatedAt?.getTime() ?? null,
      finalizedAt: finalizedAt ? fmtBR(finalizedAt) : null,
      finalizedAtMs: finalizedAt?.getTime() ?? null,
      gapMinutes,
      email: String(intentData.guestEmail || intentData.userEmail || '—'),
      userId: String(intentData.userId || '—'),
      plan: String(intentData.plan || '—'),
      paidAmount: typeof intentData.paidAmount === 'number' ? intentData.paidAmount : null,
      finalizeAttempts: Number(intentData._finalizeAttempts) || 0,
      totalExpected: expected.length,
      filesInTemp: inTemp,
      filesMissing: missing,
      filesInLovepage: inLovepage,
      strippedFromIntent: strippedFiles,
      fileSlots: slots,
      failedMoves,
      rootCauseGuess,
    });
    } catch (e) {
      console.error('[diagnostico-uploads] failed to process error log', errDoc.id, e);
    }
  }

  return results;
}

export default async function DiagnosticoUploadsPage() {
  let diagnostics: Diagnostic[] = [];
  let loadError: string | null = null;
  try {
    diagnostics = await loadDiagnostics();
  } catch (e: any) {
    loadError = e?.message || 'Erro desconhecido ao carregar diagnósticos';
    console.error('[diagnostico-uploads]', e);
  }

  // Agrega root causes pra sumário
  const causeBreakdown: Record<string, { label: string; count: number; color: string }> = {};
  for (const d of diagnostics) {
    const key = d.rootCauseGuess.tag;
    if (!causeBreakdown[key]) causeBreakdown[key] = { label: d.rootCauseGuess.label, count: 0, color: d.rootCauseGuess.color };
    causeBreakdown[key].count++;
  }
  const causes = Object.entries(causeBreakdown).sort(([,a],[,b]) => b.count - a.count);
  const totalMissing = diagnostics.reduce((s, d) => s + d.filesMissing, 0);
  const reportMarkdown = buildReport({ diagnostics, causes, totalMissing, loadError });

  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>
      <header className="sticky top-0 z-50 border-b" style={{
        background: 'rgba(9,9,11,0.92)',
        borderColor: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 px-2 shrink-0">
              <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.18)' }}>
              <FileWarning className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white tracking-tight truncate">Diagnóstico de Uploads</h1>
              <p className="text-[10px] text-zinc-500 leading-tight hidden sm:block">Por que páginas estão sendo criadas com arquivos faltando</p>
            </div>
          </div>
          <CopyReportButton markdown={reportMarkdown} />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 max-w-5xl">

        <RestoreSoftDeletedPanel />
        <HealPagesPanel />

        {/* Erro de carregamento */}
        {loadError && (
          <div className="rounded-xl mb-5 p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1.5">Erro ao carregar</p>
            <p className="text-[12px] text-red-200 font-mono break-all">{loadError}</p>
            <p className="text-[11px] text-zinc-500 mt-2">Se for "requires an index", abre o link do erro no console do servidor pra criar o índice no Firestore.</p>
          </div>
        )}

        {/* Sumário agregado */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <SummaryCard label="Páginas afetadas" value={diagnostics.length} color="#ef4444" icon={<FileWarning className="w-3.5 h-3.5" />} />
          <SummaryCard label="Arquivos perdidos (total)" value={totalMissing} color="#f59e0b" icon={<HardDrive className="w-3.5 h-3.5" />} />
          <SummaryCard label="Causa principal" value={causes[0]?.[1].label || '—'} color={causes[0]?.[1].color || '#71717a'} icon={<AlertTriangle className="w-3.5 h-3.5" />} small />
        </div>

        {/* Breakdown de causas */}
        {causes.length > 0 && (
          <div className="rounded-xl mb-5 p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Onde elas se perdem</p>
            <div className="space-y-2">
              {causes.map(([tag, c]) => (
                <div key={tag} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-[12.5px] font-semibold text-white flex-1">{c.label}</span>
                  <span className="text-[11px] text-zinc-500 tabular-nums">{c.count} {c.count === 1 ? 'página' : 'páginas'}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                    <div className="h-full rounded-full" style={{ width: `${(c.count / diagnostics.length) * 100}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="rounded-lg mb-4 px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Cada card abaixo é uma página onde arquivos foram <strong className="text-white">stripados</strong> durante o finalize.
            O <strong className="text-white">"Onde se perde"</strong> mostra exatamente em qual etapa do pipeline o arquivo sumiu.
            <strong className="text-white"> Gap</strong> = tempo entre criar o intent e finalizar a página.
          </p>
        </div>

        {/* Lista */}
        {diagnostics.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Nenhum erro de "arquivos faltando" encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {diagnostics.map(d => <DiagnosticCard key={d.errorLogId} d={d} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, small }: { label: string; value: string | number; color: string; icon: React.ReactNode; small?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="text-[9.5px] font-bold uppercase tracking-widest opacity-80">{label}</span>
      </div>
      <div className={small ? 'text-[12px] font-bold text-white truncate' : 'text-xl font-black text-white tabular-nums'}>{value}</div>
    </div>
  );
}

function DiagnosticCard({ d }: { d: Diagnostic }) {
  const fieldGroups: Record<string, FileSlot[]> = {};
  for (const s of d.fileSlots) {
    if (!fieldGroups[s.field]) fieldGroups[s.field] = [];
    fieldGroups[s.field].push(s);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header do card */}
      <div className="px-4 py-3 border-b border-white/5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide" style={{
              background: `${d.rootCauseGuess.color}20`, color: d.rootCauseGuess.color, border: `1px solid ${d.rootCauseGuess.color}40`,
            }}>{d.rootCauseGuess.label}</span>
            <span className="text-[10.5px] text-zinc-500">{d.loggedAt}</span>
          </div>
          <p className="text-[13px] font-semibold text-white leading-snug">
            {d.strippedFromIntent.length} {d.strippedFromIntent.length === 1 ? 'arquivo' : 'arquivos'} stripado{d.strippedFromIntent.length === 1 ? '' : 's'}
            {d.email !== '—' && <span className="text-zinc-500 font-normal"> · {d.email}</span>}
          </p>
          <p className="text-[10.5px] text-zinc-600 mt-0.5 font-mono">intent:{d.intentId}</p>
        </div>
      </div>

      {/* Onde se perde — explicação */}
      <div className="px-4 py-3 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Onde se perde
        </p>
        <p className="text-[12px] text-zinc-300 leading-relaxed">{d.rootCauseGuess.explanation}</p>
      </div>

      {/* Métricas chave em grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <Metric label="Gap intent→finalize" value={d.gapMinutes != null ? `${d.gapMinutes} min` : '—'} highlight={d.gapMinutes != null && d.gapMinutes > 60 ? '#dc2626' : d.gapMinutes != null && d.gapMinutes < 5 ? '#f59e0b' : undefined} />
        <Metric label="Em temp/" value={`${d.filesInTemp}`} sub={`/${d.totalExpected}`} />
        <Metric label="Faltando no Storage" value={`${d.filesMissing}`} highlight={d.filesMissing > 0 ? '#ef4444' : undefined} />
        <Metric label="Movidos pra lovepage" value={`${d.filesInLovepage}`} highlight={d.filesInLovepage > 0 ? '#22c55e' : undefined} />
      </div>

      {/* Detalhes técnicos colapsáveis */}
      <details className="group">
        <summary className="px-4 py-2.5 text-[11px] font-semibold text-zinc-400 hover:text-white cursor-pointer flex items-center gap-2 select-none">
          <Clock className="w-3 h-3" />
          Detalhes técnicos
          <span className="ml-auto text-[10px] text-zinc-600 group-open:hidden">expandir</span>
          <span className="ml-auto text-[10px] text-zinc-600 hidden group-open:inline">recolher</span>
        </summary>
        <div className="px-4 pb-4 space-y-3 text-[11px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
            <Row label="Intent criado em" value={d.intentCreatedAt || '—'} />
            <Row label="Page finalizada em" value={d.finalizedAt || '—'} />
            <Row label="Plano" value={d.plan} />
            <Row label="Pago" value={d.paidAmount != null ? `R$ ${d.paidAmount.toFixed(2)}` : '—'} />
            <Row label="Tentativas de finalize" value={`${d.finalizeAttempts}`} />
            <Row label="userId" value={d.userId} mono />
            {d.pageId && <Row label="pageId" value={d.pageId} mono full />}
          </div>

          {/* Arquivos por campo */}
          {Object.keys(fieldGroups).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Arquivos por campo</p>
              <div className="space-y-2">
                {Object.entries(fieldGroups).map(([field, slots]) => (
                  <div key={field}>
                    <p className="text-[10.5px] text-zinc-500 mb-1 font-mono">{field} ({slots.length})</p>
                    <div className="space-y-0.5">
                      {slots.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 rounded font-mono text-[10px]" style={{
                          background: s.pathExists ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                        }}>
                          <span className="shrink-0" style={{ color: s.pathExists ? '#4ade80' : '#f87171' }}>
                            {s.pathExists ? '●' : '○'}
                          </span>
                          <span className="text-zinc-400 truncate flex-1" title={s.path}>{s.path}</span>
                          {s.isStripped && <span className="shrink-0 text-[9px] px-1 rounded bg-red-500/20 text-red-300">STRIPADO</span>}
                          {s.inLovepage && <span className="shrink-0 text-[9px] px-1 rounded bg-green-500/20 text-green-300">FINAL</span>}
                          {s.inTemp && <span className="shrink-0 text-[9px] px-1 rounded bg-blue-500/20 text-blue-300">TEMP</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* failed_file_moves */}
          {d.failedMoves.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                failed_file_moves ({d.failedMoves.length})
              </p>
              <div className="space-y-0.5">
                {d.failedMoves.slice(0, 10).map((fm, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono" style={{ background: 'rgba(239,68,68,0.06)' }}>
                    <span className="shrink-0 text-[9px] px-1 rounded bg-red-500/30 text-red-200 font-bold uppercase">{fm.errorClass}</span>
                    <span className="text-zinc-400 truncate" title={fm.oldPath}>{fm.oldPath}</span>
                  </div>
                ))}
                {d.failedMoves.length > 10 && <p className="text-[10px] text-zinc-600 px-2 pt-1">+ {d.failedMoves.length - 10} mais</p>}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function Metric({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: string }) {
  return (
    <div className="px-3 py-2.5" style={{ background: '#09090b' }}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[14px] font-black tabular-nums" style={{ color: highlight || 'white' }}>{value}</span>
        {sub && <span className="text-[10px] text-zinc-600 tabular-nums">{sub}</span>}
      </div>
    </div>
  );
}

function Row({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <span className="text-zinc-600">{label}: </span>
      <span className={(mono ? 'font-mono ' : '') + 'text-zinc-300'}>{value}</span>
    </div>
  );
}

// Gera markdown completo com tudo que o engenheiro precisa pra debugar.
// Inclui: contexto do app, sumário agregado, breakdown por causa, e por
// página: timing, paths esperados/presentes/faltando, failed_file_moves.
function buildReport(args: {
  diagnostics: Diagnostic[];
  causes: Array<[string, { label: string; count: number; color: string }]>;
  totalMissing: number;
  loadError: string | null;
}): string {
  const { diagnostics, causes, totalMissing, loadError } = args;
  const now = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const lines: string[] = [];
  lines.push('# Relatório de Diagnóstico de Uploads — MyCupid');
  lines.push('');
  lines.push(`**Gerado em:** ${now} (BRT)`);
  lines.push(`**Total de páginas afetadas:** ${diagnostics.length}`);
  lines.push(`**Total de arquivos perdidos:** ${totalMissing}`);
  if (loadError) {
    lines.push('');
    lines.push(`**⚠️ ERRO ao carregar:** \`${loadError}\``);
  }
  lines.push('');

  // ── Contexto técnico ──
  lines.push('## Contexto técnico (pra LLM/engenheiro)');
  lines.push('');
  lines.push('Stack: Next.js 14 (app router) + Firebase Admin SDK + Mercado Pago.');
  lines.push('');
  lines.push('Pipeline de upload:');
  lines.push('1. Cliente sobe foto pro Firebase Storage em `temp/{userId}/{folder}/{filename}` direto via SDK do browser.');
  lines.push('2. Cliente salva `{path, url}` no doc `payment_intents/{intentId}` (Firestore).');
  lines.push('3. Após pagamento aprovado (Mercado Pago webhook ou polling), `finalizeLovePage()` em `src/app/criar/fazer-eu-mesmo/actions.ts:783` move arquivos pra `lovepages/{pageId}/{folder}/{filename}` via Admin SDK `bucket.file().copy()`.');
  lines.push('4. Antes de mover, faz pre-flight check: 6 rounds × 5s polling esperando `bucket.file(path).exists()` retornar true (eventual consistency do GCS).');
  lines.push('5. Se não encontrar após pre-flight, tenta URL recovery: `fetch(url)` da URL salva, re-upload pro mesmo path.');
  lines.push('6. Se nem isso funcionar, `strippedFiles` lista os perdidos e gera log "Página criada com N arquivos faltando".');
  lines.push('');
  lines.push('Camadas de auto-recuperação:');
  lines.push('- `/api/page-heal` — quando cliente abre página e detecta URLs `temp/`, chama esse endpoint que tenta mover (rate-limit 3×5min).');
  lines.push('- `/api/cron/self-heal-images` — roda a cada 30min (Netlify cron), varre lovepages das últimas 72h e move qualquer `temp/` restante.');
  lines.push('- `failed_file_moves` Firestore collection — registro técnico de falhas de move por arquivo.');
  lines.push('');

  // ── Breakdown agregado ──
  lines.push('## Breakdown por causa raiz (heurística)');
  lines.push('');
  if (causes.length === 0) {
    lines.push('_Nenhum erro encontrado._');
  } else {
    lines.push('| Causa | Páginas | % |');
    lines.push('|---|---|---|');
    for (const [tag, c] of causes) {
      const pct = Math.round((c.count / diagnostics.length) * 100);
      lines.push(`| **${c.label}** \`(${tag})\` | ${c.count} | ${pct}% |`);
    }
  }
  lines.push('');

  // ── Por página ──
  if (diagnostics.length > 0) {
    lines.push('## Detalhe por página afetada');
    lines.push('');
    diagnostics.forEach((d, idx) => {
      lines.push(`### ${idx + 1}. \`${d.intentId}\` — ${d.rootCauseGuess.label}`);
      lines.push('');
      lines.push(`- **Quando:** ${d.loggedAt}`);
      lines.push(`- **Email:** ${d.email}`);
      lines.push(`- **userId:** \`${d.userId}\``);
      lines.push(`- **pageId:** ${d.pageId ? `\`${d.pageId}\`` : '—'}`);
      lines.push(`- **Plano:** ${d.plan}`);
      lines.push(`- **Pago:** ${d.paidAmount != null ? `R$ ${d.paidAmount.toFixed(2)}` : '—'}`);
      lines.push(`- **Tentativas de finalize:** ${d.finalizeAttempts}`);
      lines.push(`- **Intent criado em:** ${d.intentCreatedAt || '—'}`);
      lines.push(`- **Page finalizada em:** ${d.finalizedAt || '—'}`);
      lines.push(`- **GAP intent→finalize:** ${d.gapMinutes != null ? `${d.gapMinutes} min` : '—'}`);
      lines.push(`- **Arquivos esperados:** ${d.totalExpected} · **em temp/ visíveis:** ${d.filesInTemp} · **faltando:** ${d.filesMissing} · **em lovepages/:** ${d.filesInLovepage}`);
      lines.push('');
      lines.push(`**Diagnóstico heurístico:** ${d.rootCauseGuess.explanation}`);
      lines.push('');

      if (d.strippedFromIntent.length > 0) {
        lines.push('**Paths stripados pelo finalize:**');
        lines.push('```');
        d.strippedFromIntent.slice(0, 30).forEach(p => lines.push(p));
        if (d.strippedFromIntent.length > 30) lines.push(`... +${d.strippedFromIntent.length - 30} mais`);
        lines.push('```');
        lines.push('');
      }

      if (d.fileSlots.length > 0) {
        const missingSlots = d.fileSlots.filter(s => !s.pathExists);
        if (missingSlots.length > 0) {
          lines.push('**Arquivos faltando no Storage agora:**');
          lines.push('```');
          missingSlots.slice(0, 20).forEach(s => {
            const flags = [
              s.isStripped ? 'STRIPADO' : null,
              s.path.startsWith('temp/') ? 'temp/' : null,
              s.path.startsWith('lovepages/') ? 'lovepages/' : null,
            ].filter(Boolean).join(' ');
            lines.push(`[${s.field}] ${s.path} (${flags})`);
          });
          if (missingSlots.length > 20) lines.push(`... +${missingSlots.length - 20} mais`);
          lines.push('```');
          lines.push('');
        }
      }

      if (d.failedMoves.length > 0) {
        lines.push(`**failed_file_moves (${d.failedMoves.length} entries):**`);
        const byClass: Record<string, number> = {};
        d.failedMoves.forEach(fm => { byClass[fm.errorClass] = (byClass[fm.errorClass] || 0) + 1; });
        Object.entries(byClass).forEach(([k, v]) => lines.push(`- \`${k}\`: ${v}`));
        lines.push('');
        lines.push('Sample (max 10):');
        lines.push('```');
        d.failedMoves.slice(0, 10).forEach(fm => {
          lines.push(`[${fm.errorClass}] ${fm.oldPath} → ${fm.newPath}`);
          lines.push(`  ERROR: ${fm.error.slice(0, 200)}`);
        });
        lines.push('```');
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    });
  }

  // ── Pedido pra LLM ──
  lines.push('## Pedido');
  lines.push('');
  lines.push('Com base no breakdown acima, identifica:');
  lines.push('1. A causa raiz dominante (eventual consistency? lifecycle do bucket? rate limit? race condition no client?).');
  lines.push('2. O fix cirúrgico no código com path:linha.');
  lines.push('3. Se for problema de config (lifecycle do bucket, regras de Storage, índice Firestore), descreve o que ajustar e onde.');
  lines.push('');

  return lines.join('\n');
}
