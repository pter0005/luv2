'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ImageOff, CheckCircle, AlertTriangle, XCircle, Search,
    Play, Square, ExternalLink, Loader2, RefreshCw, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PageStatus = 'ok' | 'fixable' | 'partial' | 'lost';

type ScannedPage = {
    id: string;
    userId: string;
    plan: string;
    title: string;
    createdAt: string;
    totalFiles: number;
    tempFiles: number;
    existingFiles: number;
    missingFiles: number;
    badUrlFiles: number;
    status: PageStatus;
};

const STATUS_CONFIG: Record<PageStatus, { label: string; color: string; icon: React.ReactNode }> = {
    ok: { label: 'OK', color: 'text-green-400 border-green-500/30 bg-green-500/10', icon: <CheckCircle className="w-3 h-3" /> },
    fixable: { label: 'Corrigível', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', icon: <RefreshCw className="w-3 h-3" /> },
    partial: { label: 'Parcial', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: <AlertTriangle className="w-3 h-3" /> },
    lost: { label: 'Perdida', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: <XCircle className="w-3 h-3" /> },
};

export default function FixImagesPage() {
    const [pages, setPages] = useState<ScannedPage[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [mode, setMode] = useState<'idle' | 'scanning' | 'fixing' | 'dry'>('idle');
    const stopRef = useRef(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`]);
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const summary = {
        ok: pages.filter(p => p.status === 'ok').length,
        fixable: pages.filter(p => p.status === 'fixable').length,
        partial: pages.filter(p => p.status === 'partial').length,
        lost: pages.filter(p => p.status === 'lost').length,
    };

    const runLoop = async (startUrl: string, modeLabel: string) => {
        setIsRunning(true);
        stopRef.current = false;
        setLogs([]);
        if (modeLabel === 'scan') setPages([]);
        addLog(`Iniciando ${modeLabel}...`);

        let url: string | null = startUrl;
        let totalProcessed = 0;

        while (url && !stopRef.current) {
            try {
                addLog(`Buscando: ${url}`);
                const res = await fetch(url);
                const data = await res.json();

                if (data.fatal) {
                    addLog(`❌ ERRO FATAL: ${data.fatal}`);
                    break;
                }

                if (modeLabel === 'scan' && data.pages) {
                    setPages(prev => [...prev, ...data.pages]);
                    const [current, total] = data.processed.split('/').map(Number);
                    setProgress({ current, total });
                    addLog(`✅ ${data.pages.length} páginas escaneadas — ${data.processed} (${data.elapsed})`);
                    const s = data.summary;
                    addLog(`   OK: ${s.ok} | Corrigível: ${s.fixable} | Parcial: ${s.partial} | Perdida: ${s.lost}`);
                } else {
                    const [current, total] = data.processed.split('/').map(Number);
                    setProgress({ current, total });
                    addLog(`✅ Corrigidas: ${data.fixed} | Erros: ${data.errors} | ${data.processed} (${data.elapsed})`);
                    if (data.errorMessages?.length) {
                        data.errorMessages.forEach((e: string) => addLog(`   ⚠️ ${e}`));
                    }
                    if (data.fixedPages?.length) {
                        data.fixedPages.forEach((id: string) => addLog(`   ✔ ${id}`));
                    }
                }

                totalProcessed++;
                url = data.nextUrl ? `${data.nextUrl}` : null;

                if (!url) addLog(`🎉 Concluído! Total de lotes: ${totalProcessed}`);
            } catch (e: any) {
                addLog(`❌ Erro de rede: ${e.message}`);
                break;
            }
        }

        if (stopRef.current) addLog('⛔ Parado pelo usuário.');
        setIsRunning(false);
    };

    const handleScan = () => {
        setMode('scanning');
        runLoop('/api/fix-images?mode=scan', 'scan');
    };

    const handleDry = () => {
        setMode('dry');
        runLoop('/api/fix-images?dry=1', 'dry run');
    };

    const handleFix = () => {
        setMode('fixing');
        runLoop('/api/fix-images', 'fix');
    };

    const handleStop = () => {
        stopRef.current = true;
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="bg-card border-b border-border mb-8 sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="bg-red-500/20 p-2 rounded-full">
                                <ImageOff className="w-5 h-5 text-red-400" />
                            </div>
                            <h1 className="text-xl font-bold">Recuperar Imagens</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isRunning ? (
                            <>
                                <Button onClick={handleScan} variant="outline" size="sm" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
                                    <Search className="w-4 h-4 mr-2" />Escanear
                                </Button>
                                <Button onClick={handleDry} variant="outline" size="sm" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                                    <Play className="w-4 h-4 mr-2" />Simular
                                </Button>
                                <Button onClick={handleFix} size="sm" className="bg-red-600 hover:bg-red-700">
                                    <RefreshCw className="w-4 h-4 mr-2" />Corrigir Pra Valer
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleStop} variant="destructive" size="sm">
                                <Square className="w-4 h-4 mr-2" />Parar
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 space-y-6">
                {/* Progress */}
                {progress.total > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{isRunning ? 'Processando...' : 'Concluído'}</span>
                            <span>{progress.current}/{progress.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['ok', 'fixable', 'partial', 'lost'] as PageStatus[]).map(status => (
                        <Card key={status} className={cn('border-l-4', {
                            'border-l-green-500': status === 'ok',
                            'border-l-blue-500': status === 'fixable',
                            'border-l-amber-500': status === 'partial',
                            'border-l-red-500': status === 'lost',
                        })}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    {STATUS_CONFIG[status].icon}
                                    {STATUS_CONFIG[status].label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn('text-3xl font-black', {
                                    'text-green-400': status === 'ok',
                                    'text-blue-400': status === 'fixable',
                                    'text-amber-400': status === 'partial',
                                    'text-red-400': status === 'lost',
                                })}>{summary[status]}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="bg-black/50 border border-border rounded-xl p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className={cn('text-white/70', {
                                'text-red-400': log.includes('❌'),
                                'text-green-400': log.includes('✅') || log.includes('🎉'),
                                'text-amber-400': log.includes('⚠️'),
                                'text-white/40': log.includes('Buscando'),
                            })}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}

                {/* Pages table */}
                {pages.length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h2 className="font-bold">Páginas Escaneadas</h2>
                            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{pages.length} páginas</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Título</th>
                                        <th className="px-4 py-3">Plano</th>
                                        <th className="px-4 py-3">Arquivos</th>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {pages.map(page => {
                                        const s = STATUS_CONFIG[page.status];
                                        return (
                                            <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', s.color)}>
                                                        {s.icon}{s.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium truncate max-w-[200px]">{page.title}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{page.id.slice(0, 10)}...</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={cn('text-xs', page.plan === 'avancado' ? 'border-purple-500/40 text-purple-400' : 'border-blue-500/40 text-blue-400')}>
                                                        {page.plan}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    <div>Total: {page.totalFiles}</div>
                                                    <div className="text-red-400">Perdidos: {page.missingFiles}</div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {page.createdAt ? format(new Date(page.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
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

                {pages.length === 0 && !isRunning && mode === 'idle' && (
                    <div className="text-center py-20 text-muted-foreground">
                        <ImageOff className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Clique em "Escanear" para verificar o estado das imagens</p>
                    </div>
                )}
            </main>
        </div>
    );
}
