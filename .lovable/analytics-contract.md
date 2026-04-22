# YORSO Analytics Contract v1

Single source of truth for every event the YORSO frontend emits. Events are
typed in `src/lib/analytics.ts` (compiler-enforced) and shipped to a configurable
provider via `src/lib/analytics-provider.ts`.

This document maps every event to:

- **Trigger** — the exact UI moment that fires it.
- **Surface** — where on the product the trigger lives.
- **Payload** — the typed fields we send.
- **KPI** — which Phase 0 KPI the event helps measure.

---

## Naming convention

`surface_object_action` in `snake_case`.

Examples: `hero_primary_cta_click`, `live_offer_card_click`,
`registration_email_verified`.

Avoid generic verbs (`click`, `submit`) without context. Avoid CamelCase or
hyphens. New events must be added to `EventPayloadMap` in `analytics.ts` *and*
to this document — the lint check is "if it's not here, it's not real".

---

## Common envelope (auto-attached)

Every event ships with:

| Field | Source | Notes |
|---|---|---|
| `timestamp` | `new Date().toISOString()` | UTC |
| `url` | `window.location.pathname` | route at fire time |
| `language` | `localStorage.yorso-lang` | i18n locale |
| `sessionId` | `sessionStorage.yorso_analytics_session` | generated once per tab session |
| `role` | `sessionStorage.yorso_registration.role` | `buyer` / `supplier` / `unknown` |
| `payload` | per-event typed fields | see tables below |

---

## KPI legend

| Code | KPI | Target |
|---|---|---|
| **TRAFFIC** | Page exploration | +411% |
| **REG** | Registration conversion | +539% |
| **RET** | Retention | +361% |
| **TRUST** | Supplier trust | +300% |

An event can map to multiple KPIs.

---

## Provider configuration

Set `VITE_ANALYTICS_PROVIDER` in env:

| Value | Behaviour | Default |
|---|---|---|
| `console` | Pretty-prints envelopes to dev console | DEV |
| `noop` | Drops everything (silent) | PROD until wired |
| `batch` | Buffers events, flushes via `navigator.sendBeacon('/api/analytics')` every 5s / 20 events / on `pagehide` | opt-in |

Tests can override at runtime with `setProvider()` from `analytics-provider.ts`.

---

## Event catalogue

### Landing & navigation

| Event | Trigger | Surface | Payload | KPI |
|---|---|---|---|---|
| `hero_primary_cta_click` | "Register free" button in hero | `hero` | — | REG, TRAFFIC |
| `hero_secondary_cta_click` | "Explore live offers" anchor in hero | `hero` | — | TRAFFIC |
| `hero_search_submit` | Search form submitted from hero | `hero` | `query: string` | TRAFFIC |
| `header_register_click` | "Register free" in top nav | `header` | — | REG |
| `header_signin_click` | "Sign in" in top nav | `header` | — | RET |
| `footer_link_click` | Any footer link | `footer` | `label`, `href` | TRAFFIC |
| `live_offer_card_click` | Offer card opened (homepage or offers list) | `live_offers` / `offers_list` | `offerId`, `product`, `position?` | TRAFFIC, TRUST |
| `live_offers_expand_toggle` | "Show more" toggle on mobile live offers | `live_offers` | `expanded: boolean` | TRAFFIC |
| `live_offers_view_all_click` | "View all offers" CTA | `live_offers` | — | TRAFFIC |
| `register_cta_final_click` | Final CTA section button | `final_cta` | — | REG |
| `register_cta_midpage_click` | Mid-page CTA button (e.g. supplier verification) | `midpage_cta` | `section: string` | REG |
| `register_cta_offer_detail` | "Register to contact supplier" on offer detail | `offer_detail` | `offerId` | REG, TRUST |
| `value_register_buyer_click` | Buyer CTA in value split | `value_split` | — | REG |
| `value_register_supplier_click` | Supplier CTA in value split | `value_split` | — | REG |
| `section_view` | Section enters viewport (≥30%) | varies | `section: string` | TRAFFIC |
| `scroll_depth_25/50/75` | Scroll passes 25/50/75% of page | any | `depth: number` | TRAFFIC, RET |

