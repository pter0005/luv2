import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, Gift, Bell, ImageOff, Link2, Tag, MessageCircle, ShoppingBag, QrCode } from 'lucide-react';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import AdminDashboard, {
  type DayData, type SourceRow, type RecentSale, type SaleRecord,
} from './AdminDashboard';

export const dynamic = 'force-dynamic';

import { ADMIN_EMAILS } from '@/lib/admin-emails';

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

// Retorna YYYY-MM-DD no timezone de São Paulo
function toBRDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-');
}

async function getAllData() {
  const db = getAdminFirestore();
  const today = toBRDate(new Date());
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toBRDate(yesterdayDate);

  // Last 30 days array
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(toBRDate(d));
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
  const yesterdayVisitors = visitorsByDay[yesterday] ?? 0;
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
  let yesterdaySales = 0, yesterdayRevenue = 0;
  let totalSalesBRL = 0, totalSalesUSD = 0;
  let totalBRLCount = 0; // vendas BRL pra calcular ticket médio
  let avancadoCount = 0, basicoCount = 0;
  let totalPagesCount = 0;  // todas as páginas criadas (exceto admin)
  let totalSoldCount = 0;   // páginas vendidas (exceto gifts e admin)

  // Add-on attach rate (paid non-gift docs)
  let attachIntro = 0, attachVoice = 0, attachWordGame = 0, attachQr = 0;
  let attachSample = 0;

  // Heatmap 7×24 (BRT = UTC-3, sem DST desde 2019)
  const salesHeatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  try {
    const snap = await db.collection('lovepages').orderBy('createdAt', 'desc').get();
    const filtered = snap.docs.filter(doc => {
      const owner = userMap.get(doc.data().userId);
      return !owner || !ADMIN_EMAILS.includes(owner.email);
    });

    for (const doc of filtered) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      const createdAtDate: Date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
      const isGift = !!d.isGift;

      totalPagesCount++; // conta todas, inclusive gifts, drafts e não pagas

      // Venda real = tem paymentId (webhook confirmou pagamento) OU é gift explícito
      const isPaid = !!d.paymentId;

      const isUSD = d.paymentId && isNaN(Number(d.paymentId));
      const currency: 'BRL' | 'USD' = isUSD ? 'USD' : 'BRL';
      const basePrice = d.plan === 'avancado'
        ? (isUSD ? 19.90 : 24.90)
        : (isUSD ? 14.90 : 19.90);
      const price = d.paidAmount ?? basePrice;

      // Páginas de presente e páginas sem pagamento (drafts) não contam como venda / receita
      if (!isGift && isPaid) {
        totalSoldCount++;
        if (isUSD) totalSalesUSD += price;
        else { totalSalesBRL += price; totalBRLCount++; }

        if (d.plan === 'avancado') avancadoCount++;
        else if (d.plan === 'basico') basicoCount++;

        // Attach rate
        attachSample++;
        if (d.introType === 'love') attachIntro++;
        if (d.audioRecording?.url) attachVoice++;
        if (d.enableWordGame && Array.isArray(d.wordGameQuestions) && d.wordGameQuestions.length > 0) attachWordGame++;
        if (d.qrCodeDesign && d.qrCodeDesign !== 'classic') attachQr++;

        // Heatmap weekday×hour in BR timezone (UTC-3)
        const br = new Date(createdAtDate.getTime() - 3 * 60 * 60 * 1000);
        salesHeatmap[br.getUTCDay()][br.getUTCHours()]++;
      }

      // Sales history table — últimas 100 para exibição
      if (salesHistory.length < 100) {
        const addOns: string[] = [];
        if (d.introType === 'love') addOns.push('Intro +R$5,90');
        if (d.audioRecording?.url) addOns.push('Voz +R$2,90');
        if (d.enableWordGame && Array.isArray(d.wordGameQuestions) && d.wordGameQuestions.length > 0) addOns.push('Palavra +R$2,00');
        if (d.qrCodeDesign && d.qrCodeDesign !== 'classic') addOns.push(`QR "${d.qrCodeDesign}" +R$3,90`);

        salesHistory.push({
          id: doc.id,
          plan: d.plan || 'gratis',
          price: isGift ? 0 : price,
          currency,
          createdAt: createdAtDate.toISOString(),
          ownerEmail: owner?.email || 'User deleted',
          isGift,
          title: (d.title as string) || undefined,
          addOns,
        });
      }

      if (isGift || !isPaid) continue; // gifts e não-pagas não afetam charts/fontes de tráfego

      // Date-based analytics
      let date: string | null = null;
      try { date = toBRDate(createdAtDate); } catch (_) {}

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
        if (date === yesterday) {
          yesterdaySales++;
          if (currency === 'BRL') yesterdayRevenue += price;
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

  // ── 4b. Wizard funnel (hoje) ──────────────────────────────────────────
  let wizardFunnelToday: Record<string, number> = {};
  try {
    const funnelDoc = await db.collection('wizard_funnel').doc(today).get();
    if (funnelDoc.exists) {
      const d = funnelDoc.data();
      wizardFunnelToday = (d?.steps || {}) as Record<string, number>;
    }
  } catch (_) {}

  // ── 5. Error logs (últimos 20) ─────────────────────────────────────────
  type ErrorLog = { id: string; message: string; url: string; createdAt: string; resolved: boolean };
  let recentErrors: ErrorLog[] = [];
  let unresolvedErrorCount = 0;
  try {
    const snap = await db.collection('error_logs').orderBy('createdAt', 'desc').limit(20).get();
    recentErrors = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        message: d.message || '',
        url: (d.url || '').split('?')[0],
        createdAt: formatDate(d.createdAt),
        resolved: !!d.resolved,
      };
    });
    const countSnap = await db.collection('error_logs').where('resolved', '==', false).count().get();
    unresolvedErrorCount = countSnap.data().count;
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

  // ── 6. Source rows ────────────────────────────────────────────────────────
  const allSrcs = new Set([...Object.keys(visitsBySource), ...Object.keys(salesBySource)]);
  const sourceRows: SourceRow[] = Array.from(allSrcs).map(source => {
    const visits = visitsBySource[source] || 0;
    const sales = salesBySource[source] || 0;
    const revenue = revenueBySource[source] || 0;
    const convRate = visits > 0 ? ((sales / visits) * 100).toFixed(2) : '0.00';
    return { source, visits, sales, revenue, convRate };
  }).sort((a, b) => b.visits - a.visits);

  const totalRevenue = totalSalesBRL;
  const totalUtmVisits = Object.values(visitsBySource).reduce((s, v) => s + v, 0);
  const totalSalesFromSources = Object.values(salesBySource).reduce((s, v) => s + v, 0);
  const overallConv = totalUtmVisits > 0
    ? ((totalSalesFromSources / totalUtmVisits) * 100).toFixed(2)
    : '0.00';

  const avgTicketBRL = totalBRLCount > 0 ? totalSalesBRL / totalBRLCount : 0;

  return {
    totalUsers, avancadoCount, basicoCount,
    totalSalesBRL, totalSalesUSD, salesHistory,
    todayVisitors, todaySales, todayRevenue,
    yesterdayVisitors, yesterdaySales, yesterdayRevenue,
    totalVisitors, totalSalesCount: totalPagesCount, totalSoldCount, totalRevenue, overallConv,
    avgTicketBRL,
    chartData, sourceRows, recentSales,
    recentErrors, unresolvedErrorCount,
    wizardFunnelToday,
    attachRate: {
      sample: attachSample,
      intro: attachIntro,
      voice: attachVoice,
      wordGame: attachWordGame,
      qr: attachQr,
    },
    salesHeatmap,
  };
}

