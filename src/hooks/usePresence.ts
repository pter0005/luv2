'use client';

import { useEffect } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, push, remove } from 'firebase/database';
import { useFirebase } from '@/firebase';

export function usePresence() {
  const { firebaseApp: app } = useFirebase(); // ou useFirebase se tiver o app exposto

  useEffect(() => {
    if (!app) return;

    const db = getDatabase(app);
    const connectedRef = ref(db, '.info/connected');

    // Cria uma entrada única por sessão na coleção /presence
    const presenceRef = push(ref(db, 'presence'));

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      // Quando desconectar, remove automaticamente
      onDisconnect(presenceRef).remove();

      // Registra presença
      set(presenceRef, {
        connectedAt: serverTimestamp(),
        userAgent: navigator.userAgent.slice(0, 80),
      });
    });

    return () => {
      unsub();
      remove(presenceRef); // limpa ao desmontar (ex: navegação SPA)
    };
  }, [app]);
}
