export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('analytics').get();
    const reports = snap.docs
      .filter(doc => doc.id.startsWith('report_'))
      .map(doc => {
        const d = doc.data();
        return { date: d.date, uniqueVisitors: d.uniqueVisitors ?? 0, sales: d.sales ?? 0, revenue: d.revenue ?? 0, conversionRate: d.conversionRate ?? '0%', topPaths: d.topPaths ?? [], generatedAt: d.generatedAt?.toDate?.()?.toISOString() ?? null };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json(reports);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
