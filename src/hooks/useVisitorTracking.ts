'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { getAttribution } from '@/lib/attribution';

// Detecta a fonte de tráfego do visitante. Ordem:
//   1. UTM source na URL atual (prioridade máxima — link fresco)
//   2. Attribution salva no localStorage (first-touch do captureAttribution)
//   3. Referrer do document (heurística pra tráfego orgânico sem UTM)
//   4. 'direct' como fallback
//
// Mapeia domínios conhecidos pra chaves do SOURCE_META (tiktok/instagram/etc)
// pra que o painel admin consiga agrupar corretamente.
function detectSource(): string {
  try {
    if (typeof window === 'undefined') return 'direct';
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) return utmSource.toLowerCase();

    const attr = getAttribution();
    if (attr.utm_source) return attr.utm_source.toLowerCase();

    const ref = document.referrer || '';
    if (!ref) return 'direct';
    const host = (() => { try { return new URL(ref).hostname.toLowerCase(); } catch { return ''; } })();
    if (!host) return 'direct';
    if (host.includes('tiktok'))    return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    if (host.includes('google'))    return 'google';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes('youtube'))   return 'youtube';
    if (host.includes('twitter') || host.includes('x.com')) return 'twitter';
    return 'direct';
  } catch {
    return 'direct';
  }
}

export function useVisitorTracking(userEmail?: string | null) {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) return; // não conta admin
    let deviceId = localStorage.getItem('mycupid_device_id');
    if (!deviceId) {
      deviceId = `d_${crypto.randomUUID()}`;
      localStorage.setItem('mycupid_device_id', deviceId);
    }
    const today = new Date().toISOString().slice(0, 10);
    const sessionKey = `mycupid_tracked_${today}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');

    const source = detectSource();
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, path: pathname, source }),
    }).catch(() => {});
  }, [pathname, userEmail]);
}
