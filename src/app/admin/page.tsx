import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, Gift, BarChart2, FileWarning, ImageOff, Link } from 'lucide-react';
import Link from 'next/link';
import AdminDashboard, {
  type DayData, type SourceRow, type RecentSale, type SaleRecord,
} from './AdminDashboard';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['inesvalentim45@gmail.com', 'giibrossini@gmail.com'];

function formatDate(ts: any): string {
  try {
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch { return '—'; }
}

async function getAllData() {
  const db = getAdminFirestore();
  const today = new Date().toISOString().slice(0, 10);

  // Last 30 days array
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const cutoff = days[0];

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const userMap = new Map<string, { email: string; name: string }>();
  let totalUsers = 0;
  try {
    const snap = await db.collection('users').get();
    snap.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, { email: data.email || '', name: data.name || '' });
      if (!ADMIN_EMAILS.includes(data.email)) totalUsers++;
    });
  } catch (_) {}

  // ── 2. Analytics visitors ─────────────────────────────────────────────────
  const visitorsByDay: Record<string, number> = {};
  try {
    const snap = await db.collection('analytics').get();
    for (const doc of snap.docs) {
      if (!doc.id.startsWith('day_')) continue;
      const date = doc.id.slice(4);
      if (date >= cutoff) visitorsByDay[date] = doc.data().uniqueVisitors ?? 0;
    }
  } catch (_) {}

  const todayVisitors = visitorsByDay[today] ?? 0;
  const totalVisitors = Object.values(visitorsByDay).reduce((s, v) => s + v, 0);

  // ── 3. UTM visits ─────────────────────────────────────────────────────────
  const visitsBySource: Record<string, number> = {};
  try {
    const snap = await db.collection('utm_visits').where('date', '>=', cutoff).get();
    snap.forEach(doc => {
      const src = (doc.data().source || 'direct') as string;
      visitsBySource[src] = (visitsBySource[src] || 0) + 1;
    });
  } catch (_) {}

  // ── 4. Lovepages (all metrics) ────────────────────────────────────────────
  const salesByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  const salesBySource: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};
  const recentSales: RecentSale[] = [];
  const salesHistory: SaleRecord[] = [];

  let todaySales = 0, todayRevenue = 0;
  let totalSalesBRL = 0, totalSalesUSD = 0;
  let avancadoCount = 0, basicoCount = 0;

  try {
    const snap = await db.collection('lovepages').orderBy('createdAt', 'desc').limit(500).get();
    const filtered = snap.docs.filter(doc => {
      const owner = userMap.get(doc.data().userId);
      return !owner || !ADMIN_EMAILS.includes(owner.email);
    });

    for (const doc of filtered) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      const createdAtDate: Date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();

      const isUSD = d.paymentId && isNaN(Number(d.paymentId));
      const currency: 'BRL' | 'USD' = isUSD ? 'USD' : 'BRL';
      const price = d.plan === 'avancado'
        ? (isUSD ? 19.90 : 24.90)
        : (isUSD ? 14.90 : 19.90);

      if (isUSD) totalSalesUSD += price;
      else totalSalesBRL += price;

      if (d.plan === 'avancado') avancadoCount++;
      else if (d.plan === 'basico') basicoCount++;

      // Sales history table
      if (salesHistory.length < 100) {
        salesHistory.push({
          id: doc.id,
          plan: d.plan || 'gratis',
          price,
          currency,
          createdAt: createdAtDate,
          ownerEmail: owner?.email || 'User deleted',
        });
      }

      // Date-based analytics
      let date: string | null = null;
      try { date = createdAtDate.toISOString().slice(0, 10); } catch (_) {}

      const src = (d.utmSource || 'direct') as string;

      if (date && date >= cutoff) {
        salesByDay[date] = (salesByDay[date] || 0) + 1;
        if (currency === 'BRL') {
          revenueByDay[date] = (revenueByDay[date] || 0) + price;
          revenueBySource[src] = (revenueBySource[src] || 0) + price;
        }
        salesBySource[src] = (salesBySource[src] || 0) + 1;
        if (date === today) {
          todaySales++;
          if (currency === 'BRL') todayRevenue += price;
        }
      }

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

  // ── 5. File issues ────────────────────────────────────────────────────────
  let pendingFileIssues = 0;
  try {
    const snap = await db.collection('failed_file_moves').where('resolved', '==', false).get();
    pendingFileIssues = snap.size;
  } catch (_) {}

  // ── 6. Chart data ─────────────────────────────────────────────────────────
  const chartData: DayData[] = days.map(date => {
    const [, m, d] = date.split('-');
    return {
      date,
      label: `${d}/${m}`,
      visitors: visitorsByDay[date] ?? 0,
      sales: salesByDay[date] ?? 0,
      revenue: revenueByDay[date] ?? 0,
    };
  });

  // ── 7. Source rows ────────────────────────────────────────────────────────
  const allSrcs = new Set([...Object.keys(visitsBySource), ...Object.keys(salesBySource)]);
  const sourceRows: SourceRow[] = Array.from(allSrcs).map(source => {
    const visits = visitsBySource[source] || 0;
    const sales = salesBySource[source] || 0;
    const revenue = revenueBySource[source] || 0;
    const convRate = visits > 0 ? ((sales / visits) * 100).toFixed(2) : '0.00';
    return { source, visits, sales, revenue, convRate };
  }).sort((a, b) => b.visits - a.visits);

  const totalSalesCount = salesHistory.length;
  const totalRevenue = totalSalesBRL;
  const totalUtmVisits = Object.values(visitsBySource).reduce((s, v) => s + v, 0);
  const totalSalesFromSources = Object.values(salesBySource).reduce((s, v) => s + v, 0);
  const overallConv = totalUtmVisits > 0
    ? ((totalSalesFromSources / totalUtmVisits) * 100).toFixed(2)
    : '0.00';

  return {
    totalUsers, avancadoCount, basicoCount,
    totalSalesBRL, totalSalesUSD,
    pendingFileIssues, salesHistory,
    todayVisitors, todaySales, todayRevenue,
    totalVisitors, totalSalesCount, totalRevenue, overallConv,
    chartData, sourceRows, recentSales,
  };
}

