import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ArrowLeft, TrendingUp, MousePointer, ShoppingCart, Percent } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SOURCE_META: Record<string, { emoji: string; label: string; color: string }> = {
    tiktok:    { emoji: '🎵', label: 'TikTok',    color: 'text-pink-400' },
    instagram: { emoji: '📸', label: 'Instagram', color: 'text-purple-400' },
    facebook:  { emoji: '📘', label: 'Facebook',  color: 'text-blue-400' },
    google:    { emoji: '🔍', label: 'Google',    color: 'text-yellow-400' },
    whatsapp:  { emoji: '💬', label: 'WhatsApp',  color: 'text-green-400' },
    direct:    { emoji: '🔗', label: 'Direto',    color: 'text-white/60' },
    organic:   { emoji: '🌱', label: 'Orgânico',  color: 'text-emerald-400' },
};

function getSourceMeta(source: string) {
    return SOURCE_META[source.toLowerCase()] || { emoji: '🌐', label: source, color: 'text-white/50' };
}

async function getAnalyticsData() {
    try {
        const db = getAdminFirestore();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

        const visitsBySource: Record<string, number> = {};
        const visitsByDay: Record<string, Record<string, number>> = {};
        let totalVisits = 0;

        try {
            const visitsSnap = await db.collection('utm_visits')
                .where('date', '>=', cutoffDate)
                .get();

            totalVisits = visitsSnap.size;
            visitsSnap.docs.forEach(doc => {
                const d = doc.data();
                const source = (d.source || 'direct') as string;
                const date = (d.date || '') as string;
                visitsBySource[source] = (visitsBySource[source] || 0) + 1;
                if (date) {
                    if (!visitsByDay[date]) visitsByDay[date] = {};
                    visitsByDay[date][source] = (visitsByDay[date][source] || 0) + 1;
                }
            });
        } catch (_) {
            // utm_visits ainda não existe — tudo zerado
        }

        const salesBySource: Record<string, number> = {};
        const revBySource: Record<string, number> = {};

        try {
            const salesSnap = await db.collection('lovepages')
                .orderBy('createdAt', 'desc')
                .limit(500)
                .get();

            salesSnap.docs.forEach(doc => {
                const d = doc.data();
                let createdAt: Date | null = null;
                try { createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : null; } catch (_) {}
                if (createdAt && createdAt < thirtyDaysAgo) return;
                const source = (d.utmSource || 'direct') as string;
                const price = d.plan === 'avancado' ? 24.90 : 14.90;
                salesBySource[source] = (salesBySource[source] || 0) + 1;
                revBySource[source] = (revBySource[source] || 0) + price;
            });
        } catch (_) {
            // lovepages query falhou
        }

        const allSources = new Set([...Object.keys(visitsBySource), ...Object.keys(salesBySource)]);
        const rows = Array.from(allSources).map(source => {
            const visits = visitsBySource[source] || 0;
            const sales = salesBySource[source] || 0;
            const revenue = revBySource[source] || 0;
            const convRate = visits > 0 ? ((sales / visits) * 100).toFixed(2) : '0.00';
            return { source, visits, sales, revenue, convRate };
        }).sort((a, b) => b.visits - a.visits);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const chartData = last7Days.map(date => ({
            date,
            total: Object.values(visitsByDay[date] || {}).reduce((a, b) => a + b, 0),
        }));

        const totalSales = Object.values(salesBySource).reduce((a, b) => a + b, 0);
        const totalRevenue = Object.values(revBySource).reduce((a, b) => a + b, 0);
        const overallConv = totalVisits > 0 ? ((totalSales / totalVisits) * 100).toFixed(2) : '0.00';

        return { rows, chartData, totalVisits, totalSales, totalRevenue, overallConv, error: null };
    } catch (err: any) {
        console.error('analytics error', err?.message || String(err));
        return {
            rows: [],
            chartData: Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                return { date: d.toISOString().split('T')[0], total: 0 };
            }),
            totalVisits: 0, totalSales: 0, totalRevenue: 0, overallConv: '0.00',
            error: err?.message || 'Erro desconhecido',
        };
    }
}

export default async function AdminAnalyticsPage() {
    const { rows, chartData, totalVisits, totalSales, totalRevenue, overallConv, error } = await getAnalyticsData();
    const maxChartVal = Math.max(...chartData.map(d => d.total), 1);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="bg-card border-b border-border mb-8 sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Link>
                        </Button>
                        <div className="w-px h-5 bg-border" />
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/20 p-2 rounded-full">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold">Analytics de Tráfego</h1>
                        </div>
                    </div>
                    <form action={removeAdminSession}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                            <LogOut className="h-4 w-4 mr-2" />Sair
                        </Button>
                    </form>
                </div>
            </header>

            <main className="container mx-auto px-4 space-y-8">

                {error && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">
                        ⚠️ Erro ao carregar dados: {error}
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MousePointer className="w-4 h-4 text-blue-400" />Visitas (30d)
                            </CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-black">{totalVisits.toLocaleString('pt-BR')}</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-purple-400" />Vendas (30d)
                            </CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-black">{totalSales}</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />Receita (30d)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-green-400">
                                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Percent className="w-4 h-4 text-amber-400" />Conversão Geral
                            </CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-3xl font-black text-amber-400">{overallConv}%</p></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Visitas — últimos 7 dias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-32">
                            {chartData.map(day => (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground font-bold">{day.total || ''}</span>
                                    <div
                                        className="w-full rounded-t-md relative overflow-hidden bg-primary/20"
                                        style={{ height: `${Math.max((day.total / maxChartVal) * 100, 4)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600 to-purple-400 opacity-80" />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">{day.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-bold">Performance por Fonte</h2>
                        <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">últimos 30 dias</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Fonte</th>
                                    <th className="px-6 py-4 font-medium">Visitas</th>
                                    <th className="px-6 py-4 font-medium">Vendas</th>
                                    <th className="px-6 py-4 font-medium">Receita</th>
                                    <th className="px-6 py-4 font-medium">Conversão</th>
                                    <th className="px-6 py-4 font-medium">Link UTM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            Nenhuma visita ainda. Troque os links das bios para ?utm_source=tiktok etc.
                                        </td>
                                    </tr>
                                )}
                                {rows.map(row => {
                                    const meta = getSourceMeta(row.source);
                                    const convNum = parseFloat(row.convRate);
                                    return (
                                        <tr key={row.source} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{meta.emoji}</span>
                                                    <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold">{row.visits.toLocaleString('pt-BR')}</td>
                                            <td className="px-6 py-4 font-mono">{row.sales}</td>
                                            <td className="px-6 py-4 font-mono text-green-400 font-bold">
                                                {row.revenue > 0 ? row.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold font-mono ${convNum >= 2 ? 'text-green-400' : convNum >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {row.convRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground select-all">
                                                    mycupid.com.br?utm_source={row.source}
                                                </code>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-base font-bold mb-4">Links Prontos pra Usar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['tiktok', 'instagram', 'facebook', 'whatsapp', 'google', 'organic'].map(source => {
                            const meta = getSourceMeta(source);
                            return (
                                <div key={source} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                                    <span className="text-xl shrink-0">{meta.emoji}</span>
                                    <div className="min-w-0 flex-grow">
                                        <p className={`text-xs font-bold ${meta.color} mb-0.5`}>{meta.label}</p>
                                        <code className="text-xs text-muted-foreground truncate block select-all">
                                            mycupid.com.br?utm_source={source}
                                        </code>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
