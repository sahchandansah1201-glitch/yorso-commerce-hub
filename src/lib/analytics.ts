// ─── Phase 0 Typed Analytics Event Contract ─────────────────────

/**
 * All Phase 0 analytics event names. Use this type to ensure
 * every analytics.track() call uses a known event name.
 *
 * Scroll-depth events are dynamic (`scroll_depth_25/50/75`) and
 * handled separately via template literals.
 */
export type AnalyticsEvent =
  // Landing / Navigation
  | "hero_primary_cta_click"
  | "hero_secondary_cta_click"
  | "hero_search_submit"
  | "header_register_click"
  | "header_signin_click"
  | "footer_link_click"
  | "live_offer_card_click"
  | "live_offers_expand_toggle"
  | "live_offers_view_all_click"
  | "register_cta_final_click"
  | "register_cta_midpage_click"
  | "register_cta_offer_detail"
  | "value_register_buyer_click"
  | "value_register_supplier_click"
  | "section_view"
  | "home_category_click"
  // Offers
  | "offers_list_view"
  | "offer_detail_view"
  | "offer_detail_locked_view"
  | "register_to_unlock_click"
  // Registration
  | "registration_role_selected"
  | "registration_email_submitted"
  | "registration_email_verified"
  | "registration_resend_code"
  | "registration_details_completed"
  | "registration_onboarding_completed"
  | "registration_onboarding_skipped"
  | "registration_countries_completed"
  | "registration_countries_skipped"
  | "registration_complete"
  | "value_destination_selected"
  // Phone verification
  | "phone_verification_sent"
  | "phone_verified"
  | "phone_whatsapp_verify_started"
  | "phone_whatsapp_verified"
  // Auth
  | "signin_email"
  | "signin_phone"
  | "signin_whatsapp"
  | "forgot_password"
  // Legacy (kept for backward compat, remove when dead code is cleaned)
  | "registration_start"
  | "registration_complete_mock"
  // Scroll depth (dynamic)
  | `scroll_depth_${number}`;

type EventPayload = Record<string, string | number | boolean | undefined>;

const analytics = {
  track(event: AnalyticsEvent, payload?: EventPayload) {
    const base = {
      timestamp: new Date().toISOString(),
      language: localStorage.getItem("yorso-lang") || "en",
      url: window.location.pathname,
    };
    const data = { event, ...base, ...payload };

    // Console log for development — replace with real provider
    if (import.meta.env.DEV) {
      console.log(`[YORSO Analytics]`, data);
    }

    // Future: send to analytics endpoint
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
  },
};

// Scroll depth tracking — fires once per threshold per page load
let firedDepths = new Set<number>();

export function initScrollDepthTracking() {
  firedDepths = new Set();
  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    [25, 50, 75].forEach((threshold) => {
      if (pct >= threshold && !firedDepths.has(threshold)) {
        firedDepths.add(threshold);
        analytics.track(`scroll_depth_${threshold}`, { depth: threshold });
      }
    });
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

// Section impression observer — fires once when section enters viewport
export function trackSectionImpression(
  element: HTMLElement | null,
  sectionName: string
) {
  if (!element) return () => {};
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        analytics.track("section_view", { section: sectionName });
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(element);
  return () => observer.disconnect();
}

export default analytics;
