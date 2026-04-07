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

/* ── generic event ────────────────────────────────────────────────────────── */

export function trackEvent(
  eventName: string,
  params?: Record<string, any>,
) {
  // Meta Pixel — standard events use 'track', custom ones use 'trackCustom'
  const metaStandard = [
    'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase',
    'Lead', 'CompleteRegistration', 'Search',
  ];
  try {
    if (hasFbq()) {
      if (metaStandard.includes(eventName)) {
        (window as any).fbq('track', eventName, params);
      } else {
        (window as any).fbq('trackCustom', eventName, params);
      }
    }
  } catch (e) {
    console.warn(`[Meta Pixel] Failed to track ${eventName}:`, e);
  }

  // TikTok Pixel
  try {
    if (hasTtq()) {
      (window as any).ttq.track(eventName, params);
    }
  } catch (e) {
    console.warn(`[TikTok Pixel] Failed to track ${eventName}:`, e);
  }

  // GA4
  try {
    if (hasGtag()) {
      window.gtag('event', eventName, params);
    }
  } catch (e) {
    console.warn(`[GA4] Failed to track ${eventName}:`, e);
  }
}

/* ── funnel-specific ──────────────────────────────────────────────────────── */

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
