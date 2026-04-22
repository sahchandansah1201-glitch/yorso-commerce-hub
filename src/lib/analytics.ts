/**
 * YORSO Analytics Contract v1
 *
 * This module is the single source of truth for everything the frontend is
 * allowed to track. It guarantees:
 *
 *   1. A closed set of event names (the AnalyticsEvent union).
 *   2. A typed payload for every event (the EventPayloadMap).
 *   3. A consistent envelope (timestamp, language, url, sessionId, role).
 *   4. A pluggable provider boundary (see analytics-provider.ts).
 *
 * Adding a new event:
 *   - Add the name to AnalyticsEvent.
 *   - Add its payload shape to EventPayloadMap (use {} for events with no fields).
 *   - Document it in .lovable/analytics-contract.md with KPI mapping.
 *
 * Naming convention: `surface_object_action`, snake_case.
 */

import { getProvider } from "./analytics-provider";

// ─── Common payload primitives ──────────────────────────────────────────────

export type UserRole = "buyer" | "supplier" | "unknown";
export type Surface =
  | "homepage"
  | "offers_list"
  | "offer_detail"
  | "registration"
  | "signin"
  | "header"
  | "footer"
  | "hero"
  | "live_offers"
  | "supplier_verification"
  | "value_split"
  | "final_cta"
  | "midpage_cta";

interface Empty {
  /* no fields */
}

// ─── Per-event payload contracts ────────────────────────────────────────────

export interface EventPayloadMap {
  // Landing / Navigation ────────────────────────────────────────
  hero_primary_cta_click: Empty;
  hero_secondary_cta_click: Empty;
  hero_search_submit: { query: string };
  header_register_click: Empty;
  header_signin_click: Empty;
  footer_link_click: { label: string; href: string };

  live_offer_card_click: { offerId: string; product: string; position?: number };
  live_offers_expand_toggle: { expanded: boolean };
  live_offers_view_all_click: Empty;

  register_cta_final_click: Empty;
  register_cta_midpage_click: { section: string };
  register_cta_offer_detail: { offerId: string };

  value_register_buyer_click: Empty;
  value_register_supplier_click: Empty;

  section_view: { section: string };

  // Offers ──────────────────────────────────────────────────────
  offers_list_view: Empty;
  offer_detail_view: { offerId: string; product: string };

  // Registration ────────────────────────────────────────────────
  // Funnel events carry `step` (1..7) and `sessionId` so drop-off and
  // time-between-steps can be reconstructed without joining tables.
  registration_role_selected: { role: UserRole; step: 1 };
  registration_email_submitted: { role: UserRole; step: 2; sessionId: string; emailDomain: string };
  registration_email_verified: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** ms between email_submitted and email_verified (null if not measurable) */
    verificationLatencyMs: number | null;
  };
  registration_resend_code: Empty;
  registration_details_completed: { role: UserRole; country: string };
  registration_onboarding_completed: {
    role: UserRole;
    categoriesCount: number;
    volume: string;
    certificationsCount: number;
  };
  registration_onboarding_skipped: Empty;
  registration_countries_completed: { role: UserRole; countriesCount: number };
  registration_countries_skipped: Empty;
  registration_complete: {
    role: UserRole;
    step: 7;
    sessionId: string;
    country: string;
    categories: number;
    countries: number;
    /** ms from role_selected → complete (null if not measurable) */
    funnelDurationMs: number | null;
  };
  value_destination_selected: { country: string; role: UserRole };

  // Phone verification ──────────────────────────────────────────
  phone_verification_sent: { phone: string };
  phone_verified: { phone: string };
  phone_whatsapp_verify_started: { phone: string };
  phone_whatsapp_verified: { phone: string };

  // Auth ────────────────────────────────────────────────────────
  signin_email: { email: string };
  signin_phone: { phone: string };
  signin_whatsapp: { phone: string };
  forgot_password: { email: string };

  // API errors (used by upcoming useApiCall hook) ───────────────
  api_error: { endpoint: string; code: string; field?: string };

  // Legacy (kept for backward compat — remove during cleanup) ───
  registration_start: Empty;
  registration_complete_mock: Empty;
}

export type AnalyticsEvent = keyof EventPayloadMap;

// Scroll depth events are dynamic (`scroll_depth_25`, `scroll_depth_50`, ...).
// They share one payload shape and bypass the typed map intentionally.
type ScrollDepthEvent = `scroll_depth_${number}`;
interface ScrollDepthPayload {
  depth: number;
}

// ─── Envelope ───────────────────────────────────────────────────────────────

export interface AnalyticsEnvelope {
  event: string;
  timestamp: string;
  url: string;
  language: string;
  sessionId: string;
  role: UserRole;
  payload: Record<string, unknown>;
}

// ─── Session helpers ────────────────────────────────────────────────────────

const SESSION_KEY = "yorso_analytics_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no_storage";
  }
}

function getRole(): UserRole {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = sessionStorage.getItem("yorso_registration");
    if (!raw) return "unknown";
    const parsed = JSON.parse(raw) as { role?: UserRole };
    return parsed.role ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getLanguage(): string {
  if (typeof window === "undefined") return "en";
  try {
    return localStorage.getItem("yorso-lang") ?? "en";
  } catch {
    return "en";
  }
}

function getUrl(): string {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

// ─── Public API ─────────────────────────────────────────────────────────────

interface Analytics {
  track<E extends AnalyticsEvent>(
    event: E,
    ...args: EventPayloadMap[E] extends Empty ? [] | [EventPayloadMap[E]] : [EventPayloadMap[E]]
  ): void;
  /** Dynamic scroll-depth events bypass the typed map. */
  trackScrollDepth(event: ScrollDepthEvent, payload: ScrollDepthPayload): void;
}

const analytics: Analytics = {
  track(event, ...args) {
    const payload = (args[0] ?? {}) as Record<string, unknown>;
    const envelope: AnalyticsEnvelope = {
      event,
      timestamp: new Date().toISOString(),
      url: getUrl(),
      language: getLanguage(),
      sessionId: getSessionId(),
      role: getRole(),
      payload,
    };
    try {
      getProvider().send(envelope);
    } catch {
      /* analytics must never break the app */
    }
  },
  trackScrollDepth(event, payload) {
    const envelope: AnalyticsEnvelope = {
      event,
      timestamp: new Date().toISOString(),
      url: getUrl(),
      language: getLanguage(),
      sessionId: getSessionId(),
      role: getRole(),
      payload: payload as unknown as Record<string, unknown>,
    };
    try {
      getProvider().send(envelope);
    } catch {
      /* swallow */
    }
  },
};

// ─── Scroll depth tracking ──────────────────────────────────────────────────

let firedDepths = new Set<number>();

export function initScrollDepthTracking(): () => void {
  firedDepths = new Set();
  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    [25, 50, 75].forEach((threshold) => {
      if (pct >= threshold && !firedDepths.has(threshold)) {
        firedDepths.add(threshold);
        analytics.trackScrollDepth(`scroll_depth_${threshold}`, { depth: threshold });
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

// ─── Section impression observer ────────────────────────────────────────────

export function trackSectionImpression(
  element: HTMLElement | null,
  sectionName: string,
): () => void {
  if (!element) return () => {};
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        analytics.track("section_view", { section: sectionName });
        observer.disconnect();
      }
    },
    { threshold: 0.3 },
  );
  observer.observe(element);
  return () => observer.disconnect();
}

export default analytics;
