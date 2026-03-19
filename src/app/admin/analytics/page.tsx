import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from '../admin-auth-actions';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import AnalyticsDashboard, { type DayData, type SourceRow } from './AnalyticsDashboard';

export const dynamic = 'force-dynamic';

const SOURCE_META: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook',
  google: 'Google', whatsapp: 'WhatsApp', direct: 'Direto', organic: 'Orgânico',
};

function dayLabel(date: string) {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
}

async function getAnalyticsData() {
  const db = getAdminFirestore();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  // ── Gerar array dos últimos 30 dias ──────────────────────────────────────
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  // ── Visitantes únicos por dia (analytics/day_YYYY-MM-DD) ─────────────────
  const visitorsByDay: Record<string, number> = {};
  try {
    const snap = await db.collection('analytics').get();
    snap.docs.forEach(doc => {
      if (!doc.id.startsWith('day_')) return;
      const date = doc.id.replace('day_', '');
      if (date >= cutoff) {
        visitorsByDay[date] = doc.data().uniqueVisitors ?? 0;
      }
    });
  } catch (_) {}

  const todayVisitors = visitorsByDay[today] ?? 0;
  const totalVisitors = Object.values(visitorsByDay).reduce((a, b) => a + b, 0);

  // ── Visitas por fonte UTM (utm_visits) ────────────────────────────────────
  const visitsBySource: Record<string, number> = {};
  try {
    const snap = await db.collection('utm_visits').where('date', '>=', cutoff).get();
    snap.docs.forEach(doc => {
      const source = (doc.data().source || 'direct') as string;
      visitsBySource[source] = (visitsBySource[source] || 0) + 1;
    });
  } catch (_) {}

  // ── Vendas por dia e por fonte (lovepages) ────────────────────────────────
  const salesByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  const salesBySource: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};

  try {
    const snap = await db.collection('lovepages')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    snap.docs.forEach(doc => {
      const d = doc.data();
      let date: string | null = null;
      try {
        const ts = d.createdAt?.toDate?.();
        if (ts) date = ts.toISOString().slice(0, 10);
      } catch (_) {}
      if (!date || date < cutoff) return;

      const source = (d.utmSource || 'direct') as string;
      const price = d.plan === 'avancado' ? 24.90 : 14.90;

      salesByDay[date] = (salesByDay[date] || 0) + 1;
      revenueByDay[date] = (revenueByDay[date] || 0) + price;
      salesBySource[source] = (salesBySource[source] || 0) + 1;
      revenueBySource[source] = (revenueBySource[source] || 0) + price;
    });
  } catch (_) {}

  // ── Montar chartData (30 dias) ────────────────────────────────────────────
  const chartData: DayData[] = days.map(date => ({
    date,
    label: dayLabel(date),
    visitors: visitorsByDay[date] ?? 0,
    sales: salesByDay[date] ?? 0,
    revenue: revenueByDay[date] ?? 0,
  }));

  // ── Montar sourceRows ─────────────────────────────────────────────────────
  const allSources = new Set([...Object.keys(visitsBySource), ...Object.keys(salesBySource)]);
  const sourceRows: SourceRow[] = Array.from(allSources).map(source => {
    const visits = visitsBySource[source] || 0;
    const sales = salesBySource[source] || 0;
    const revenue = revenueBySource[source] || 0;
    const convRate = visits > 0 ? ((sales / visits) * 100).toFixed(2) : '0.00';
    return { source, visits, sales, revenue, convRate };
  }).sort((a, b) => b.visits - a.visits);

  const totalSales = Object.values(salesBySource).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(revenueBySource).reduce((a, b) => a + b, 0);
  const totalUtmVisits = Object.values(visitsBySource).reduce((a, b) => a + b, 0);
  const overallConv = totalUtmVisits > 0 ? ((totalSales / totalUtmVisits) * 100).toFixed(2) : '0.00';

  return { todayVisitors, totalVisitors, totalSales, totalRevenue, overallConv, chartData, sourceRows };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="min-h-screen pb-20" style={{ background: '#09090b' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(9,9,11,0.95)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1.5" />Dashboard</Link>
            </Button>
            <div className="w-px h-5 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.2)' }}>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <h1 className="text-base font-bold text-white">Analytics</h1>
            </div>
          </div>
          <form action={removeAdminSession}>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-red-400">
              <LogOut className="h-4 w-4 mr-1.5" />Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 space-y-8">
        <AnalyticsDashboard {...data} />
      </main>
    </div>
  );
}
