# YORSO Production Scale Baseline

Status: mandatory architecture gate
Batch: #36
Date: 2026-05-14

## Mandatory Target

YORSO production frontend, backend, persistence, queues, integrations and
agent-runtime decisions must be designed for stable operation with at least
10,000 concurrent web users.

This is a design and release gate. It does not claim that the current prototype
already passed a load test. A feature can stay prototype-only, but any feature
described as production-ready must include the capacity review below.

## Meaning Of 10,000 Concurrent Users

The target means 10,000 active users with overlapping sessions across catalog
search, supplier profile reads, account edits, access requests, RFQ flows,
notifications and agent-assisted workflows.

It does not mean 10,000 direct PostgreSQL connections. Browser users must go
through the web/API tier, PgBouncer, cache, queues and bounded data access.

Every production-facing feature must state:

- expected request rate and peak burst multiplier;
- expected read/write ratio;
- hot-path endpoints and cold-path endpoints;
- maximum synchronous request work;
- background job volume;
- timeout budget;
- graceful degradation behavior.

## Required Capacity Review

Every production-facing change must document these points before release
signoff:

| Area | Required answer |
|---|---|
| Read/write profile | Which operations are hot reads, hot writes, rare writes and background tasks? |
| Database strategy | Which indexes, pagination limits, bounded queries and transaction boundaries protect PostgreSQL? |
| Connection strategy | How do API workers avoid unbounded database connections through PgBouncer or equivalent pooling? |
| Cache strategy | Which reads are cacheable, what TTL is acceptable, and how is invalidation handled? |
| Queue/backpressure | Which work leaves the request path, how retries are bounded, and how idempotency is enforced? |
| Runtime scaling | Which processes are stateless, horizontally scalable and safe to restart? |
| Rate limits | Which user, IP, company or token limits prevent abuse and scraping? |
| Failure mode | What does the user see when API, search, queue, storage or analytics is degraded? |
| Observability | Which metrics, structured logs, traces and alerts prove the feature is healthy? |
| Load test | Which scenario validates the feature before production rollout? |

## Baseline Architecture Rules

For the self-hosted YORSO product:

- Frontend must not talk directly to PostgreSQL.
- Public pages and account UI must use typed API adapters.
- API workers must be stateless and horizontally scalable.
- PostgreSQL must sit behind PgBouncer or equivalent pooling.
- High-volume list/search endpoints must be indexed, paginated and bounded.
- Search-heavy marketplace discovery must not depend on unindexed table scans.
- Media and documents must live in object storage, not app container disks.
- Long-running imports, emails, notifications, reports and agent work must run
  in workers, not inside HTTP request handlers.
- Access-control-sensitive fields must be shaped by the API before reaching
  the frontend.
- Supabase may remain as prototype/reference tooling, not as production
  backend architecture.

## Current Repository Enforcement

The baseline is enforced by:

```bash
npm run check:production-scale-baseline
npm run ci:core
```

The guard verifies that backend architecture docs, validation docs, package
scripts, DB scaling migration and supplier-directory read path keep the
10,000-concurrent-user requirement visible and testable.

Batch #35 introduced the first concrete high-concurrency read-path work:

- `packages/db/migrations/0005_supplier_directory_search_scaling.sql`;
- `packages/db/migrations/0006_offer_catalog.sql`;
- `packages/db/migrations/0007_supplier_access_flow.sql`;
- trigram GIN indexes for supplier and offer search fields;
- verification-level index for supplier filters;
- supplier-access request, grant and notification indexes;
- frontend supplier directory and offer catalog API bridges with pagination.
- self-hosted offer detail smoke for the bounded `/v1/offers/:id` read path,
  locked/unlocked access shaping, not-found, method and validation guards.
- `packages/db/migrations/0009_supplier_directory_pagination_sort.sql` adds
  composite indexes for supplier directory pagination and sort paths.

Batch #36 promotes the target from a supplier-directory note to a project-level
release gate.

Batch #44 hardens the offer detail access path against prototype-only unlocks:

