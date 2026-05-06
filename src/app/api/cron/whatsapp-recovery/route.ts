import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { sendText } from '@/services/zapi/client';
import {
  buildRecovery5min,
  buildRecovery1h,
} from '@/services/zapi/messages';
import { categorizeRecipient } from '@/services/zapi/recipient';
import { formatPhoneE164 } from '@/services/zapi/phone';
import { ADMIN_EMAILS } from '@/lib/admin-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron WhatsApp Recovery (2 toques: soft 4min + cupom 10min)
 *
 * Disparado pelo Netlify Scheduled Functions a cada 5min. Busca payment_intents
 * com status=waiting_payment dentro das janelas dos 3 stages e dispara mensagem
 * via Z-API com cupom CUPOM10. Idempotente via flags `recovery${stage}Sent`.
 *
 * SOFT-LAUNCH: por default `RECOVERY_ENABLED=false`. Liga via env var quando
 * pronto. Sem isso, cron entra e sai sem mandar nada.

 *
 * Janelas (atualizadas — decisão dono: cadência mais agressiva pq PIX é
 * pago rápido; se passou de 10min, provavelmente abandonou):
 *   soft  → mandado se 4  ≤ idade < 9min  e !recovery5minSent (sem cupom)
 *   cupom → mandado se 10 ≤ idade < 30min e !recovery1hSent  (CUPOM10)
 *
 * Cap diário (RECOVERY_DAILY_CAP, default 100): conta envios do "5min" hoje
 * como proxy de novos lembretes — protege contra explosão de gastos / banimento
 * Z-API se algo der errado.
 *
 * Mother's Day: copy especial pra recipient='mae' até MOTHERS_DAY_DATE.
 */

