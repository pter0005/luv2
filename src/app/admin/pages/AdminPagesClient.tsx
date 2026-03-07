'use client';

import { useState, useTransition } from 'react';
import { reprocessPageFiles } from './actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    RefreshCw, CheckCircle, XCircle, AlertTriangle, 
    FileWarning, ChevronDown, ChevronUp, Loader2,
    ExternalLink
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
};

type PageWithIssue = {
    id: string;
    title: string;
    plan: string;
    userId: string;
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

function PageIssueCard({ page }: { page: PageWithIssue }) {
    const [isPending, startTransition] = useTransition();
    const [expanded, setExpanded] = useState(false);
    const [result, setResult] = useState<ReprocessResult>(null);

    const handleReprocess = () => {
        setResult(null);
        startTransition(async () => {
            const res = await reprocessPageFiles(page.id);
            setResult(res);
        });
    };

    return (
        <div className={cn(
            "rounded-xl border bg-card transition-all",
            result?.success && result.moved > 0 && "border-green-500/40 bg-green-500/5",
            result?.success === false && "border-red-500/40 bg-red-500/5",
        )}>
            <div className="flex items-start justify-between p-4 gap-4">
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-foreground truncate">{page.title}</span>
                        <Badge variant="outline" className={cn(
                            "text-xs shrink-0",
                            page.plan === 'avancado' ? 'border-purple-500/40 text-purple-400' : 'border-blue-500/40 text-blue-400'
                        )}>
                            {page.plan}
                        </Badge>
                        <Badge variant="destructive" className="text-xs shrink-0">
                            <FileWarning className="w-3 h-3 mr-1" />
                            {page.failedFiles.length} arquivo{page.failedFiles.length > 1 ? 's' : ''} preso{page.failedFiles.length > 1 ? 's' : ''}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono">ID: {page.id.slice(0, 12)}...</span>
                        {page.createdAt && (
                            <span>Criada: {format(new Date(page.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8"
                    >
                        <Link href={`/p/${page.id}`} target="_blank">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver
                        </Link>
                    </Button>
                    <Button
                        onClick={handleReprocess}
                        disabled={isPending}
                        size="sm"
                        className={cn(
                            "h-8",
                            result?.success && result.moved > 0
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-amber-600 hover:bg-amber-700"
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : result?.success && result.moved > 0 ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        {isPending ? 'Reprocessando...' : result?.success && result.moved > 0 ? 'Resolvido!' : 'Reprocessar'}
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
                                : 'Nenhum arquivo foi movido (podem já estar no destino).'
                            : `Erro: ${result.error}`
                        }
                    </span>
                </div>
            )}

            {/* Lista de arquivos com problema */}
            {expanded && (
                <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Arquivos presos em temp/</p>
                    {page.failedFiles.map(file => (
                        <div key={file.id} className="rounded-lg bg-muted/30 p-3 text-xs font-mono space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400 shrink-0">DE:</span>
                                <span className="text-foreground/70 truncate">{file.oldPath}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400 shrink-0">PARA:</span>
                                <span className="text-foreground/70 truncate">{file.newPath}</span>
                            </div>
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

export default function AdminPagesClient({
    pagesWithIssues,
    stats,
}: {
    pagesWithIssues: PageWithIssue[];
    stats: Stats;
}) {
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

            {/* Lista de páginas com issues */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        Páginas com Arquivos Presos
                        {pagesWithIssues.length > 0 && (
                            <Badge variant="destructive" className="ml-2">{pagesWithIssues.length}</Badge>
                        )}
                    </h2>
                </div>

                {pagesWithIssues.length === 0 ? (
                    <Alert className="border-green-500/30 bg-green-500/10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400 font-medium">
                            Tudo limpo! Nenhuma página com arquivos presos em temp/.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {pagesWithIssues.map(page => (
                            <PageIssueCard key={page.id} page={page} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