- `/v1/offers/:id?accessLevel=qualified_unlocked` does not reveal exact price
  or supplier identity unless the current account has a self-hosted
  supplier-access grant.
- The frontend offer catalog adapter sends account-session headers to the API
  so access shaping can be evaluated server-side.
- The supplier access frontend bridge clears stale local approvals when the
  self-hosted API is configured and reports no active request or grant.
- The self-hosted offer detail smoke now includes
  `offer_detail_requires_grant=ok`, proving that a query parameter alone cannot
  bypass the access model.

Batch #45 applies the same server-side grant gate to supplier profiles:

- `/v1/suppliers/:id?accessLevel=qualified_unlocked` downgrades to
  `registered_locked` unless the current account has an approved
  supplier-access grant.
- Supplier directory API requests carry account-session headers when the
  self-hosted API is configured.
- Runtime smoke markers `supplier_directory_requires_grant=ok` and
  `supplier_directory_unlocked=ok` prove that supplier identity unlocks only
  after approval.

Batch #46 adds the production rule for private supplier-name search at list
scale. The API must first load the buyer's active `supplier_identity` grants and
only then include private search text for those supplier IDs. This avoids a
global company-name search path while keeping approved buyer workflows fast. The
required smoke markers are `supplier_directory_private_search_requires_grant=ok`,
`supplier_directory_granted_private_search=ok` and
`supplier_directory_ungranted_private_search_guard=ok`.

Batch #47 applies the same rule to the offer catalog. `/v1/offers` must use the
active supplier grant set for both list response shaping and private supplier
search. This avoids global `qualified_unlocked` scans and keeps the 10,000
concurrent-user path bounded by PostgreSQL indexes and per-request grant sets.
The required smoke markers are `offer_catalog_private_search_requires_grant=ok`,
`offer_catalog_list_requires_grant=ok`,
`offer_catalog_granted_private_search=ok` and
`offer_catalog_ungranted_private_search_guard=ok`.

Batch #48 hardens the buyer approval-notification bridge for scale. The local
mock approval ticker may stay fast because it does not touch the network, but
self-hosted `/v1/access/notifications` polling must be bounded. The frontend
uses `BACKEND_NOTIFICATION_POLL_MS = 60_000`, prevents overlapping sync calls,
and also syncs once when a hidden tab becomes visible. This avoids creating a
2-second polling path that would generate unnecessary backend traffic at 10,000
concurrent users.

Batch #49 closes the backend acknowledgement loop for access notifications.
After the frontend applies a `price_access_approved` notification, it calls
`PATCH /v1/access/notifications` with the processed notification IDs. The API
marks those rows as `read` and writes a `notification_read` audit event. This
keeps the unread feed small, reduces repeated notification payloads at scale and
preserves an auditable buyer-side acknowledgement trail.

Batch #50 closes the frontend refresh loop after access state changes. The
shared `SUPPLIER_ACCESS_CHANGE_EVENT` is dispatched when supplier-access state
is persisted locally. `/offers`, `/offers/:id`, `/suppliers` and
`/suppliers/:id` subscribe to that event and refetch their self-hosted API data
instead of waiting for a manual reload. This keeps newly approved price and
supplier identity grants visible quickly while avoiding a new polling path. At
10,000 concurrent users this matters: approval changes trigger bounded,
event-driven reads for the current browser context, not continuous catalog or
supplier-directory polling.

Batch #51 makes the same refresh loop visible to the buyer. Approval events now
carry typed detail (`supplierId`, `status`, `source`) so the UI can distinguish
real approval transitions from ordinary backend reads. Offer and supplier
detail pages show a localized `SupplierAccessRefreshBanner` only for matching
`backend_notification` or `mock_progression` approvals. This prevents stale
locked copy after access is granted without introducing another timer, feed
query or global page reload.