// Cache for 5 min to avoid re-reading the whole lovepages collection on every
// admin page hit. SaleNotification (RTDB) gives real-time feel for new sales.
const getCachedDashboardData = unstable_cache(
  getAllData,
  ['admin-dashboard-v1'],
  { revalidate: 300, tags: ['admin-dashboard'] },
);

export default async function AdminPage() {
  const data = await getCachedDashboardData();

  return (
    <div className="min-h-screen pb-24 admin-mesh-bg">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(9,9,11,0.9)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-3 sm:px-4 gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight hidden sm:block">Admin</span>
          </div>

          {/* Nav links — horizontal scroll on mobile */}
          <nav className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0"
            style={{ scrollbarWidth: 'none' } as any}>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/recuperar-pix">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />Recuperar
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/creditos">
                <Gift className="h-3.5 w-3.5 text-emerald-400" />Créditos
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/gift">
                <Link2 className="h-3.5 w-3.5 text-purple-400" />Presentes
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/discount">
                <Tag className="h-3.5 w-3.5 text-green-400" />Descontos
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/whatsapp">
                <MessageCircle className="h-3.5 w-3.5 text-green-400" />WhatsApp
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/notificacoes">
                <Bell className="h-3.5 w-3.5 text-yellow-400" />Notificações
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/fix-images">
                <ImageOff className="h-3.5 w-3.5 text-orange-400" />Imagens
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm"
              className="shrink-0 text-zinc-500 hover:text-white h-8 px-2 text-xs gap-1.5">
              <Link href="/admin/qrcode">
                <QrCode className="h-3.5 w-3.5 text-fuchsia-400" />QR Code
              </Link>
            </Button>
          </nav>

          {/* Right: logout only on mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-600 hidden lg:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
            <form action={removeAdminSession}>
              <Button variant="ghost" size="sm"
                className="text-zinc-500 hover:text-red-400 gap-1.5 h-8 px-2 text-xs">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>

        </div>
      </header>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 pt-6 relative z-10">
        <AdminDashboard {...data} />
      </main>

    </div>
  );
}
