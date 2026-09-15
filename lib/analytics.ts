"use client";

// ============================================================================
// Thin analytics dispatch layer. Funnel events fan out to whichever
// providers are configured (PostHog, GA4, Meta Pixel) without the calling
// component needing to know which providers exist. Add/remove a provider in
// one place here rather than hunting through every component that tracks
// something.
// ============================================================================

export type FunnelEvent =
  | "property_view"
  | "qualification_form_started"
  | "qualification_form_completed"
  | "whatsapp_redirect_clicked";

export interface FunnelEventMetadata {
  propertyId: string;
  propertyTitle?: string;
  price?: number;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
    gtag?: (
      command: "event",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    fbq?: (
      command: "track" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Fires a funnel event to every analytics provider that's present on
 * `window`. Each provider call is wrapped so one failing (e.g. an ad-blocker
 * killing fbq) never prevents the others from firing, and never throws back
 * into calling code — analytics must not break the WhatsApp redirect flow.
 */
export function trackEvent(
  event: FunnelEvent,
  metadata: FunnelEventMetadata
): void {
  if (typeof window === "undefined") return;

  const payload = {
    property_id: metadata.propertyId,
    property_title: metadata.propertyTitle,
    price: metadata.price,
    source: metadata.source,
    utm_source: metadata.utmSource,
    utm_medium: metadata.utmMedium,
    utm_campaign: metadata.utmCampaign,
  };

  try {
    window.posthog?.capture(event, payload);
  } catch {
    // Swallow — analytics failures must never break the user flow.
  }

  try {
    window.gtag?.("event", event, payload);
  } catch {
    // Swallow.
  }

  try {
    // Meta Pixel uses its own standard event names for some funnel steps;
    // custom events cover the rest.
    if (event === "whatsapp_redirect_clicked") {
      window.fbq?.("track", "Contact", payload);
    } else if (event === "qualification_form_completed") {
      window.fbq?.("track", "Lead", payload);
    } else {
      window.fbq?.("trackCustom", event, payload);
    }
  } catch {
    // Swallow.
  }
}

/**
 * Fires an event and returns a promise that resolves once a short grace
 * window has passed. Used specifically before a `window.location` redirect
 * (the WhatsApp handoff), because some mobile browsers suspend/kill
 * JavaScript execution the instant navigation starts — sendBeacon-style
 * providers usually flush immediately, but gtag/fbq's network calls can be
 * dropped mid-flight. Awaiting a short delay before redirecting gives those
 * calls a chance to actually leave the page.
 */
export function trackEventBeforeRedirect(
  event: FunnelEvent,
  metadata: FunnelEventMetadata,
  graceMs = 250
): Promise<void> {
  trackEvent(event, metadata);
  return new Promise((resolve) => setTimeout(resolve, graceMs));
}
