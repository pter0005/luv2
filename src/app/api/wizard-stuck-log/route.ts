import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Log defensivo: registra sinais de "wizard travado" pro admin investigar.
 * Sem auth — é o cliente reportando estado dele mesmo, sem ler nada sensível.
 * Rate limited pra evitar flood se algo grita repetidamente.
 *
 * Tipos de evento (kind):
 *   - 'next_blocked'  → handleNext retornou sem avançar (validation fail)
 *   - 'button_stuck'  → botão Continuar disabled por > 30s
 *   - 'upload_failed' → uploadFile rejeitou após retries
 *   - 'counter_stuck' → uploadingCount > 0 por > 90s
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`wizard-stuck:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || 'unknown').slice(0, 40);
    const step = String(body.step || '').slice(0, 40);
    const route = String(body.route || '').slice(0, 80);
    const detail = String(body.detail || '').slice(0, 500);
    const userId = String(body.userId || '').slice(0, 80);
    const userAgent = String(body.userAgent || '').slice(0, 200);

    const db = getAdminFirestore();
    await db.collection('wizard_stuck_logs').add({
      kind, step, route, detail, userId, userAgent,
      ip,
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'log_failed', message: err?.message }, { status: 500 });
  }
}
