import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
import { unstable_cache } from 'next/cache';
import AdminDashboard, {
  type DayData, type SourceRow, type RecentSale, type SaleRecord,
} from './AdminDashboard';
import AdminNav from './AdminNav';

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
  let totalSalesBRL = 0, totalSalesUSD = 0, totalSalesEUR = 0;
  let totalBRLCount = 0, totalUSDCount = 0, totalEURCount = 0;
  let todayRevenueEUR = 0, todayRevenueUSD = 0;
  let yesterdayRevenueEUR = 0, yesterdayRevenueUSD = 0;
  let todaySalesBR = 0, todaySalesPT = 0, todaySalesUS = 0;
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
      // Se não tem createdAt (doc corrompido/legacy), pula — não conta como "hoje"
      if (!d.createdAt?.toDate) continue;
      const createdAtDate: Date = d.createdAt.toDate();
      const isGift = !!d.isGift;

      totalPagesCount++; // conta todas, inclusive gifts, drafts e não pagas

      // Venda real = tem paymentId (webhook confirmou pagamento) OU é gift explícito
      const isPaid = !!d.paymentId;

      // Detecta currency/market via campos canônicos do intent (persistidos
      // desde o feat de geo-detection). Fallback: se paymentId não-numérico
      // (Stripe sessions tipo "cs_..."), assume USD legado.
      const docMarket = (d.market || (d.currency === 'EUR' ? 'PT' : d.currency === 'USD' ? 'US' : null)) as
        'BR' | 'PT' | 'US' | null;
      const isStripeId = d.paymentId && isNaN(Number(d.paymentId));
      const market: 'BR' | 'PT' | 'US' = docMarket || (isStripeId ? 'US' : 'BR');
      const currency: 'BRL' | 'USD' | 'EUR' = market === 'PT' ? 'EUR' : market === 'US' ? 'USD' : 'BRL';

      // Base price por plano e moeda — mantém os fallbacks "antigos" pra
      // docs sem paidAmount (legacy). Novo flow sempre tem paidAmount.
      const baseByMarket: Record<'BR' | 'PT' | 'US', { avancado: number; basico: number }> = {
        BR: { avancado: 24.90, basico: 19.90 },
        PT: { avancado: 12.99, basico: 8.99 },
        US: { avancado: 14.99, basico: 9.99 },
      };
      const basePrice = d.plan === 'avancado' ? baseByMarket[market].avancado : baseByMarket[market].basico;
      const price = d.paidAmount ?? basePrice;

      // Páginas de presente e páginas sem pagamento (drafts) não contam como venda / receita
      if (!isGift && isPaid) {
        totalSoldCount++;
        if (currency === 'EUR') { totalSalesEUR += price; totalEURCount++; }
        else if (currency === 'USD') { totalSalesUSD += price; totalUSDCount++; }
        else { totalSalesBRL += price; totalBRLCount++; }

        if (d.plan === 'avancado') avancadoCount++;
        else if (d.plan === 'basico') basicoCount++;

        // Attach rate
        attachSample++;
        if (d.introType === 'love' || d.introType === 'poema') attachIntro++;
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
        if (d.introType === 'love') addOns.push('Intro Coelhinho +R$5,90');
        if (d.introType === 'poema') addOns.push('Buquê Digital +R$6,90');
        if (d.audioRecording?.url) addOns.push('Voz +R$2,90');
        if (d.enableWordGame && Array.isArray(d.wordGameQuestions) && d.wordGameQuestions.length > 0) addOns.push('Palavra +R$2,00');
        if (d.qrCodeDesign && d.qrCodeDesign !== 'classic') addOns.push(`QR "${d.qrCodeDesign}" +R$3,90`);

        salesHistory.push({
          id: doc.id,
          plan: d.plan || 'gratis',
          price: isGift ? 0 : price,
          currency,
          market,
          createdAt: createdAtDate.toISOString(),
          ownerEmail: owner?.email || 'User deleted',
          isGift,
          title: (d.title as string) || undefined,
          addOns,
          whatsappNumber: (d.whatsappNumber as string) || undefined,
        });
      }

      if (isGift || !isPaid) continue; // gifts e não-pagas não afetam charts/fontes de tráfego

      // Date-based analytics
      let date: string | null = null;
      try { date = toBRDate(createdAtDate); } catch (_) {}

      // Wizard antigo (/criar) salva como `utmSource`; wizard novo (/chat)
      // salva via captureAttribution como `utm_source`. Normaliza os dois.
      const rawSrc = (d.utmSource || d.utm_source || 'direct') as string;
      const src = rawSrc.toLowerCase().trim();

      if (date && date >= cutoff) {
        salesByDay[date] = (salesByDay[date] || 0) + 1;
        // chartData.revenue agora é receita CONSOLIDADA em BRL (BR + PT*5,8 + US*5,1)
        // Sem isso, a meta semanal R$4k só conta vendas BR e ignora as EUR.
        // Cotação fixa, idêntica ao FX_TO_BRL do AdminDashboard — precisam casar.
        const priceBRL =
          currency === 'EUR' ? price * 5.8 :
          currency === 'USD' ? price * 5.1 :
          price;
        revenueByDay[date] = (revenueByDay[date] || 0) + priceBRL;
        revenueBySource[src] = (revenueBySource[src] || 0) + priceBRL;
        salesBySource[src] = (salesBySource[src] || 0) + 1;
        if (date === today) {
          todaySales++;
          if (currency === 'BRL') todayRevenue += price;
          else if (currency === 'EUR') todayRevenueEUR += price;
          else if (currency === 'USD') todayRevenueUSD += price;
          if (market === 'BR') todaySalesBR++;
          else if (market === 'PT') todaySalesPT++;
          else if (market === 'US') todaySalesUS++;
        }
        if (date === yesterday) {
          yesterdaySales++;
          if (currency === 'BRL') yesterdayRevenue += price;
          else if (currency === 'EUR') yesterdayRevenueEUR += price;
          else if (currency === 'USD') yesterdayRevenueUSD += price;
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
  const avgTicketEUR = totalEURCount > 0 ? totalSalesEUR / totalEURCount : 0;
  const avgTicketUSD = totalUSDCount > 0 ? totalSalesUSD / totalUSDCount : 0;

  return {
    totalUsers, avancadoCount, basicoCount,
    totalSalesBRL, totalSalesUSD, totalSalesEUR, salesHistory,
    todayVisitors, todaySales, todayRevenue, todayRevenueEUR, todayRevenueUSD,
    todaySalesBR, todaySalesPT, todaySalesUS,
    yesterdayVisitors, yesterdaySales, yesterdayRevenue, yesterdayRevenueEUR, yesterdayRevenueUSD,
    totalVisitors, totalSalesCount: totalPagesCount, totalSoldCount, totalRevenue, overallConv,
    avgTicketBRL, avgTicketEUR, avgTicketUSD,
    salesCountBRL: totalBRLCount, salesCountEUR: totalEURCount, salesCountUSD: totalUSDCount,
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

// Cache for 30s — short enough that new sales show up quickly.
// SaleNotification (RTDB) fires router.refresh() on new sales for instant updates.
const getCachedDashboardData = unstable_cache(
  getAllData,
  ['admin-dashboard-v1'],
  { revalidate: 30, tags: ['admin-dashboard'] },
);

export default async function AdminPage() {
  const data = await getCachedDashboardData();

  return (
    <div className="min-h-screen pb-24 admin-mesh-bg">
      <AdminNav logoutAction={removeAdminSession} />

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 pt-6 relative z-10">
        <AdminDashboard {...data} />
      </main>

    </div>
  );
}
