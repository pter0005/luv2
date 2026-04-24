'use client';

import { useState, useTransition, useMemo } from 'react';
import { reprocessPageFiles, removeBrokenFileRefs } from './actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    RefreshCw, CheckCircle, XCircle, AlertTriangle,
    FileWarning, ChevronDown, ChevronUp, Loader2,
    ExternalLink, Trash2, Mail, MessageSquare, Crown, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FailedFile = {
    id: string;
    oldPath: string;
    newPath: string;
    error: string;
    createdAt: string | null;
    synthetic?: boolean; // true = detectado via scan (não tinha failed_file_moves real)
};

type PageWithIssue = {
    id: string;
    title: string;
    plan: string;
    userId: string;
    guestEmail?: string | null;
    whatsappNumber?: string | null;
    createdAt: string | null;
    failedFiles: FailedFile[];
};

type Stats = {
    totalFailed: number;
    totalResolved: number;
    totalPending: number;
};

type ReprocessResult = {
    success: boolean;
    moved: number;
    failed: number;
    error?: string;
} | null;

type RemoveResult = {
    success: boolean;
    removed: number;
    error?: string;
} | null;

// ── Badge de plano com cores distintas pra VIP/avancado/basico ──────────────
function PlanBadge({ plan }: { plan: string }) {
    if (plan === 'vip') {
        return (
            <Badge variant="outline" className="text-xs shrink-0 border-amber-400/50 text-amber-300 bg-amber-500/10">
                <Crown className="w-3 h-3 mr-1" /> VIP
            </Badge>
        );
    }
    if (plan === 'avancado') {
        return (
            <Badge variant="outline" className="text-xs shrink-0 border-purple-500/40 text-purple-400">
                Avançado
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-xs shrink-0 border-blue-500/40 text-blue-400">
            {plan === 'basico' ? 'Básico' : plan || 'desconhecido'}
        </Badge>
    );
}

// ── Formata phone BR pra exibição ──────────────────────────────────────────
function formatPhone(raw: string | null | undefined): string {
    if (!raw) return '';
    const d = raw.replace(/\D/g, '');
    if (d.length < 10) return raw;
    const cc = d.length >= 12 ? d.slice(0, -11) : '';
    const body = d.slice(-11);
    return `${cc ? '+' + cc + ' ' : ''}(${body.slice(0, 2)}) ${body.slice(2, 7)}-${body.slice(7)}`;
}

// ── Monta link wa.me com mensagem pronta pedindo reupload ───────────────────
function buildWhatsAppLink(phone: string, pageTitle: string, pageId: string): string {
    const digits = phone.replace(/\D/g, '');
    const full = digits.startsWith('55') ? digits : `55${digits}`;
    const msg = `Oi! Aqui é do MyCupid 💌 Vi que algumas fotos da sua página "${pageTitle}" tiveram problema no upload. Você pode reenviá-las acessando o link de edição que vou te mandar. Me responde esta mensagem que te passo os detalhes!`;
    return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

function PageIssueCard({ page }: { page: PageWithIssue }) {
    const [isReprocessing, startReprocess] = useTransition();
    const [isRemoving, startRemove] = useTransition();
    const [expanded, setExpanded] = useState(false);
    const [result, setResult] = useState<ReprocessResult>(null);
    const [removeResult, setRemoveResult] = useState<RemoveResult>(null);
    const [confirmingRemove, setConfirmingRemove] = useState(false);

    const handleReprocess = () => {
        setResult(null);
        setRemoveResult(null);
        startReprocess(async () => {
            const res = await reprocessPageFiles(page.id);
            setResult(res);
        });
    };

    const handleRemoveBroken = () => {
        if (!confirmingRemove) {
            setConfirmingRemove(true);
            return;
        }
        setRemoveResult(null);
        setResult(null);
        startRemove(async () => {
            const res = await removeBrokenFileRefs(page.id);
            setRemoveResult(res);
            setConfirmingRemove(false);
        });
    };

    // Sintético = só detectado via scan; real = tem failed_file_moves
    const syntheticCount = page.failedFiles.filter(f => f.synthetic).length;
    const realCount = page.failedFiles.length - syntheticCount;

    const busy = isReprocessing || isRemoving;

    return (
        <div className={cn(
            "rounded-xl border bg-card transition-all",
            page.plan === 'vip' && "ring-1 ring-amber-400/30",
            result?.success && result.moved > 0 && "border-green-500/40 bg-green-500/5",
            removeResult?.success && "border-zinc-500/40 bg-zinc-500/5",
            (result?.success === false || removeResult?.success === false) && "border-red-500/40 bg-red-500/5",
        )}>
            <div className="flex items-start justify-between p-4 gap-4 flex-wrap">
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-foreground truncate max-w-[60vw] md:max-w-none">{page.title}</span>
                        <PlanBadge plan={page.plan} />
                        {realCount > 0 && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                                <FileWarning className="w-3 h-3 mr-1" />
                                {realCount} log{realCount > 1 ? 's' : ''} de falha
                            </Badge>
                        )}
                        {syntheticCount > 0 && (
                            <Badge variant="outline" className="text-xs shrink-0 border-amber-500/40 text-amber-400">
                                <Search className="w-3 h-3 mr-1" />
                                {syntheticCount} órfão{syntheticCount > 1 ? 's' : ''} detectado{syntheticCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono">ID: {page.id.slice(0, 12)}...</span>
                        {page.createdAt && (
                            <span>Criada: {format(new Date(page.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        )}
                        {page.guestEmail && (
                            <span className="flex items-center gap-1 text-blue-400/80">
                                <Mail className="w-3 h-3" /> {page.guestEmail}
                            </span>
                        )}
                        {page.whatsappNumber && (
                            <span className="flex items-center gap-1 text-green-400/80">
                                <MessageSquare className="w-3 h-3" /> {formatPhone(page.whatsappNumber)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Link pra abrir a página em nova aba — admin confere se carrega */}
                    <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={`/p/${page.id}`} target="_blank">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver
                        </Link>
                    </Button>

                    {/* Link WhatsApp pronto se tem telefone */}
                    {page.whatsappNumber && (
                        <Button asChild variant="outline" size="sm" className="h-8 border-green-500/40 text-green-400 hover:bg-green-500/10">
                            <a
                                href={buildWhatsAppLink(page.whatsappNumber, page.title, page.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                WhatsApp
                            </a>
                        </Button>
                    )}

                    {/* Reprocessar — tenta mover temp/ → lovepages/ (se arquivos ainda existirem) */}
                    <Button
                        onClick={handleReprocess}
                        disabled={busy}
                        size="sm"
                        className={cn(
                            "h-8",
                            result?.success && result.moved > 0
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-amber-600 hover:bg-amber-700"
                        )}
                    >
                        {isReprocessing ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : result?.success && result.moved > 0 ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        {isReprocessing ? 'Reprocessando...' : result?.success && result.moved > 0 ? 'Resolvido!' : 'Reprocessar'}
                    </Button>

                    {/* Remover órfãos — ação destrutiva, duas cliques (confirma + confirma) */}
                    <Button
                        onClick={handleRemoveBroken}
                        disabled={busy}
                        size="sm"
                        variant={confirmingRemove ? 'destructive' : 'outline'}
                        className={cn('h-8', !confirmingRemove && 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300')}
                    >
                        {isRemoving ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                        )}
                        {isRemoving ? 'Removendo...' : confirmingRemove ? 'Confirmar remoção' : 'Remover órfãos'}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Aviso de confirmação pra "Remover órfãos" */}
            {confirmingRemove && !isRemoving && (
                <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-bold mb-0.5">Atenção: ação irreversível</p>
                        <p className="text-xs text-red-200/80">
                            Vou checar quais arquivos já foram deletados do storage e remover as referências mortas do doc.
                            As fotos são <strong>perdidas permanentemente</strong>. Use só depois de tentar "Reprocessar" primeiro.
                        </p>
                        <button
                            onClick={() => setConfirmingRemove(false)}
                            className="text-[11px] text-red-300 underline mt-1 hover:text-red-100"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Resultado do reprocessamento */}
            {result && (
                <div className={cn(
                    "mx-4 mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                    result.success && result.moved > 0 ? "bg-green-500/10 text-green-400" :
                    result.success && result.moved === 0 ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                )}>
                    {result.success && result.moved > 0 && <CheckCircle className="w-4 h-4 shrink-0" />}
                    {result.success && result.moved === 0 && <AlertTriangle className="w-4 h-4 shrink-0" />}
                    {!result.success && <XCircle className="w-4 h-4 shrink-0" />}
                    <span>
                        {result.success
                            ? result.moved > 0
                                ? `${result.moved} arquivo${result.moved > 1 ? 's' : ''} movido${result.moved > 1 ? 's' : ''} com sucesso!${result.failed > 0 ? ` (${result.failed} ainda falhou)` : ''}`
                                : 'Nenhum arquivo foi movido — provavelmente já foram deletados do storage. Tenta "Remover órfãos" pra limpar as refs mortas.'
                            : `Erro: ${result.error}`
                        }
                    </span>
                </div>
            )}

            {/* Resultado do remove órfãos */}
            {removeResult && (
                <div className={cn(
                    "mx-4 mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                    removeResult.success ? "bg-zinc-500/10 text-zinc-300" : "bg-red-500/10 text-red-400",
                )}>
                    {removeResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    <span>
                        {removeResult.success
                            ? removeResult.removed > 0
                                ? `${removeResult.removed} referência${removeResult.removed > 1 ? 's' : ''} morta${removeResult.removed > 1 ? 's' : ''} removida${removeResult.removed > 1 ? 's' : ''}. Cliente precisa reenviar as fotos via /editar.`
                                : 'Nenhuma ref morta encontrada — arquivos ainda existem no storage.'
                            : `Erro: ${removeResult.error}`
                        }
                    </span>
                </div>
            )}

            {/* Lista de arquivos com problema */}
            {expanded && (
                <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Arquivos presos ({page.failedFiles.length})
                    </p>
                    {page.failedFiles.map(file => (
                        <div key={file.id} className="rounded-lg bg-muted/30 p-3 text-xs font-mono space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400 shrink-0">DE:</span>
                                <span className="text-foreground/70 truncate">{file.oldPath}</span>
                            </div>
                            {!file.synthetic && (
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 shrink-0">PARA:</span>
                                    <span className="text-foreground/70 truncate">{file.newPath}</span>
                                </div>
                            )}
                            {file.error && (
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 shrink-0">ERRO:</span>
                                    <span className="text-foreground/50">{file.error}</span>
                                </div>
                            )}
                            {file.createdAt && (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground shrink-0">EM:</span>
                                    <span className="text-muted-foreground">
                                        {format(new Date(file.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const PAGE_SIZE = 25;

export default function AdminPagesClient({
    pagesWithIssues,
    stats,
}: {
    pagesWithIssues: PageWithIssue[];
    stats: Stats;
}) {
    const [filter, setFilter] = useState<'all' | 'vip' | 'avancado' | 'basico'>('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const filtered = useMemo(() => {
        if (filter === 'all') return pagesWithIssues;
        return pagesWithIssues.filter(p => p.plan === filter);
    }, [pagesWithIssues, filter]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    // Stats específicos por plano (inferidos do resultado atual pra não bater Firestore de novo)
    const vipCount = pagesWithIssues.filter(p => p.plan === 'vip').length;
    const avCount = pagesWithIssues.filter(p => p.plan === 'avancado').length;
    const basCount = pagesWithIssues.filter(p => p.plan === 'basico').length;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <Card className={cn("border-l-4", stats.totalPending > 0 ? "border-l-red-500" : "border-l-green-500")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Arquivos Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-3xl font-black", stats.totalPending > 0 ? "text-red-400" : "text-green-400")}>
                            {stats.totalPending}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">precisam de atenção</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-green-400">{stats.totalResolved}</p>
                        <p className="text-xs text-muted-foreground mt-1">arquivos recuperados</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-zinc-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Histórico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black">{stats.totalFailed}</p>
                        <p className="text-xs text-muted-foreground mt-1">falhas registradas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros por plano + contadores */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Filtrar:</span>
                {([
                    { key: 'all' as const, label: 'Todos', count: pagesWithIssues.length },
                    { key: 'vip' as const, label: 'VIP', count: vipCount },
                    { key: 'avancado' as const, label: 'Avançado', count: avCount },
                    { key: 'basico' as const, label: 'Básico', count: basCount },
                ]).map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => { setFilter(key); setVisibleCount(PAGE_SIZE); }}
                        className={cn(
                            'px-3 py-1 rounded-md text-xs font-medium transition',
                            filter === key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                        disabled={count === 0 && key !== 'all'}
                    >
                        {label} <span className="opacity-70">({count})</span>
                    </button>
                ))}
            </div>

            {/* Lista de páginas com issues */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        Páginas com Arquivos Presos
                        {filtered.length > 0 && (
                            <Badge variant="destructive" className="ml-2">{filtered.length}</Badge>
                        )}
                    </h2>
                </div>

                {filtered.length === 0 ? (
                    <Alert className="border-green-500/30 bg-green-500/10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400 font-medium">
                            {filter === 'all'
                                ? 'Tudo limpo! Nenhuma página com arquivos presos em temp/.'
                                : `Nenhuma página ${filter.toUpperCase()} com problemas.`}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {visible.map(page => (
                            <PageIssueCard key={page.id} page={page} />
                        ))}
                        {hasMore && (
                            <div className="pt-3 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                                    className="text-xs"
                                >
                                    Mostrar mais {Math.min(PAGE_SIZE, filtered.length - visibleCount)} páginas
                                    <span className="ml-2 text-muted-foreground">
                                        ({visibleCount}/{filtered.length})
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
