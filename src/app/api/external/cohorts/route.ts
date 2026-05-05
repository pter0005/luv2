import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  FX,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/cohorts
 *
 * Análise de cohort mensal: agrupa customers por MÊS DA PRIMEIRA COMPRA
 * e mostra quanto desse cohort voltou a comprar nos meses seguintes.
 *
 * Útil pra entender retenção real — vale email de aniversário?
 *   - Se cohort de Jan tem 8% de retenção em mês+1, vale automation
 *   - Se tem 0.5%, melhor focar aquisição
 *
 * Identidade: email lowercased+trimmed.
 *
 * Output:
 *   monthlyCohorts: [
 *     { cohortMonth: '2026-03', customers: 285,
 *       retentionByMonth: { 0: 100, 1: 12, 2: 5, 3: 3 },
 *       revenueByMonth: { 0: 7895.40, 1: 950.20, 2: 312.10 },
 *       totalLTV: 9520, avgLTV: 33.40 }
 *   ]
 *
 * Mês 0 = mês da aquisição. Mês 1 = retornaram no mês seguinte. Etc.
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    // Pega TODAS as vendas (cohort precisa de histórico completo)
    const snap = await db.collection('lovepages').orderBy('createdAt', 'asc').get();

    type Purchase = {
      email: string;
      createdAt: Date;
      amountBRL: number;
    };

    // Por customer: lista de purchases ordenadas
    const purchases = new Map<string, Purchase[]>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.paymentId || d.isGift) continue;
      if (d.deletedByAdmin) continue;
      if (!d.createdAt?.toDate) continue;

      const emailRaw = (owner?.email || d.guestEmail || d.ownerEmail || '').toLowerCase().trim();
      if (!emailRaw || !emailRaw.includes('@')) continue;

      const m = resolveMarket(d);
      const amountBRL = toBRL(resolveAmount(d, m), currencyOfMarket(m));
      const createdAt: Date = d.createdAt.toDate();

      const list = purchases.get(emailRaw) || [];
      list.push({ email: emailRaw, createdAt, amountBRL });
      purchases.set(emailRaw, list);
    }

    // Cohort: agrupa customers pelo MÊS-ANO da PRIMEIRA compra
    type Cohort = {
      cohortMonth: string; // YYYY-MM
      customerEmails: Set<string>;
      // monthOffset (0,1,2...) → { activeCustomers: Set, revenue: number }
      activity: Map<number, { active: Set<string>; revenue: number }>;
    };

    const cohorts = new Map<string, Cohort>();

    purchases.forEach((purchaseList, email) => {
      // Ordena pelo createdAt asc (já vem assim mas garante)
      purchaseList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const first = purchaseList[0];
      const cohortKey = `${first.createdAt.getUTCFullYear()}-${String(first.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;

      let cohort = cohorts.get(cohortKey);
      if (!cohort) {
        cohort = {
          cohortMonth: cohortKey,
          customerEmails: new Set(),
          activity: new Map(),
        };
        cohorts.set(cohortKey, cohort);
      }
      cohort.customerEmails.add(email);

      // Pra cada compra deste customer, calcula offset em meses do cohort
      for (const p of purchaseList) {
        const monthsDiff =
          (p.createdAt.getUTCFullYear() - first.createdAt.getUTCFullYear()) * 12 +
          (p.createdAt.getUTCMonth() - first.createdAt.getUTCMonth());
        const slot = cohort.activity.get(monthsDiff) || { active: new Set(), revenue: 0 };
        slot.active.add(email);
        slot.revenue += p.amountBRL;
        cohort.activity.set(monthsDiff, slot);
      }
    });

    // Materializa pra response
    const sortedKeys = Array.from(cohorts.keys()).sort();
    const monthlyCohorts = sortedKeys.map(key => {
      const c = cohorts.get(key)!;
      const totalCustomers = c.customerEmails.size;

      // Retention rate por mês (0 = aquisição, sempre 100%)
      const retentionByMonth: Record<number, number> = {};
      const revenueByMonth: Record<number, number> = {};
      const customersByMonth: Record<number, number> = {};

      const sortedOffsets = Array.from(c.activity.keys()).sort((a, b) => a - b);
      for (const offset of sortedOffsets) {
        const slot = c.activity.get(offset)!;
        retentionByMonth[offset] = totalCustomers > 0
          ? Number(((slot.active.size / totalCustomers) * 100).toFixed(2))
          : 0;
        customersByMonth[offset] = slot.active.size;
        revenueByMonth[offset] = Number(slot.revenue.toFixed(2));
      }

      const totalLTV = Object.values(revenueByMonth).reduce((s, v) => s + v, 0);
      return {
        cohortMonth: c.cohortMonth,
        customers: totalCustomers,
        retentionByMonth,
        customersByMonth,
        revenueByMonth,
        totalLTV: Number(totalLTV.toFixed(2)),
        avgLTV: totalCustomers > 0 ? Number((totalLTV / totalCustomers).toFixed(2)) : 0,
      };
    });

    // Médias agregadas (todos cohorts juntos)
    const allCustomers = Array.from(purchases.keys()).length;
    const totalRevenueBRL = Array.from(purchases.values()).reduce(
      (s, list) => s + list.reduce((a, p) => a + p.amountBRL, 0),
      0,
    );
    const returningCount = Array.from(purchases.values()).filter(list => list.length >= 2).length;

    // Retention "média" — média ponderada das retenções de cada cohort em
    // cada offset. Ex: avgRetention[1] = avg de quantos customers voltaram
    // 1 mês depois em todos cohorts que já tiveram chance disso acontecer.
    const offsetCounts: Record<number, { active: number; total: number }> = {};
    monthlyCohorts.forEach(c => {
      for (const [offsetStr, customers] of Object.entries(c.customersByMonth)) {
        const offset = Number(offsetStr);
        if (offset === 0) continue;
        offsetCounts[offset] = offsetCounts[offset] || { active: 0, total: 0 };
        offsetCounts[offset].active += customers;
        offsetCounts[offset].total += c.customers;
      }
    });
    const avgRetention: Record<number, number> = {};
    for (const [offsetStr, v] of Object.entries(offsetCounts)) {
      avgRetention[Number(offsetStr)] = v.total > 0
        ? Number(((v.active / v.total) * 100).toFixed(2))
        : 0;
    }

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        monthlyCohorts,
        summary: {
          totalUniqueCustomers: allCustomers,
          totalReturningCustomers: returningCount,
          overallReturningRate: allCustomers > 0
            ? Number(((returningCount / allCustomers) * 100).toFixed(2))
            : 0,
          totalRevenueBRL: Number(totalRevenueBRL.toFixed(2)),
          avgRetention, // % média que volta no mês N
          totalCohorts: monthlyCohorts.length,
        },
        meta: {
          fxToBRL: FX,
          identityKey: 'email lowercased + trimmed',
          note: 'Cohort = mês da PRIMEIRA compra. Mês 0 = aquisição (sempre 100%). Mês 1+ = retornaram.',
          recommendation: monthlyCohorts.length < 3
            ? 'Pouco dado pra análise (precisa 3+ meses de histórico). Volte daqui 30-60 dias.'
            : null,
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/cohorts] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
