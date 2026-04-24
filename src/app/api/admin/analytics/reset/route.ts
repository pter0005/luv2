export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';
import { timingSafeEqual } from 'crypto';

// ── RESET PASSWORD (gate extra contra clique acidental) ─────────────────────
// Lê de env em produção pra permitir rotate sem redeploy de código. Fallback
// ao valor solicitado pelo dono (pedropedropedro123) se env não existir —
// evita travar o admin se esqueceram de setar.
const RESET_PASSWORD = process.env.ADMIN_RESET_PASSWORD || 'pedropedropedro123';

// Compare em tempo constante pra prevenir timing attack — irrelevante aqui
// na prática (já tem isAdminRequest), mas é grátis e não dói.
function passwordMatches(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

// Apaga todos os docs de uma coleção em batches de 500
async function nukeCollection(db: any, collectionRef: any): Promise<void> {
  const snap = await collectionRef.limit(500).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  await batch.commit();
  if (snap.size === 500) await nukeCollection(db, collectionRef);
}

// ── COLEÇÕES QUE NUNCA PODEM SER APAGADAS ───────────────────────────────────
// Se algum dia alguém adicionar um `nukeCollection` nova no escopo deste
// endpoint, essa lista explícita força um segundo par de olhos no code review.
// Declarada fora da função pra ficar visível no diff.
const PROTECTED_COLLECTIONS = new Set([
  'lovepages',        // páginas de clientes — receita, criações
  'payment_intents',  // histórico de pagamento, pra auditoria + recuperação
  'users',            // contas dos clientes
  'user_credits',     // créditos pagos
  'gift_tokens',      // tokens de presente em uso
  'discount_codes',   // cupons ativos
  'wizard_funnel',    // funil histórico — útil pra comparação temporal
  'error_logs',       // auditoria de falhas
  'push_subscriptions', // push notifications
  'failed_file_moves',  // fila de recovery de arquivos
]);

// Lista do que REALMENTE vai ser apagado — defensivo: se mudar, muda aqui.
const RESETTABLE_COLLECTIONS = ['analytics', 'utm_visits'];

// Sanity check em build time — impede regressão silenciosa se alguém
// adicionar `lovepages` à lista resetável por engano.
for (const c of RESETTABLE_COLLECTIONS) {
  if (PROTECTED_COLLECTIONS.has(c)) {
    throw new Error(`[reset] Collection ${c} está em PROTECTED e RESETTABLE ao mesmo tempo`);
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Lê senha do body JSON (body opcional — header também aceito pra
  // compatibilidade com clientes antigos que ainda não passaram password).
  let providedPassword = '';
  try {
    const body = await req.json().catch(() => ({} as any));
    providedPassword = String(body?.password || '');
  } catch { /* ignore */ }

  if (!passwordMatches(providedPassword, RESET_PASSWORD)) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 403 });
  }

  try {
    const db = getAdminFirestore();

    // ── 1. analytics (docs day_* + report_* etc) ────────────────────────────
    await nukeCollection(db, db.collection('analytics'));

    // ── 2. analytics/daily/{date} subcoleções (últimos 90 dias) ─────────────
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      await nukeCollection(db, db.collection('analytics').doc('daily').collection(ds));
    }

    // ── 3. utm_visits ───────────────────────────────────────────────────────
    await nukeCollection(db, db.collection('utm_visits'));

    // ── NUNCA deletadas (documentadas explícitas pra auditoria) ────────────
    // lovepages, payment_intents, users, user_credits, gift_tokens,
    // discount_codes, wizard_funnel, error_logs, push_subscriptions,
    // failed_file_moves — ver PROTECTED_COLLECTIONS acima.

    return NextResponse.json({
      success: true,
      reset: RESETTABLE_COLLECTIONS,
      preserved: Array.from(PROTECTED_COLLECTIONS),
    });
  } catch (err: any) {
    console.error('[Reset] Erro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