Batch #52 adds a buyer-facing supplier access notification center in the
header. It reuses the same self-hosted `/v1/access/notifications` feed and
`PATCH /v1/access/notifications` acknowledgement path instead of adding a new
endpoint. The header bell sets `autoLoad: false`, so ordinary page boot does
not create an extra feed request; it refreshes on manual open and on typed
`SUPPLIER_ACCESS_CHANGE_EVENT` approvals. It does not add high-frequency
polling. At the 10,000 concurrent-user target, the read path remains an
indexed, paginated notification feed and the write path is a bounded
acknowledgement batch, not one request per notification row.

Batch #53 adds supplier directory pagination and sort as a production read
contract rather than a client-only convenience. `/v1/suppliers` accepts
`sortBy`, `sortDirection`, `limit` and `offset`; `/suppliers` persists
`q/filter/sort/dir/rows/page` in the URL; and the DB owns composite indexes for
default, country, verification and response-speed ordering. At 10,000
concurrent web users this keeps directory browsing bounded to one indexed page
read per user action and avoids loading the full supplier set into the browser.

Batch #54 applies the same production read rule to the offer catalog. `/v1/offers`
accepts `sortBy`, `sortDirection`, `limit` and `offset`; `/offers` persists
`q/category/origin/supplierCountry/state/certification/sort/dir/rows/page` in
the URL; and the DB owns composite indexes for latest, category, origin and MOQ
ordering. Price sorting is intentionally not part of the locked-list contract:
exact price remains grant-gated, so the list must not leak it indirectly through
row ordering. At 10,000 concurrent users, offer catalog pagination stays one
bounded indexed read per user action.

Batch #55 adds offer catalog browser e2e coverage for the same contract.
`e2e/offers-catalog-paging.spec.ts` verifies URL hydration, sort controls,
page-size changes, Next/Previous navigation, page clamping and private supplier
search gating in the actual browser-rendered `/offers` page. This protects the
10,000 concurrent-user read design from frontend regressions: the UI must keep
using bounded pages and safe sort keys, not silently return to full-list
client-side browsing or locked supplier-name discovery.

Batch #56 adds supplier directory browser e2e coverage for the same production
read path. `e2e/suppliers-directory-paging.spec.ts` verifies URL hydration,
quick filters, sort controls, page-size changes, Next/Previous navigation,
page clamping, private supplier search gating and locked breadth masking in the
actual `/suppliers` page. At 10,000 concurrent web users, this protects the
supplier directory from regressing into full-list client browsing, hidden
company-name discovery or unbounded page sizes while still allowing qualified
buyers to search approved supplier identities.

Batch #57 adds supplier profile detail browser e2e coverage for the buyer
access path on `/suppliers/:id`. `e2e/supplier-profile-detail.spec.ts` verifies
the registered buyer one-click access request, locked-state no-leak behavior,
approval-triggered refresh banner, matching-supplier unlock, unrelated supplier
approval guard and unknown supplier not-found cleanup. This is a production
scale guard because supplier profile detail pages are high-read trust surfaces:
the browser must not bypass server grant semantics, leak supplier identity in
DOM or structured data, or require continuous polling to show newly approved
access. The refresh remains event-driven through `SUPPLIER_ACCESS_CHANGE_EVENT`,
so the 10,000 concurrent-user baseline avoids another global polling loop.

Batch #58 adds offer detail runtime browser e2e coverage for the buyer access
path on `/offers/:id`. `e2e/offer-detail-runtime.spec.ts` verifies registered
one-click access requests, no supplier identity or exact-price leakage in
locked page body/head, matching-supplier approval refresh, unrelated approval
isolation and unknown offer not-found cleanup. The batch also closes the
delivery-basis and volume-break price leak in both local fallback shaping and
the self-hosted offer API. This matters at 10,000 concurrent users because
offer detail is a hot read path: access state must be shaped once by bounded
API/fallback logic, not by expensive client-side masking or polling loops.

