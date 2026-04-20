/**
 * Thin wrapper around navigator.vibrate with safe no-op on unsupported platforms.
 */
export function haptic(kind: 'tap' | 'success' | 'error' = 'tap') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const patterns: Record<typeof kind, number | number[]> = {
    tap: 8,
    success: [10, 40, 14],
    error: [30, 60, 30],
  };
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* ignore */
  }
}
