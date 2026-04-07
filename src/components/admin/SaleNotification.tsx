'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getDatabase, ref, onChildAdded, query, orderByChild, startAt } from 'firebase/database';
import { getApp } from 'firebase/app';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Bell, BellRing, Volume2, FlaskConical } from 'lucide-react';

interface SaleEvent {
  id: string;
  title: string;
  plan: string;
  value: number;
  ts: number;
}

const VAPID_PUBLIC_KEY = 'BFVpYTPhsd-dbg4p-a09S3t1WoJIWw3ULVv6jpuGYWA5vsbB9ClFkl2Y64_QKSkt2evt9-kFHo9tb35W3oHM1HU';
const ADMIN_PUSH_KEY = 'mycupid_admin_push_subscribed';

const CASH_SOUND_URL = 'data:audio/wav;base64,UklGRiQGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAGAAAAAP//AQABAP7/AgD+/wIA/v8DAP3/BAD7/wYA+P8KAPb/CwD0/xAA8P8UAPD/FQDv/xkA7P8cAOz/HQDr/yAA6f8kAOj/JQDn/ykA5P8rAOP/MADg/zIA4P82AN3/OADd/zwA2v8+ANr/QgDX/0QA1/9IANb/SADV/00A0v9PANL/UwDP/1UAz/9ZAMz/XADM/14Ayv9jAMj/ZgDI/2cAyP9rAMb/bgDE/3IAwv90AML/eADA/3oAwP99AL7/gQC8/4MAvP+FALr/igC4/4wAuP+PALb/kgC0/5QAtP+XALL/mQCy/5wAsP+fAK7/oQCu/6QArP+nAKr/qQCq/6wAqP+vAKj/sACo/7IApv+1AKT/twCk/7kAov+9AKD/vgCg/8EAnv/EAJL/wACI/7YAhP+qAID/nAB+/48AfP+FAHL/eQBk/24AWP9kAEr/WgA8/1AAMv9GABr/OAAK/y8A/v4kAPb+GQDw/hAA6v4HAOT+/v/e/vX/2P7t/9L+5f/O/t7/yP7W/8T+z//A/sj/vP7C/7j+vP+0/rb/sv6x/67+q/+s/qb/qP6h/6b+nf+k/pj/oP6V/57+kf+c/o7/mv6L/5j+iP+W/oX/lP6D/5T+gP+S/n//kP59/5D+fP+Q/nv/kP56/5D+e/+Q/nz/kv59/5L+f/+U/oD/lP6D/5b+hf+Y/oj/mv6L/5z+jv+e/pH/oP6V/6L+mP+k/pz/pv6g/6j+pP+q/qj/rP6s/67+sP+w/rT/sv64/7T+vP+2/sD/uP7E/7r+yP+8/sz/vv7Q/8D+1P/C/tf/xP7c/8b+3//I/uP/yv7m/8z+6v/O/u3/0P7x/9L+9P/U/vf/1v76/9j+/v/a/gAA3P4EAN7+BgDg/goA4v4MAOb+DwDo/hIA7P4UAO7+FwDw/hkA9P4cAPb+HgD4/iEA+v4kAPz+JgD+/igAAAEqAAIBLQAEAS8ABgExAAgBMwAKATUADAE3AA4BOQAQATsAEAE9ABIBPwAUAUEAFgFDABYBRQAYAUYAGAFIABoBSgAaAUoAHAFMABwBTgAcAU4AHgFQAB4BUAAYANIAIAFSACABVABYAVQAWAVYAGAFWABYAWAAWAAWAFAAVABUAFQAUABQAEQAOAA4ADgAMAAwACgAIAAgABgAGAAQAAgACAAAAAP//AgD+/wIA/v8DAP3/BAD8/wQA/P8FAPs/BgA=';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PushStatus = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported';

