/**
 * Unified analytics helper — fires events to Meta Pixel, TikTok Pixel and GA4
 * in a single call so the wizard (and other components) don't repeat try/catch
 * boilerplate for each provider.
 */

/* ── helpers ──────────────────────────────────────────────────────────────── */

function hasFbq(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).fbq === 'function';
}

function hasTtq(): boolean {
  return typeof window !== 'undefined' && !!(window as any).ttq;
}

function hasGtag(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/* ── Advanced Matching ────────────────────────────────────────────────────── */

// SHA-256 hex — required format for Meta/TikTok advanced matching.
// Meta PII fields must be lowercased and SHA-256 hashed before send.
async function sha256Hex(raw: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
    const bytes = new TextEncoder().encode(raw);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

/**
 * Inject hashed email + phone into Meta Pixel & TikTok Pixel so match rate
 * jumps from ~40% to 70%+. Call once the user provides contact info (at the
 * payment step). Safe to call multiple times — providers dedup internally.
 */
export async function setAdvancedMatching(opts: { email?: string; phone?: string }) {
  const email = (opts.email || '').trim().toLowerCase();
  // Phone for Meta: digits only, country code prefixed (55 for BR, 1 for US).
  // Heuristic: 10-11 digits → BR without country code (most common), prepend 55.
  // 12+ digits → already has country code, use as-is.
  const rawPhone = (opts.phone || '').replace(/\D/g, '');
  const phone = rawPhone.length >= 10 && rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;

  const [emHash, phHash] = await Promise.all([
    email ? sha256Hex(email) : Promise.resolve(null),
    phone ? sha256Hex(phone) : Promise.resolve(null),
  ]);

  try {
    if (hasFbq()) {
      const userData: Record<string, string> = {};
      if (emHash) userData.em = emHash;
      if (phHash) userData.ph = phHash;
      if (Object.keys(userData).length) {
        (window as any).fbq('setUserProperties', userData);
      }
    }
  } catch (e) {
    console.warn('[Meta Pixel] Failed to set advanced matching:', e);
  }

  try {
    if (hasTtq()) {
      const identify: Record<string, string> = {};
      if (emHash) identify.email = emHash;
      if (phHash) identify.phone_number = phHash;
      if (Object.keys(identify).length) {
        (window as any).ttq.identify(identify);
      }
    }
  } catch (e) {
    console.warn('[TikTok Pixel] Failed to identify user:', e);
  }
}

/* ── generic event ────────────────────────────────────────────────────────── */

/**
 * Track an event across Meta Pixel, TikTok Pixel and GA4.
 *
 * `eventId` is critical when the same event also fires server-side via Meta
 * CAPI / TikTok Events API — both platforms use it to dedup. Pass the same
 * stable id (e.g. pageId for Purchase) to the server call and this call.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, any>,
  eventId?: string,
) {
  // Meta Pixel — standard events use 'track', custom ones use 'trackCustom'
  const metaStandard = [
    'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase',
    'Lead', 'CompleteRegistration', 'Search',
  ];
  try {
    if (hasFbq()) {
      const metaOpts = eventId ? { eventID: eventId } : undefined;
      if (metaStandard.includes(eventName)) {
        (window as any).fbq('track', eventName, params, metaOpts);
      } else {
        (window as any).fbq('trackCustom', eventName, params, metaOpts);
      }
    }
  } catch (e) {
    console.warn(`[Meta Pixel] Failed to track ${eventName}:`, e);
  }

  // TikTok Pixel — event_id goes inside the params object
  try {
    if (hasTtq()) {
      const ttParams = eventId ? { ...params, event_id: eventId } : params;
      (window as any).ttq.track(eventName, ttParams);
    }
  } catch (e) {
    console.warn(`[TikTok Pixel] Failed to track ${eventName}:`, e);
  }

  // GA4
  try {
    if (hasGtag()) {
      const gaParams = eventId ? { ...params, transaction_id: eventId } : params;
      window.gtag('event', eventName, gaParams);
    }
  } catch (e) {
    console.warn(`[GA4] Failed to track ${eventName}:`, e);
  }
}

/* ── funnel-specific ──────────────────────────────────────────────────────── */

// Session-level dedup: one write per step per page load. Back/next through
// the same step only counts once; a fresh wizard visit counts again (that IS
// a new funnel attempt).
const reportedFunnelSteps = new Set<string>();

export function trackFunnelStep(
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  extras?: Record<string, any>,
) {
  const params = {
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    ...extras,
  };

  // Firestore aggregate — drives the admin funnel panel
  if (typeof window !== 'undefined' && !reportedFunnelSteps.has(stepName)) {
    reportedFunnelSteps.add(stepName);
    fetch('/api/funnel-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: stepName,
        segment: extras?.segment,
        locale: extras?.locale,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  // GA4 custom event
  try {
    if (hasGtag()) {
      window.gtag('event', 'funnel_step', params);
    }
  } catch (e) {
    console.warn('[GA4] Failed to track funnel_step:', e);
  }

  // Meta Pixel custom event
  try {
    if (hasFbq()) {
      (window as any).fbq('trackCustom', 'FunnelStep', params);
    }
  } catch (e) {
    console.warn('[Meta Pixel] Failed to track FunnelStep:', e);
  }

  // TikTok Pixel custom event
  try {
    if (hasTtq()) {
      (window as any).ttq.track('FunnelStep', params);
    }
  } catch (e) {
    console.warn('[TikTok Pixel] Failed to track FunnelStep:', e);
  }
}
