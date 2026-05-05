/**
 * Extrai geolocalização e device do request server-side.
 *
 * Funciona em qualquer plataforma:
 *   - Netlify Edge Functions: x-country, x-nf-geo (base64 JSON)
 *   - Vercel: x-vercel-ip-country, x-vercel-ip-country-region, x-vercel-ip-city
 *   - Cloudflare: cf-ipcountry, cf-ipcity, cf-region
 *
 * Usado em createOrUpdatePaymentIntent pra persistir geo no momento da venda
 * — atribuição precisa, sem depender só do client (que pode não conseguir
 * via privacy mode/VPN no browser).
 */

import { headers as nextHeaders } from 'next/headers';

export interface RequestGeo {
  country: string | null;     // ISO-3166 alpha-2 ex: 'BR', 'PT', 'US'
  region: string | null;      // estado/região ex: 'SP', 'RJ', 'CA'
  city: string | null;        // ex: 'Sao Paulo', 'Lisbon'
  latitude: string | null;
  longitude: string | null;
  ip: string | null;          // IP truncado (last octet → '0' pra LGPD/GDPR)
  userAgent: string | null;   // UA do request (truncado 500 chars)
  acceptLanguage: string | null; // ex: 'pt-BR,pt;q=0.9'
}

function truncateIp(ip: string | null): string | null {
  if (!ip) return null;
  // IPv4: zera último octeto. IPv6: zera últimos 80 bits.
  const v4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (v4) return `${v4[1]}.0`;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  return ip;
}

function decodeNetlifyGeo(header: string | null): { country?: string; region?: string; city?: string; lat?: string; lng?: string } | null {
  if (!header) return null;
  try {
    const decoded = JSON.parse(
      typeof atob === 'function' ? atob(header) : Buffer.from(header, 'base64').toString('utf-8'),
    );
    return {
      country: decoded?.country?.code,
      region: decoded?.subdivision?.code || decoded?.subdivision?.name,
      city: decoded?.city,
      lat: decoded?.latitude,
      lng: decoded?.longitude,
    };
  } catch { return null; }
}

/**
 * Lê headers do request atual (Server Action / Route Handler).
 * Tenta Netlify → Vercel → Cloudflare em cascata.
 */
export function getRequestGeo(): RequestGeo {
  let h: Headers | null = null;
  try {
    h = nextHeaders() as any;
  } catch {
    return { country: null, region: null, city: null, latitude: null, longitude: null, ip: null, userAgent: null, acceptLanguage: null };
  }
  if (!h) return { country: null, region: null, city: null, latitude: null, longitude: null, ip: null, userAgent: null, acceptLanguage: null };

  const get = (k: string) => h!.get(k);

  // Country
  let country = (get('x-country') || get('x-vercel-ip-country') || get('cf-ipcountry') || '').toUpperCase() || null;

  // Netlify x-nf-geo (JSON base64)
  let region: string | null = null;
  let city: string | null = null;
  let lat: string | null = null;
  let lng: string | null = null;

  const nf = decodeNetlifyGeo(get('x-nf-geo'));
  if (nf) {
    if (!country && nf.country) country = nf.country.toUpperCase();
    region = nf.region || null;
    city = nf.city || null;
    lat = nf.lat ? String(nf.lat) : null;
    lng = nf.lng ? String(nf.lng) : null;
  }

  // Fallback Vercel
  region = region || get('x-vercel-ip-country-region') || get('cf-region') || null;
  city = city || decodeURIComponent(get('x-vercel-ip-city') || get('cf-ipcity') || '') || null;
  if (city === '') city = null;
  lat = lat || get('x-vercel-ip-latitude') || get('cf-iplatitude') || null;
  lng = lng || get('x-vercel-ip-longitude') || get('cf-iplongitude') || null;

  // IP (privacy: trunca último octeto)
  const xff = get('x-forwarded-for') || '';
  const rawIp = xff.split(',')[0]?.trim() || get('x-real-ip') || null;
  const ip = truncateIp(rawIp);

  // UA
  const ua = get('user-agent');
  const userAgent = ua ? ua.slice(0, 500) : null;

  const acceptLanguage = (get('accept-language') || '').slice(0, 200) || null;

  return { country, region, city, latitude: lat, longitude: lng, ip, userAgent, acceptLanguage };
}
