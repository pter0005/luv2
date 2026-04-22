/**
 * Attribution helpers — captura identificadores de campanha (fbp/fbc/ttclid/UTMs)
 * na primeira visita e persiste em localStorage + cookie pra sobreviver a
 * navegação. Esses valores são mandados junto com o payment_intent e usados
 * pelo server-side CAPI/Events API pra atribuir a venda ao ad correto.
 *
 * Sem isso, Meta/TikTok não conseguem deduplicar o Purchase do browser com
 * o CAPI, e o algoritmo do ads otimiza no escuro (~30% pior).
 */

const STORAGE_KEY = 'mycupid_attribution_v1';

export interface AttributionData {
  fbp?: string;
  fbc?: string;
  ttclid?: string;
  ttp?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  captured_at?: number;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

/**
 * Captura attribution data da URL + cookies do browser.
 * Merge com o que já tá salvo (primeira visita vence, mas preenche gaps).
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

  // Meta fbc — formato `fb.<subdomain>.<creation_time>.<fbclid>`
  // Só gera se o fbclid veio agora; senão lê do cookie já setado pelo Pixel.
  const fbcFromUrl = fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;

  const captured: AttributionData = {
    fbp: existing.fbp || readCookie('_fbp'),
    fbc: existing.fbc || fbcFromUrl || readCookie('_fbc'),
    ttclid: existing.ttclid || ttclid || undefined,
    ttp: existing.ttp || readCookie('_ttp'),
    utm_source: existing.utm_source || params.get('utm_source') || undefined,
    utm_medium: existing.utm_medium || params.get('utm_medium') || undefined,
    utm_campaign: existing.utm_campaign || params.get('utm_campaign') || undefined,
    utm_content: existing.utm_content || params.get('utm_content') || undefined,
    utm_term: existing.utm_term || params.get('utm_term') || undefined,
    landing_page: existing.landing_page || window.location.pathname,
    referrer: existing.referrer || (document.referrer || undefined),
    captured_at: existing.captured_at || Date.now(),
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
