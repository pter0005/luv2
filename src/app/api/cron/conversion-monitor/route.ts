export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { logCriticalError } from '@/lib/log-critical-error';
import { notifyAdmins } from '@/lib/notify-admin';

/**
 * Compara o funil de hoje com a baseline dos 7 dias anteriores. Se o drop-off
 * de qualquer step pular > 30%, dispara um push pros admins. Detecta quedas
 * de conversão ANTES de virarem perda de receita (ex: deploy quebrou o botão
 * de pagar, gateway fora do ar, desconto expirado escondendo o total).
 *
 * Roda de hora em hora. Usa apenas steps-chave pra evitar ruído:
 * recipient → plan → payment → pix_generated → paid
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminFirestore();

  function dateKey(d: Date): string {
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      .split('/').reverse().join('-');
  }

  const today = new Date();
  const todayKey = dateKey(today);

  // Baseline: últimos 7 dias completos (exclui hoje pra não comparar com o dia em andamento)
  const baselineKeys: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    baselineKeys.push(dateKey(d));
  }

  try {
    const [todaySnap, ...baselineSnaps] = await Promise.all([
      db.collection('wizard_funnel').doc(todayKey).get(),
      ...baselineKeys.map((k) => db.collection('wizard_funnel').doc(k).get()),
    ]);

    if (!todaySnap.exists) {
      return NextResponse.json({ ok: true, reason: 'no_data_today' });
    }

    const todaySteps = (todaySnap.data()?.steps || {}) as Record<string, number>;

    // Soma baseline
    const baselineSteps: Record<string, number> = {};
    let baselineDaysWithData = 0;
    baselineSnaps.forEach((snap) => {
      if (!snap.exists) return;
      baselineDaysWithData++;
      const s = (snap.data()?.steps || {}) as Record<string, number>;
      for (const k in s) baselineSteps[k] = (baselineSteps[k] || 0) + s[k];
    });

    if (baselineDaysWithData < 3) {
      return NextResponse.json({ ok: true, reason: 'insufficient_baseline' });
    }

    // Conversão step-to-step. Comparar CR de funis ao invés de volume bruto
    // evita alertas falsos em dias de tráfego baixo.
    const funnel: Array<[string, string]> = [
      ['recipient', 'plan'],
      ['plan', 'payment'],
      ['payment', 'pix_generated'],
      ['pix_generated', 'paid'],
    ];

    const alerts: string[] = [];
    funnel.forEach(([from, to]) => {
      const todayFrom = todaySteps[from] || 0;
      const todayTo = todaySteps[to] || 0;
      const baseFrom = baselineSteps[from] || 0;
      const baseTo = baselineSteps[to] || 0;

      // Sample size mínimo — precisa pelo menos 50 no `from` hoje pra CR ser estável
      if (todayFrom < 50 || baseFrom < 50) return;

      const todayCR = todayTo / todayFrom;
      const baseCR = baseTo / (baseFrom || 1);
      if (baseCR <= 0) return;

      const delta = (todayCR - baseCR) / baseCR;
      if (delta < -0.3) {
        alerts.push(
          `${from}→${to}: ${(todayCR * 100).toFixed(1)}% hoje vs ${(baseCR * 100).toFixed(1)}% baseline (${(delta * 100).toFixed(0)}%)`,
        );
      }
    });

    if (alerts.length > 0) {
      const title = `⚠️ CR caindo no funil`;
      const body = alerts.join(' · ');
      await notifyAdmins(title, body, 'https://mycupid.com.br/admin').catch(() => {});
      await logCriticalError('api', 'Conversion rate drop detected', {
        todayKey,
        alerts,
        todaySteps,
        baselineDaysWithData,
      }).catch(() => {});
      return NextResponse.json({ ok: true, alerts });
    }

    return NextResponse.json({ ok: true, healthy: true });
  } catch (e: any) {
    console.error('[cron/conversion-monitor] Failed:', e?.message);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
