import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { sendText } from '@/services/zapi/client';
import { buildOptOutConfirmation } from '@/services/zapi/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook inbound do Z-API — escuta mensagens RECEBIDAS no número.
 *
 * Único uso: detectar STOP/PARAR/CANCELAR e marcar `recoveryDisabled=true`
 * em todos os intents waiting_payment do número. Manda confirmação.
 *
 * LGPD: opt-out tem que ser FÁCIL e AUTOMÁTICO. Sem isso, usa-se de
 * legítimo interesse cai. Esse webhook fecha esse loop.
 *
 * Setup no painel Z-API → Webhooks → "Ao receber" → URL:
 *   https://mycupid.com.br/api/webhooks/zapi
 *
 * Segurança: Z-API não assina o payload, então usa shared-secret no
 * query (?secret=...) que comparamos com env ZAPI_WEBHOOK_SECRET.
 * Sem secret config'd, não rejeita (mas isso é deploy ruim — sempre
 * setar em prod).
 */

const STOP_KEYWORDS = /^\s*(stop|parar|para|cancelar|cancela|sair|remover|nao|não|n[aã]o quero)\s*\.?!?\s*$/i;

export async function POST(req: NextRequest) {
  // Auth via shared secret no query
  const secret = process.env.ZAPI_WEBHOOK_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const provided = url.searchParams.get('secret') || req.headers.get('x-zapi-secret') || '';
    if (provided !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Z-API formato típico (varia por versão):
  //   { phone, fromMe, text: { message }, type, ... }
  // ou
  //   { phone, fromMe: false, message, ... }
  const fromMe = payload?.fromMe === true;
  if (fromMe) return NextResponse.json({ ok: true, ignored: 'from_me' });

  const phoneRaw = String(payload?.phone || payload?.author || '').replace(/\D/g, '');
  const messageText: string =
    payload?.text?.message ||
    payload?.text?.body ||
    payload?.message ||
    payload?.body ||
    '';

  if (!phoneRaw || !messageText) {
    return NextResponse.json({ ok: true, ignored: 'no_phone_or_text' });
  }

  // Só age em STOP/PARAR — outras msgs são ignoradas (cliente respondendo
  // dúvida, vai cair em atendimento manual).
  if (!STOP_KEYWORDS.test(messageText)) {
    return NextResponse.json({ ok: true, ignored: 'not_stop_keyword' });
  }

  try {
    const db = getAdminFirestore();

    // Match por whatsappNumber salvo no intent. Aceita ambos formatos
    // (com 55 e sem) — busca por sufixo dos últimos 11 díg que é o que
    // BR usa internamente.
    const last11 = phoneRaw.slice(-11);
    const last10 = phoneRaw.slice(-10);

    // Busca intents ATIVOS desse phone — só os que ainda têm chance de
    // receber recovery. Não toca em completed/refunded.
    const snap = await db.collection('payment_intents')
      .where('status', 'in', ['waiting_payment', 'pending'])
      .limit(50)
      .get();

    let matched = 0;
    for (const doc of snap.docs) {
      const wn = String(doc.data()?.whatsappNumber || '').replace(/\D/g, '');
      const wnLast11 = wn.slice(-11);
      if (wnLast11 === last11 || wn.slice(-10) === last10) {
        await doc.ref.set({
          recoveryDisabled: true,
          recoveryDisabledReason: 'user_opt_out',
          recoveryDisabledAt: Timestamp.now(),
        }, { merge: true });
        matched++;
      }
    }

    // Confirma pro cliente (fire-and-forget — não bloqueia 200 do webhook)
    sendText({
      phone: phoneRaw.startsWith('55') ? phoneRaw : `55${phoneRaw}`,
      message: buildOptOutConfirmation(),
    }).catch(() => {});

    return NextResponse.json({ ok: true, matched, action: 'opt_out_recorded' });
  } catch (e: any) {
    console.error('[webhook/zapi] error:', e?.message);
    // Sempre 200 pra Z-API não retentar com mesma keyword (idempotência)
    return NextResponse.json({ ok: true, error: e?.message?.slice(0, 200) });
  }
}

// Z-API às vezes faz GET pra "test webhook" no painel
export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, alive: true });
}
