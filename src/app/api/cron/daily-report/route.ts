export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { logCriticalError } from '@/lib/log-critical-error';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getAdminFirestore();
  // YYYY-MM-DD em BRT (UTC-3, sem DST desde 2019)
  const today = new Date()
    .toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    .split('/').reverse().join('-');
  try {
    const visitorsSnap = await db.collection('analytics').doc('daily').collection(today).get();
    const uniqueVisitors = visitorsSnap.size;
    const pathCounts: Record<string, number> = {};
    visitorsSnap.docs.forEach(doc => {
      const path = doc.data().firstPath || '/';
      pathCounts[path] = (pathCounts[path] ?? 0) + 1;
    });
    const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));
    // Intervalo do dia em BRT: [00:00 BRT, 23:59:59.999 BRT] = [03:00 UTC, 02:59:59.999 UTC do dia seguinte]
    const salesSnap = await db.collection('lovepages')
      .where('createdAt', '>=', Timestamp.fromDate(new Date(`${today}T03:00:00.000Z`)))
      .where('createdAt', '<', Timestamp.fromDate(new Date(new Date(`${today}T03:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000)))
      .get();
    // Only count pages that were actually paid. Use the real charged amount
    // (paidAmount) so discounts and add-ons are reflected in the daily report.
    const paidDocs = salesSnap.docs.filter(doc => !!doc.data().paymentId && !doc.data().isGift);
    const sales = paidDocs.length;
    const revenue = paidDocs.reduce((acc, doc) => {
      const d = doc.data();
      const paid = Number(d.paidAmount);
      if (isFinite(paid) && paid > 0) return acc + paid;
      return acc + (d.plan === 'avancado' ? 24.90 : 19.90);
    }, 0);
    const conversionRate = uniqueVisitors > 0 ? ((sales / uniqueVisitors) * 100).toFixed(2) : '0.00';
    const report = { date: today, uniqueVisitors, sales, revenue: Number(revenue.toFixed(2)), conversionRate: `${conversionRate}%`, topPaths, generatedAt: Timestamp.now() };
    await db.collection('analytics').doc(`report_${today}`).set(report);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    logCriticalError('api', `daily-report falhou: ${err?.message || 'unknown'}`, {
      stack: err?.stack,
    }).catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
