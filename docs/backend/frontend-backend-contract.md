# YORSO Frontend-Backend Contract

Status: Phase 0 closure-audited contract
Frontend source: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`

## Purpose

This document maps the current YORSO frontend to the backend modules that must
replace mock data, localStorage and sessionStorage. It is written for
implementation planning, not for public product copy.

The backend must preserve the existing frontend product intent:

- public discovery before registration;
- trust before conversion;
- gated supplier identity and exact price;
- professional procurement workflows;
- supplier profile as a commercial dossier;
- account workspace as the source for company data.

## Global Rules

1. Existing routes must keep working while data sources migrate.
2. Mock data can remain as seed and fallback, but not as the primary source of
   production truth.
3. Hidden values must not be sent to locked users. Frontend blur is only a
   visual affordance.
4. Production backend target is self-hosted YORSO API plus PostgreSQL. Supabase,
   Firebase, Appwrite, Clerk, Auth0 and similar hosted BaaS/SaaS application
   backends are not production dependencies.
5. All backend migrations, services, generated types, seed data, infra files and
   contracts must exist locally in the repository.
6. API adapters should return shapes compatible with existing components before
   component rewrites are attempted.
7. Frontend pages must not import Supabase or similar hosted backend clients as
   production data gateways. They must call typed YORSO API adapters.
8. Every sensitive workflow needs tests for anonymous, registered, qualified,
   owner and admin access where relevant.

## Access Levels

Current frontend access model:

- `anonymous_locked`
- `registered_locked`
- `qualified_unlocked`

Backend must support these states with database rules, not only frontend logic.

Required data views:

- public views for anonymous users;
- registered-safe views for signed-in but unapproved buyers;
- qualified views for approved buyers;
- owner views for supplier/company owners;
- admin views for verification and support.

## Route Contract

This table maps the active `src/App.tsx` routes audited during Backend Phase 0
closure. Development-only routes are called out separately so they are not
mistaken for production data surfaces.

| Route | Current frontend role | Current data source | Backend target | Priority |
|---|---|---|---|---|
| `/` | Public entry, trust, live offers | landing components, `mockOffers`, partial catalog fetch | public catalog preview, marketplace stats, homepage CMS blocks | P1 |
| `/register` and steps | Buyer/supplier onboarding | self-hosted registration draft, per-request OTP policy, verification delivery outbox, file-spool delivery runtime and account creation when `VITE_YORSO_API_URL` is configured; registration context/sessionStorage only for transient form continuity and API-disabled preview | `/v1/auth/register/*`, `yorso_registration_drafts`, `yorso_registration_delivery_outbox`, sealed backend-only OTP handoff, registration delivery worker/scheduler boundary, account creation source of truth | Phase 2E implemented |
| `/signin` | Sign-in to workspace | self-hosted sign-in and password-reset request adapter when `VITE_YORSO_API_URL` is configured; API-disabled preview uses local contract only, not Supabase auth | `/v1/auth/sign-in`, `/v1/auth/password-reset/request`, self-hosted auth/session API, password recovery delivery outbox/runtime, user-company resolution, role/session adapter | Phase 2J closed |
| `/reset-password` | Password recovery | self-hosted token completion via `?token=` / `#token=` when `VITE_YORSO_API_URL` is configured; API-disabled preview has no recovery session and does not call Supabase | `/v1/auth/password-reset/complete`, `yorso_auth_password_recovery_tokens`, `yorso_auth_password_recovery_outbox`, password recovery delivery worker/sender runtime, session revocation | Phase 2J closed |
| `/offers` | Procurement catalog workspace | `mockOffers`, `catalog-api`, local UI state | offer catalog API, public/qualified views, backend filters | P0 |
| `/offers/:id` | Offer decision page | mock offer detail plus partial catalog | offer detail API, documents, supplier trust, related offers | P1 |
| `/suppliers` | Supplier directory | `mockSuppliers`, i18n patches, session shortlist | supplier directory API, public/qualified views, shortlist API | P0 |
| `/suppliers/:supplierId` | Supplier dossier | `mockSuppliers`, `getOffersForSupplier`, local access request | supplier profile API, supplier offers API, access workflow | P0 |
| `/about` | Public company/trust page | static info page content, route-owned SEO | CMS-ready static page or local content source with route SEO | P3 |
| `/contact` | Public contact/trust page | static info page content, route-owned SEO | CMS-ready contact content, support/contact routing later | P3 |
| `/terms` | Legal page | static legal copy, route-owned SEO | versioned legal document source | P3 |
| `/privacy` | Legal page | static legal copy, route-owned SEO | versioned legal document source | P3 |
| `/cookies` | Legal page | static legal copy, route-owned SEO | versioned legal document source | P3 |
| `/gdpr` | Legal/compliance page | static legal copy, route-owned SEO | versioned compliance document source | P3 |
| `/anti-fraud` | Trust/compliance page | static legal copy, route-owned SEO | versioned trust/compliance content source | P3 |
| `/careers` | Public hiring page | static info page content, route-owned SEO | CMS-ready static page or hiring source later | P3 |
| `/press` | Public press page | static info page content, route-owned SEO | CMS-ready press/media content source later | P3 |
| `/partners` | Public partner page | static info page content, route-owned SEO | CMS-ready partner content and conversion events later | P3 |
| `/how-it-works` | Product education | static content | CMS-ready static page | P3 |
| `/for-suppliers` | Supplier acquisition landing | static content | CMS-ready static page, conversion events | P3 |
| `/blog` | SEO/content index | static `blogPosts` and i18n patches | content source, SEO metadata, sitemap/RSS later | P2 |
| `/blog/:slug` | Article page | static `blogPosts` | content source, article metadata, structured data | P2 |
| `/account/personal` | User profile | self-hosted account workspace snapshot when `VITE_YORSO_API_URL` is configured; localStorage/mock only in API-disabled preview | `GET /v1/account/workspace`, `PATCH /v1/account/me` | Phase 1 closed |
| `/account/company` | Company profile and media | self-hosted account workspace snapshot and self-hosted account storage when API is configured; local file URLs only in API-disabled preview | `GET /v1/account/workspace`, `PATCH /v1/account/company`, self-hosted object storage | Phase 1 closed |
| `/account/branches` | Branch list | self-hosted account workspace snapshot when API is configured | row-level branch API, bulk replace compatibility | Phase 1 closed |
| `/account/products` | Product matrix | self-hosted account workspace snapshot when API is configured | row-level product API, bulk replace compatibility | Phase 1 closed |
| `/account/meta-regions` | Logistics grouping | self-hosted account workspace snapshot when API is configured | row-level meta-region API, bulk replace compatibility | Phase 1 closed |
| `/account/notifications` | Notification preferences | self-hosted account workspace snapshot when API is configured | row-level notification API, bulk replace compatibility | Phase 1 closed |
| `/account` | Account legacy/current entry | client redirect to `/account/personal` | redirect only; no data source | P0 |
| `/profile` and `/profile/*` | Legacy profile aliases | client redirects to account sections | redirect compatibility only; no data source | P0 |
| `/dashboard/registration-funnel` | Analytics demo | deterministic mock | analytics warehouse or event aggregates | P3 |
| `/dashboard/registration-resend` | Analytics demo | deterministic mock | analytics aggregates | P3 |
| `/admin` | Admin/operator hub | self-hosted admin operations API adapter | admin operations overview API | P0 |
| `/admin/access-requests` | Access review queue | self-hosted admin access review API adapter | access review queue API and audit | P0 |
| `/admin/access-grants` | Access grant console | self-hosted admin access grants API adapter | grant list/revoke API and audit | P0 |
| `/admin/runtime` | Runtime status page | self-hosted admin runtime API adapter | runtime health/readiness/capacity API | P0 |
| `/admin/audit` | Audit events page | self-hosted admin audit API adapter | audit event query/export API | P0 |
| `/admin/incidents` | Incident queue page | self-hosted admin incidents API adapter | incident queue/workflow API | P0 |
| `/admin/incidents/:incidentId` | Incident detail page | self-hosted admin incident detail API adapter | incident detail/workflow/handoff API | P0 |
| `/admin/incident-execution` | Incident execution queue | self-hosted admin incident execution API adapter | execution queue/update API | P0 |
| `/admin/incident-workload` | Incident workload page | self-hosted admin incident workload API adapter | workload/correlation/forecast API | P0 |
| `/admin/incident-trends` | Incident trend analytics | self-hosted admin incident trends API adapter | trend analytics/export/action API | P0 |
| `/admin/incident-trend-actions` | Incident trend action queue | self-hosted admin incident trend action queue API adapter | trend action queue/export/bulk API | P0 |
| `/dev/typography` | Development typography audit | local dev-only UI | no production backend target | dev-only |
| `*` | Not found route | localized static fallback | no backend data source | P3 |

## Data Source Replacement Map

| Current file/source | Current role | Backend replacement |
|---|---|---|
| `src/data/mockAccount.ts` | account fixtures | `profiles`, `companies`, `company_branches`, `company_products`, `company_meta_regions`, `notification_preferences` |
| `src/lib/account-store.ts` | API-disabled account preview cache only after Phase 1 | `account-api.ts` using self-hosted YORSO API as production authority |
| `src/data/mockSuppliers.ts` | supplier directory/profile fixtures | `supplier_profiles`, `supplier_certifications`, `supplier_delivery_markets`, `supplier_documents` |
| `src/data/mockOffers.ts` | catalog and offer fixtures | `products`, `offers`, `offer_prices`, `offer_media`, `offer_delivery_terms`, `offer_documents` |
| `src/data/mockIntelligence.ts` | price/news/doc readiness fixtures | market intelligence tables or external ingestion later |
| `src/lib/supplier-access-requests.ts` | local access request state | `supplier_access_requests`, `access_grants`, `access_events` |
| `src/lib/supplier-access-approval.ts` | mock approval notification | backend status transition and notification queue |
| `src/lib/catalog-requests.ts` | session RFQ/request state | `buyer_requests`, `buyer_request_items`, `supplier_responses` |
| `src/lib/buyer-session.ts` | frontend session bridge | YORSO API session plus resolved company membership |
| `src/data/blogPosts.ts` | blog content | content table or local markdown/MDX pipeline with generated metadata |
| `src/data/mockWorkspace.ts` | buyer workspace fixture | saved offers, price requests, messages, activity tables |

## Adapter Contract

Frontend pages should not import database clients directly. Use typed adapters.

Production adapter rule:

- page/component code calls `src/lib/*-api.ts`;
- adapters call the self-hosted YORSO API;
- Supabase-specific adapters may remain only as temporary legacy prototype
  bridges and must not be production dependencies;
- adapter return shapes must not expose restricted fields in locked states;
- removing Supabase from production must not require page-level rewrites.

Required adapters:

```text
src/lib/account-api.ts
src/lib/supplier-api.ts
src/lib/offer-api.ts
src/lib/access-api.ts
src/lib/rfq-api.ts
src/lib/notification-api.ts
src/lib/content-api.ts
```

Each adapter should expose:

- typed request/response shapes;
- loading and error semantics;
- public/registered/qualified access awareness where needed;
- mock fallback only when explicitly allowed;
- no hidden fields in locked responses.

## Account Contract

### `/account/personal`

Backend entities:

- `profiles`
- `company_members`

Required fields:

- first name;
- last name;
- role in company;
- email;
- phone;
- phone verification state;
- preferred language;
- timezone.

Acceptance:

- edits persist in database;
- values survive browser/device change;
- invalid email/phone rejected;
- localStorage no longer source of truth.

### `/account/company`

Backend entities:

- `companies`
- `company_profiles`
- `company_media`
- `supplier_profiles`

Required fields:

- legal name;
- trade name;
- account role: buyer, supplier, both;
- website;
- country;
- year founded;
- contact email;
- contact phone;
- WhatsApp or messenger-ready field;
- description;
- product focus;
- certificates;
- payment terms;
- publication status;
- buyer qualification status;
- logo image;
- cover image;
- image alt text;
- logo fit;
- cover focal point.

Acceptance:

- company media uploads to Storage;
- preview uses stored company data;
- saved supplier profile draft can feed `/suppliers/:supplierId`;
- publication status does not publish until backend policy allows it.

### `/account/branches`

Backend entities:

- `company_branches`

Required fields:

- branch type;
- country;
- region;
- city;
- address;
- port or pickup point;
- default incoterms;
- notes;
- active/inactive state.

Why this matters:

Branches become delivery basis options for supplier offers.

Acceptance:

- user can create, edit, deactivate and delete draft branches;
- branch can be used by future offers;
- branch access is limited to company members.

### `/account/products`

Backend entities:

- `company_products`

Required fields:

- commercial name;
- Latin name;
- format/cut;
- product state;
- role: buying, selling, both;
- monthly volume;
- certificates;
- target countries;
- status.

Why this matters:

Products power supplier catalog, buyer needs and matching.

Acceptance:

- user can create and edit rows;
- products can be used for supplier profile and future offers;
- buyer and supplier product roles are explicit.

### `/account/meta-regions`

Backend entities:

- `company_meta_regions`
- `company_meta_region_countries`

Required fields:

- name;
- countries;
- logistics reason;
- used-for flags;
- notes.

Why this matters:

Meta-regions allow YORSO to group countries by logistics cost or commercial
meaning instead of treating every country separately.

Acceptance:

- user can create/edit/delete meta-regions;
- notifications and matching can reference meta-regions;
- country list is validated.

### `/account/notifications`

Backend entities:

- `notification_preferences`

Required fields:

- channel;
- enabled;
- events;
- frequency;
- destination address or connector placeholder.

Acceptance:

- user can enable/disable channels;
- unsupported channels are clearly marked as planned;
- settings are used by notification queue later.

## Supplier Directory Contract

### `/suppliers`

Backend entities:

- `supplier_profiles`
- `supplier_certifications`
- `supplier_delivery_markets`
- `supplier_product_previews`
- `access_grants`

Public response must include:

- masked supplier name;
- country and city if allowed;
- supplier type;
- safe description;
- product preview images;
- certification summary;
- approximate or safe activity signals;
- access CTA state.

Public response must not include:

- real company name;
- legal details;
- website;
- WhatsApp;
- email;
- exact hidden product counts if access policy forbids them;
- full delivery geography if locked.

Qualified response can include:

- real company name;
- full trust evidence;
- full catalog preview;
- delivery markets;
- contact channels according to grant scope.

Acceptance:

- search does not reveal hidden company names for locked users;
- locked responses do not contain real identity in network payload;
- mobile layout remains overflow-safe;
- RU/ES localization does not mix raw English system values.

### `/suppliers/:supplierId`

Backend entities:

- `supplier_profiles`
- `supplier_documents`
- `supplier_legal_details`
- `supplier_facilities`
- `supplier_shipments`
- `supplier_faq`
- `offers`
- `access_grants`

Locked response:

- dossier structure;
- safe placeholders;
- non-sensitive trust summary;
- gated access panel;
- safe catalog preview.

Qualified response:

- real company identity;
- legal details;
- contacts;
- full document readiness;
- supplier-specific offers;
- restricted production and delivery details allowed by grant;
- published production capability facts and public trade/logistics terms may be
  included in locked-safe responses.

Owner response:

- all profile data;
- edit-ready fields later;
- publication status;
- verification state.

Acceptance:

- no locked DOM or network leak of company name, legal details, contacts,
  confidential production notes or exact hidden counts;
- supplier offers are truly tied to supplier id;
- access request panel uses backend statuses;
- canonical and SEO rules are defined before public indexing.

## Offer Catalog Contract

### `/offers`

Backend entities:

- `products`
- `offers`
- `offer_prices`
- `offer_media`
- `offer_delivery_terms`
- `offer_documents`
- `access_grants`

Public response:

- product name;
- Latin name;
- image list;
- origin;
- format/cut;
- safe price range label or price access explanation;
- MOQ if allowed;
- certifications;
- safe supplier trust signal;
- no real supplier identity unless policy allows it.

Qualified response:

- exact price range;
- supplier identity;
- supplier country;
- full delivery terms;
- price tiers;
- landed-cost inputs if available.

Acceptance:

- filters work from backend;
- locked response does not include supplier id or exact price fields;
- selected offer panel can load offer-specific price/news/doc readiness data;
- mock fallback is explicit and visible in tests, not silent production truth.

### `/offers/:id`

Backend entities:

- offer detail tables;
- supplier trust tables;
- documents;
- related offers;
- access grants.

Acceptance:

- detail page can render from backend by id;
- legacy offer redirects still work;
- locked users do not receive hidden values;
- document access follows grant scope.

## Access Request Contract

Backend entities:

- `supplier_access_requests`
- `price_access_requests`
- `access_grants`
- `access_events`
- `notifications`

Request creation:

- buyer id;
- buyer company id;
- supplier id or offer id;
- default request scope: price and supplier identity;
- created timestamp;
- status `sent` or `pending`.

No extra reason step is required for default flow.

Approval:

- supplier owner or admin approves;
- grant is created;
- notification is queued;
- frontend access level updates on next load or realtime event.

Acceptance:

- status persists across devices;
- buyer sees sent/pending/approved/rejected state;
- approval unlocks exact price or supplier identity according to grant;
- all transitions are audited.

## RFQ Contract

Backend entities:

- `buyer_requests`
- `buyer_request_items`
- `buyer_request_destinations`
- `supplier_responses`
- `request_events`
- `request_attachments`

Frontend entry points:

- catalog empty state;
- "not found" request form;
- later buyer workspace.

Acceptance:

- user can submit structured product request;
- request is visible in buyer workspace;
- suppliers can respond with comparable fields;
- request does not disappear on refresh.

## Blog Contract

Current blog is static and SEO-oriented. Backend/content pipeline can be delayed
until core trade flows are stable.

Minimum later requirements:

- content source of truth;
- slug uniqueness;
- SEO title and description;
- OG image;
- author/reviewer fields;
- language variants;
- sitemap generation;
- RSS or feed generation;
- schema data.

## Backend Implementation Order

1. Fix current frontend gates: build, lint, tests.
2. Add account API contract and database schema.
3. Move `/account/personal` and `/account/company` to backend.
4. Add branch/product/meta-region/notification CRUD.
5. Move supplier directory and supplier profile to backend views.
6. Move offer catalog and offer detail to backend views.
7. Replace supplier access localStorage flow with backend workflow.
8. Replace catalog request sessionStorage flow with RFQ backend.
9. Add buyer workspace.
10. Add supplier workspace.
11. Add notifications, messaging, documents and admin verification.

## Quality Gates

Before a backend phase is considered complete:

- `npm run build` passes;
- `npm run lint` passes or only documented non-blocking warnings remain;
- relevant unit tests pass;
- RLS tests pass for access-sensitive data;
- browser-level check confirms no locked data is visible;
- network payload check confirms no hidden values are sent;
- local seed data can reproduce the page.

## Open Decisions

1. Whether blog content remains file-based MDX/static data or moves to a CMS
   table.
2. Whether supplier approval is performed by supplier users first or by YORSO
   admin first.
3. Whether company profile publication requires manual YORSO review.
4. Whether buyer qualification is automatic, admin-reviewed, or supplier-scoped.
5. Which notification channels are real in the first backend release.

## Immediate Backend Phase 0 Checklist

- Add this contract under `docs/backend/`.
- Inventory existing Supabase migrations as prototype references only.
- Decide self-hosted PostgreSQL migration baseline.
- Add `.env.example`.
- Generate API/client types from the self-hosted contract.
- Fix current lint/test failures.
- Create account schema migration.
- Create account API adapter skeleton.
- Add account adapter tests with mocked YORSO API responses.
