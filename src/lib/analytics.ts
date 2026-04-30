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

import { getProvider, recordAnalyticsFailure } from "./analytics-provider";

// ─── Common payload primitives ──────────────────────────────────────────────

export type UserRole = "buyer" | "supplier" | "unknown";

/**
 * Источники, с которых пользователь стартовал регистрацию.
 * Используется в `registration_start` и `registration_complete` для
 * сравнения конверсии разных CTA.
 */
export type RegistrationSource =
  | "direct"
  | "supplier_preview"
  | "hero_cta"
  | "trust_block"
  | "header"
  | "final_cta"
  | "value_split_buyer"
  | "value_split_supplier"
  | "supplier_profile"
  | "offer_detail"
  | "catalog_banner"
  | "how_it_works"
  | "for_suppliers";
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

type Empty = Record<string, never>;

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
  live_offers_source_resolved: { source: "supabase" | "mock-fallback"; count: number };

  register_cta_final_click: Empty;
  register_cta_midpage_click: { section: string };
  register_cta_offer_detail: { offerId: string };

  value_register_buyer_click: Empty;
  value_register_supplier_click: Empty;

  supplier_page_view: { surface?: "for_suppliers" } | Empty;
  supplier_page_cta_register_click: { surface: "hero" | "final" };
  supplier_page_cta_requests_click: { surface: "hero" | "final" };

  section_view: { section: string };

  // Offers ──────────────────────────────────────────────────────
  offers_list_view: Empty;
  offer_detail_view: { offerId: string; product: string };
  catalog_access_request_submit: { scopes: string[]; hasNote: boolean };
  catalog_product_request_submit: { product: string; hasOrigin: boolean; hasDestination: boolean };
  catalog_offer_select: { offerId: string; category: string; origin: string; supplierCountry: string };
  catalog_offer_compare_add: {
    offerId: string;
    category: string;
    origin: string;
    supplierCountry: string;
    accessLevel: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    selectedCount: number;
  };
  catalog_offer_compare_remove: {
    offerId: string;
    category: string;
    origin: string;
    supplierCountry: string;
    accessLevel: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    selectedCount: number;
  };
  catalog_compare_open: {
    offerCount: number;
    accessLevel: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
  };
  catalog_landed_cost_view: {
    offerId: string;
    category: string;
    origin: string;
    supplierCountry: string;
    accessLevel: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
  };
  catalog_soft_fallback_applied: {
    level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    lastErrorCode?: string | null;
    httpStatus?: number | null;
    correlationId?: string;
  };
  catalog_fetch_attempt_failed: {
    level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    attempt: number;
    code?: string;
    status?: number;
    httpStatus?: number | null;
    message?: string;
    correlationId?: string;
  };
  catalog_background_recovered: {
    level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    attempt: number;
    durationMs: number;
    lastErrorCode?: string | null;
    httpStatus?: number | null;
    correlationId?: string;
  };
  catalog_manual_retry_click: {
    level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    correlationId?: string;
  };
  offer_detail_manual_retry_click: {
    offerId: string | undefined;
    lastErrorCode: string | null;
    correlationId?: string;
  };
  offer_detail_background_recovered: {
    offerId: string | undefined;
    attempts: number;
    correlationId?: string;
  };

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
    /** True if the user requested at least one resend before successfully verifying. */
    isResend: boolean;
    /** Number of code submissions before success (1 = first try). */
    attempt: number;
  };
  registration_email_verification_failed: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** Backend error code, e.g. INVALID_CODE, CODE_EXPIRED, TOO_MANY_ATTEMPTS, VERIFICATION_FAILED. */
    reason: "INVALID_CODE" | "CODE_EXPIRED" | "TOO_MANY_ATTEMPTS" | "VERIFICATION_FAILED" | "SERVER_ERROR" | "NETWORK_ERROR" | "UNKNOWN";
    /** Number of failed attempts in this verification session (incl. current). */
    attempt: number;
    /** ms since the email was submitted (null if not measurable). */
    elapsedMs: number | null;
    /** Length of the code the user submitted (0..6). Distinguishes input issues from wrong codes. */
    enteredCodeLength: number;
    /** True if the user requested at least one resend before this attempt. */
    isResend: boolean;
  };
  /**
   * Fired when verification is hard-blocked (e.g. rate limit). Distinct from
   * `_failed` so dashboards can separate transient input errors from blocking states.
   */
  registration_verification_blocked: {
    role: UserRole;
    step: 3;
    sessionId: string;
    reason: "TOO_MANY_ATTEMPTS" | "RATE_LIMITED";
    /** Number of failed attempts when the block triggered. */
    attempt: number;
    /** Recommended wait time before retrying, in seconds (null if API didn't provide one). */
    retryAfterSec: number | null;
  };
  /**
   * Fired the moment the user taps "Resend code".
   * Carries enough context to compute "did the user resend before even trying?",
   * resend frequency, and time-since-email so funnel dashboards can isolate
   * resend-driven drop-off.
   */
  registration_resend_code: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** 1-based index of this resend within the current verification session. */
    resendIndex: number;
    /** Failed verify attempts the user made before pressing resend (0 = none). */
    attemptsBeforeResend: number;
    /** ms since the email was submitted (null if not measurable). */
    msSinceEmailSubmitted: number | null;
    /** ms since the previous resend (null on the first resend). */
    msSinceLastResend: number | null;
  };
  /**
   * Fired on the first verify attempt that follows a resend, exactly once per resend.
   * Lets us answer end-to-end: "did resending the code actually unblock the user?"
   */
  registration_resend_outcome: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** 1-based index of the resend this outcome belongs to. */
    resendIndex: number;
    /** Whether the verify attempt after this resend succeeded or failed. */
    outcome: "succeeded" | "failed";
    /** Failure reason when outcome is "failed", otherwise null. */
    reason:
      | "INVALID_CODE"
      | "CODE_EXPIRED"
      | "TOO_MANY_ATTEMPTS"
      | "VERIFICATION_FAILED"
      | "SERVER_ERROR"
      | "NETWORK_ERROR"
      | "UNKNOWN"
      | null;
    /** ms between the resend click and this verify attempt completing (null if not measurable). */
    msFromResendToAttempt: number | null;
    /** Length of the code submitted on this attempt (0..6). */
    enteredCodeLength: number;
  };
  /**
   * Fired exactly once per resend that NEVER produced a follow-up verify attempt
   * because the user left the verify page (route change, tab close, refresh).
   * Closes the loop with `registration_resend_outcome` so resend efficacy is
   * measurable end-to-end even for abandoned sessions.
   */
  registration_resend_abandoned: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** 1-based index of the abandoned resend within the session. */
    resendIndex: number;
    /** ms between the resend click and the abandonment. */
    msSinceResend: number;
    /** How the page was left. */
    leaveReason: "unmount" | "pagehide";
    /** Number of code slots the user had filled when they left (0..6). */
    filledCount: number;
  };
  // These exist to answer: "are verify failures driven by user input behaviour
  // (paste shape, backspace storms, premature blur) vs. wrong codes?"
  registration_otp_paste: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** Raw length of clipboard text. */
    rawLength: number;
    /** Length after digit-only filter (slice 0..6). */
    digitLength: number;
    /** True if the pasted content auto-filled all 6 inputs. */
    filledAllSlots: boolean;
    /** True if the pasted text contained any non-digit chars. */
    hadNonDigits: boolean;
  };
  registration_otp_backspace: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** Index of the input where backspace was pressed (0..5). */
    fromIndex: number;
    /** True if the slot was empty (focus jumped back to previous input). */
    onEmptySlot: boolean;
    /** Number of slots filled at the moment of the keypress. */
    filledCount: number;
  };
  registration_otp_focus: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** Index of the focused input (0..5). */
    inputIndex: number;
    /** True only on the very first focus event of the verify screen lifecycle. */
    isFirstFocus: boolean;
    /** ms since the verify screen mounted. */
    msSinceMount: number;
  };
  registration_otp_blur: {
    role: UserRole;
    step: 3;
    sessionId: string;
    /** Index of the blurred input (0..5). */
    inputIndex: number;
    /** Number of slots filled at the moment of blur. */
    filledCount: number;
    /** True if the user blurred before all 6 slots were filled. */
    incomplete: boolean;
  };
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
    // Preview attribution (если регистрация началась с клика по preview-карточке)
    supplier_id?: string;
    species?: string;
    form?: string;
    href?: string;
    access_level?: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    source?: RegistrationSource;
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

  // Routing diagnostics ────────────────────────────────────────
  page_not_found: {
    path: string;
    search: string;
    referrer: string;
  };

  // Buyer Workspace ─────────────────────────────────────────────
  workspace_session_started: { method: "email" | "phone" | "whatsapp" };
  workspace_session_ended: Empty;

  // Post-registration auto-redirect (buyer → /offers) ──────────
  buyer_auto_redirect_banner_shown: {
    sessionId: string;
    countdownSeconds: number;
  };
  buyer_auto_redirect_fired: {
    sessionId: string;
    destination: string;
    trigger: "timeout" | "manual";
    waitMs: number;
  };
  workspace_view: {
    section: "dashboard" | "saved" | "price_requests" | "messages";
  };
  workspace_quick_action_click: {
    action: "browse_offers" | "view_saved" | "open_messages";
  };
  workspace_saved_offer_open: { offerId: string };
  workspace_saved_offer_remove: { offerId: string };
  workspace_price_request_open: { requestId: string; status: "pending" | "approved" | "rejected" };
  workspace_message_thread_open: { threadId: string; unread: number };
  /** Switch between top-tabs (dashboard / saved / price-requests / messages). */
  workspace_tab_switch: {
    from: "dashboard" | "saved" | "price_requests" | "messages";
    to: "dashboard" | "saved" | "price_requests" | "messages";
  };
  /** Click on a KPI tile in the workspace dashboard. `key` identifies which KPI. */
  workspace_dashboard_kpi_click: {
    key: "saved" | "price_requests" | "messages" | "alerts";
  };
  /** Search input usage on Saved / Price Requests / Messages lists. */
  workspace_list_search: {
    section: "saved" | "price_requests" | "messages";
    queryLength: number;
  };
  /** Filter chip toggled on a workspace list. */
  workspace_list_filter: {
    section: "saved" | "price_requests" | "messages";
    /** Canonical filter value (e.g. "all", "pending", "unread"). */
    filter: string;
  };

  /** User starts following a market signal (signal_follow / signal_unfollow). */
  signal_follow: {
    signalId: string;
    severity: "info" | "watch" | "alert";
    kind: "supply" | "demand" | "logistics" | "regulation";
  };
  signal_unfollow: {
    signalId: string;
    severity: "info" | "watch" | "alert";
    kind: "supply" | "demand" | "logistics" | "regulation";
  };
  /** User opens the alerts surface (header bell or inline panel). */
  alerts_open: { surface: "header_bell" | "inline_panel" };
  /** User marks all alerts as read. */
  alerts_mark_all_read: { count: number };
  /** User clicks an individual alert in the feed. */
  alerts_item_click: {
    signalId: string;
    alertId: string;
    surface: "header_bell" | "inline_panel";
    /** Where the click navigates to (kept open for future destinations). */
    destination: "catalog_category";
  };
  /** /offers detected a `fromAlert` query param after navigation from the bell. */
  alerts_navigated_to_catalog: { alertId: string };
  /** Buyer clicked an item in the /offers trust proof-strip to jump to its anchor. */
  catalog_trust_proof_click: { itemId: string; anchor: string };

  /**
   * Click on a supplier-profile catalog preview card.
   * Used to compare conversion of locked vs unlocked previews into
   * registration / offer detail views.
   */
  preview_card_click: {
    supplier_id: string;
    species: string;
    form: string;
    href: string;
    access_level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    /** Уникальный id попытки регистрации, инициируемой этим кликом. */
    attempt_id: string;
  };

  /**
   * Fired when the user lands on /register (step 0 of the funnel).
   * Optional attribution params link the registration attempt to a
   * preceding `preview_card_click` so we can compare conversion of
   * locked vs unlocked supplier-profile previews into actual signups.
   */
  registration_start: {
    supplier_id?: string;
    species?: string;
    form?: string;
    href?: string;
    access_level?: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
    /** Source of attribution; "direct" when no preceding CTA/preview click is recorded. */
    source: RegistrationSource;
    /** Уникальный id текущей попытки регистрации. */
    attempt_id: string;
  };

  // Legacy (kept for backward compat — remove during cleanup) ───
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
    } catch (error) {
      recordAnalyticsFailure({
        reason: "provider_threw",
        transport: "provider",
        error,
        droppedEvents: 1,
      });
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
    } catch (error) {
      recordAnalyticsFailure({
        reason: "provider_threw",
        transport: "provider",
        error,
        droppedEvents: 1,
      });
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
