'use client';

import { useEffect } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, remove } from 'firebase/database';
import { getApp } from 'firebase/app';

import { ADMIN_EMAILS } from '@/lib/admin-emails';

// Stable per-browser ID so N tabs from the same person dedup to 1 user.
// Widget counts unique top-level keys (visitorId), not child keys (tabId).
function getVisitorId(): string {
  try {
    const key = 'mycupid-visitor-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function newTabId(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
}

export function usePresence(userEmail?: string | null) {
  useEffect(() => {
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) return;
    let db: any;
    try { db = getDatabase(getApp()); } catch { return; }

    const visitorId = getVisitorId();
    const tabId = newTabId();
    const presenceRef = ref(db, `presence/${visitorId}/${tabId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (!snap.val()) return;
      onDisconnect(presenceRef).remove();
      set(presenceRef, { connectedAt: serverTimestamp() });
    });

    return () => {
      unsub();
      remove(presenceRef).catch(() => {});
    };
  }, [userEmail]);
}

export function useCreatingPresence(active: boolean, userEmail?: string | null) {
  useEffect(() => {
    if (!active) return;
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) return;
    let db: any;
    try { db = getDatabase(getApp()); } catch { return; }

    const visitorId = getVisitorId();
    const tabId = newTabId();
    const creatingRef = ref(db, `creating/${visitorId}/${tabId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (!snap.val()) return;
      onDisconnect(creatingRef).remove();
      set(creatingRef, { connectedAt: serverTimestamp() });
    });

    return () => {
      unsub();
      remove(creatingRef).catch(() => {});
    };
  }, [active, userEmail]);
}
