/**
 * Attribution helpers — captura identificadores de campanha (fbp/fbc/ttclid/UTMs)
 * na primeira visita e persiste em localStorage + cookie pra sobreviver a
 * navegação. Esses valores são mandados junto com o payment_intent e usados
 * pelo server-side CAPI/Events API pra atribuir a venda ao ad correto.
 *
 * Sem isso, Meta/TikTok não conseguem deduplicar o Purchase do browser com
 * o CAPI, e o algoritmo do ads otimiza no escuro (~30% pior).
 *
 * P1 expansion: também captura device fingerprint (UA, screen, timezone),
 * gclid (Google Ads), referrer original, primeira visita timestamp.
 * Tudo passive — zero impacto pro cliente.
 */

const STORAGE_KEY = 'mycupid_attribution_v1';

export interface AttributionData {
  // ── Click IDs (atribuição de ads) ──
  fbp?: string;        // Facebook browser ID (cookie _fbp)
  fbc?: string;        // Facebook click ID (derivado de fbclid)
  fbclid?: string;     // Raw fbclid pra logging/debug
  ttclid?: string;     // TikTok click ID
  ttp?: string;        // TikTok cookie
  gclid?: string;      // Google Ads click ID
  msclkid?: string;    // Microsoft Ads (Bing)

  // ── UTMs ──
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  // ── Origem / sessão ──
  landing_page?: string;     // pathname da primeira tela vista
  referrer?: string;         // document.referrer (de onde veio)
  captured_at?: number;      // timestamp da primeira captura
  first_visit_at?: number;   // alias canônico — quando bateu no site primeira vez

  // ── Device fingerprint (não-PII, ajuda anti-fraude + segmentação) ──
  user_agent?: string;       // UA completo (max 500 chars)
  screen_size?: string;      // ex: "1920x1080"
  viewport_size?: string;    // ex: "1280x720"
  device_pixel_ratio?: number; // 1, 2, 3 (HiDPI)
  timezone?: string;         // ex: "America/Sao_Paulo"
  language?: string;         // navigator.language ex: "pt-BR"
  platform?: string;         // navigator.platform ex: "MacIntel" (deprecated mas ainda dá info)
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function safeStr(v: any, max: number = 500): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

/**
 * Captura attribution data da URL + cookies do browser + device info.
 * Merge com o que já tá salvo (primeira visita vence, mas preenche gaps).
 *
 * Idempotente: chamar várias vezes não duplica nada. First-touch wins
 * (ex: se user veio de utm_source=instagram primeiro e depois entrou
 * direct, a atribuição fica como instagram).
 */
export function captureAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};

  // Existing storage (first-touch attribution wins)
  let existing: AttributionData = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) existing = JSON.parse(raw);
  } catch { /* ignore */ }

  const url = new URL(window.location.href);
  const params = url.searchParams;

  const fbclid = params.get('fbclid');
  const ttclid = params.get('ttclid');
  const gclid = params.get('gclid');
  const msclkid = params.get('msclkid');

  // Meta fbc — formato `fb.<subdomain>.<creation_time>.<fbclid>`
  // Só gera se o fbclid veio agora; senão lê do cookie já setado pelo Pixel.
  const fbcFromUrl = fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;

  // Device fingerprint — passive, nada que peça permissão
  let deviceInfo: Partial<AttributionData> = {};
  try {
    deviceInfo = {
      user_agent: safeStr(navigator.userAgent, 500),
      screen_size: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      device_pixel_ratio: typeof window.devicePixelRatio === 'number' ? Number(window.devicePixelRatio.toFixed(2)) : undefined,
      timezone: safeStr(Intl.DateTimeFormat().resolvedOptions().timeZone, 64),
      language: safeStr(navigator.language, 16),
      platform: safeStr((navigator as any).platform, 64),
    };
  } catch { /* navegadores antigos podem barrar; melhor sem device info que sem nada */ }

  const captured: AttributionData = {
    // Click IDs — first-touch wins
    fbp: existing.fbp || readCookie('_fbp'),
    fbc: existing.fbc || fbcFromUrl || readCookie('_fbc'),
    fbclid: existing.fbclid || fbclid || undefined,
    ttclid: existing.ttclid || ttclid || undefined,
    ttp: existing.ttp || readCookie('_ttp'),
    gclid: existing.gclid || gclid || undefined,
    msclkid: existing.msclkid || msclkid || undefined,

    // UTMs — first-touch wins
    utm_source: existing.utm_source || params.get('utm_source') || undefined,
    utm_medium: existing.utm_medium || params.get('utm_medium') || undefined,
    utm_campaign: existing.utm_campaign || params.get('utm_campaign') || undefined,
    utm_content: existing.utm_content || params.get('utm_content') || undefined,
    utm_term: existing.utm_term || params.get('utm_term') || undefined,

    // Origem — first-touch wins
    landing_page: existing.landing_page || window.location.pathname,
    referrer: existing.referrer || (document.referrer || undefined),
    captured_at: existing.captured_at || Date.now(),
    first_visit_at: existing.first_visit_at || existing.captured_at || Date.now(),

    // Device — atualiza sempre (UA pode mudar entre sessões: novo browser, etc)
    user_agent: deviceInfo.user_agent || existing.user_agent,
    screen_size: deviceInfo.screen_size || existing.screen_size,
    viewport_size: deviceInfo.viewport_size || existing.viewport_size,
    device_pixel_ratio: deviceInfo.device_pixel_ratio ?? existing.device_pixel_ratio,
    timezone: deviceInfo.timezone || existing.timezone,
    language: deviceInfo.language || existing.language,
    platform: deviceInfo.platform || existing.platform,
  };

  // Remove undefined keys pra não poluir o Firestore doc
  const clean: AttributionData = {};
  (Object.keys(captured) as (keyof AttributionData)[]).forEach((k) => {
    const v = captured[k];
    if (v !== undefined && v !== '') (clean as any)[k] = v;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch { /* storage disabled */ }

  return clean;
}

/**
 * Lê a attribution salva (sem capturar novamente). Usado quando quer injetar
 * no payload de um intent/save sem depender da URL atual.
 */
export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