Batch #59 adds offer catalog detail flow browser e2e coverage for the full
buyer path across `/offers` and `/offers/:id`. The new
`e2e/offer-catalog-detail-flow.spec.ts` verifies that a registered catalog row
stays locked before approval, a one-click request on the detail page unlocks
only the matching supplier after approval, the buyer can return to the catalog
with URL state preserved, and unrelated supplier approvals do not unlock the
current offer. This is the offer catalog detail flow browser e2e guard. It also
formalizes the per-offer access model in the frontend: self-hosted API reads
may request `qualified_unlocked`, but the backend remains responsible for
per-row grant downgrades; local fallback unlocks only suppliers with approved
mock access state. At 10,000 concurrent users this keeps access refresh
event-driven and avoids full catalog reloads, global client-side unlocks or
polling-heavy approval checks.

Batch #60 adds supplier directory profile flow browser e2e coverage for the
matching supplier path across `/suppliers` and `/suppliers/:id`. The new
`e2e/supplier-directory-profile-flow.spec.ts` verifies that a registered
directory row stays locked before approval, a one-click request on the profile
page unlocks only the matching supplier after approval, the buyer can return to
the directory with `q/filter/sort/rows` URL state preserved, and unrelated
supplier approvals do not unlock the current supplier. This is the supplier
directory profile flow browser e2e guard. The local fallback now tracks
approved supplier access per supplier record instead of relying only on a
global buyer level; self-hosted API reads may request `qualified_unlocked`, but
the backend remains responsible for per-row grant downgrades. At 10,000
concurrent users this keeps supplier discovery refresh event-driven, bounded to
the visible page, and protected from global frontend unlocks.

