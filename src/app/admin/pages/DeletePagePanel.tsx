'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, Trash2, AlertTriangle, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { deletePage, getPageQuickInfo } from './actions';

type PageInfo = {
    id: string;
    title: string;
    plan: string;
    paidAmount: number | null;
    currency: string | null;
    market: string | null;
    createdAt: string | null;
    paymentId: string | null;
    ownerEmail: string | null;
    whatsappNumber: string | null;
    isGift: boolean;
};

const fmtCurrency = (v: number | null, c: string | null) => {
    if (v == null) return '—';
    if (c === 'EUR') return `€${v.toFixed(2).replace('.', ',')}`;
    if (c === 'USD') return `$${v.toFixed(2)}`;
    return `R$${v.toFixed(2).replace('.', ',')}`;
};

const flagOf = (m: string | null) => m === 'PT' ? '🇵🇹' : m === 'US' ? '🇺🇸' : '🇧🇷';

export default function DeletePagePanel() {
    const [pageId, setPageId] = useState('');
    const [info, setInfo] = useState<PageInfo | null>(null);
    const [searched, setSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [reason, setReason] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [confirmStage, setConfirmStage] = useState(false);
    const [deleteResult, setDeleteResult] = useState<{ success: boolean; filesDeleted?: number; filesFailedToDelete?: number; error?: string } | null>(null);

    const [isSearching, startSearch] = useTransition();
    const [isDeleting, startDelete] = useTransition();

    // Aceita tanto pageId puro ("abc123") quanto URL completa ("https://mycupid.com.br/p/abc123")
    const extractPageId = (input: string): string => {
        const trimmed = input.trim();
        const match = trimmed.match(/\/p\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : trimmed;
    };

    const handleSearch = () => {
        const id = extractPageId(pageId);
        if (!id) {
            setSearchError('Cola um pageId ou URL.');
            return;
        }
        setSearched(false);
        setInfo(null);
        setSearchError(null);
        setDeleteResult(null);
        setConfirmStage(false);
        setConfirmText('');
        startSearch(async () => {
            const res = await getPageQuickInfo(id);
            setSearched(true);
            if (!res.success) {
                setSearchError(res.error || 'Erro ao buscar.');
                return;
            }
            if (!res.found) {
                setSearchError('Página não encontrada (pode já estar deletada ou ID errado).');
                return;
            }
            setInfo(res.data!);
        });
    };

    const handleDelete = () => {
        if (!info) return;
        if (confirmText.trim().toUpperCase() !== 'DELETAR') {
            return;
        }
        startDelete(async () => {
            const res = await deletePage(info.id, reason || undefined);
            setDeleteResult(res);
            if (res.success) {
                // Limpa estado pra próxima ação
                setInfo(null);
                setPageId('');
                setReason('');
                setConfirmText('');
                setConfirmStage(false);
            }
        });
    };

    return (
        <Card className="border-red-500/20 bg-red-500/[0.02]">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    Buscar e deletar página manualmente
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-1">
                    Use quando cliente pedir reembolso ou quando precisar remover página por fraude/conteúdo inadequado.
                    Soft delete: doc fica em <code className="text-zinc-400">deleted_lovepages</code> + arquivos do Storage têm 7 dias de janela de recuperação.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Busca */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        placeholder="pageId ou URL (https://mycupid.com.br/p/abc123)"
                        className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/[0.04] ring-1 ring-white/10 focus:ring-red-400/40 focus:bg-white/[0.06] focus:outline-none text-white placeholder:text-white/40"
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !pageId.trim()} variant="outline" size="sm">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Buscar
                    </Button>
                </div>

                {searchError && (
                    <Alert variant="destructive" className="border-red-500/30">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription className="text-xs">{searchError}</AlertDescription>
                    </Alert>
                )}

                {/* Detalhes da página */}
                {info && (
                    <div className="rounded-lg p-3 bg-white/[0.02] ring-1 ring-white/5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-white truncate">{info.title}</p>
                                <p className="text-[11px] text-zinc-500 font-mono truncate">{info.id}</p>
                            </div>
                            <Link href={`/p/${info.id}`} target="_blank" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 shrink-0">
                                ver <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <div>
                                <span className="text-zinc-500">Plano: </span>
                                <Badge variant="outline" className="text-[10px] capitalize">{info.plan}</Badge>
                            </div>
                            <div>
                                <span className="text-zinc-500">Mercado: </span>
                                <span className="text-white">{flagOf(info.market)} {info.market || '?'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500">Pago: </span>
                                <span className="text-emerald-400 font-bold">{fmtCurrency(info.paidAmount, info.currency)}</span>
                            </div>
                            <div className="col-span-2 sm:col-span-3">
                                <span className="text-zinc-500">Email: </span>
                                <span className="text-white">{info.ownerEmail || '—'}</span>
                            </div>
                            {info.whatsappNumber && (
                                <div className="col-span-2 sm:col-span-3">
                                    <span className="text-zinc-500">WhatsApp: </span>
                                    <span className="text-white">{info.whatsappNumber}</span>
                                </div>
                            )}
                            {info.paymentId && (
                                <div className="col-span-2 sm:col-span-3">
                                    <span className="text-zinc-500">Payment ID: </span>
                                    <span className="text-white font-mono">{info.paymentId}</span>
                                </div>
                            )}
                            {info.isGift && (
                                <div className="col-span-2 sm:col-span-3">
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">🎁 Página de presente</Badge>
                                </div>
                            )}
                        </div>

                        {/* Motivo (opcional) */}
                        <div className="pt-2">
                            <label className="text-[11px] text-zinc-500 font-medium">Motivo da deleção (opcional, fica no audit):</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="ex: cliente pediu reembolso, conteúdo inadequado, fraude"
                                className="mt-1 w-full px-3 py-2 rounded-lg text-xs bg-white/[0.04] ring-1 ring-white/10 focus:ring-red-400/40 focus:outline-none text-white placeholder:text-white/30"
                            />
                        </div>

                        {/* Confirmação em 2 etapas */}
                        {!confirmStage ? (
                            <Button
                                onClick={() => setConfirmStage(true)}
                                variant="destructive"
                                size="sm"
                                className="w-full mt-2"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Deletar página
                            </Button>
                        ) : (
                            <div className="space-y-2 pt-2 border-t border-red-500/20">
                                <Alert variant="destructive" className="border-red-500/40 bg-red-500/10">
                                    <AlertTriangle className="w-4 h-4" />
                                    <AlertDescription className="text-xs">
                                        <strong>Confirmação final.</strong> Vai remover o doc da <code>lovepages</code>, marcar o intent como deletado e remover arquivos do Storage. <strong>Reversível em 7 dias</strong> via <code>deleted_lovepages</code> + soft delete do GCS. Digite <code className="font-bold">DELETAR</code> abaixo:
                                    </AlertDescription>
                                </Alert>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="Digite DELETAR"
                                        className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/[0.04] ring-1 ring-red-500/30 focus:ring-red-400/60 focus:outline-none text-white placeholder:text-white/30 font-mono"
                                    />
                                    <Button
                                        onClick={handleDelete}
                                        disabled={isDeleting || confirmText.trim().toUpperCase() !== 'DELETAR'}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Confirmar
                                    </Button>
                                    <Button onClick={() => { setConfirmStage(false); setConfirmText(''); }} variant="outline" size="sm" disabled={isDeleting}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resultado */}
                {deleteResult && (
                    <Alert
                        variant={deleteResult.success ? 'default' : 'destructive'}
                        className={cn(
                            deleteResult.success ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30',
                        )}
                    >
                        {deleteResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4" />}
                        <AlertDescription className="text-xs">
                            {deleteResult.success
                                ? `Página deletada. ${deleteResult.filesDeleted || 0} arquivos removidos do Storage. ${deleteResult.filesFailedToDelete ? `${deleteResult.filesFailedToDelete} falharam (recuperáveis via soft delete por 7 dias).` : ''}`
                                : `Erro: ${deleteResult.error}`}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