export default async function AdminPage() {
  const data = await getAllData();

  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(9,9,11,0.92)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.2)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-sm font-black text-white tracking-tight">Admin</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-500 hover:text-white h-8 px-2.5 text-xs gap-1.5">
              <Link href="/admin/creditos">
                <Gift className="h-3.5 w-3.5 text-emerald-400" />Créditos
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-500 hover:text-white h-8 px-2.5 text-xs gap-1.5">
              <Link href="/admin/gift">
                <Link className="h-3.5 w-3.5 text-purple-400" />Presentes
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-500 hover:text-white h-8 px-2.5 text-xs gap-1.5">
              <Link href="/admin/area2">
                <BarChart2 className="h-3.5 w-3.5 text-yellow-400" />Area 2
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className={`h-8 px-2.5 text-xs gap-1.5 ${data.pendingFileIssues > 0 ? 'text-red-400 hover:text-red-300' : 'text-zinc-500 hover:text-white'}`}>
              <Link href="/admin/pages">
                <FileWarning className="h-3.5 w-3.5" />
                Arquivos
                {data.pendingFileIssues > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {data.pendingFileIssues > 9 ? '9+' : data.pendingFileIssues}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-500 hover:text-white h-8 px-2.5 text-xs gap-1.5">
              <Link href="/admin/fix-images">
                <ImageOff className="h-3.5 w-3.5 text-orange-400" />Imagens
              </Link>
            </Button>
          </div>

          {/* Right: date + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-zinc-600 hidden sm:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
            <form action={removeAdminSession}>
              <Button variant="ghost" size="sm"
                className="text-zinc-500 hover:text-red-400 gap-1.5 h-8 px-2.5 text-xs">
                <LogOut className="h-3.5 w-3.5" />Sair
              </Button>
            </form>
          </div>

        </div>
      </header>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 pt-6">
        <AdminDashboard {...data} />
      </main>

    </div>
  );
}
