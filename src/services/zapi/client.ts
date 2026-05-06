/**
 * Cliente HTTP pro Z-API (provider WhatsApp não-oficial).
 * Plano R$129/mês fixo, mensagens ilimitadas.
 *
 * Endpoints usados:
 *   POST /instances/{id}/token/{token}/send-text
 *   GET  /instances/{id}/token/{token}/status
 *
 * Auth: header Client-Token (separado do path token, regra Z-API).
 *
 * Retry: até 2 tentativas em 5xx/429, 30s entre. Timeout 10s por chamada.
 * Fail aberto silencioso pra não bloquear webhook MP nem cron.
 */

interface ZApiSendArgs {
  phone: string;       // E.164 sem +, ex "5511988887777"
  message: string;
}

export interface ZApiResult {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
}

const BASE_URL = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';

function isConfigured(): boolean {
  return !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN && process.env.ZAPI_CLIENT_TOKEN);
}

function isEnabled(): boolean {
  return process.env.ZAPI_ENABLED === 'true' && isConfigured();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function sendText({ phone, message }: ZApiSendArgs): Promise<ZApiResult> {
  if (!isEnabled()) {
    return { ok: false, status: 0, error: 'zapi_disabled_or_not_configured' };
  }

  const url = `${BASE_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;

  let lastError = 'unknown';
  let lastStatus = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': process.env.ZAPI_CLIENT_TOKEN!,
        },
        body: JSON.stringify({ phone, message }),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timer));

      lastStatus = r.status;
      let data: any = null;
      try { data = await r.json(); } catch { data = {}; }

      if (r.status === 200 && (data.messageId || data.id || data.zaapId)) {
        return {
          ok: true,
          status: 200,
          messageId: String(data.messageId || data.id || data.zaapId),
        };
      }

      // Retry só em 5xx ou 429 — 4xx (exceto 429) são erros do nosso lado
      // (phone inválido, mensagem mal-formada). Retry não vai mudar nada.
      if (r.status >= 500 || r.status === 429) {
        lastError = data?.error || data?.message || `http_${r.status}`;
        if (attempt < 2) { await sleep(30_000); continue; }
      }

      return {
        ok: false,
        status: r.status,
        error: data?.error || data?.message || `http_${r.status}`,
      };
    } catch (e: any) {
      lastError = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'fetch_failed');
      if (attempt < 2) { await sleep(30_000); continue; }
    }
  }

  return { ok: false, status: lastStatus, error: lastError };
}

export async function checkStatus(): Promise<{ connected: boolean; smartphoneConnected?: boolean; error?: string }> {
  if (!isConfigured()) return { connected: false, error: 'not_configured' };
  try {
    const url = `${BASE_URL}/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/status`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    const r = await fetch(url, {
      headers: { 'Client-Token': process.env.ZAPI_CLIENT_TOKEN! },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!r.ok) return { connected: false, error: `http_${r.status}` };
    const d = await r.json();
    return {
      connected: d.connected === true,
      smartphoneConnected: d.smartphoneConnected,
    };
  } catch (e: any) {
    return { connected: false, error: e?.message || 'fetch_failed' };
  }
}

export const zapiInternals = { isEnabled, isConfigured };
