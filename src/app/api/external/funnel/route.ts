import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import { dateKeyBR } from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

/**
 * GET /api/external/funnel
 *
 * Agrega o doc /wizard_funnel/{YYYY-MM-DD} no range pedido. Retorna funil
 * completo (recipient → title → ... → paid), conversão entre cada etapa,
 * e estimativa de cart abandoned (entrou checkout mas não pagou).
 *
 * Stages mais relevantes pra otimização:
 *   recipient    — entrou no wizard (similar a "view")
 *   plan         — selecionou plano
 *   payment      — chegou na tela de pagamento
 *   pix_generated — gerou PIX (commited intent)
 *   paid         — pagou
 *
 * Query: from, to (ISO ou YYYY-MM-DD), groupBy (day|segment|locale)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');
  const groupBy = url.searchParams.get('groupBy') || 'total';

  // Resolve range — default últimos 30 dias
  const today = new Date();
  const fromDate = fromStr ? new Date(fromStr) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const toDate = toStr ? new Date(toStr) : today;
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: 'invalid date' }, { status: 400 });
  }

  // Lista todos os YYYY-MM-DD no range em BRT
  const dateKeys: string[] = [];
  const cursor = new Date(fromDate);
  while (cursor <= toDate) {
    dateKeys.push(dateKeyBR(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  // Cap em 92 dias pra não estourar
  if (dateKeys.length > 92) {
    return NextResponse.json({ error: 'range too wide (max 92 days)' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const snaps = await Promise.all(
      dateKeys.map(k => db.collection('wizard_funnel').doc(k).get()),
    );

    type StepCounts = Record<string, number>;
    const totalSteps: StepCounts = {};
    const dailyBreakdown: Array<{ day: string; steps: StepCounts }> = [];
    const bySegment: Record<string, StepCounts> = {};
    const byLocale: Record<string, StepCounts> = {};

    snaps.forEach((snap, i) => {
      if (!snap.exists) return;
      const d = snap.data() || {};
      const steps = (d.steps || {}) as StepCounts;

      // Total agregado
      for (const [step, count] of Object.entries(steps)) {
        const n = Number(count);
        if (isFinite(n)) totalSteps[step] = (totalSteps[step] || 0) + n;
      }

      if (groupBy === 'day') {
        dailyBreakdown.push({ day: dateKeys[i], steps: { ...steps } });
      }

      if (groupBy === 'segment' && d.bySegment) {
        for (const [seg, segSteps] of Object.entries(d.bySegment as Record<string, StepCounts>)) {
          bySegment[seg] = bySegment[seg] || {};
          for (const [step, count] of Object.entries(segSteps)) {
            const n = Number(count);
            if (isFinite(n)) bySegment[seg][step] = (bySegment[seg][step] || 0) + n;
          }
        }
      }

      if (groupBy === 'locale' && d.byLocale) {
        for (const [loc, locSteps] of Object.entries(d.byLocale as Record<string, StepCounts>)) {
          byLocale[loc] = byLocale[loc] || {};
          for (const [step, count] of Object.entries(locSteps)) {
            const n = Number(count);
            if (isFinite(n)) byLocale[loc][step] = (byLocale[loc][step] || 0) + n;
          }
        }
      }
    });

    // Funil canônico (ordem importa pra calcular conversão)
    const canonicalFunnel = [
      'recipient',  // 1. entrou no wizard
      'title',      // 2. nomeou
      'plan',       // 3. selecionou plano
      'payment',    // 4. chegou no checkout
      'pix_generated', // 5. gerou PIX (intent committed)
      'paid',       // 6. pagou
    ];

    const computeFunnel = (steps: StepCounts) => {
      const stages = canonicalFunnel.map(s => ({ step: s, count: steps[s] || 0 }));
      const conversionRates: Record<string, string> = {};
      for (let i = 1; i < stages.length; i++) {
        const prev = stages[i - 1].count;
        const cur = stages[i].count;
        const rate = prev > 0 ? (cur / prev) * 100 : 0;
        conversionRates[`${stages[i - 1].step}→${stages[i].step}`] = `${rate.toFixed(2)}%`;
      }
      const overall = stages[0].count > 0
        ? `${((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(2)}%`
        : '0.00%';
      return { stages, conversionRates, overallConversion: overall };
    };

    const main = computeFunnel(totalSteps);

    // Cart abandoned: pix_generated - paid (gerou PIX mas nunca confirmou)
    const pixGenerated = totalSteps['pix_generated'] || 0;
    const paid = totalSteps['paid'] || 0;
    const cartAbandoned = Math.max(0, pixGenerated - paid);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        range: { from: dateKeys[0], to: dateKeys[dateKeys.length - 1], days: dateKeys.length },
        groupBy,
        funnel: {
          totalSteps,
          ...main,
        },
        abandoned: {
          pixGeneratedNotPaid: cartAbandoned,
          // Estimativa de valor médio perdido (assumindo ticket R$30 BR)
          // Não usa amount real porque wizard_funnel não tem valor — só counts
          estimatedAvgTicketBRL: 30,
          estimatedValueLostBRL: Number((cartAbandoned * 30).toFixed(2)),
        },
        ...(groupBy === 'day' ? { daily: dailyBreakdown } : {}),
        ...(groupBy === 'segment' ? {
          bySegment: Object.fromEntries(
            Object.entries(bySegment).map(([seg, steps]) => [seg, computeFunnel(steps)]),
          ),
        } : {}),
        ...(groupBy === 'locale' ? {
          byLocale: Object.fromEntries(
            Object.entries(byLocale).map(([loc, steps]) => [loc, computeFunnel(steps)]),
          ),
        } : {}),
        meta: {
          stepsLegend: {
            recipient: 'entrou no wizard (1ª etapa)',
            title: 'preencheu título',
            plan: 'selecionou plano',
            payment: 'chegou na tela de pagamento',
            pix_generated: 'gerou PIX (intent committed)',
            paid: 'pagou (lovepage criada)',
          },
          source: 'collection wizard_funnel — agregado por dia em America/Sao_Paulo',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/funnel] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
