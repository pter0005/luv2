import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from '../admin-auth-actions';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import AnalyticsDashboard, {
  type DayData, type SourceRow, type RecentSale,
} from './AnalyticsDashboard';

export const dynamic = 'force-dynamic';

function dayLabel(date: string) {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
}

function formatDate(ts: any): string {
  try {
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

async function getData() {
  const db = getAdminFirestore();
  const today = new Date().toISOString().slice(0, 10);

  // últimos 30 dias
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const cutoff = days[0];

  // ── 1. Visitantes únicos por dia ─────────────────────────────────────────
  const visitorsByDay: Record<string, number> = {};
  try {
    const snap = await db.collection('analytics').get();
    for (const doc of snap.docs) {
      if (!doc.id.startsWith('day_')) continue;
      const date = doc.id.slice(4); // remove "day_"
      if (date >= cutoff) visitorsByDay[date] = doc.data().uniqueVisitors ?? 0;
    }
  } catch (_) {}

  const todayVisitors = visitorsByDay[today] ?? 0;
  const totalVisitors = Object.values(visitorsByDay).reduce((s, v) => s + v, 0);

  // ── 2. Visitas UTM por fonte ─────────────────────────────────────────────
  const visitsBySource: Record<string, number> = {};
  try {
    const snap = await db.collection('utm_visits').where('date', '>=', cutoff).get();
    snap.forEach(doc => {
      const src = (doc.data().source || 'direct') as string;
      visitsBySource[src] = (visitsBySource[src] || 0) + 1;
    });
  } catch (_) {}

  // ── 3. Vendas: por dia, por fonte, recentes ──────────────────────────────
  const salesByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  const salesBySource: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};
  const recentSales: RecentSale[] = [];

  let todaySales = 0;
  let todayRevenue = 0;

  try {
    const snap = await db.collection('lovepages')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    for (const doc of snap.docs) {
      const d = doc.data();
      let date: string | null = null;
      try { date = d.createdAt?.toDate?.()?.toISOString().slice(0, 10) ?? null; } catch (_) {}
      if (!date) continue;

      const price = d.plan === 'avancado' ? 24.90 : 14.90;
      const src = (d.utmSource || 'direct') as string;

      // só conta nos últimos 30d para as métricas
      if (date >= cutoff) {
        salesByDay[date] = (salesByDay[date] || 0) + 1;
        revenueByDay[date] = (revenueByDay[date] || 0) + price;
        salesBySource[src] = (salesBySource[src] || 0) + 1;
        revenueBySource[src] = (revenueBySource[src] || 0) + price;
        if (date === today) { todaySales++; todayRevenue += price; }
      }

      // recentes: últimas 20 independente de data
      if (recentSales.length < 20) {
        recentSales.push({
          pageId: doc.id,
          title: (d.title || 'Sem título') as string,
          plan: (d.plan || 'basico') as string,
          price,
          createdAt: formatDate(d.createdAt),
          utmSource: src,
        });
      }
    }
  } catch (_) {}

  // ── 4. Chart data ────────────────────────────────────────────────────────
  const chartData: DayData[] = days.map(date => ({
    date,
    label: dayLabel(date),
    visitors: visitorsByDay[date] ?? 0,
    sales: salesByDay[date] ?? 0,
    revenue: revenueByDay[date] ?? 0,
  }));

  // ── 5. Source rows ───────────────────────────────────────────────────────
  const allSrcs = new Set([...Object.keys(visitsBySource), ...Object.keys(salesBySource)]);
  const sourceRows: SourceRow[] = Array.from(allSrcs).map(source => {
    const visits = visitsBySource[source] || 0;
    const sales = salesBySource[source] || 0;
    const revenue = revenueBySource[source] || 0;
    const convRate = visits > 0 ? ((sales / visits) * 100).toFixed(2) : '0.00';
    return { source, visits, sales, revenue, convRate };
  }).sort((a, b) => b.visits - a.visits);

  const totalSales = Object.values(salesBySource).reduce((s, v) => s + v, 0);
  const totalRevenue = Object.values(revenueBySource).reduce((s, v) => s + v, 0);
  const totalUtmVisits = Object.values(visitsBySource).reduce((s, v) => s + v, 0);
  const overallConv = totalUtmVisits > 0
    ? ((totalSales / totalUtmVisits) * 100).toFixed(2)
    : '0.00';

  return {
    todayVisitors, todaySales, todayRevenue,
    totalVisitors, totalSales, totalRevenue, overallConv,
    chartData, sourceRows, recentSales,
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getData();

  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(9,9,11,0.9)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-500 hover:text-white gap-1.5 h-8 px-2.5">
              <Link href="/admin">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.2)' }}>
                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-bold text-white">Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
            <form action={removeAdminSession}>
              <Button variant="ghost" size="sm"
                className="text-zinc-500 hover:text-red-400 gap-1.5 h-8 px-2.5">
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 pt-6">
        <AnalyticsDashboard {...data} />
      </main>
    </div>
  );
}