export function SaleNotification() {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle');
  const [showBanner, setShowBanner] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initializedRef = useRef(false);

  // Check initial push status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }

    if (localStorage.getItem(ADMIN_PUSH_KEY)) {
      setPushStatus('subscribed');
      return;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setPushStatus('denied');
      return;
    }

    // Show the banner after 2 seconds
    const timer = setTimeout(() => setShowBanner(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const subscribeAdmin = useCallback(async () => {
    setPushStatus('subscribing');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subscription.toJSON(), isAdmin: true }),
      });

      if (res.ok) {
        localStorage.setItem(ADMIN_PUSH_KEY, 'true');
        setPushStatus('subscribed');
        setShowBanner(false);
      }
    } catch (err) {
      console.error('[SaleNotification] Push subscribe error:', err);
      setPushStatus('denied');
    }
  }, []);

  const playCashSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(CASH_SOUND_URL);
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  const dismiss = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, []);

  // Firebase RTDB listener for real-time sales
  useEffect(() => {
    let db: any;
    try {
      db = getDatabase(getApp());
    } catch (e) {
      console.error('[SaleNotification] Firebase RTDB not initialized:', e);
      return;
    }

    const startTime = Date.now();
    const salesRef = query(
      ref(db, 'sales_feed'),
      orderByChild('ts'),
      startAt(startTime),
    );

    const unsub = onChildAdded(salesRef, (snap) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return;
      }

      const data = snap.val();
      if (!data || !data.ts || data.ts < startTime) return;

      const sale: SaleEvent = {
        id: snap.key || Math.random().toString(),
        title: data.title || 'Sem título',
        plan: data.plan || 'basico',
        value: data.value || 0,
        ts: data.ts,
      };

      setSales(prev => [sale, ...prev].slice(0, 5));
      playCashSound();

      if (Notification.permission === 'granted') {
        new Notification(`Nova venda! R$${sale.value.toFixed(2).replace('.', ',')}`, {
          body: `${sale.title} — Plano ${sale.plan === 'avancado' ? 'Avançado' : 'Básico'}`,
          icon: 'https://i.imgur.com/InmbjFb.png',
        });
      }

      setTimeout(() => {
        setSales(prev => prev.filter(s => s.id !== sale.id));
      }, 8000);
    });

    setTimeout(() => { initializedRef.current = true; }, 2000);

    return () => unsub();
  }, [playCashSound]);

  return (
    <>
      {/* ── Banner para ativar notificações ── */}
      <AnimatePresence>
        {showBanner && pushStatus === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(15,10,30,0.9) 100%)',
              border: '1.5px solid rgba(37,99,235,0.3)',
            }}
          >
            <button onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0"
                style={{ border: '1px solid rgba(37,99,235,0.3)' }}>
                <BellRing className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Ativar notificações de venda</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Receba um alerta com som de dinheirinho toda vez que alguém comprar — mesmo com o navegador fechado
                </p>
              </div>
              <button
                onClick={subscribeAdmin}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shrink-0"
              >
                Ativar
              </button>
            </div>
          </motion.div>
        )}

        {pushStatus === 'subscribed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-center gap-3 text-xs text-green-400/70"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notificações de venda ativas</span>
            <Volume2 className="w-3.5 h-3.5" />
            {!testDone && (
              <button
                onClick={async () => {
                  setTestSending(true);
                  try {
                    await fetch('/api/push/test-sale', { method: 'POST' });
                    setTestDone(true);
                  } catch {}
                  setTestSending(false);
                }}
                disabled={testSending}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {testSending ? 'Enviando...' : 'Testar notificação'}
              </button>
            )}
            {testDone && (
              <span className="ml-auto text-[11px] text-green-400/50">✓ Teste enviado — confira seu celular</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toasts de venda em tempo real ── */}
      <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
        <AnimatePresence>
          {sales.map(sale => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto rounded-2xl p-4 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #052e16 0%, #0a1a0f 100%)',
                border: '1.5px solid rgba(34,197,94,0.5)',
                boxShadow: '0 0 40px rgba(34,197,94,0.2), 0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <button onClick={() => dismiss(sale.id)}
                className="absolute top-2 right-2 text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 10 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}
                >
                  <DollarSign className="w-5 h-5 text-green-400" />
                </motion.div>
                <div>
                  <p className="text-sm font-black text-green-300">
                    Nova venda! R${sale.value.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-white/60 truncate max-w-[200px]">
                    {sale.title} — {sale.plan === 'avancado' ? 'Avançado' : 'Básico'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
