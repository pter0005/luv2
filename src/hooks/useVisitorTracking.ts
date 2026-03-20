'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ADMIN_EMAILS = ['inesvalentim45@gmail.com', 'giibrossini@gmail.com'];

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
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, path: pathname }),
    }).catch(() => {});
  }, [pathname, userEmail]);
}