### Offers

| Event | Trigger | Surface | Payload | KPI |
|---|---|---|---|---|
| `offers_list_view` | `/offers` page mounted | `offers_list` | — | TRAFFIC |
| `offer_detail_view` | `/offers/:id` page mounted | `offer_detail` | `offerId`, `product` | TRAFFIC, TRUST |

### Registration funnel

Every step in the funnel emits an event so we can compute drop-off between
stages. This is the primary source of the +539% registration KPI.

| Event | Trigger | Surface | Payload | KPI |
|---|---|---|---|---|
| `registration_role_selected` | Role chosen on `/register` | `registration` | `role`, `step:1` | REG |
| `registration_email_submitted` | Email submitted on `/register/email` | `registration` | `role`, `step:2`, `sessionId`, `emailDomain` | REG |
| `registration_email_verified` | Email OTP accepted on `/register/verify` | `registration` | `role`, `step:3`, `sessionId`, `verificationLatencyMs` | REG |
| `registration_resend_code` | "Resend code" tapped | `registration` | — | REG |
| `registration_details_completed` | Details form submitted on `/register/details` | `registration` | `role`, `country` | REG |
| `registration_onboarding_completed` | Onboarding submitted | `registration` | `role`, `categoriesCount`, `volume`, `certificationsCount` | REG, RET |
| `registration_onboarding_skipped` | Onboarding skipped | `registration` | — | REG |
| `registration_countries_completed` | Countries submitted | `registration` | `role`, `countriesCount` | REG, RET |
| `registration_countries_skipped` | Countries skipped | `registration` | — | REG |
| `registration_complete` | Final "Ready" screen reached | `registration` | `role`, `country`, `categories`, `countries` | REG (north-star) |
| `value_destination_selected` | Each country selected during onboarding | `registration` | `country`, `role` | RET, TRUST |

### Phone verification

| Event | Trigger | Payload | KPI |
|---|---|---|---|
| `phone_verification_sent` | SMS code requested | `phone` | REG, TRUST |
| `phone_verified` | SMS code accepted | `phone` | REG, TRUST |
| `phone_whatsapp_verify_started` | WhatsApp verify started | `phone` | REG |
| `phone_whatsapp_verified` | WhatsApp verify accepted | `phone` | REG, TRUST |

### Auth

| Event | Trigger | Payload | KPI |
|---|---|---|---|
| `signin_email` | Sign in via email submitted | `email` | RET |
| `signin_phone` | Sign in via phone submitted | `phone` | RET |
| `signin_whatsapp` | Sign in via WhatsApp code | `phone` | RET |
| `forgot_password` | Reset link requested | `email` | RET |

### System / quality

| Event | Trigger | Payload | KPI |
|---|---|---|---|
| `api_error` | Any `useApiCall` returns `ok: false` | `endpoint`, `code`, `field?` | quality (used to debug REG/RET regressions) |

### Legacy (slated for removal)

`registration_start`, `registration_complete_mock` — kept temporarily for
backward compatibility with old code paths. Do not add new call sites.

---

## Adding a new event — checklist

1. Add the name to `AnalyticsEvent` (the `EventPayloadMap` keys) in
   `src/lib/analytics.ts`.
2. Add the typed payload (use `Empty` if the event has no fields).
3. Add a row in the appropriate table above with trigger, surface, payload,
   and KPI tags.
4. If the event maps to a brand-new KPI, update the KPI legend.
5. Verify with `npx tsc --noEmit` — the compiler must accept every existing
   `analytics.track(...)` call site.

## Removing an event — checklist

1. Search the codebase for the event name.
2. Replace or delete every call site.
3. Remove the entry from `EventPayloadMap` *and* from this document.
4. Note the removal in the project changelog if other teams depended on it.
