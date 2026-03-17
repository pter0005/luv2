'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldCheck, ArrowLeft, Search, Wrench, AlertTriangle,
  CheckCircle, XCircle, Clock, FileWarning, ImageOff,
  Loader2, StopCircle, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageInfo {
  id: string;
  userId: string;
  plan: string;
  title: string;
  createdAt: string | null;
  totalFiles: number;
  tempFiles: number;
  existingFiles: number;
  missingFiles: number;
  badUrlFiles: number;
  status: 'ok' | 'fixable' | 'partial' | 'lost';
}

interface ScanResult {
  pages: PageInfo[];
  processed: string;
  elapsed: string;
  nextUrl: string | null;
  summary: { ok: number; fixable: number; partial: number; lost: number };
}

interface FixResult {
  dryRun: boolean;
  fixed: number;
  skipped: number;
  errors: number;
  processed: string;
  elapsed: string;
  fixedPages: string[];
  nextUrl: string | null;
  errorMessages: string[];
}

type Phase = 'idle' | 'scanning' | 'scanned' | 'fixing' | 'done';

const STATUS_CONFIG = {
  ok: { label: 'OK', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  fixable: { label: 'Corrigível', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  partial: { label: 'Parcial', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  lost: { label: 'Perdida', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
};

export default function AdminFixImagesPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [totals, setTotals] = useState({ ok: 0, fixable: 0, partial: 0, lost: 0 });
  const [progress, setProgress] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [fixStats, setFixStats] = useState({ fixed: 0, errors: 0, skipped: 0 });
  const abortRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`]);
  };

  // ── SCAN ──
  const startScan = async () => {
    setPhase('scanning');
    setPages([]);
    setLogs([]);
    setTotals({ ok: 0, fixable: 0, partial: 0, lost: 0 });
    abortRef.current = false;

    addLog('🔍 Iniciando scan de todas as páginas...');
    let url: string | null = '/api/fix-images?mode=scan&offset=0';
    let allPages: PageInfo[] = [];
    let runningTotals = { ok: 0, fixable: 0, partial: 0, lost: 0 };
    let batch = 1;

    while (url && !abortRef.current) {
      try {
        const res = await fetch(url);
        const data: ScanResult = await res.json();

        if ((data as any).fatal) {
          addLog(`❌ ERRO: ${(data as any).fatal}`);
          break;
        }

        allPages = [...allPages, ...data.pages];
        runningTotals.ok += data.summary.ok;
        runningTotals.fixable += data.summary.fixable;
        runningTotals.partial += data.summary.partial;
        runningTotals.lost += data.summary.lost;

        setPages([...allPages]);
        setTotals({ ...runningTotals });
        setProgress(data.processed);
        addLog(`📦 Lote ${batch}: ${data.pages.length} páginas escaneadas (${data.elapsed})`);

        url = data.nextUrl;
        batch++;
      } catch (e: any) {
        addLog(`❌ Erro de rede: ${e.message}`);
        break;
      }
    }

    addLog(
      `✅ Scan completo: ${runningTotals.ok} ok, ${runningTotals.fixable} corrigíveis, ${runningTotals.partial} parciais, ${runningTotals.lost} perdidas`
    );
    setPhase('scanned');
  };

  // ── FIX ──
  const startFix = async (dryRun: boolean) => {
    setPhase('fixing');
    setFixStats({ fixed: 0, errors: 0, skipped: 0 });
    abortRef.current = false;

    const mode = dryRun ? 'SIMULAÇÃO' : 'CORREÇÃO REAL';
    addLog(`🚀 Iniciando ${mode}...`);

    let url: string | null = `/api/fix-images?offset=0${dryRun ? '&dry=1' : ''}`;
    let totalFixed = 0, totalErrors = 0, totalSkipped = 0;
    let batch = 1;

    while (url && !abortRef.current) {
      try {
        const res = await fetch(url);
        const data: FixResult = await res.json();

        if ((data as any).fatal) {
          addLog(`❌ ERRO: ${(data as any).fatal}`);
          break;
        }

        totalFixed += data.fixed;
        totalErrors += data.errors;
        totalSkipped += data.skipped;
        setFixStats({ fixed: totalFixed, errors: totalErrors, skipped: totalSkipped });
        setProgress(data.processed);

        addLog(`📦 Lote ${batch}: ${data.fixed} corrigidas, ${data.skipped} ok, ${data.errors} erros (${data.elapsed})`);

        if (data.errorMessages?.length) {
          data.errorMessages.slice(0, 5).forEach((e) => addLog(`  ⚠️ ${e}`));
        }

        url = data.nextUrl;
        batch++;
      } catch (e: any) {
        addLog(`❌ Erro de rede: ${e.message}`);
        break;
      }
    }

    addLog(`🎉 ${mode} completa! ${totalFixed} corrigidas, ${totalErrors} erros, ${totalSkipped} já ok.`);
    setPhase('done');
  };

  const stop = () => {
    abortRef.current = true;
    addLog('⏹️ Parando...');
  };

  const progressPct = (() => {
    if (!progress) return 0;
    const [current, total] = progress.split('/').map(Number);
    return total > 0 ? (current / total) * 100 : 0;
  })();

  const isRunning = phase === 'scanning' || phase === 'fixing';

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border mb-8 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="bg-red-500/20 p-2 rounded-full">
                <ImageOff className="w-4 h-4 text-red-400" />
              </div>
              <h1 className="text-lg font-bold">Recuperar Imagens</h1>
            </div>
          </div>
          {isRunning && (
            <Button onClick={stop} variant="destructive" size="sm">
              <StopCircle className="w-4 h-4 mr-2" />Parar
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OK</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{totals.ok}</div>
              <p className="text-xs text-muted-foreground">imagens funcionando</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corrigíveis</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{totals.fixable}</div>
              <p className="text-xs text-muted-foreground">URL errada, arquivo ok</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parciais</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{totals.partial}</div>
              <p className="text-xs text-muted-foreground">algumas imagens perdidas</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perdidas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{totals.lost}</div>
              <p className="text-xs text-muted-foreground">arquivos deletados</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={startScan}
            disabled={isRunning}
            variant="outline"
            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
          >
            {phase === 'scanning' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {phase === 'scanning' ? 'Escaneando...' : '1. Escanear Páginas'}
          </Button>

          <Button
            onClick={() => startFix(true)}
            disabled={isRunning || phase === 'idle'}
            variant="outline"
            className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
          >
            {phase === 'fixing' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileWarning className="w-4 h-4 mr-2" />}
            2. Simular Correção
          </Button>

          <Button
            onClick={() => startFix(false)}
            disabled={isRunning || phase === 'idle'}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wrench className="w-4 h-4 mr-2" />
            3. Corrigir Pra Valer
          </Button>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso: {progress}</span>
              {phase === 'fixing' && (
                <span className="text-purple-400">
                  ✅ {fixStats.fixed} corrigidas · ⏭️ {fixStats.skipped} ok · ❌ {fixStats.errors} erros
                </span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  phase === 'scanning' ? 'bg-blue-500' : 'bg-purple-500'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Pages Table */}
        {pages.length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">Páginas Escaneadas</h2>
              <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                {pages.length} páginas
              </span>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Página</th>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Arquivos</th>
                    <th className="px-4 py-3 font-medium">Criada</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pages.map((page) => {
                    const cfg = STATUS_CONFIG[page.status];
                    const Icon = cfg.icon;
                    return (
                      <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.bg, cfg.color)}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[200px]">{page.title}</span>
                            <span className="text-xs text-muted-foreground">{page.id.slice(0, 12)}...</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                            page.plan === 'avancado' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          )}>
                            {page.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-xs">
                            <span>{page.existingFiles}/{page.totalFiles} existem</span>
                            {page.missingFiles > 0 && (
                              <span className="text-red-400">{page.missingFiles} perdidos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(page.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href={`/p/${page.id}`} target="_blank">
                              <ExternalLink className="w-3 h-3 mr-1" />Ver
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Log de Execução
              </h2>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('⚠️') ? 'text-yellow-400' :
                    log.includes('🎉') || log.includes('✅') ? 'text-green-400' :
                    'text-muted-foreground'
                  )}
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {phase === 'idle' && (
          <div className="text-center py-16 text-muted-foreground">
            <ImageOff className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">Recuperação de Imagens</p>
            <p className="text-sm">Clique em &quot;Escanear Páginas&quot; para verificar o estado de todas as páginas.</p>
          </div>
        )}
      </main>
    </div>
  );
}
    