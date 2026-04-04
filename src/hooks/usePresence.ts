'use client';

import { useEffect } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, push, remove } from 'firebase/database';
import { getApp } from 'firebase/app';

import { ADMIN_EMAILS } from '@/lib/admin-emails';

export function usePresence(userEmail?: string | null) {
  useEffect(() => {
    if (userEmail && ADMIN_EMAILS.includes(userEmail)) return; // não conta admin
    let db: any;
    try {
      db = getDatabase(getApp());
    } catch (e) {
      return; // Realtime DB não configurado ainda
    }

    const connectedRef = ref(db, '.info/connected');
    const presenceRef = push(ref(db, 'presence'));

    const unsub = onValue(connectedRef, (snap) => {
      if (!snap.val()) return;
      onDisconnect(presenceRef).remove();
      set(presenceRef, { connectedAt: serverTimestamp() });
    });

    return () => {
      unsub();
      remove(presenceRef);
    };
  }, []);
}
