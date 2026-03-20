export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getAdminFirestore();
  const today = new Date().toISOString().slice(0, 10);
  try {
    const visitorsSnap = await db.collection('analytics').doc('daily').collection(today).get();
    const uniqueVisitors = visitorsSnap.size;
    const pathCounts: Record<string, number> = {};
    visitorsSnap.docs.forEach(doc => {
      const path = doc.data().firstPath || '/';
      pathCounts[path] = (pathCounts[path] ?? 0) + 1;
    });
    const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));
    const salesSnap = await db.collection('lovepages')
      .where('createdAt', '>=', Timestamp.fromDate(new Date(`${today}T00:00:00Z`)))
      .where('createdAt', '<=', Timestamp.fromDate(new Date(`${today}T23:59:59Z`)))
      .get();
    const sales = salesSnap.size;
    const revenue = salesSnap.docs.reduce((acc, doc) => acc + (doc.data().plan === 'avancado' ? 24.90 : 19.90), 0);
    const conversionRate = uniqueVisitors > 0 ? ((sales / uniqueVisitors) * 100).toFixed(2) : '0.00';
    const report = { date: today, uniqueVisitors, sales, revenue: Number(revenue.toFixed(2)), conversionRate: `${conversionRate}%`, topPaths, generatedAt: Timestamp.now() };
    await db.collection('analytics').doc(`report_${today}`).set(report);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