function daysToMothersDay(): number {
  const dateStr = process.env.MOTHERS_DAY_DATE || '2026-05-10';
  const target = new Date(dateStr + 'T00:00:00-03:00'); // BRT
  if (isNaN(target.getTime())) return 0;
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

type StageKey = '5min' | '1h';

interface Stage {
  key: StageKey;
  minMin: number;
  maxMin: number;
  flag: string;       // boolean flag no doc
  flagSentAt: string; // timestamp field
  flagMsgId: string;  // messageId field
  build: (p: { firstName: string; recipient: any; checkoutUrl: string; daysToMothersDay: number }) => string;
}

// Cadência atual (decisão dono): 4min soft + 10min cupom. PIX é pago rápido,
// se passou de 10min sem pagar provavelmente já abandonou. Cadência antiga
// (5min/1h/24h) era lenta demais. Stage 24h removido por ser pushy demais.
// As keys '5min' e '1h' são MANTIDAS (e os flags recovery5minSent /
// recovery1hSent) pra preservar idempotência com intents que já foram
// processados — só o intervalo minMin/maxMin é que mudou.
const STAGES: Stage[] = [
  { key: '5min', minMin: 4,    maxMin: 9,    flag: 'recovery5minSent',  flagSentAt: 'recovery5minSentAt',  flagMsgId: 'recovery5minMessageId',  build: buildRecovery5min },
  { key: '1h',   minMin: 10,   maxMin: 30,   flag: 'recovery1hSent',    flagSentAt: 'recovery1hSentAt',    flagMsgId: 'recovery1hMessageId',    build: buildRecovery1h },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  // Auth — só Netlify cron
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const enabled = process.env.RECOVERY_ENABLED === 'true' && process.env.ZAPI_ENABLED === 'true';
  if (!enabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'RECOVERY_ENABLED or ZAPI_ENABLED not true',
    });
  }

  const dailyCap = parseInt(process.env.RECOVERY_DAILY_CAP || '100', 10);

  const db = getAdminFirestore();
  const now = Date.now();

  // Verifica cap diário (envios de 5min hoje + 1h + 24h)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    const sentTodaySnap = await db.collection('payment_intents')
      .where('recovery5minSentAt', '>=', Timestamp.fromDate(startOfDay))
      .count().get();
    const sentToday = sentTodaySnap.data().count;
    if (sentToday >= dailyCap) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'daily_cap_reached',
        sentToday,
        cap: dailyCap,
      });
    }
  } catch (e: any) {
    // Index pode não existir ainda — primeira execução do cron. Continua.
    console.warn('[whatsapp-recovery] cap check failed (index missing?):', e?.message);
  }

  // Janela MAIOR de busca: 4min até 30min. Casa com a cadência atual
  // (soft 4-9min, cupom 10-30min). Filtro fino por stage acontece em memória.
  const cutoffOldest = Timestamp.fromMillis(now - 30 * 60 * 1000);
  const cutoffYoungest = Timestamp.fromMillis(now - 4 * 60 * 1000);

  // Busca intents waiting_payment criados na janela. Filtros adicionais
  // (opt-in, recoveryDisabled, isGift) aplicados em memória pra não exigir
  // composite index gigante.
  let pendingDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  try {
    const snap = await db.collection('payment_intents')
      .where('status', '==', 'waiting_payment')
      .where('createdAt', '>=', cutoffOldest)
      .where('createdAt', '<=', cutoffYoungest)
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    pendingDocs = snap.docs;
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: 'firestore_query_failed',
      message: e?.message,
      hint: 'May need composite index on payment_intents (status + createdAt)',
    }, { status: 500 });
  }

  // Carrega users pra filtrar admins
  const userMap = new Map<string, string>(); // userId → email
  try {
    const usersSnap = await db.collection('users').get();
    usersSnap.docs.forEach((d) => {
      const e = d.data()?.email;
      if (e) userMap.set(d.id, String(e).toLowerCase());
    });
  } catch { /* segue sem map */ }

  const results: Array<{ intentId: string; stage: StageKey; status: string; error?: string }> = [];
  let processed = 0, sent = 0, skipped = 0, failed = 0;

  for (const doc of pendingDocs) {
    if (sent >= dailyCap) break;

    const sale = doc.data();

    // Skip: gift, refund, opt-out, sem phone, admin, sem createdAt
    if (sale.isGift) { skipped++; continue; }
    if (sale.deletedByAdmin) { skipped++; continue; }
    if (sale.recoveryDisabled === true) { skipped++; continue; }
    if (sale.whatsappOptIn === false) { skipped++; continue; }

    const ownerEmail = userMap.get(sale.userId) || '';
    if (ownerEmail && ADMIN_EMAILS.includes(ownerEmail)) { skipped++; continue; }

    const createdAt: Date | null = sale.createdAt?.toDate ? sale.createdAt.toDate() : null;
    if (!createdAt) { skipped++; continue; }

    const ageMin = (now - createdAt.getTime()) / 60000;

    // Encontra stage que se encaixa na idade E ainda não foi enviado
    const stage = STAGES.find((s) =>
      ageMin >= s.minMin &&
      ageMin < s.maxMin &&
      sale[s.flag] !== true,
    );
    if (!stage) continue;

    processed++;

    const phone = formatPhoneE164(sale.whatsappNumber || sale.buyerPhone);
    if (!phone) {
      // Marca pra não tentar de novo — phone permanente inválido.
      try {
        await doc.ref.set({
          recoveryDisabled: true,
          recoveryDisabledReason: 'invalid_phone',
        }, { merge: true });
      } catch { /* */ }
      skipped++;
      results.push({ intentId: doc.id, stage: stage.key, status: 'skipped_invalid_phone' });
      continue;
    }

    const firstName = ((sale.userName as string) || 'amor').split(' ')[0];
    const recipient = categorizeRecipient(sale.title);
    const baseUrl = sale.market === 'PT' ? 'https://mycupid.net' : 'https://mycupid.com.br';
    // Link recovery: usa o cupom CUPOM10 (rota /desconto/CODE existente que
    // grava no localStorage e leva pro wizard com cupom já aplicado).
    const checkoutUrl = `${baseUrl}/desconto/CUPOM10`;

    const message = stage.build({
      firstName,
      recipient,
      checkoutUrl,
      daysToMothersDay: daysToMothersDay(),
    });

    const result = await sendText({ phone, message });

    if (result.ok) {
      try {
        await doc.ref.set({
          [stage.flag]: true,
          [stage.flagSentAt]: Timestamp.now(),
          [stage.flagMsgId]: result.messageId || null,
        }, { merge: true });
      } catch (e: any) {
        console.warn(`[whatsapp-recovery] failed to update intent ${doc.id}:`, e?.message);
      }
      sent++;
      results.push({ intentId: doc.id, stage: stage.key, status: 'sent' });
    } else {
      failed++;
      results.push({ intentId: doc.id, stage: stage.key, status: 'send_failed', error: result.error });
    }

    // Anti-throttle: 1.5s entre envios. Z-API recomenda pra não soar como bot.
    await sleep(1500);
  }

  return NextResponse.json({
    ok: true,
    processed,
    sent,
    skipped,
    failed,
    cap: dailyCap,
    results: results.slice(0, 50), // cap pra response não estourar
  });
}