Batch #61 adds API-backed supplier directory profile flow browser e2e coverage.
The new `e2e/supplier-directory-profile-api-flow.spec.ts` runs with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`, so the frontend uses the
self-hosted API adapter while Playwright provides deterministic API responses.
The spec verifies the same buyer path as Batch #60, but through `/v1/suppliers`
and `/v1/access/*` requests: profile approval is delivered as a backend
notification, the refresh banner reloads the supplier profile from API-shaped
data, and returning to `/suppliers` preserves `q/filter/sort/rows` while only
the matching row unlocks. This is the API-backed supplier directory profile
flow browser e2e guard. At 10,000 concurrent users this protects the production
path from accidentally relying on localStorage-only fallback behavior, confirms
that notification polling remains coarse, and keeps private supplier search
dependent on backend-shaped access state.

Batch #62 adds API-backed offer catalog detail flow browser e2e coverage. The
new `e2e/offer-catalog-detail-api-flow.spec.ts` runs with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`, so `/offers` and
`/offers/:id` use the self-hosted offer catalog adapter while Playwright
emulates `/v1/offers`, `/v1/offers/:id` and `/v1/access/*` responses. The spec
verifies the same buyer path as Batch #59, but through API-shaped offer data:
the catalog row starts locked, detail creates a one-click request, backend
notification approval shows the refresh banner, the detail reloads exact price
and supplier identity only for the matching supplier, and returning to
`/offers` preserves `q/category/sort/rows` while only that row unlocks. This is
the API-backed offer catalog detail flow browser e2e guard. At 10,000
concurrent users this protects the production offer discovery path from
depending on local mock storage, confirms approval refresh remains event-driven,
and keeps exact price visibility tied to backend-shaped grants instead of a
global frontend buyer flag.

Batch #63 adds API-backed supplier access notification center browser e2e
coverage. The new
`e2e/supplier-access-notification-center-api-flow.spec.ts` runs with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`, so the header
notification bell uses the self-hosted `/v1/access/notifications` adapter while
Playwright provides deterministic feed responses. The spec verifies that the
bell itself does not auto-load feed data on render, opening the bell refreshes
the feed, "Mark all read" and row open acknowledge unread rows through `PATCH`,
and every notification request carries `x-yorso-user-id` plus
`x-yorso-session-id`. This is the API-backed supplier access notification
center browser e2e guard. At 10,000 concurrent users this protects the header
from per-render notification reads, keeps background sync bounded and confirms
the acknowledgement path prevents repeated unread payloads.

Batch #64 promotes the API-backed access browser checks into one CI-gated suite.
`smoke:e2e:api-backed-access-flows` builds the frontend with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` and runs the three
production-path browser specs together:
`supplier-directory-profile-api-flow`, `offer-catalog-detail-api-flow` and
`supplier-access-notification-center-api-flow`. This is the API-backed access browser suite.
At 10,000 concurrent users this matters because the release gate
now verifies the complete buyer access loop in one pass: directory search,
offer discovery, detail unlock, backend notification delivery, acknowledgement
and session headers. The suite is intentionally separate from local fallback
smoke tests, because it must prove that production code paths work when the
self-hosted API adapter is enabled.

Batch #65 adds a real self-hosted API browser smoke. Unlike Batch #64, this
does not use Playwright route interception. `smoke:e2e:self-hosted-access-runtime`
builds `apps/api`, starts a memory-mode API process on a free local port,
builds the Vite frontend with `VITE_YORSO_API_URL` pointing to that API, starts
Vite preview on a separate free port, and runs
`e2e/self-hosted-access-runtime.spec.ts`. The browser then creates a supplier
access request from `/offers/:id`, the test approves it through the real
`/v1/access/supplier-requests/:id/decision` endpoint, and the same backend
grant unlocks offer detail, offer catalog private search and supplier
directory private search. This is the real self-hosted API browser smoke. At
10,000 concurrent users it closes the gap between adapter-level mocks and the
owned runtime: grant state is shared by API modules, session headers are used
by browser requests, and the release gate verifies graceful API-mode behavior
without relying on frontend-only localStorage unlocks.

Batch #66 adds an optional Supabase frontend smoke. Supabase remains allowed
only as prototype/reference tooling, so the production frontend must not crash
when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are empty.
`smoke:e2e:frontend-no-supabase-env` builds the Vite app with Supabase and
self-hosted API URLs intentionally blank, starts preview on a free port, and
runs `e2e/frontend-no-supabase-env.spec.ts`. The smoke verifies that public,
sign-in, reset-password and catalog routes boot without Supabase client
construction errors. At 10,000 concurrent users this protects deployability:
missing prototype credentials cannot take down a self-hosted production build,
and authentication/catalog routes degrade to self-hosted or local fallback
behavior instead of hard-failing at module import time.

Batch #67 removes the remaining direct Supabase imports from production-facing
auth pages. `SignIn` and `ResetPassword` now cross Supabase only through
`src/lib/auth-runtime.ts`, which exposes `signInWithEmail`,
`requestPasswordReset`, `observePasswordRecovery` and
`updateRecoveredPassword`. The adapter uses the local auth contract when
Supabase is not configured and delegates to prototype Supabase auth only when
prototype env variables are present. This is the auth runtime adapter boundary.
At 10,000 concurrent users this matters because page components cannot become
implicit production auth gateways to Supabase: the self-hosted product can boot
without prototype credentials, while future production auth can replace the
adapter behind the same page contract.

Batch #68 closes the legacy catalog Supabase adapter boundary. `src/lib/catalog-api.ts`
is now a self-hosted-first catalog facade: when `VITE_YORSO_API_URL` is configured
it reads through `src/lib/offer-catalog-api.ts` and the self-hosted `/v1/offers`
contract; only when the self-hosted API is disabled does it call
`src/lib/legacy-catalog-supabase-adapter.ts`. The adapter is the only catalog
module in this path allowed to import `@/integrations/supabase/client`, and it is
documented as prototype/reference fallback, not production infrastructure.
At 10,000 concurrent users this keeps the hot catalog path replaceable and
observable through the owned API while preserving a safe prototype fallback for
unfinished environments. Guards and `src/lib/catalog-api.boundary.test.ts`
prevent direct Supabase imports from returning to the catalog facade.

## Release Rule

If a change affects production frontend, backend, persistence, queues,
integrations or runtime behavior, release signoff must either:

1. reference a capacity review against this document; or
2. explicitly mark the change as prototype-only.

If neither is true, the change is not production-ready.
