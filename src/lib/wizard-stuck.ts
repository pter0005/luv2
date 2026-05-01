/**
 * Helper pra reportar travamento do wizard.
 * Best-effort — silencia falhas de rede pra não criar loop.
 */
export function reportWizardStuck(payload: {
  kind: 'next_blocked' | 'button_stuck' | 'upload_failed' | 'counter_stuck';
  step?: string;
  route?: string;
  detail?: string;
  userId?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/wizard-stuck-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        route: payload.route || window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 200),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* silencioso */ }
}
