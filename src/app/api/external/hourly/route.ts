import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  hourBR,
  dayOfWeekBR,
  DOW_NAMES_PT,
  DOW_NAMES_EN,
  FX,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/hourly
 *
 * Distribuição de vendas por hora-do-dia (0-23) e dia-da-semana (0-6).
 * Útil pra dayparting de ads (quando focar gasto), identificar janelas
 * mortas, e agendar campanhas de email/push em horário ideal.
 *
 * Query: from, to (mínimo 7 dias recomendado pra ter sinal estatístico)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    let q: FirebaseFirestore.Query = db.collection('lovepages').orderBy('createdAt', 'desc');
    if (fromStr) {
      const f = new Date(fromStr);
      if (!isNaN(f.getTime())) q = q.where('createdAt', '>=', f);
    }
    if (toStr) {
      const t = new Date(toStr);
      if (!isNaN(t.getTime())) q = q.where('createdAt', '<=', t);
    }
    const snap = await q.limit(10000).get();

    // [hour] = { count, totalBRL }
    const byHour: Array<{ count: number; totalBRL: number }> = Array.from(
      { length: 24 },
      () => ({ count: 0, totalBRL: 0 }),
    );

    // [dow] = { count, totalBRL, daysSeen }
    const byDow: Array<{ count: number; totalBRL: number; daysSeen: Set<string> }> = Array.from(
      { length: 7 },
      () => ({ count: 0, totalBRL: 0, daysSeen: new Set() }),
    );

    // Heatmap [dow][hour]
    const heatmap: Array<Array<{ count: number; totalBRL: number }>> = Array.from(
      { length: 7 },
      () => Array.from({ length: 24 }, () => ({ count: 0, totalBRL: 0 })),
    );

    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    let totalSales = 0;
    let totalRevenueBRL = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.paymentId || d.isGift) continue;
      if (!d.createdAt?.toDate) continue;

      const createdAt: Date = d.createdAt.toDate();
      if (!earliestDate || createdAt < earliestDate) earliestDate = createdAt;
      if (!latestDate || createdAt > latestDate) latestDate = createdAt;

      const m = resolveMarket(d);
      const currency = currencyOfMarket(m);
      const amountBRL = toBRL(resolveAmount(d, m), currency);

      const hour = hourBR(createdAt);
      const dow = dayOfWeekBR(createdAt);
      const dayKey = createdAt.toISOString().slice(0, 10);

      byHour[hour].count++;
      byHour[hour].totalBRL += amountBRL;
      byDow[dow].count++;
      byDow[dow].totalBRL += amountBRL;
      byDow[dow].daysSeen.add(dayKey);
      heatmap[dow][hour].count++;
      heatmap[dow][hour].totalBRL += amountBRL;

      totalSales++;
      totalRevenueBRL += amountBRL;
    }

    // Encontra hora pico, melhor dia, etc
    let peakHour = -1, peakHourCount = -1;
    byHour.forEach((h, i) => {
      if (h.count > peakHourCount) { peakHourCount = h.count; peakHour = i; }
    });
    let bestDow = -1, bestDowCount = -1;
    byDow.forEach((d, i) => {
      if (d.count > bestDowCount) { bestDowCount = d.count; bestDow = i; }
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        range: {
          from: earliestDate?.toISOString() || null,
          to: latestDate?.toISOString() || null,
          totalSales,
          totalRevenueBRL: Number(totalRevenueBRL.toFixed(2)),
        },
        timezone: 'America/Sao_Paulo',
        byHour: byHour.map((h, hour) => ({
          hour,
          count: h.count,
          totalBRL: Number(h.totalBRL.toFixed(2)),
          pctOfTotal: totalSales > 0 ? Number(((h.count / totalSales) * 100).toFixed(2)) : 0,
        })),
        byDayOfWeek: byDow.map((d, dow) => {
          const daysSeen = d.daysSeen.size || 1;
          return {
            day: dow,
            dayName: DOW_NAMES_PT[dow],
            dayNameEn: DOW_NAMES_EN[dow],
            count: d.count,
            totalBRL: Number(d.totalBRL.toFixed(2)),
            avgPerDay: Number((d.count / daysSeen).toFixed(2)),
            avgRevenuePerDayBRL: Number((d.totalBRL / daysSeen).toFixed(2)),
          };
        }),
        heatmap: heatmap.map((row, dow) =>
          row.map((cell, hour) => ({
            day: dow,
            hour,
            count: cell.count,
            totalBRL: Number(cell.totalBRL.toFixed(2)),
          })),
        ),
        insights: {
          peakHour,
          peakHourLabel: peakHour >= 0 ? `${peakHour}h-${peakHour + 1}h BRT` : null,
          peakHourCount,
          bestDayOfWeek: bestDow,
          bestDayName: bestDow >= 0 ? DOW_NAMES_PT[bestDow] : null,
          bestDayCount: bestDowCount,
        },
        meta: {
          fxToBRL: FX,
          note: 'Distribuição em America/Sao_Paulo (BRT, UTC-3 sem DST).',
          minDataRecommendation: '7+ dias de dados pra sinal estatístico.',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/hourly] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
