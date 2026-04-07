'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = 'BFVpYTPhsd-dbg4p-a09S3t1WoJIWw3ULVv6jpuGYWA5vsbB9ClFkl2Y64_QKSkt2evt9-kFHo9tb35W3oHM1HU';
const DISMISSED_KEY = 'mycupid_push_dismissed';
const SUBSCRIBED_KEY = 'mycupid_push_subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if: already subscribed, dismissed, no support, already granted
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Check current permission
    if (Notification.permission === 'granted') {
      // Already granted but not subscribed — try to subscribe silently
      subscribeUser();
      return;
    }
    if (Notification.permission === 'denied') return;

    // Show prompt after 10 seconds on the page
    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const subscribeUser = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      localStorage.setItem(SUBSCRIBED_KEY, '1');
    } catch (err) {
      console.warn('[Push] Subscription failed:', err);
    }
  }, []);

  const handleAllow = async () => {
    setVisible(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeUser();
      }
    } catch (err) {
      console.warn('[Push] Permission request failed:', err);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="push-prompt"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-[90] pointer-events-auto"
        >
          <div className="rounded-2xl p-4 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, #1a0533, #0d0120)',
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 40px rgba(139,92,246,0.15), 0 16px 40px rgba(0,0,0,0.5)',
            }}>
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Bell className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-white">Quer receber novidades?</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Receba ofertas especiais e lembretes pra não esquecer de presentear quem você ama
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleAllow}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #7c3aed)' }}>
                    Ativar notificações
                  </button>
                  <button onClick={handleDismiss}
                    className="px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
