'use client';

import { useEffect } from 'react';

const THROTTLE_KEY = 'mycupid_last_error_report';
const THROTTLE_MS = 30_000; // max 1 report a cada 30s

function shouldReport(): boolean {
  const last = localStorage.getItem(THROTTLE_KEY);
  if (last && Date.now() - parseInt(last) < THROTTLE_MS) return false;
  localStorage.setItem(THROTTLE_KEY, String(Date.now()));
  return true;
}

function sendError(data: { message: string; stack?: string; url: string; extra?: any }) {
  if (!shouldReport()) return;
  // Ignorar erros comuns que não são bugs reais
  const ignore = ['ResizeObserver', 'Loading chunk', 'ChunkLoadError', 'Network Error', 'AbortError', 'cancelled'];
  if (ignore.some(i => data.message.includes(i))) return;

  fetch('/api/error-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, userAgent: navigator.userAgent }),
  }).catch(() => {});
}

export default function ErrorTracker() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      sendError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        url: window.location.href,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      sendError({
        message: reason?.message || String(reason) || 'Unhandled promise rejection',
        stack: reason?.stack,
        url: window.location.href,
        extra: { type: 'unhandledrejection' },
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
