# YORSO Production Scale Baseline

Status: mandatory architecture gate
Batch: #36
Date: 2026-05-14

Phase 3C provider-free frontend smoke: `smoke:e2e:frontend-provider-free-env`
builds and boots public/auth/catalog routes with only the owned YORSO API
contract. Supabase reference tooling, the tracked Supabase project directory
and hosted BaaS SDK dependency are retired from the active product surface.

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
- Supabase, Firebase, Appwrite, Clerk, Auth0, hosted BaaS platforms and similar
  third-party application backends must not be production dependencies.
- Supabase/provider files must not exist in the active product surface after
  Backend Phase 3C; historical docs remain archival context only.

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
without hosted BaaS credentials. Backend Phase 3C supersedes this with
`smoke:e2e:frontend-provider-free-env`, which builds the Vite app with the
owned API contract only, starts preview on a free port and runs
`e2e/frontend-provider-free-env.spec.ts`. The smoke verifies that public,
sign-in, reset-password and catalog routes boot without hosted-provider client
construction errors. At 10,000 concurrent users this protects deployability:
missing third-party provider credentials cannot take down a self-hosted
production build, and authentication/catalog routes degrade to self-hosted or
local-preview behavior instead of hard-failing at module import time.

Batch #67 removed direct Supabase imports from production-facing auth pages.
Phase 2J then removes the remaining auth Supabase prototype fallback entirely:
`SignIn` and `ResetPassword` use `src/lib/auth-runtime.ts`, which exposes
`signInWithEmail`, `requestPasswordReset`, `observePasswordRecovery` and
`updateRecoveredPassword` through self-hosted or local-contract behavior only.
At 10,000 concurrent users this matters because page components cannot become
implicit production auth gateways to Supabase: configured deployments use the
owned `/v1/auth/*` API, while API-disabled preview remains a local contract and
does not call hosted auth.

Batch #68 originally isolated the legacy catalog Supabase adapter boundary.
Backend Phase 3A supersedes that boundary by removing the catalog Supabase
fallback completely. `src/lib/catalog-api.ts` is now a self-hosted-first catalog
facade over `src/lib/offer-catalog-api.ts`: configured deployments use the owned
`/v1/offers` and `/v1/offers/:id` contracts, while API-disabled preview uses only
local fixtures from the offer catalog adapter. At 10,000 concurrent users this
removes an unowned external catalog read path under load and keeps production
catalog traffic on the owned API, database indexes, pagination and observability
surface. Guards and `src/lib/catalog-api.boundary.test.ts` prevent
`fetchLegacyCatalogOffers`, `fetchLegacyCatalogOfferById` or the removed
`src/lib/legacy-catalog-supabase-adapter.ts` file from returning.

Backend Phase 3B removes the supplier access Supabase fallback that Batch #69
previously isolated. `src/lib/supplier-access-api.ts` remains the
self-hosted-first access facade: configured deployments use
`/v1/access/suppliers/:supplierId/request` and `/v1/access/notifications`;
API-disabled preview uses only local supplier-access preview storage. No
supplier-access path falls back to Supabase auth, RLS or prototype tables. At
10,000 concurrent users this removes an unowned external access read/write path
under load and keeps buyer trust state on the owned access API, database indexes
and notification flow. `src/lib/supplier-access-api.boundary.test.ts`,
`check:self-hosted-api` and `check:production-scale-baseline` now fail if the
removed `src/lib/legacy-supplier-access-supabase-adapter.ts` file or legacy
adapter markers return.

Phase 2J closes the auth Supabase removal boundary.
`src/lib/auth-runtime.ts` remains the production-facing auth facade for
sign-in, password reset, recovery-session observation and recovered password
updates, and no longer contains the legacy Supabase adapter path, the
`supabase_prototype` source or `VITE_SUPABASE_*` branching. At 10,000
concurrent users this keeps sign-in and reset routes on the owned API surface
instead of a hosted auth provider. `src/lib/auth-runtime.boundary.test.ts`,
`check:self-hosted-api` and `check:production-scale-baseline` prevent the
removed auth Supabase fallback from returning.

Batch #71 adds the self-hosted production policy and clarifies the production
third-party boundary. YORSO production is a self-hosted product running on owned
server infrastructure: YORSO frontend, YORSO `apps/api`, PostgreSQL, PgBouncer,
Redis, MinIO or owned object storage, workers and operational tooling. Supabase
and similar hosted BaaS/SaaS application backends are not used as production
auth, database, storage, access-control or deployment dependencies. The
repository may retain legacy Supabase prototype references, but
production-ready code must route through YORSO-owned contracts and adapters.

Batch #72 adds the self-hosted production runtime guard. The new
`.env.production.example`, `docs/backend/self-hosted-production-deploy.md` and
`check:self-hosted-production-runtime` make the server deploy boundary
explicit: production runtime configuration must not require Supabase, Firebase,
Appwrite, Clerk, Auth0 or similar hosted BaaS/SaaS environment variables.
`infra/docker-compose.yml` now represents the owned server runtime without
hosted-provider inputs, while the provider-free frontend smoke continues to
prove that public, auth and catalog routes boot without third-party provider
credentials.
At 10,000 concurrent users this matters because the production hot path must
be operable, observable and recoverable inside the owned stack rather than
depending on third-party application backend availability.

Backend Phase 3C retires the remaining active Supabase/provider reference
surface. The tracked `supabase/` project, `src/integrations/supabase`, Supabase
CLI/type/access smoke scripts, RLS reference tests, `@supabase/supabase-js`
dependency, `VITE_SUPABASE_*` env examples and old `frontend-no-supabase-env`
smoke are removed or renamed. `check:provider-boundary` now scans production
source roots for hosted-provider imports, env keys, legacy adapter markers and
old admin runtime policy fields. At 10,000 concurrent users this matters
because the product cannot silently route catalog, access, auth, admin or DB
work to a hosted BaaS path under load.

Batch #73 adds the self-hosted auth/session foundation. The API now owns
`POST /v1/auth/sign-in`, `GET /v1/auth/session` and `POST /v1/auth/sign-out`
behind `packages/contracts/src/auth.ts`, `apps/api/src/modules/auth` and
`scripts/smoke-self-hosted-auth-api.mjs`. The self-hosted PostgreSQL baseline
also owns `yorso_auth_credentials` and `yorso_auth_sessions` through
`packages/db/migrations/0011_auth_sessions.sql`. This is not final
auth-hardening: password hashing policy, brute-force protection, MFA, Redis
session replication and audit dashboards remain separate production-readiness
work. At 10,000 concurrent users the important architectural change is that
auth/session traffic has an owned API contract, an owned persistence schema,
bounded smoke coverage and no dependency on hosted auth providers.

Batch #74 adds the self-hosted auth frontend bridge. When
`VITE_YORSO_API_URL` is configured, `/signin` posts email/password to the
owned `/v1/auth/sign-in` endpoint, stores the returned backend session id and
user id in `yorso_buyer_session`, and downstream self-hosted API adapters send
those values as `x-yorso-session-id` and `x-yorso-user-id`. When the API URL
is empty, the frontend still falls back to local prototype mode for Lovable
and offline review. Password reset, phone and WhatsApp sign-in are explicitly
not upgraded by this batch because the Batch #73 backend only owns email
sign-in/session/sign-out. At 10,000 concurrent users this keeps browser auth
stateless from the frontend perspective, avoids hosted auth dependencies and
uses bounded per-action calls rather than polling. Production hardening still
requires rate limiting, Redis-backed session checks, audit events and load
tests for sign-in bursts and steady session validation.

Batch #75 adds the backend session authority guard. Protected self-hosted API
routes no longer trust a browser-provided `x-yorso-user-id` by itself:
`/v1/account/*`, `/v1/account/files/*`, `/v1/access/*`, and authenticated
catalog/supplier requests must validate `x-yorso-session-id` through the
owned auth service before using a user id. Public catalog and supplier routes
remain readable when no session headers are present, but if a client sends
session headers the API validates them and rejects user/session mismatch. This
closes the gap between Batch #74 frontend session storage and real backend
authorization: the client may route a request, but it cannot self-assign an
account. At 10,000 concurrent users the read profile is one session lookup per
protected request; the PostgreSQL baseline already indexes active sessions via
`idx_yorso_auth_sessions_user_active`, and production hardening should add a
short-lived Redis session cache, request-rate limits, invalid-session metrics,
and load tests for steady account/catalog traffic. Failure mode is fail-closed
for protected routes (`401 account_session_required` or
`401 account_session_invalid`) and graceful public fallback for anonymous
catalog reads.

Batch #76 hardens revoked-session behavior. After `/v1/auth/sign-out`, the
same session id must be rejected by protected account routes, supplier-access
notification routes, and authenticated catalog unlock attempts. Public catalog
reads without session headers remain available but return redacted data. At the
10,000 concurrent-user baseline this keeps the read/write profile explicit:
sign-out is a session deletion/write, protected reads perform one bounded
session validation, and catalog reads without credentials avoid unnecessary auth
lookups. Backpressure and graceful degradation remain fail-closed for revoked
credentials and fail-open only for anonymous public catalog data. Observability
must track invalid-session counts, revoked-session reuse attempts and catalog
downgrade rates before production signoff.

Batch #77 adds self-hosted auth security events and sign-in backpressure. The
read/write profile is intentionally bounded: every sign-in attempt writes one
security event, failed sign-ins read a narrow `(email, event_type,
occurred_at)` index before password verification, and successful session reads
do not write per-request audit rows. PostgreSQL stores
`yorso_auth_security_events` with indexes for email/type, session, user and
event-type timelines; a Redis token-bucket can replace or front the PostgreSQL
counter when load tests show the sign-in path approaching the 10,000
concurrent-user target. Failure mode is fail-closed for bursty sign-in attempts
(`429 auth_rate_limited`) while existing anonymous catalog reads remain
available. Observability must track `sign_in_failed`,
`sign_in_rate_limited`, `session_invalid`, and `sign_out_invalid` rates by
time window before production signoff.

Batch #78 adds Redis sign-in backpressure on the production Redis path. The
expected write profile for failed sign-ins is one `INCR` plus a bounded TTL per
hashed email key, with an optional hashed IP key; successful sign-ins clear the
short-lived Redis bucket and keep the append-only audit event. PostgreSQL
remains the audit trail, not the hot counter, which prevents credential-stuffing
bursts from turning into repeated indexed count queries. Production config must
set `AUTH_RATE_LIMIT_DRIVER=redis`, `AUTH_RATE_LIMIT_FAIL_MODE=closed`,
`AUTH_SIGN_IN_FAILURE_WINDOW_MS=900000` and
`AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS=5`. Failure mode is explicit: if Redis is
unavailable in production, sign-in fails closed with `429 auth_rate_limited`
and `Retry-After`; local/test mode can use the audit-log fallback. Observability
must track Redis limiter errors, degraded fail-closed decisions, rate-limited
attempts, and p95/p99 sign-in latency under burst load before production
signoff.

Batch #79 adds the Redis session cache runtime for hot authenticated reads.
PostgreSQL remains the source of truth for issuing, expiring and revoking
sessions, but protected routes no longer have to hit PostgreSQL for every
steady-state session read once the cache is warm. The expected read/write
profile is one Redis `GET` per protected request, one Redis `SETEX` after
sign-in or cache miss, and one Redis `DEL` after sign-out; PostgreSQL is read
on cache miss and written on sign-in/sign-out. Production config must set
`AUTH_SESSION_CACHE_DRIVER=redis`, `AUTH_SESSION_CACHE_FAIL_MODE=closed`,
`AUTH_SESSION_CACHE_TTL_MS=300000` and
`AUTH_SESSION_CACHE_KEY_PREFIX=yorso:auth`. Failure mode is explicit:
protected/authenticated paths fail closed if the production session cache is
unavailable, while anonymous catalog reads remain public and redacted.
Backpressure is provided by short TTLs, PgBouncer for database misses, and
Redis as the hot-path session authority cache. Observability must track cache
hit/miss ratio, Redis unavailable events, invalid-session reuse and p95/p99
protected-route latency under the 10,000 concurrent-user baseline. Load tests
must include warm-cache account/catalog reads, cache-miss bursts and sign-out
invalidation checks before production signoff.

Batch #80 adds a session-cache fail-closed smoke for the production Redis
failure path. The smoke runs the compiled API with
`AUTH_SESSION_CACHE_DRIVER=redis`, `AUTH_SESSION_CACHE_FAIL_MODE=closed` and an
unavailable Redis endpoint. Expected behavior is: sign-in and `/v1/auth/session`
return `auth_session_cache_unavailable`; protected account reads and
authenticated catalog unlock attempts fail closed; anonymous catalog reads
remain available and redacted. This is the negative control for the Batch #79
cache strategy: the service must not silently fall back to PostgreSQL for
authenticated requests when production Redis is unavailable, because that would
turn a cache outage into uncontrolled database pressure at the 10,000
concurrent-user baseline. Observability must treat this as an incident signal:
count Redis unavailable events, protected-route fail-closed responses and
anonymous fallback traffic separately.

Batch #81 adds auth observability JSONL for the self-hosted runtime. Production
config must set `AUTH_OBSERVABILITY_DRIVER=console`; local prototype mode can
keep the driver disabled to avoid noisy test output. The read/write profile is
append-only stdout JSONL plus existing durable `yorso_auth_security_events`
writes for security decisions. The JSONL stream emits `auth_runtime_event`
records for sign-in failures, rate-limit blocks, successful sign-ins, sign-out
success and invalid-session outcomes, without raw email, session id or user id
values. This makes the 10,000 concurrent-user auth path operable without
introducing a hosted observability dependency: log aggregation can count
`auth.sign_in.rate_limited`, `auth.session.invalid`,
`auth.session_cache.unavailable` and p95/p99 route latency by request id.
Failure mode is non-blocking for telemetry emission; auth decisions still rely
on the owned repository, Redis rate limiter and Redis session cache.

Batch #82 adds production readiness checks for the self-hosted API. `/health/live`
remains a cheap process liveness probe, while `/health/ready` and
`/v1/health/ready` now execute bounded readiness checks for PostgreSQL,
Redis-backed auth hot paths, local file storage and production runtime config.
The expected read profile is low-frequency orchestrator polling, not user
traffic. Each dependency check is capped by `HEALTH_READINESS_TIMEOUT_MS` so a
failing Redis or PostgreSQL path cannot pin request workers at the 10,000
concurrent-user baseline. Failure mode is explicit: required dependency failure
returns `503 not_ready`, while local prototype dependencies can be marked as
`skipped`. Docker Compose now points the API healthcheck at `/health/ready`, and
the self-hosted health readiness smoke `smoke:self-hosted-health-readiness`
verifies local readiness, Redis outage, PostgreSQL outage and method guards.
Observability should count `not_ready`
responses by dependency and alert before load balancers drain all API replicas.

Batch #83 adds graceful shutdown drain for the self-hosted API. On `SIGTERM`
or `SIGINT`, the process enters `server_draining`, readiness returns
`503 not_ready`, live health remains cheap, and new non-health work receives
`503 server_draining` instead of entering long queues. Existing in-flight
requests are tracked with `ApiLifecycle.activeRequests` and get a bounded
window controlled by `YORSO_SHUTDOWN_DRAIN_DELAY_MS` and
`YORSO_SHUTDOWN_GRACE_TIMEOUT_MS`; if the window expires, the process forces
connection closure. This protects rolling deploys at the 10,000 concurrent-user
baseline: load balancers can stop sending traffic before the API exits, while
clients get an explicit retryable failure mode. The self-hosted graceful
shutdown smoke, also referenced as the self-hosted graceful shutdown smoke,
`smoke:self-hosted-graceful-shutdown` verifies ready-before signal, draining
readiness, live-during-drain, new-work rejection and process exit.

Batch #84 adds request guardrails for the self-hosted API. Runtime config now
sets `YORSO_REQUEST_TIMEOUT_MS`, `YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS`,
`YORSO_HEADERS_TIMEOUT_MS`, `YORSO_KEEP_ALIVE_TIMEOUT_MS`,
`YORSO_MAX_HEADER_BYTES` and `YORSO_JSON_BODY_MAX_BYTES`. These limits create
bounded failure modes before application code, database pools or file storage
can be pinned by slow or oversized clients. Oversized JSON bodies return
`413 request_body_too_large`, stalled body uploads return
`408 request_body_timeout`, long-running requests return `408 request_timeout`,
and oversized headers are rejected by the Node HTTP parser with `431`.
The explicit request timeout and body idle timeout are separate controls:
request timeout bounds total route work, while body idle timeout bounds time
between upload chunks.
At the 10,000 concurrent-user baseline this is the API backpressure layer above
PgBouncer and Redis: legitimate requests fail fast when a replica is saturated,
while abusive or broken clients cannot accumulate unbounded memory, sockets or
worker time. Observability must count each guardrail code separately and alert
on spikes by route and request id. The self-hosted request guardrails smoke
`smoke:self-hosted-request-guardrails` verifies large-body rejection, body idle
timeout and header-size enforcement over the compiled API.

Batch #85 adds request observability for the same guardrails. Production config
must set `YORSO_REQUEST_OBSERVABILITY_DRIVER=console`, which writes JSONL
`api_request_event` records without request payloads, query strings, supplier
ids, offer ids, email addresses or session ids. The event stream reports
`request.completed`, `request.guardrail_triggered` and client parser failures
with normalized route, method, status code, outcome, latency bucket, request id
and guardrail code. The expected write profile is one small stdout JSONL record
per HTTP request plus one record for parser-level header overflow; aggregation
belongs to owned log collection, not a hosted SaaS backend. At the 10,000
concurrent-user baseline this closes the feedback loop for Batch #84:
operators can see whether `request_timeout`, `request_body_timeout`,
`request_body_too_large` or `request_header_too_large` is protecting the API
or masking a capacity issue. Failure mode is non-blocking: request handling
must continue even if telemetry emission fails. The self-hosted request
observability smoke, also referenced as the self-hosted request observability
smoke, `smoke:self-hosted-request-observability` verifies normal completion
telemetry, guardrail telemetry, header overflow telemetry and no-PII stdout
behavior.

Marker: self-hosted request observability smoke.

Batch #86 adds structured API error observability and correlation. Production
config must set `YORSO_ERROR_OBSERVABILITY_DRIVER=console`, which writes JSONL
`api_error_event` records for structured error responses and parser-level
client errors. Every JSON error response now carries `requestId`,
`correlationId` and an `error.errorId`; the same ids are also exposed through
`x-request-id`, `x-correlation-id` and `x-error-id` response headers. Error
events include only safe operational fields: normalized route, method, status
code, error code, category, retryability, request id, correlation id and error
id. They deliberately omit payload values, query strings, email addresses,
passwords, raw session ids and stack traces. The expected write profile is one
small stderr JSONL record per 4xx/5xx response plus parser errors; this is
separate from request telemetry so operators can build error-rate and
guardrail-rate alerts independently. At the 10,000 concurrent-user baseline
this gives support and SRE teams a stable handle for incident triage without
scraping user data from application logs. Failure mode is non-blocking:
request handling continues if error telemetry emission fails. The self-hosted
error observability smoke, also referenced as the self-hosted error
observability smoke, `smoke:self-hosted-error-observability` verifies error
envelopes, auth errors, guardrail errors, parser errors and no-PII log output.

Marker: self-hosted error observability smoke.

Batch #87 adds a Prometheus-compatible metrics endpoint for the self-hosted API.
Production config must set `YORSO_METRICS_DRIVER=prometheus`, which keeps an
in-process low-cardinality metrics registry and exposes `/metrics` and
`/v1/metrics` in Prometheus text format. The registry derives counters and
histograms from the sanitized request, error and auth telemetry events already
introduced in Batches #85 and #86. Metrics include
`yorso_api_requests_total`, `yorso_api_request_duration_seconds`,
`yorso_api_errors_total`, `yorso_api_guardrails_total`,
`yorso_api_auth_events_total`, `yorso_api_auth_session_cache_events_total`,
`yorso_api_auth_rate_limit_events_total`, `yorso_api_readiness_checks_total`
and lifecycle gauges. Labels are bounded to normalized route, method, status
class, outcome, error category/code and guardrail kind. They deliberately omit
query strings, payload values, raw supplier ids, offer ids, email addresses,
passwords and session ids.

At the 10,000 concurrent-user baseline this turns request/error telemetry into
operational SLO inputs without sending production data to a hosted monitoring
backend. Prometheus or an owned scraper can collect the endpoint from the same
self-hosted network as the API. Failure mode is local and bounded: metrics
collection is in-memory, low-cardinality and non-blocking. If the driver is
disabled in prototype mode, `/metrics` still reports `yorso_api_metrics_enabled
0` so operators can detect misconfiguration. The self-hosted metrics smoke,
also referenced as the self-hosted metrics smoke,
`smoke:self-hosted-metrics` verifies Prometheus output, request histogram,
error counter, auth counter, guardrail counter, readiness counter and no-PII
behavior.

Marker: self-hosted metrics smoke.
Marker: Prometheus metrics endpoint.

Batch #88 adds a structured audit trail for risk-bearing backend actions. The
console driver remains a deterministic local smoke path that writes sanitized
`api_audit_event` JSONL records for auth sign-in/sign-out, account/company
mutations, supplier access request/decision actions, notification
acknowledgements and account file/document uploads. Audit records include
request id, correlation id, action, outcome, normalized route and hashed
actor/session/resource identifiers. They deliberately omit raw emails,
passwords, user ids, session ids, supplier ids, file names, uploaded payloads,
query strings and business profile values.

Batch #89 makes production audit durable. Production config must set
`YORSO_AUDIT_DRIVER=postgres`, which persists the same sanitized audit envelope
to `yorso_api_audit_events`. The write profile is one small audit row for each
protected mutation and auth outcome. The database owns indexes for
`occurred_at`, `action/outcome/time`, `actor_user_hash/time`,
`resource_type/resource_hash/time` and `correlation_id`, so compliance and
support queries stay bounded at the 10,000 concurrent-user baseline.

The persistence path is non-blocking and bounded by
`YORSO_AUDIT_MAX_IN_FLIGHT`. If the in-flight limit is reached, the API drops
the audit write and emits a sanitized `api_audit_dropped` envelope instead of
holding user requests behind an unbounded audit queue. If PostgreSQL write
fails, `emitAuditEvent` still emits sanitized `api_audit_emit_failed` metadata
without raw identities or payload data. This keeps auditability inside the
owned self-hosted stack without hosted audit/SIEM dependencies.

The self-hosted audit trail smoke, also referenced as the self-hosted audit
trail smoke, `smoke:self-hosted-audit-trail` verifies auth, account, access,
notification and storage audit events plus no-PII log behavior. The durable
audit smoke, `smoke:self-hosted-audit-persistence`, verifies PostgreSQL insert
shape, hash-only parameters and backpressure drop behavior without requiring a
live database.

Marker: self-hosted audit trail smoke.
Marker: api_audit_event.
Marker: self-hosted audit persistence smoke.
Marker: yorso_api_audit_events.

Batch #90 adds the admin audit read/export boundary on top of durable audit
storage. The self-hosted API now exposes `GET /v1/admin/audit-events` and
`GET /v1/admin/audit-events/export`, both protected by backend session
validation plus the owned `yorso_user_roles` table. Ordinary buyer or supplier
sessions receive `403 admin_role_required`; anonymous requests receive the
existing session guard. This is deliberately not a Supabase/Auth0/Clerk role
check.

The read profile is operator-heavy and bounded: filters are limited to
sanitized fields (`action`, `outcome`, `actorUserHash`, `resourceType`,
`resourceHash`, `correlationId`, `from`, `to`) and pagination is cursor-based
over `(occurred_at, audit_id)`. JSON responses cap at 500 rows; JSONL export
caps at 10,000 rows per call and returns `x-next-cursor` for continuation.
The database adds `yorso_user_roles`, `idx_yorso_user_roles_role_user`,
`idx_yorso_api_audit_events_status_time` and
`idx_yorso_api_audit_events_route_time` to keep admin reads bounded at the
10,000 concurrent-user baseline. Export is intentionally page-oriented rather
than a long-running streaming job; future worker-based exports can reuse the
same repository contract.

Failure mode is fail-closed. If the session is missing, invalid or non-admin,
audit reads are denied and a sanitized admin audit event is emitted. Returned
records expose only the durable audit envelope fields: hashed actor, session
and resource references, no emails, no passwords, no raw user ids, no raw
session ids, no supplier ids, no file names and no request bodies. The
self-hosted admin audit smoke, `smoke:self-hosted-admin-audit`, validates
auth guard, role guard, list endpoint, JSONL export and query validation.

Marker: self-hosted admin audit smoke.
Marker: admin.audit_events.read.
Marker: admin.audit_events.export.
Marker: yorso_user_roles.

Batch #91 hardens the admin audit runtime for production operation. The admin
audit query contract now includes exact `route`, exact `statusCode` and
coarse `statusClass` filters so operators can inspect failure classes without
exporting broad date ranges. Export requests still cap at 10,000 rows, and
the API additionally enforces `YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS`
with a production maximum of 31 days. Retention is explicit through
`YORSO_ADMIN_AUDIT_RETENTION_DAYS`, with production guarded at 365 days or
higher, and the database owns a controlled
`yorso_purge_api_audit_events(p_before timestamptz)` maintenance helper.

The database adds `idx_yorso_api_audit_events_route_status_time` and
`idx_yorso_api_audit_events_outcome_status_time` for high-volume admin
investigation paths. Prometheus metrics add
`yorso_api_admin_audit_requests_total` and
`yorso_api_admin_audit_rows_total`, labelled only by operation, outcome,
reason and limit bucket, never by raw user, email, session or supplier data.
The admin audit smoke now verifies route/status filtering, export-window
rejection and metrics emission in addition to the Batch #90 auth and role
guards.

Marker: Batch #91.
Marker: admin audit retention.
Marker: yorso_purge_api_audit_events.
Marker: yorso_api_admin_audit_requests_total.
Marker: YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS.
Marker: YORSO_ADMIN_AUDIT_RETENTION_DAYS.

Batch #92 turns admin audit retention into an operator-safe runtime path. The
API now exposes `POST /v1/admin/audit-events/retention` for admin-only dry-run
and apply operations. Retention uses `yorso_purge_api_audit_events_batch`
instead of deleting an unlimited time range in one transaction. Each request is
bounded by `batchSize` and `maxBatches`, and the database scans
`idx_yorso_api_audit_events_retention_scan` in `(occurred_at, audit_id)` order.
This keeps maintenance work predictable while the marketplace is serving the
10,000 concurrent-user baseline.

Batch #92 also adds CSV export for sanitized audit events. JSONL remains the
default export format, CSV is explicit through `format=csv`, and both formats
reuse the same bounded page contract, export-window guard and `x-next-cursor`
continuation. CSV cells are quoted and escaped server-side. Prometheus admin
audit counters now include the `retention` operation with low-cardinality
labels only. The `admin:audit:retention` CLI calls the self-hosted API using an
admin session and supports dry-run by default, with `--apply` required for
deletion.

Expected profile: admin retention is a low-frequency maintenance write path,
not a buyer-facing request path. It scans old audit rows through an ordered
index, deletes in bounded batches and reports remaining rows before the cutoff.
Failure mode is fail-closed: missing admin session, non-admin role, invalid
payload or retention validation errors do not delete rows. Observability comes
from `yorso_api_admin_audit_requests_total`,
`yorso_api_admin_audit_rows_total`, the admin audit event for the retention
operation and the smoke markers `admin_audit_retention_dry_run=ok`,
`admin_audit_retention_apply=ok` and `admin_audit_retention_metrics=ok`.

Marker: Batch #92.
Marker: yorso_purge_api_audit_events_batch.
Marker: idx_yorso_api_audit_events_retention_scan.
Marker: admin_audit_csv_export=ok.
Marker: admin_audit_retention_apply=ok.
Marker: admin:audit:retention.

Batch #93 adds the admin runtime status boundary. Operators now have
`GET /v1/admin/runtime/status`, protected by the same self-hosted session and
`admin` role guard as the audit console. The endpoint reports only safe runtime
facts: self-hosted backend status, the 10,000 concurrent-user production
baseline, selected driver names, request guardrail limits, admin audit
retention/export limits, lifecycle drain state and the explicit policy that
Supabase or another hosted BaaS is not the production backend.

The endpoint deliberately excludes connection strings, S3 endpoints and
buckets, filesystem paths, secrets, emails, raw user ids, session ids and
business payload values. This keeps the operator surface useful during
incidents without turning it into a data-leak path. Prometheus records
`yorso_api_admin_runtime_status_requests_total` with low-cardinality labels
only: operation, outcome and reason. The smoke
`smoke:self-hosted-admin-runtime-status` validates auth guard, admin role guard,
safe payload shape, no-secret serialization and metrics emission.

Expected profile: admin runtime status is a low-frequency operator read path.
It performs no database, Redis or object-storage probing and therefore cannot
amplify an incident by adding dependency load. Failure mode is fail-closed:
missing session, invalid session or non-admin role returns 401/403. Observability
comes from the admin audit action `admin.runtime.status.read`, request/error
telemetry and the Prometheus counter
`yorso_api_admin_runtime_status_requests_total`.

Marker: Batch #93.
Marker: /v1/admin/runtime/status.
Marker: admin.runtime.status.read.
Marker: admin runtime status.
Marker: self-hosted admin runtime status smoke.
Marker: yorso_api_admin_runtime_status_requests_total.
Marker: admin_runtime_status_no_secrets=ok.

Batch #94 adds the admin runtime UI on top of the same endpoint. The frontend
route `/admin/runtime` is an operator-only status surface for the self-hosted
product. It uses `src/lib/admin-runtime-api.ts` and
`src/lib/use-admin-runtime-status.ts` to call `/v1/admin/runtime/status` with
`x-yorso-user-id` and `x-yorso-session-id` from the self-hosted browser
session. The page has explicit disabled, session-required and admin-role
states, so prototype mode does not invent backend health data.

The UI shows only sanitized facts already allowed by Batch #93: the 10,000
concurrent-user policy, runtime drivers, auth backpressure, request guardrails,
audit limits, lifecycle drain state and production policy. It must not render
emails, raw user ids, session ids, connection strings, storage endpoints or
secret values. `test:admin-runtime-frontend` covers the adapter, hook and page.
`smoke:e2e:admin-runtime-status` covers the browser route with an API-backed
mock and verifies request headers, no-secret rendering and the 403 admin-role
state.

Expected profile: `/admin/runtime` is a low-frequency operator read path. It
must never poll aggressively; refresh is explicit through the UI. At the 10,000
concurrent-user baseline it adds negligible load and degrades safely to
disabled/session-required/forbidden states.

Marker: Batch #94.
Marker: admin runtime UI.
Marker: API-backed admin runtime status browser e2e.
Marker: /admin/runtime.
Marker: test:admin-runtime-frontend.
Marker: smoke:e2e:admin-runtime-status.

Batch #95 expands the admin runtime surface from static status to actionable
diagnostics. The backend adds `GET /v1/admin/runtime/diagnostics`, protected by
the same self-hosted session and `admin` role boundary as runtime status. The
endpoint returns derived checks for production policy, the 10,000 concurrent
users baseline, auth rate limiting, session cache, observability, audit
durability, request guardrails and lifecycle drain. It also returns a capacity
plan with read/write profile, cache strategy, backpressure strategy, database
strategy, failure mode, observability plan and load-test plan.

Expected profile: diagnostics is a low-frequency operator read path. It does
not scan business data, does not call hosted BaaS, does not expose secrets and
does not mutate runtime state. It is deliberately explicit-refresh only in the
browser UI, so open admin tabs cannot create background load. The endpoint uses
the same request guardrails, audit sink and Prometheus counter as runtime
status, with operation label `diagnostics`.

The frontend extends `/admin/runtime` with a diagnostics panel and capacity
plan. It reuses `src/lib/admin-runtime-api.ts` and
`src/lib/use-admin-runtime-status.ts`, loading status and diagnostics together
through self-hosted session headers. Disabled, missing-session and non-admin
states remain explicit. The UI must not render emails, raw ids, session ids,
connection strings, storage endpoints or secrets.

Marker: Batch #95.
Marker: admin runtime diagnostics.
Marker: /v1/admin/runtime/diagnostics.
Marker: admin.runtime.diagnostics.read.
Marker: admin_runtime_diagnostics_read=ok.
Marker: admin-runtime-diagnostics.
Marker: admin-runtime-capacity-plan.

Batch #96 adds the supplier access review console. Operators now have a
self-hosted admin queue at `GET /v1/admin/access-requests`, protected by the
same browser session authority and `admin` role guard as runtime status and
audit. The queue returns only review-safe context: request status, buyer display
or company label, masked supplier context, request message, age and SLA bucket.
It does not return buyer emails, phone numbers, raw session ids or passwords.

The decision path is `POST /v1/admin/access-requests/:requestId/decision`.
It reuses the existing supplier access decision service, so approval creates
`supplier_identity` and `offer_price` grants and creates the buyer
`price_access_approved` notification. Rejection, pending and revoke decisions
do not create grants. The frontend route `/admin/access-requests` uses
`src/lib/admin-access-review-api.ts` and `src/lib/use-admin-access-review.ts`
with explicit disabled, session-required, forbidden and error states.

Expected profile: the review console is a low-frequency operator read/write
path, not a buyer-facing hot path. Reads are paginated with `limit` and
`offset`, default to the open queue and are supported by
`0017_supplier_access_review_queue` indexes for open status, history ordering
and buyer support lookup. The path degrades fail-closed on missing session,
invalid session or non-admin role. Observability comes from sanitized audit
actions `admin.access_requests.read` and `admin.access_requests.decision`,
standard request/error telemetry and the smoke marker
`self_hosted_admin_access_review_smoke=ok`. Load testing should include mixed
operator search, paginated open queue reads and approval writes while buyer
catalog traffic remains dominant.

Marker: Batch #96.
Marker: /v1/admin/access-requests.
Marker: /v1/admin/access-requests/:requestId/decision.
Marker: admin.access_requests.read.
Marker: admin.access_requests.decision.
Marker: 0017_supplier_access_review_queue.
Marker: admin-access-review-page.
Marker: admin-access-review-queue.
Marker: test:admin-access-review-frontend.
Marker: smoke:self-hosted-admin-access-review.
Marker: smoke:e2e:admin-access-review.
Marker: self-hosted admin access review smoke.
Marker: API-backed admin access review browser e2e.
Marker: self_hosted_admin_access_review_smoke=ok.

Batch #97 adds the admin access grants console and revoke runtime. Operators
now have a self-hosted admin list at `GET /v1/admin/access-grants`, protected
by the same self-hosted session authority and `admin` role guard as runtime
status, audit and review. The list groups active or expired
`supplier_identity` and `offer_price` grants by buyer and supplier. It returns
review-safe buyer labels, supplier context, scopes, grant age, request status
and expiry state. It does not return raw session ids, buyer emails, passwords
or storage credentials.

The revoke path is `POST /v1/admin/access-grants/:grantId/revoke`. It expires
all active grants for the same buyer and supplier, updates the linked request
to `revoked` when present and records a `supplier_access_revoked` event. After
revocation, offer detail, offer catalog and supplier directory access checks
must downgrade the buyer again and mask supplier identity plus exact price.

Expected read/write profile: the grants console is a low-frequency operator
read path with occasional revoke writes. Reads are paginated with `limit` and
`offset`, default to active grants and are bounded to 100 rows by contract.
Writes are idempotent at the access state level because revoked grants become
expired and catalog access checks read only active grants.

Cache, queue and backpressure strategy: no browser background polling is added.
The admin UI refreshes on demand. API request guardrails, auth session cache,
rate limits and existing audit backpressure apply. If a revoke fails, access is
not partially represented in the UI as successful; the backend response remains
the source of truth.

Database indexing and pagination strategy: migration
`0018_admin_access_grants_console` adds active, expired, buyer, supplier and
revoked-event indexes. Marketplace hot paths continue using narrow
buyer/supplier/scope access checks, while admin scans stay on bounded
pagination.

Failure mode and graceful degradation: missing session, invalid session,
non-admin role, invalid grant id and missing grant all fail closed. When the
self-hosted API is not configured, `/admin/access-grants` shows an explicit
disabled state and does not invent grant data.

Observability and load-test plan: sanitized audit actions
`admin.access_grants.read` and `admin.access_grants.revoke` are emitted.
Smoke and browser tests verify auth guard, role guard, list, revoke,
post-revoke catalog masking and validation. Load testing should include mixed
admin list reads, revoke writes and buyer catalog/detail reads, with buyer
catalog traffic remaining dominant.

Marker: Batch #97.
Marker: /v1/admin/access-grants.
Marker: /v1/admin/access-grants/:grantId/revoke.
Marker: admin.access_grants.read.
Marker: admin.access_grants.revoke.
Marker: 0018_admin_access_grants_console.
Marker: admin-access-grants-page.
Marker: admin-access-grants-table.
Marker: test:admin-access-grants-frontend.
Marker: smoke:self-hosted-admin-access-grants.
Marker: smoke:e2e:admin-access-grants.
Marker: self-hosted admin access grants smoke.
Marker: API-backed admin access grants browser e2e.
Marker: self_hosted_admin_access_grants_smoke=ok.

Batch #98 adds engineering lessons release gates after the Batch #96 and
Batch #97 correction cycle. The goal is to convert repeated implementation
mistakes into durable project checks instead of relying on chat memory. The
new gate records lessons in project memory, checks API-backed browser smoke
isolation, prevents parallel Vite build-based e2e commands from racing on
shared `dist/`, and keeps memory-repository smoke assertions tied to stable
contract fields.

API-backed e2e release policy: any browser spec that requires
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` must run through a
dedicated `smoke:e2e:*` script and must not be added to generic
`smoke:e2e:run`. Generic browser smoke stays safe for local prototype mode.
API-backed suites remain explicit release checks for self-hosted API paths.

Expected read/write profile: Batch #98 adds no runtime marketplace traffic.
It adds release-time reads of `package.json`, AGENTS rules, project-memory,
smoke scripts and docs. The checks are bounded file scans and one Vitest suite.

Cache, queue and backpressure strategy: no cache or queue is added. The
failure mode is fail-fast in CI before release, not runtime backpressure.
Browser suites that rebuild Vite assets must run sequentially or use isolated
outputs to avoid shared `dist/` races.

Database indexing and pagination strategy: no database schema changes. The
policy protects future database-backed and API-backed releases by keeping
API-only browser specs out of prototype smoke and by requiring stable
contract-field assertions.

Failure mode and graceful degradation: if a future batch adds an API-backed
spec to generic smoke, runs build-based e2e commands in parallel, or removes
the lesson records, `check:engineering-lessons` fails. If a production-facing
batch exposes a process mistake, the mitigation must be recorded as an
engineering lesson with a guard before the batch is considered complete.

Observability and load-test plan: Batch #98 is a release-observability guard.
The relevant signal is CI failure with a specific lesson-policy report. Runtime
load tests are unchanged, but API-backed browser smoke isolation prevents
false failures from masking real self-hosted access-flow regressions at the
10000 concurrent-user baseline.

Marker: Batch #98.
Marker: check:engineering-lessons.
Marker: test:engineering-lessons.
Marker: API-backed e2e release policy.

Batch #99 adds the admin operations hub as a larger connected batch. It is not
a single screen-only change. The batch includes a new protected backend
endpoint, frontend adapter, hook, operator page, shared admin navigation, browser
e2e, self-hosted smoke, CI wiring, docs and guard-script enforcement.

Runtime endpoint: `GET /v1/admin/operations/overview`.

Expected read/write profile: low-frequency admin read path. One request fans out
to sanitized runtime status, diagnostics, access review preview and access grants
preview. It performs no writes. Operator decisions and grant revocations stay in
their dedicated endpoints.

Cache, queue and backpressure strategy: the browser does not poll this endpoint
by default. Operators must use explicit refresh. The backend returns bounded
5-row previews and reuses request timeout, admin session guard, role guard and
audit backpressure controls.

Database indexing and pagination strategy: Batch #99 uses existing indexed admin
access review and grants list paths with `limit=5`. Future expansion must add
rollups or indexed filters before increasing counts or preview width.

Failure mode and graceful degradation: if API, session or role validation fails,
the frontend shows disabled, session-required, forbidden or error states. It
does not fabricate admin data from local mocks.

Observability and load-test plan: the endpoint emits admin audit reads and is
covered by `smoke:self-hosted-admin-operations`, `smoke:e2e:admin-operations`,
`check:self-hosted-api` and `check:production-scale-baseline`. It remains a
low-frequency operator path in the 10,000 concurrent users plan.

Marker: Batch #99.
Marker: admin operations hub.
Marker: smoke:self-hosted-admin-operations.
Marker: smoke:e2e:admin-operations.
Marker: admin_operations_overview=ok.
Marker: admin_operations_no_secrets=ok.

Batch #100 expands the operator layer into a command center rather than another
single-purpose page. The batch connects backend overview aggregation, admin
audit summaries, operator readiness, direct operator actions, `/admin/audit`
frontend, browser smoke, docs and guard scripts.

Runtime endpoints:

- `GET /v1/admin/operations/overview`;
- `GET /v1/admin/audit-events`;
- `GET /v1/admin/audit-events/export?format=csv`.

Expected read/write profile: low-frequency admin reads only. The operations
overview fans out to runtime status, runtime diagnostics, access review preview,
access grants preview and a bounded admin audit sample. The audit page performs
paginated audit reads and bounded CSV export. No Batch #100 endpoint writes
business data.

Cache, queue and backpressure strategy: no browser polling is added. Operators
use explicit refresh and navigation. Backend request guardrails, admin session
validation, admin role validation, audit retention/export limits and the
existing request/error/metrics observability remain the pressure controls.

Database indexing and pagination strategy: access previews remain capped at 5.
Audit events are read through the existing admin audit repository paths with
supported route/outcome/status filters. The UI sends only typed filter values
and does not expose arbitrary SQL sort or filter strings.

Failure mode and graceful degradation: disabled API, missing self-hosted session,
forbidden role and backend error states are explicit. The frontend does not
fallback to local mock admin data when the API is configured. Payloads must not
include session ids, emails, passwords, connection strings or storage endpoints.

Observability and load-test plan: Batch #100 is covered by
`smoke:self-hosted-admin-operations`, `test:admin-operations-frontend`,
`test:admin-audit-frontend`, `smoke:e2e:admin-operations`,
`smoke:e2e:admin-audit-events`, `check:self-hosted-api` and
`check:production-scale-baseline`. Load testing should keep admin operations
traffic separated from buyer catalog traffic because this remains a low-QPS
operator control plane at the 10,000 concurrent-user baseline.

Marker: Batch #100.
Marker: admin operations command center.
Marker: /admin/audit.
Marker: smoke:e2e:admin-audit-events.
Marker: admin_operations_audit_summary=ok.
Marker: admin_operations_readiness=ok.

Batch #101 adds the admin incident response layer. The backend derives incidents
from runtime diagnostics and bounded admin audit reads, then stores only durable
operator acknowledgement state in `yorso_admin_incident_acknowledgements`.
The frontend adds `/admin/incidents` and the command center receives a bounded
incident preview through `GET /v1/admin/operations/overview`.

Runtime endpoints:

- `GET /v1/admin/incidents`;
- `GET /v1/admin/incidents/:incidentId`;
- `POST /v1/admin/incidents/:incidentId/acknowledge`;
- `GET /v1/admin/operations/overview`, with incident summary.

Expected read/write profile: low-frequency admin reads and sparse incident
acknowledgement writes. No buyer catalog or supplier directory hot path depends
on the incident console.

Cache, queue and backpressure strategy: no browser polling. Operators use
explicit refresh and typed filters. Existing API request guardrails, admin
session validation, admin role validation, request timeouts, audit backpressure
and error observability protect the path.

Database indexing and pagination strategy: incident derivation stays bounded by
runtime diagnostic size and audit query limits. Durable acknowledgement state is
indexed by status and actor in `0019_admin_incident_acknowledgements.sql`.

Failure mode and graceful degradation: disabled API, missing self-hosted session,
forbidden role, invalid payload and backend errors render explicit UI/API
responses. The frontend must not fabricate admin incident data when the API is
configured.

Observability and load-test plan: Batch #101 is covered by
`smoke:self-hosted-admin-incidents`, `test:admin-incidents-frontend`,
`smoke:e2e:admin-incidents`, `check:self-hosted-db`,
`check:self-hosted-api` and `check:production-scale-baseline`. Load testing
should treat `/admin/incidents` as a low-QPS control-plane workflow separate
from buyer marketplace traffic at the 10,000 concurrent users baseline.

Marker: Batch #101.
Marker: admin incident response.
Marker: /admin/incidents.
Marker: /v1/admin/incidents.
Marker: smoke:self-hosted-admin-incidents.
Marker: smoke:e2e:admin-incidents.
Marker: admin_incidents_acknowledge=ok.

## Batch #102 Admin Incident Workflow

Batch #102 extends the admin incident response layer from acknowledge/resolve
into a bounded operator workflow. The backend keeps incidents derived from
runtime diagnostics and admin audit summaries, then stores only durable operator
workflow state: assignment, escalation, resolution status and timeline events.
The frontend extends `/admin/incidents` with assignment input, escalation
control, SLA status, due status, timeline preview, operator runbook steps and a
workload summary for assignment coverage, SLA breach rate, source mix and
escalation load.

Runtime endpoints:

- `GET /v1/admin/incidents`;
- `GET /v1/admin/incidents/:incidentId`;
- `POST /v1/admin/incidents/:incidentId/acknowledge`;
- `POST /v1/admin/incidents/:incidentId/workflow`.
- `POST /v1/admin/incidents/workflow/bulk`.
- `GET /v1/admin/incidents/export`.

Expected read/write profile: admin-only, low-QPS control-plane traffic. Reads
remain paginated and bounded, with typed filters for status, severity, source,
assignment state, escalation level and SLA state. Writes are sparse operator
actions: assign, comment, escalate, resolve and bounded bulk workflow updates
for up to 25 incidents per request. Export is sanitized, filter-bound and
limited by the same query caps. No buyer marketplace path reads the incident
workflow tables.

Cache, queue and backpressure strategy: no browser polling and no background
queue in this batch. Operators refresh explicitly. Existing self-hosted admin
session checks, role checks, API guardrails, request timeouts, audit
backpressure, metrics and error telemetry remain active.

Database indexing and pagination strategy: `0020_admin_incident_workflow.sql`
adds `yorso_admin_incident_events` with incident/time, actor/time and type/time
indexes, plus acknowledgement indexes for assignee and escalation. Timeline
reads are limited per incident and never scan raw audit payloads.

Failure mode and graceful degradation: invalid workflow actions return typed
validation errors. Disabled API, missing session, forbidden role and backend
failures still render explicit UI states. The UI displays hashed operator
identifiers only and must not render raw user ids, sessions, email addresses,
connection strings or storage endpoints.

Observability and load-test plan: Batch #102 is covered by
`smoke:self-hosted-admin-incidents`, `test:admin-incidents-frontend`,
`smoke:e2e:admin-incidents`, `test:db-contract`, `test:db-migrations`,
`check:self-hosted-db`, `check:self-hosted-api` and
`check:production-scale-baseline`. Load tests should treat this as a
low-frequency admin control-plane workflow separate from the 10,000 concurrent
buyer/supplier hot path.

Marker: Batch #102.
Marker: admin incident workflow.
Marker: /v1/admin/incidents/:incidentId/workflow.
Marker: /v1/admin/incidents/workflow/bulk.
Marker: /v1/admin/incidents/export.
Marker: yorso_admin_incident_events.
Marker: admin_incidents_assign=ok.
Marker: admin_incidents_escalate=ok.
Marker: admin_incidents_comment=ok.
Marker: admin_incidents_workload_summary=ok.
Marker: admin_incidents_bulk_workflow=ok.
Marker: admin_incidents_export_json=ok.
Marker: admin_incidents_export_csv=ok.
Marker: admin_incidents_workflow_filters=ok.
Marker: admin_incidents_workflow_validation_guard=ok.
Marker: admin_incidents_bulk_workflow_validation_guard=ok.

## Batch #103 Admin Incident Detail Handoff

Batch #103 adds a dedicated admin incident detail, handoff, remediation and postmortem
layer on top of the Batch #101 and Batch #102 incident console. The operator
can open `/admin/incidents/:incidentId`, review the complete sanitized detail
shape, run single-incident workflow actions, export a bounded JSON or Markdown
handoff via `/v1/admin/incidents/:incidentId/handoff` and load a bounded
remediation plan via `/v1/admin/incidents/:incidentId/remediation`. It also
exports a bounded JSON or Markdown postmortem draft via
`/v1/admin/incidents/:incidentId/postmortem` for after-action review. The
detail UI also includes an operator readiness checklist for evidence, runbook,
owner assignment, SLA review and capacity review before shift handoff.

Read profile: low-frequency admin detail reads. Detail, handoff export and
remediation/postmortem plan exports are operator control-plane paths, not buyer
hot paths. Reads remain explicit, bounded by one incident id and derived from
the already bounded runtime diagnostics plus audit event sample.

Write profile: no new write table is introduced. Batch #103 reuses the
Batch #102 workflow endpoints for assignment, escalation, comments and
resolution. Handoff export and remediation plan are read-only operations.
Postmortem export is also read-only.

Cache, queue and backpressure strategy: the browser detail page does not poll.
Operators refresh explicitly. API request guardrails, admin session checks,
role checks, audit logging and existing request/error/metrics observability
remain active. No background queue is required for this control-plane path.

Database indexing and pagination strategy: no new migration is required.
Incident detail and handoff use one incident id and the existing
`yorso_admin_incident_acknowledgements` and `yorso_admin_incident_events`
indexes from Batch #102. List pagination remains in the list endpoint.

Failure mode and graceful degradation: disabled API, missing session,
forbidden role, loading and error states are explicit. The frontend does not
fabricate incident details. Handoff, remediation and postmortem payloads contain hashed
actors only and must not contain raw emails, session ids, passwords, connection
strings or storage endpoints. Operator notes are rejected when they include
raw emails, UUIDs or token-like secret assignments.
The readiness checklist is local derived state, not a new backend source of
truth, so it cannot fabricate a safe handoff when the API detail is missing.

Observability and load-test plan: Batch #103 is covered by
`test:admin-incidents-frontend`, `smoke:self-hosted-admin-incidents`,
`smoke:e2e:admin-incident-detail`, `check:self-hosted-api` and
`check:production-scale-baseline`. Load testing should keep this path in the
admin control-plane profile while buyer catalog/access tests provide the
10,000 concurrent user hot-path pressure.

Marker: Batch #103.
Marker: admin incident detail.
Marker: admin incident detail handoff.
Marker: /v1/admin/incidents/:incidentId/handoff.
Marker: /v1/admin/incidents/:incidentId/remediation.
Marker: /v1/admin/incidents/:incidentId/postmortem.
Marker: /admin/incidents/:incidentId.
Marker: operator readiness.
Marker: admin-incident-detail-readiness.
Marker: admin-incident-readiness-owner.
Marker: smoke:e2e:admin-incident-detail.
Marker: admin_incidents_handoff_json=ok.
Marker: admin_incidents_handoff_markdown=ok.
Marker: admin_incidents_remediation_plan=ok.
Marker: admin_incidents_postmortem_json=ok.
Marker: admin_incidents_postmortem_markdown=ok.
Marker: admin_incidents_note_hygiene_guard=ok.
Marker: 10,000 concurrent.

## Batch #104 Admin Incident Execution Tracker

Batch #104 turns the Batch #103 remediation and postmortem plans into durable,
auditable execution items. Operators can load `/v1/admin/incidents/:incidentId/execution`
from `/admin/incidents/:incidentId`, export the bounded plan through
`/v1/admin/incidents/:incidentId/execution/export?format=json|csv`, start an
item, mark it done with bounded evidence, block it with a bounded reason, or
skip it. The API writes only
per-incident execution state to PostgreSQL through
`yorso_admin_incident_execution_items`; it does not write buyer/supplier hot-path
data and it does not call hosted BaaS services.

Read profile: low-frequency admin control-plane reads. Execution reads are
bounded by one incident id and return at most the derived remediation,
verification, rollback, capacity, postmortem and prevention checklist items for
that incident. JSON and CSV exports reuse the same bounded item set. There is no
browser polling.

Write profile: sparse operator writes. Each execution update is a single
`(incident_id, item_id)` upsert plus one bounded incident timeline event. The
write path requires the self-hosted account session, admin role and typed
contract validation.

Cache, queue and backpressure strategy: no queue is required for this
operator workflow. Operators refresh explicitly. Request timeout, body-size
guardrails, admin audit events, error observability, request observability and
Prometheus metrics remain the backpressure and diagnostics layer.

Database indexing and pagination strategy: `0021_admin_incident_execution.sql`
adds a primary key on `(incident_id, item_id)` and indexes by incident/status,
assignee/status and source/status. This keeps execution dashboards and
single-incident refreshes bounded under the 10,000 concurrent-user production
baseline because marketplace reads never touch the incident execution table.

Failure mode and graceful degradation: missing API, missing session, forbidden
role, unsafe notes and invalid item ids return typed errors. The UI keeps the
execution tracker behind an explicit load action and disables status changes
when evidence or blocked reason is required. Notes reject raw emails, UUIDs and
token-like secrets before they can become execution evidence.

Observability and load-test plan: Batch #104 is covered by
`test:admin-incidents-frontend`, `smoke:self-hosted-admin-incidents`,
`smoke:e2e:admin-incident-detail`, `check:self-hosted-db`,
`check:self-hosted-api` and `check:production-scale-baseline`. Load testing
should model execution as a low-rate admin workflow while buyer catalog,
supplier directory and access-flow tests carry the 10,000 concurrent-user
hot-path load.

Marker: Batch #104.
Marker: admin incident execution.
Marker: /v1/admin/incidents/:incidentId/execution.
Marker: /v1/admin/incidents/:incidentId/execution/export.
Marker: yorso_admin_incident_execution_items.
Marker: admin-incident-detail-execution.
Marker: admin-incident-detail-execution-load.
Marker: admin-incident-detail-execution-json.
Marker: admin-incident-detail-execution-csv.
Marker: admin-incident-detail-execution-plan.
Marker: admin_incidents_execution_plan=ok.
Marker: admin_incidents_execution_export_json=ok.
Marker: admin_incidents_execution_export_csv=ok.
Marker: admin_incidents_execution_start=ok.
Marker: admin_incidents_execution_done=ok.
Marker: admin_incidents_execution_blocked=ok.
Marker: admin_incidents_execution_note_hygiene_guard=ok.
Marker: admin_incidents_execution_missing_item_guard=ok.
Marker: 10,000 concurrent.

## Batch #105 Admin Incident Execution Queue

Batch #105 promotes Batch #104 per-incident execution tracking into an
operator-level execution queue. Operators can inspect execution work across
incidents at `/admin/incident-execution`, call
`GET /v1/admin/incidents/execution-queue`, export the same bounded queue through
`/v1/admin/incidents/execution-queue/export?format=json|csv`, and bulk update
selected execution items through `/v1/admin/incidents/execution-queue/bulk`.
The queue remains a self-hosted PostgreSQL control-plane path and does not add
Supabase, Firebase, Appwrite, Clerk, Auth0 or other hosted BaaS production
dependencies.

Read profile: low-frequency admin reads. The queue is bounded by typed filters,
`limit <= 100`, `offset <= 10,000`, and returns derived execution items from
bounded incident data plus durable execution records. There is no browser
polling.

Write profile: sparse operator bulk writes. Bulk updates are capped by the
contract at 50 `(incidentId, itemId)` refs, require a self-hosted admin session,
and reuse the same note/evidence hygiene rules as single-item execution updates.

Cache, queue and backpressure strategy: no queue worker is required for the
operator UI. Request guardrails, admin role checks, bounded body parsing,
audit events and metrics remain the defensive layer. Operators refresh the queue
explicitly.

Database indexing and pagination strategy: Batch #105 reuses
`yorso_admin_incident_execution_items` indexes from Batch #104:
incident/status, assignee/status and source/status. API pagination prevents
large admin responses, and exports are limited to the current filtered page.

Failure mode and graceful degradation: missing API, missing self-hosted session,
forbidden admin role, unsafe notes and invalid execution refs return typed
errors. The frontend shows disabled/session/forbidden/error states and does not
fabricate execution data.

Observability and load-test plan: Batch #105 is covered by
`test:admin-incidents-frontend`, `smoke:self-hosted-admin-incidents`,
`smoke:e2e:admin-incident-execution-queue`, `check:self-hosted-api` and
`check:production-scale-baseline`. Load testing should keep this as an admin
control-plane workload while catalog, supplier directory and access runtime
flows carry the 10,000 concurrent-user hot path.

Marker: Batch #105.
Marker: admin incident execution queue.
Marker: /admin/incident-execution.
Marker: /v1/admin/incidents/execution-queue.
Marker: /v1/admin/incidents/execution-queue/export.
Marker: /v1/admin/incidents/execution-queue/bulk.
Marker: admin-incident-execution-queue-page.
Marker: admin-incident-execution-filters.
Marker: admin-incident-execution-summary.
Marker: admin-incident-execution-bulk.
Marker: smoke:e2e:admin-incident-execution-queue.
Marker: admin_incidents_execution_queue=ok.
Marker: admin_incidents_execution_queue_filters=ok.
Marker: admin_incidents_execution_queue_export_json=ok.
Marker: admin_incidents_execution_queue_export_csv=ok.
Marker: admin_incidents_execution_queue_bulk=ok.
Marker: admin_incidents_execution_queue_note_hygiene_guard=ok.
Marker: 10,000 concurrent.

## Batch #106 Admin Incident Workload And Correlation

Batch #106 adds the admin incident workload and correlation center for the
self-hosted operator console. It connects `/admin/incident-workload` to
`/v1/admin/incidents/execution-workload`,
`/v1/admin/incidents/execution-workload/export`, and
`/v1/admin/incidents/execution-workload/forecast`, and
`/v1/admin/incidents/:incidentId/correlation`. Operators can see overload,
overdue pressure, blocked execution items, near-term capacity risk and
audit/timeline signals without opening every incident detail page.

Expected read/write profile:

- Read-heavy admin control-plane path.
- One explicit page load or refresh per operator action; no automatic polling.
- No new writes. Mutations stay in existing incident workflow and execution
  item endpoints.
- JSON and CSV exports use the same bounded workload query schema.
- Forecast reads are explicit operator actions and use bounded `horizonHours`
  and `limit` values.

Cache, queue and backpressure strategy:

- No browser polling and no unbounded export job.
- API responses are derived from existing bounded incident/execution records.
- If this becomes a high-frequency NOC dashboard, the next production step is a
  Redis-backed short TTL snapshot keyed by filter hash.

Database indexing and pagination strategy:

- Migration `0022_admin_incident_workload_correlation` adds execution status,
  owner, source and incident/source/status indexes.
- The same migration adds recent incident event indexes for timeline
  correlation.
- Workload keeps `limit` and `offset`; correlation keeps bounded `limit`.
- Forecast uses the same bounded workload inputs plus `horizonHours`, capped by
  the contract, and does not scan marketplace traffic tables.

Failure mode and graceful degradation:

- Missing self-hosted API URL renders disabled state.
- Missing session renders session-required state.
- Non-admin session renders forbidden state.
- API errors show bounded page-level errors, not raw server internals.

Observability and load-test plan:

- Route actions are audited as `admin.incidents.execution_workload.read`,
  `admin.incidents.execution_workload.export`, and
  `admin.incidents.correlation.read`.
- Capacity forecasts are audited as
  `admin.incidents.execution_workload.forecast`.
- Existing request, error and Prometheus metrics cover route and status class.
- Load test should simulate 100 operators over 10,000 concurrent marketplace
  users: 1 workload refresh per 30 seconds, 1 correlation read per minute, and
  1 bounded export per 10 minutes.

Validation:

- `test:admin-incidents-frontend`;
- `smoke:self-hosted-admin-incidents`;
- `smoke:e2e:admin-incident-workload`;
- `check:self-hosted-api`;
- `check:self-hosted-db`;
- `check:production-scale-baseline`.

Marker: Batch #106.
Marker: admin incident workload.
Marker: /admin/incident-workload.
Marker: /v1/admin/incidents/execution-workload.
Marker: /v1/admin/incidents/execution-workload/export.
Marker: /v1/admin/incidents/execution-workload/forecast.
Marker: /v1/admin/incidents/:incidentId/correlation.
Marker: admin-incident-workload-page.
Marker: admin-incident-workload-correlation.
Marker: admin-incident-workload-forecast-summary.
Marker: smoke:e2e:admin-incident-workload.
Marker: admin_incidents_workload=ok.
Marker: admin_incidents_workload_export_json=ok.
Marker: admin_incidents_workload_export_csv=ok.
Marker: admin_incidents_workload_forecast=ok.
Marker: admin_incidents_correlation=ok.
Marker: 0022_admin_incident_workload_correlation.
Marker: 10,000 concurrent.

## Batch #107 Admin Incident Trend Analytics

Batch #107 adds the admin incident trend analytics surface for the self-hosted
operator console. It connects `/admin/incident-trends` to
`/v1/admin/incidents/trends`, `/v1/admin/incidents/trends/export`,
`/v1/admin/incidents/trends/anomalies`, and
`/v1/admin/incidents/trends/briefing`. Operators can review bucketed trend
pressure, source/status/severity mix, route risk, SLA posture, anomaly signals,
and a shift briefing without opening every incident individually.

Expected read/write profile:

- Read-heavy admin control-plane path.
- One explicit refresh per operator action; no browser polling.
- JSON and CSV exports are explicit, bounded and audit-covered.
- Anomaly and briefing reads are explicit operator actions.
- No new writes in the trend path. Mutations remain in incident workflow,
  execution, queue and acknowledgement routes.

Cache, queue and backpressure strategy:

- No automatic polling in Batch #107.
- Query shape is bounded by window, granularity and limit.
- CSV export is a bounded bucket export, not a raw table dump.
- If this becomes a live dashboard, add Redis TTL snapshots by sanitized query
  hash before increasing refresh frequency.
- Existing request guardrails and admin auth boundaries remain active.

Database indexing and pagination strategy:

- Migration `0023_admin_incident_trend_analytics` adds incident event time/type,
  incident event drill-down, acknowledgement status/escalation, execution
  status/source and execution priority indexes.
- Bucket count is bounded by contract.
- Route risk rows are bounded by contract.
- Trend export uses the same bounded source as the page response.

Failure mode and graceful degradation:

- Missing self-hosted API URL renders disabled state.
- Missing session renders session-required state.
- Non-admin session renders forbidden state.
- API errors render a bounded page error.
- Export errors render bounded export status.
- Operators can still use incident list, detail, execution, queue and workload
  views if trend analytics is unavailable.

Observability and load-test plan:

- Route actions are audited as `admin.incidents.trends.read`,
  `admin.incidents.trends.export`, `admin.incidents.trends.anomalies`, and
  `admin.incidents.trends.briefing`.
- Existing request, error and Prometheus metrics cover route and status class.
- Load test should simulate 100 operators over 10,000 concurrent marketplace
  users: one trend refresh per 30 seconds, one anomaly read per two minutes,
  one briefing read per five minutes, and one bounded export per 10 minutes.

Validation:

- `test:admin-incidents-frontend`;
- `test:backend-contract`;
- `smoke:self-hosted-admin-incidents`;
- `smoke:e2e:admin-incident-trends`;
- `check:self-hosted-api`;
- `check:self-hosted-db`;
- `check:production-scale-baseline`.

Marker: Batch #107.
Marker: admin incident trend analytics.
Marker: /admin/incident-trends.
Marker: /v1/admin/incidents/trends.
Marker: /v1/admin/incidents/trends/export.
Marker: /v1/admin/incidents/trends/anomalies.
Marker: /v1/admin/incidents/trends/briefing.
Marker: admin-incident-trends-page.
Marker: admin-incident-trends-buckets.
Marker: smoke:e2e:admin-incident-trends.
Marker: admin_incidents_trends=ok.
Marker: admin_incidents_trends_export_json=ok.
Marker: admin_incidents_trends_export_csv=ok.
Marker: admin_incidents_trends_anomalies=ok.
Marker: admin_incidents_trends_briefing=ok.
Marker: 0023_admin_incident_trend_analytics.
Marker: 10,000 concurrent.

## Batch #108 Admin Incident Trend Actions

Batch #108 extends trend analytics with a bounded operator action loop.
Trend buckets, route risk and anomalies remain read models; trend actions are
derived proposals that require an explicit admin decision before durable state
changes.

Expected read/write profile:

- `GET /v1/admin/incidents/trends/actions` is an admin control-plane read.
- `POST /v1/admin/incidents/trends/actions/:actionId/decision` is an explicit
  admin write.
- Accepted decisions write one durable trend action row and update a bounded
  set of related incident workflow records.
- Dismissed decisions write one durable trend action row and do not mutate
  incident workflow.

Cache, queue and backpressure strategy:

- No polling is introduced.
- Action reads are bounded by trend query `window`, `granularity` and `limit`.
- Action count is capped at 25.
- Related incident IDs are capped at 25.
- Existing request guardrails, admin auth, audit, error and metrics pipelines
  apply to both action endpoints.

Database indexing and pagination strategy:

- Migration `0024_admin_incident_trend_actions` stores durable decisions in
  `yorso_admin_incident_trend_actions`.
- `idx_yorso_admin_trend_actions_status_updated` supports recent decision
  review.
- `idx_yorso_admin_trend_actions_kind_priority` supports action queue slicing.
- `idx_yorso_admin_trend_actions_route` supports route-risk decisions.
- `idx_yorso_admin_trend_actions_related_gin` supports incident drill-down.

Failure mode and graceful degradation:

- If action derivation fails, trend analytics still remains usable.
- If a decision write fails, UI keeps the proposal state and exposes retry.
- Decision notes use the existing hygiene guard and must not contain raw
  emails, UUIDs, session IDs, tokens or secrets.
- Dismiss decisions are safe no-op workflow changes.

Observability and load-test plan:

- Route actions are audited as `admin.incidents.trends.actions.read` and
  `admin.incidents.trends.actions.decision`.
- Load test should simulate 50 concurrent admin action reads and 20 concurrent
  accept/dismiss decisions while public catalog and supplier directory traffic
  stays at the 10,000 concurrent-user baseline.
- Verify p95 action read latency, decision write contention, timeline event
  creation and no regression on marketplace hot-path endpoints.

Validation:

- `test:admin-incidents-frontend`;
- `test:api`;
- `test:backend-contract`;
- `check:self-hosted-db`;
- `check:self-hosted-api`;
- `smoke:self-hosted-admin-incidents`;
- `smoke:e2e:admin-incident-trends`.

Marker: Batch #108.
Marker: admin incident trend actions.
Marker: trend action loop.
Marker: /v1/admin/incidents/trends/actions.
Marker: /v1/admin/incidents/trends/actions/:actionId/decision.
Marker: admin-incident-trends-actions.
Marker: admin_incidents_trend_actions=ok.
Marker: admin_incidents_trend_action_accept=ok.
Marker: admin_incidents_trend_action_dismiss=ok.
Marker: admin_incidents_trend_action_validation_guard=ok.
Marker: 0024_admin_incident_trend_actions.
Marker: 10,000 concurrent users.

## Batch #109 Admin Incident Trend Action Queue

Batch #109 moves trend action handling from a single inline panel into a
dedicated admin queue. It keeps Batch #108 action decisions, then adds
queue-level filters, bounded exports, bulk decisions and browser coverage for
`/admin/incident-trend-actions`.

Expected read/write profile:

- `GET /v1/admin/incidents/trend-action-queue` is an admin control-plane read.
- `GET /v1/admin/incidents/trend-action-queue/export?format=json|csv` is a
  bounded admin export.
- `POST /v1/admin/incidents/trend-action-queue/bulk` is an explicit admin
  write capped at 25 action IDs per request.
- Public marketplace hot paths are not called by this UI and receive no new
  polling pressure.

Cache, queue and backpressure strategy:

- No browser polling is introduced.
- Queue reads are bounded by `window`, `limit`, `offset`, decision, kind,
  priority and owner-role filters.
- Bulk writes reuse existing request guardrails, admin auth, audit, metrics
  and error observability.
- Unsafe notes are rejected before persistence.

Database indexing and pagination strategy:

- Migration `0025_admin_incident_trend_action_queue` adds queue indexes on the
  existing `yorso_admin_incident_trend_actions` table.
- `idx_yorso_admin_trend_actions_owner_priority` supports owner/priority queue
  reads.
- `idx_yorso_admin_trend_actions_status_kind_priority` supports decision,
  kind and priority filters.
- `idx_yorso_admin_trend_actions_decider_updated` supports operator decision
  review.

Failure mode and graceful degradation:

- Missing API renders a disabled state.
- Missing session renders a self-hosted session-required state.
- Non-admin sessions render forbidden state.
- Export and bulk failures leave previous queue data visible and retryable.

Observability and load-test plan:

- Queue reads are audited as `admin.incidents.trend_action_queue.read`.
- Queue exports are audited as `admin.incidents.trend_action_queue.export`.
- Bulk decisions are audited as
  `admin.incidents.trend_action_queue.bulk_decision`.
- Load test should simulate 50 concurrent queue reads, 20 concurrent bulk
  decisions and simultaneous 10,000 concurrent public marketplace users.

Validation:

- `test:admin-incidents-frontend`;
- `test:api`;
- `smoke:self-hosted-admin-incidents`;
- `smoke:e2e:admin-incident-trend-actions`;
- `check:self-hosted-api`;
- `check:self-hosted-db`;
- `check:production-scale-baseline`.

Marker: Batch #109.
Marker: admin incident trend action queue.
Marker: /admin/incident-trend-actions.
Marker: /v1/admin/incidents/trend-action-queue.
Marker: /v1/admin/incidents/trend-action-queue/export.
Marker: /v1/admin/incidents/trend-action-queue/bulk.
Marker: admin-incident-trend-actions-page.
Marker: smoke:e2e:admin-incident-trend-actions.
Marker: admin_incidents_trend_action_queue=ok.
Marker: admin_incidents_trend_action_queue_export_json=ok.
Marker: admin_incidents_trend_action_queue_export_csv=ok.
Marker: admin_incidents_trend_action_queue_bulk=ok.
Marker: 0025_admin_incident_trend_action_queue.
Marker: 10,000 concurrent users.

## Batch #112 Frontend Route Code Splitting

Batch #112 reduces the production frontend entry chunk by lazy-loading route
pages from the router shell and splitting the local translation table into a
named `i18n-translations` chunk. It does not change backend APIs,
persistence, queues or supplier access policy.

Expected read/write profile:

- No new backend reads or writes are introduced.
- Public route navigation now downloads the route chunk needed for the current
  page instead of loading every page component in the initial entry chunk.
- Admin/account route chunks are fetched only when the operator or account
  route is visited.
- The local `src/i18n/translations.ts` table is loaded as a named chunk and
  can be cached independently by the browser/CDN.

Cache, queue and backpressure strategy:

- Hashed Vite assets remain browser/CDN cacheable.
- No polling, queue work or background API traffic is added.
- Manual third-party vendor chunks are intentionally avoided because production
  preview exposed React/vendor circular runtime errors during Batch #112
  validation.
- The fallback is a lightweight skeleton, so route transitions do not add
  backend pressure while chunks load.

Database indexing and pagination strategy:

- Unchanged. This batch is frontend bundle structure only.
- Existing supplier directory, offer catalog, account and admin pagination
  rules remain the bounded read strategy for the 10,000 concurrent-user target.

Failure mode and graceful degradation:

- If a lazy route chunk loads normally, the route renders without changing the
  page contract.
- If a chunk download fails, the app currently relies on default browser/React
  error behavior. A custom route chunk error boundary with retry is a follow-up
  hardening item, not included in Batch #112.
- Existing disabled/session/forbidden states on admin and account pages are
  unchanged.

Observability and load-test plan:

- Track production RUM for route chunk load failures, route transition latency,
  first contentful paint and interaction latency on `/`, `/offers`,
  `/suppliers`, `/how-it-works` and `/for-suppliers`.
- CDN logs should confirm high cache-hit ratios for hashed route chunks and the
  `i18n-translations` chunk under repeat traffic.
- Load tests remain focused on backend hot paths; this batch should reduce
  frontend transfer pressure without changing API request volume.

Validation:

- `npx vitest run src/test/app-route-code-splitting.test.ts`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run build`;
- `E2E_BASE_URL=http://127.0.0.1:4182 npx playwright test e2e/smoke-core.spec.ts e2e/suppliers-no-horizontal-overflow-375.spec.ts --project=chromium`.

Measured production build after Batch #112:

- Previous single entry chunk before route splitting: about `2.69 MB`
  minified and `734 kB` gzip.
- Current entry chunk: `352.18 kB` minified and `112.99 kB` gzip.
- Current `i18n-translations` chunk: `311.45 kB` minified and `98.15 kB`
  gzip.
- Previous Vite large-chunk warning is gone.

Marker: Batch #112.
Marker: frontend route code splitting.
Marker: i18n-translations.
Marker: app route code splitting.
Marker: 10,000 concurrent users.

## Batch #113 Route Chunk Error Boundary

Batch #113 adds a route-level error boundary around the lazy routes introduced
in Batch #112. If a lazy route render or route chunk load fails, buyers and
operators see a clear recovery state instead of a blank screen or default
React runtime failure.

Expected read/write profile:

- No backend reads or writes are introduced.
- The fallback state is rendered fully in the browser.
- Reload uses the current browser location and does not add polling, queue work
  or background API traffic.
- Go-back uses browser history and does not write application state.

Cache, queue and backpressure strategy:

- Hashed Vite route chunks and the `i18n-translations` chunk remain
  browser/CDN cacheable.
- A failed route chunk download is handled as a user-visible recovery path,
  not retried in a loop.
- No queues, timers or repeated fetch retries are introduced.

Database indexing and pagination strategy:

- Unchanged. This batch only changes route-shell failure handling.
- Existing catalog, supplier, account and admin pagination/indexing strategies
  remain the bounded read plan for the 10,000 concurrent-user target.

Failure mode and graceful degradation:

- Normal route loads are unchanged.
- If a lazy route fails, `RouteChunkErrorBoundary` shows a concise reload
  action and a go-back action.
- The fallback copy states that the screen itself does not change the YORSO
  session, access requests or workspace data.
- Existing page-level disabled/session/forbidden/error states remain inside
  their routes and still render when route code loads successfully.

Observability and load-test plan:

- Track route error-boundary impressions, reload clicks and route chunk load
  failures in production RUM when telemetry is available.
- CDN logs should be checked for route chunk `404`, `5xx` and cache-miss
  spikes after deploys.
- Synthetic browser checks should continue to cover `/`, `/offers`,
  `/suppliers`, `/blog`, `/for-suppliers` and `/account/personal`.

Validation:

- `npx vitest run src/components/routing/RouteChunkErrorBoundary.test.tsx src/test/app-route-code-splitting.test.ts`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`;
- production preview browser smoke for `e2e/smoke-core.spec.ts` and
  `e2e/suppliers-no-horizontal-overflow-375.spec.ts`.

Marker: Batch #113.
Marker: route chunk error boundary.
Marker: RouteChunkErrorBoundary.
Marker: route-chunk-error.
Marker: 10,000 concurrent users.

## Batch #114 Font Loading Cleanup

Batch #114 moves Google Fonts loading out of `src/index.css` and into early
document-head links. The visual contract is unchanged: body copy still uses
Inter and headings still use Plus Jakarta Sans. The change removes blocking
CSS `@import` discovery and lets the browser preconnect to the font origins
before the main stylesheet is parsed.

Expected read/write profile:

- No backend reads or writes are introduced.
- The browser makes the same font stylesheet request, but discovers it from
  `index.html` instead of from a nested CSS import.
- No application data, buyer session, supplier access state or admin runtime
  state is read or written.

Cache, queue and backpressure strategy:

- Google Fonts CSS remains browser/CDN cacheable.
- `fonts.gstatic.com` font binaries remain browser/CDN cacheable.
- `preconnect` reduces connection setup delay for cold sessions without adding
  polling, queues, timers or repeated retries.

Database indexing and pagination strategy:

- Unchanged. This batch only changes static document and CSS loading.
- Existing supplier, offer, account and admin bounded read strategies remain
  the 10,000 concurrent-user database plan.

Failure mode and graceful degradation:

- If Google Fonts are delayed or unavailable, the existing fallback stack
  still uses `system-ui, sans-serif`.
- The page remains readable before webfonts finish loading because the request
  uses `display=swap`.
- Public routes, SEO metadata, mobile overflow fixes, lazy route splitting and
  the Batch #113 route error boundary are unchanged.

Observability and load-test plan:

- Synthetic browser checks should confirm the five public buyer routes still
  render with no horizontal overflow.
- Production RUM should monitor first contentful paint, layout shift and font
  request error rates after deployment.
- CDN/browser waterfall checks should confirm there is no CSS `@import` font
  request chain.

Validation:

- `npx vitest run src/test/font-loading.test.ts`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`;
- production preview browser smoke for `e2e/smoke-core.spec.ts` and
  `e2e/suppliers-no-horizontal-overflow-375.spec.ts`.

Marker: Batch #114.
Marker: font loading cleanup.
Marker: Google Fonts preconnect.
Marker: no CSS font import.
Marker: 10,000 concurrent users.

## Batch #115 Catalog Locale Hardening

Batch #115 fixes English catalog runtime copy that was still rendered from
legacy Russian literals in locked offer cards. The buyer-facing `/offers`
page now displays the redacted price label, analytics trigger, title, aria
label and screen-reader hint from the active locale. The change is UI copy
normalization only: it does not change price access rules, supplier identity
redaction, offer data, routes, backend APIs or the Batch #112/#113 route shell.

Expected read/write profile:

- No backend reads or writes are introduced.
- Catalog API and fallback reads stay unchanged.
- No buyer session, supplier access request, saved offer or admin state is
  written by this change.

Cache, queue and backpressure strategy:

- Existing route chunks and the `i18n-translations` chunk remain browser/CDN
  cacheable.
- No queues, polling loops, retries or background jobs are introduced.
- Locale strings are resolved client-side from the existing translation table.

Database indexing and pagination strategy:

- Unchanged. This batch only changes display labels in existing catalog
  components.
- Existing offer/supplier pagination, access gating and database indexes
  remain the 10,000 concurrent-user plan.

Failure mode and graceful degradation:

- If a legacy redacted price label is returned by fallback data, the UI maps it
  to the active locale's locked-price label.
- Unknown non-redacted price labels still render as received.
- Screen-reader copy for the analytics toggle stays tied to the same
  `aria-controls`, `aria-expanded`, `aria-describedby` and region contracts.

Observability and load-test plan:

- Synthetic checks should confirm `/offers` in English no longer exposes
  Russian locked-price or analytics toggle text.
- Existing catalog interaction telemetry can continue to track analytics panel
  opens; event names and selectors are unchanged.
- Browser smoke should continue to include mobile overflow checks for
  `/offers` and `/suppliers`.

Validation:

- `npx vitest run src/lib/catalog-display-labels.test.ts src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/catalog/CatalogOfferRow.analyticsA11y.test.tsx src/components/catalog/MobileOfferCard.analyticsToggle.test.tsx`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- production preview browser check for `/offers` desktop and mobile.

Marker: Batch #115.
Marker: catalog locale hardening.
Marker: locked price active locale.
Marker: analytics trigger active locale.
Marker: 10,000 concurrent users.

## Batch #116 Offers Proof Anchor Fallback

Batch #116 hardens the `/offers` trust proof strip so proof buttons always
move buyers to visible evidence. The `Procurement intelligence` proof still
targets the desktop intelligence panel when it is visible, but falls back to
the offer-results evidence on mobile where that desktop panel is intentionally
hidden. The `Document readiness` proof now lands on offer cards where document
status is visible instead of the procurement filter bar.

Expected read/write profile:

- No backend reads or writes are introduced.
- Catalog API/fallback reads, buyer session state and access-gating state are
  unchanged.
- The only runtime change is a client-side `scrollIntoView` target selection
  after a proof-strip click.

Cache, queue and backpressure strategy:

- Existing route chunks and the `i18n-translations` chunk remain
  browser/CDN cacheable.
- No queues, polling, retries, timers or background jobs are introduced.
- The fallback anchor is resolved synchronously from the current DOM.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch offer reads, supplier reads,
  pagination, search, filters or database indexes.
- Existing offer/supplier bounded read strategies remain the 10,000
  concurrent-user plan.

Failure mode and graceful degradation:

- If the primary proof target is visible, the existing target is used.
- If the primary target is hidden or not measurable, the UI falls back to a
  visible offer-results anchor when configured.
- If neither target exists, behavior degrades to the original anchor lookup
  without changing access state, supplier identity redaction or catalog data.

Observability and load-test plan:

- Existing `catalog_trust_proof_click` telemetry continues to fire with the
  resolved anchor id.
- Synthetic mobile checks should click the proof-strip intelligence and
  document-readiness buttons and assert the first offer card is in view.
- Public route checks should continue to verify `/offers` has no horizontal
  overflow at mobile widths.

Validation:

- `npx vitest run src/components/catalog/TrustProofStrip.test.tsx`;
- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/offers-trust-proof-anchors.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #116.
Marker: offers proof anchor fallback.
Marker: catalog trust proof strip.
Marker: mobile visible evidence.
Marker: 10,000 concurrent users.

## Batch #117 Offers Request Anchor

Batch #117 restores the cross-route request-access landing contract between
`/how-it-works` and `/offers`. Buyer CTAs that promise supplier access now
preserve `#request`, and `/offers` exposes a stable request anchor around the
existing access/value strip. The catalog URL normalization now preserves the
active hash when filters, sort, rows or page state rewrite search params.

Expected read/write profile:

- No backend reads or writes are introduced.
- Catalog reads, fallback data, buyer sessions, access requests and supplier
  identity redaction are unchanged.
- The only runtime changes are client-side URL hash preservation and a
  `scrollIntoView` pass for hash anchors after the catalog renders.

Cache, queue and backpressure strategy:

- Existing route chunks and the `i18n-translations` chunk remain
  browser/CDN cacheable.
- No queues, polling, retries, timers or background jobs are introduced.
- Hash scrolling is synchronous browser/client behavior and does not increase
  network load at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch offer reads, supplier reads,
  pagination, search, filters or database indexes.
- Existing offer/supplier bounded read strategies remain the 10,000
  concurrent-user plan.

Failure mode and graceful degradation:

- If a supported hash target exists, `/offers` scrolls it into view after
  render.
- If the target does not exist, the page remains on the normal catalog view.
- Search-param normalization preserves the current hash; if no hash exists,
  existing catalog URL behavior is unchanged.
- Access gating, price locks and supplier identity redaction remain the same.

Observability and load-test plan:

- Browser smoke should verify `/how-it-works` request-access CTAs land on
  `/offers#request` and the access/value strip is visible.
- Browser smoke should verify direct `/offers#request` entry preserves the
  hash through catalog URL normalization.
- Existing public route checks should continue to verify `/offers` and
  `/how-it-works` have no horizontal overflow at mobile widths.

Validation:

- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/how-it-works-request-anchor.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #117.
Marker: offers request anchor.
Marker: how-it-works request CTA.
Marker: hash preservation.
Marker: 10,000 concurrent users.

## Batch #118 For-Suppliers CTA Semantics

Batch #118 fixes invalid nested interactive markup on `/for-suppliers`.
Supplier-facing hero and final CTAs now use the existing `Button asChild`
pattern instead of rendering `Link` elements around `Button` elements. The
visual hierarchy, destinations, analytics events and public route shell stay
unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier-facing page content, SEO metadata, route loading, registration
  flow destinations and offer catalog reads remain unchanged.
- The only runtime change is client-side DOM semantics for CTA links.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter request volume at the 10,000 concurrent-user
  target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, catalog
  pagination, supplier reads or account persistence.

Failure mode and graceful degradation:

- CTAs remain normal links to `/register` and `/offers`.
- If JavaScript hydration is delayed, anchor semantics still expose direct
  destinations.
- Analytics click handlers remain best-effort and do not block navigation.

Observability and load-test plan:

- Regression coverage should assert `/for-suppliers` has no nested
  interactive CTA markup.
- Browser smoke verifies the supplier register and buyer request CTAs remain
  visible on mobile and the page has no horizontal overflow.
- Existing public route checks should continue to verify no horizontal
  overflow at mobile widths.

Validation:

- `npx vitest run src/pages/ForSuppliers.test.tsx`;
- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/for-suppliers-cta-semantics.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #118.
Marker: for-suppliers CTA semantics.
Marker: nested interactive markup.
Marker: 10,000 concurrent users.

## Batch #119 Offers CTA Semantics

Batch #119 fixes invalid nested interactive markup on `/offers`. Locked-buyer
account and related-request CTAs now use the existing `Button asChild` pattern
instead of rendering `Link` elements around `Button` elements. Catalog copy,
visual hierarchy, destinations, access gating, supplier redaction, price locks,
sorting, filtering and pagination stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Offer catalog reads, fallback data, buyer sessions, access requests, access
  levels and supplier identity redaction are unchanged.
- The only runtime change is client-side DOM semantics for locked-buyer CTA
  links.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter request volume at the 10,000 concurrent-user
  target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, catalog
  pagination, supplier reads, offer reads or account persistence.
- Existing bounded catalog pagination remains the 10,000 concurrent-user plan.

Failure mode and graceful degradation:

- Locked-buyer CTAs remain normal links to `/register`.
- If JavaScript hydration is delayed, anchor semantics still expose direct
  destinations.
- Access gating remains fail-closed: exact prices and supplier identities stay
  locked until the buyer is qualified.

Observability and load-test plan:

- Regression coverage should assert `/offers` has no nested interactive CTA
  markup.
- Browser smoke verifies the locked account CTA and related-request CTAs remain
  visible as links on mobile.
- Existing catalog smoke continues to verify URL-backed sort, pagination,
  private supplier search gating and mobile overflow.

Validation:

- `npx vitest run src/pages/Offers.catalogPaging.test.tsx`;
- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/offers-cta-semantics.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #119.
Marker: offers CTA semantics.
Marker: catalog nested interactive markup.
Marker: 10,000 concurrent users.

## Batch #120 Auth CTA Semantics

Batch #120 fixes invalid nested interactive markup on the public auth routes.
The `/signin` home back-link and `/reset-password` sign-in back-link now use
the existing `Button asChild` pattern instead of rendering `Link` elements
around `Button` elements. Auth copy, form behavior, redirect behavior,
self-hosted API integration, Supabase prototype recovery behavior, route shell
and visual styling stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Sign-in submissions, password-reset requests, password update requests,
  buyer session storage and downstream catalog session headers are unchanged.
- The only runtime change is client-side DOM semantics for auth back-link CTAs.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter auth request volume at the 10,000 concurrent-user
  target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, auth
  persistence, catalog pagination, offer reads or account persistence.

Failure mode and graceful degradation:

- Auth back CTAs remain normal links to `/` and `/signin`.
- If JavaScript hydration is delayed, anchor semantics still expose direct
  destinations.
- Sign-in and password-reset submit buttons remain real buttons with the
  existing submit handlers.

Observability and load-test plan:

- Regression coverage should assert auth routes have no nested interactive CTA
  markup.
- Browser smoke verifies `/signin` and `/reset-password` back CTAs remain
  visible as links on mobile.
- Existing auth smoke continues to verify self-hosted sign-in session storage
  and downstream session headers.

Validation:

- `npx vitest run src/pages/AuthCtaSemantics.test.tsx`;
- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/auth-cta-semantics.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #120.
Marker: auth CTA semantics.
Marker: auth nested interactive markup.
Marker: 10,000 concurrent users.

## Batch #121 Offer Detail CTA Semantics

Batch #121 fixes invalid nested interactive markup on `/offers/:id`. The offer
detail error, not-found, locked access and sticky mobile CTAs now use the
existing `Button asChild` pattern instead of rendering `Link` or hash-anchor
elements around `Button` elements. Offer detail copy, visual hierarchy, access
gating, supplier identity redaction, exact-price locking, return-to-catalog
behavior and access-request behavior stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Offer detail reads, fallback data, buyer sessions, supplier access requests,
  access level resolution and supplier identity redaction are unchanged.
- The only runtime change is client-side DOM semantics for offer detail CTA
  links and hash anchors.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter offer detail request volume at the 10,000
  concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, catalog
  pagination, offer detail lookups, supplier reads or account persistence.
- Existing bounded catalog pagination and detail lookup plans remain the
  10,000 concurrent-user strategy.

Failure mode and graceful degradation:

- Offer detail CTAs remain normal links to `/register`, `/offers` or
  `#offer-supplier-access`.
- If JavaScript hydration is delayed, anchor semantics still expose direct
  destinations.
- Access gating remains fail-closed: exact prices and supplier identities stay
  locked until the buyer is qualified.

Observability and load-test plan:

- Regression coverage should assert `/offers/:id` has no nested interactive
  CTA markup across anonymous, registered-locked and unknown-offer states.
- Browser smoke verifies mobile offer detail CTAs remain visible as links and
  do not create horizontal overflow.
- Existing offer detail smoke continues to verify supplier identity redaction,
  approval refresh behavior and unlocked commercial controls.

Validation:

- `E2E_BASE_URL=http://127.0.0.1:<port> npx playwright test e2e/offer-detail-cta-semantics.spec.ts --project=chromium`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #121.
Marker: offer detail CTA semantics.
Marker: offer detail nested interactive markup.
Marker: 10,000 concurrent users.

## Batch #122 Public CTA Semantics

Batch #122 fixes invalid nested interactive markup on the homepage and shared
info/legal pages. The homepage `View all offers` CTA now uses the existing
`Button asChild` pattern, landing offer certification chips render as static
proof chips inside card links, and the shared `InfoPageLayout` back CTA uses a
single semantic link. Buyer-first copy, offer-card destinations, information
page content, route shell, SEO behavior and visual styling stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Homepage offer reads, mock fallback behavior, analytics calls, route-owned SEO
  effects and information page rendering are unchanged.
- The only runtime change is client-side DOM semantics for landing and
  info/legal CTA targets.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter homepage or information page traffic volume at the
  10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, catalog
  pagination, offer reads, supplier reads or account persistence.
- Existing bounded catalog and public-route loading plans remain the
  10,000 concurrent-user strategy.

Failure mode and graceful degradation:

- Homepage offer cards remain normal links to offer detail pages.
- The homepage `View all offers` CTA remains a normal link to `/offers`.
- Shared information page back CTAs remain normal links to `/`.
- Static certification chips keep the proof signal without creating child
  buttons inside parent links.

Observability and load-test plan:

- Regression coverage should assert homepage and shared info/legal routes have
  no nested interactive CTA markup.
- Browser smoke verifies homepage mobile/desktop and all shared info/legal
  routes keep zero nested controls and zero horizontal overflow.
- Existing public route smoke continues to verify route rendering, SEO,
  buyer-first narrative, supplier identity redaction and access gating.

Validation:

- `npx vitest run src/pages/PublicCtaSemantics.test.tsx`;
- `npm run smoke:e2e:public-cta-semantics`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #122.
Marker: public CTA semantics.
Marker: homepage info page nested interactive markup.
Marker: 10,000 concurrent users.

## Batch #123 Public Input Accessibility

Batch #123 fixes unnamed visible input controls on the homepage and public
sign-in route. The homepage offer search now has a programmatic label, and the
sign-in email, phone, password and forgot-password email fields are connected
to their visible labels. Country phone inputs also expose named country and
country-search controls. Visual layout, copy, routes, auth behavior,
buyer-session behavior and analytics stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Homepage search navigation, sign-in submissions, phone sign-in behavior,
  password-reset requests, buyer sessions and auth runtime selection are
  unchanged.
- The only runtime change is client-side accessibility semantics for existing
  public input controls.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter homepage search or auth request volume at the
  10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, catalog
  pagination, offer reads, auth persistence or account persistence.
- Existing bounded catalog search and self-hosted auth plans remain the
  10,000 concurrent-user strategy.

Failure mode and graceful degradation:

- Homepage search remains a normal form that routes to `/offers` or
  `/offers?q=...`.
- Sign-in and forgot-password fields remain normal inputs with the same
  submit handlers and required validation.
- If JavaScript hydration is delayed, labels still describe the static input
  fields in the rendered document.

Observability and load-test plan:

- Regression coverage should assert homepage and public sign-in fields are
  reachable by accessible label.
- Browser smoke verifies `/` and `/signin` have no visible unnamed controls in
  the checked mobile states and no horizontal overflow.
- Existing auth and public route smoke continues to verify routing, access
  gating, supplier redaction, price locks and route chunk recovery.

Validation:

- `npx vitest run src/pages/PublicInputA11y.test.tsx`;
- `npm run smoke:e2e:public-input-a11y`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #123.
Marker: public input accessibility.
Marker: homepage sign-in unnamed inputs.
Marker: 10,000 concurrent users.

## Batch #124 Public Heading Structure

Batch #124 fixes public-route heading outline regressions found in runtime
audit after Batch #123. Footer column labels are treated as navigation labels
instead of page headings, and the supplier directory results list now sits under
a real, screen-reader-visible H2. Visual layout, copy, routes, access gating,
supplier identity redaction, price locks, auth behavior and analytics stay
unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier directory reads, catalog reads, sign-in behavior, homepage search
  and information page rendering are unchanged.
- The only runtime change is client-side semantic structure for existing public
  route markup.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter public-route or supplier-directory request volume
  at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, supplier
  pagination, supplier API queries, offer reads, auth persistence or account
  persistence.
- Existing bounded supplier-directory pagination remains the 10,000
  concurrent-user strategy.

Failure mode and graceful degradation:

- Footer links remain normal links grouped by navigation labels.
- Supplier rows remain the same selectable rows and supplier-profile links.
- If JavaScript hydration is delayed, the static document still exposes a
  sequential heading outline for public routes.

Observability and load-test plan:

- Regression coverage should assert public routes do not skip heading levels.
- Browser smoke verifies the footer does not contribute page headings and
  `/suppliers` exposes the supplier result cards under the results H2.
- Existing public route smoke continues to verify route rendering, mobile
  overflow, access gating, supplier redaction, price locks and route chunk
  recovery.

Validation:

- `npx vitest run src/components/landing/Footer.test.tsx src/pages/Suppliers.test.tsx`;
- `npm run smoke:e2e:public-heading-structure`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #124.
Marker: public heading structure.
Marker: footer supplier directory heading outline.
Marker: 10,000 concurrent users.

## Batch #125 Public Landmark Labels

Batch #125 fixes unnamed public navigation and supporting-aside landmarks found
in runtime audit after Batch #124. The shared header now names desktop and
mobile navigation, `/how-it-works` names supplier-supporting asides through
their headings, and `/blog` plus `/blog/:slug` name their insight/article
support rails. Visual layout, copy, routes, search/filter behavior, article
links, supplier access rules, supplier identity redaction, price locks, auth
behavior and analytics stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Header navigation, blog filtering, article reads, supplier-directory reads,
  catalog reads, sign-in behavior and homepage search are unchanged.
- The only runtime change is client-side landmark naming for existing public
  route markup.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter public-route, blog, catalog or supplier-directory
  request volume at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, supplier
  pagination, blog content data, offer reads, auth persistence or account
  persistence.
- Existing bounded public-route rendering, blog static content and supplier
  directory pagination remain the 10,000 concurrent-user strategy.

Failure mode and graceful degradation:

- Header navigation remains normal links in desktop and mobile states.
- Blog side rails and how-it-works support columns remain normal static content.
- If JavaScript hydration is delayed, existing markup still exposes labelled
  landmarks for screen-reader landmark navigation.

Observability and load-test plan:

- Regression coverage should assert public `nav` and `aside` landmarks have
  accessible names on mobile and desktop.
- Browser smoke verifies `/`, catalog, supplier, auth, info/legal, insights
  and article routes have no unnamed visible nav/aside landmarks.
- Existing public route smoke continues to verify route rendering, mobile
  overflow, nested-control absence, input accessibility, heading structure,
  access gating, supplier redaction, price locks and route chunk recovery.

Validation:

- `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx`;
- `npm run smoke:e2e:public-landmark-labels`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #125.
Marker: public landmark labels.
Marker: header blog how-it-works labelled landmarks.
Marker: 10,000 concurrent users.

## Batch #126 Public Skip-To-Main Target

Batch #126 fixes public keyboard scanability after Batch #125 landmark
labelling. The homepage now exposes a semantic `<main id="main">`, public
Header surfaces can expose a localized skip-to-main link, and public buyer
routes normalize a single `#main` target. Header links, mobile menu behavior,
buyer narrative, catalog and supplier access flows, blog content, auth
behavior, supplier identity redaction, price locks and route shell behavior
stay unchanged.

Expected read/write profile:

- No backend reads or writes are introduced.
- Catalog, supplier directory, supplier profile, offer detail, blog, auth and
  info/legal route data access are unchanged.
- The only runtime behavior added is a client-side focus/scroll action for an
  existing in-page anchor target.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter public-route, blog, catalog, supplier-directory or
  detail-route request volume at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, supplier
  pagination, offer reads, blog content data, auth persistence or account
  persistence.
- Existing bounded catalog and supplier-directory pagination remain the 10,000
  concurrent-user strategy.

Failure mode and graceful degradation:

- The skip link is a normal anchor to `#main`; if JavaScript hydration is
  delayed, the browser can still navigate to the main target.
- When JavaScript is available, activating the link focuses the main content
  target and updates the hash without changing the route.
- If a route were to miss `#main`, the link would remain a harmless in-page
  anchor; regression coverage prevents that on public routes.

Observability and load-test plan:

- Regression coverage should assert public routes expose exactly one
  `main#main`, one skip link and no horizontal overflow at mobile and desktop
  widths.
- Browser smoke verifies the skip link can move focus to `#main` without
  changing the route.
- Existing public route smoke continues to verify route rendering, mobile
  overflow, nested-control absence, input accessibility, heading structure,
  landmark naming, access gating, supplier redaction, price locks and route
  chunk recovery.

Validation:

- `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx`;
- `npm run smoke:e2e:public-skip-main-target`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #126.
Marker: public skip-to-main target.
Marker: header main keyboard scanability.
Marker: 10,000 concurrent users.

## Batch #127 Public Blog Mobile Tap Targets

Batch #127 fixes mobile scanability and tap precision on the public insights
surface after Batch #126. Blog filter chips, article-read actions, popular
topic chips, blog breadcrumbs and mobile article table-of-contents links now
use mobile-safe target zones while preserving copy, route destinations, article
data, SEO metadata, buyer narrative, supplier trust positioning, access gating,
supplier identity redaction, price locks and route shell behavior.

Expected read/write profile:

- No backend reads or writes are introduced.
- Blog post data, article reads, catalog reads, supplier reads, auth behavior
  and info/legal routes are unchanged.
- The only runtime change is CSS class hardening for existing blog links,
  buttons and disclosure controls.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter public-route or blog request volume at the 10,000
  concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier pagination, blog content data, auth persistence or account
  persistence.
- Blog content remains static client data loaded through the existing route
  chunk strategy.

Failure mode and graceful degradation:

- Blog filters, topic buttons, article links, breadcrumbs and table-of-contents
  anchors remain normal buttons and links.
- If CSS fails, the underlying controls still expose the same labels and
  destinations.
- If JavaScript hydration is delayed, article links and in-page anchors remain
  normal browser navigation targets.

Observability and load-test plan:

- Regression coverage should assert selected blog mobile controls expose at
  least 44px by 44px target boxes at 390px.
- Browser smoke verifies `/blog` and a representative `/blog/:slug` route keep
  zero horizontal overflow while preserving existing route rendering.
- Existing public route smoke continues to verify route rendering, mobile
  overflow, nested-control absence, input accessibility, heading structure,
  landmark naming, skip-to-main behavior, access gating, supplier redaction,
  price locks and route chunk recovery.

Validation:

- `npm run smoke:e2e:blog-mobile-tap-targets`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #127.
Marker: public blog mobile tap targets.
Marker: insights route mobile scanability.
Marker: 10,000 concurrent users.

## Batch #128 Public Auth And Registration Accessibility

Batch #128 hardens the public auth and registration conversion flow after
Batch #127. Registration routes now expose a stable `main#main` target,
keyboard skip-to-main link, mobile-safe header/footer/secondary action targets,
named OTP inputs, explicit browser completion hints and single semantic CTAs
while preserving registration copy, funnel analytics, route behavior, buyer
first narrative, supplier trust positioning, access gating, supplier identity
redaction and price locks.

Expected read/write profile:

- No backend reads or writes are introduced.
- Registration API calls, sign-in calls, password recovery behavior, buyer
  session writes and registration session storage contracts are unchanged.
- The runtime changes are markup semantics, target-size classes and
  autocomplete/id/label attributes on existing public auth and registration
  controls.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter public auth or registration request volume at the
  10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier pagination, auth persistence, registration persistence or account
  persistence.
- Registration step state continues to use the existing local session-storage
  context before any self-hosted auth/register API call.

Failure mode and graceful degradation:

- The registration skip link is a normal anchor to `#main`; if JavaScript
  hydration is delayed, browser in-page navigation still works.
- Registration legal links, header links, skip actions and final CTAs remain
  normal links or buttons with the same destinations.
- If browser autocomplete is unavailable, forms still submit through the same
  handlers and validation paths.

Observability and load-test plan:

- Regression coverage should assert registration routes expose exactly one
  `main#main`, one skip link, no nested controls and no horizontal overflow at
  390px.
- Browser smoke verifies marked registration mobile targets expose at least
  44px by 44px target boxes at 390px.
- Browser smoke verifies sign-in and registration fields keep expected
  autocomplete attributes and OTP inputs keep programmatic names.
- Existing public route smoke continues to verify route rendering, mobile
  overflow, nested-control absence, input accessibility, heading structure,
  landmark naming, skip-to-main behavior, access gating, supplier redaction,
  price locks and route chunk recovery.

Validation:

- `npm run smoke:e2e:public-auth-registration-a11y`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #128.
Marker: public auth registration accessibility.
Marker: registration flow mobile scanability.
Marker: 10,000 concurrent users.

## Batch #129 Offer Detail Mobile Accessibility

Batch #129 hardens the public offer detail decision route after Batch #128.
The offer detail page now exposes named gallery controls, mobile-safe buyer
decision targets, accessible verification/specification disclosure states and
locale-owned gallery control names while preserving offer access gating, supplier identity
redaction, exact-price locking, CTA destinations, route behavior and buyer-first
procurement copy.

Expected read/write profile:

- No backend reads or writes are introduced.
- Offer detail fetching, fallback behavior, supplier access request state,
  buyer session reads and approval-refresh behavior are unchanged.
- The runtime changes are markup semantics, target-size classes, aria labels and
  aria-expanded attributes on existing offer detail controls.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter offer-detail request volume at the 10,000
  concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier pagination, auth persistence, access persistence or account
  persistence.
- Offer detail data remains fetched through the existing access-level-aware
  data path.

Failure mode and graceful degradation:

- Gallery navigation, thumbnails, breadcrumb links, delivery-basis selection,
  verification scope disclosure and full-specification disclosure remain normal
  buttons or links.
- If CSS fails, the underlying controls still expose names, destinations and
  button semantics.
- If JavaScript hydration is delayed, breadcrumb links and sticky CTAs remain
  normal browser navigation targets, while non-navigation controls wait for the
  existing React handlers.

Observability and load-test plan:

- Regression coverage should assert marked offer detail mobile controls expose
  at least 44px by 44px target boxes at 390px.
- Browser smoke verifies `/offers/:id` keeps named visible gallery buttons, no
  nested controls, no unnamed visible buttons and zero horizontal overflow.
- Browser smoke verifies opening the photo gallery keeps the close control
  named.
- Existing offer detail smoke continues to verify access gating, supplier
  redaction, price locks, approval refresh, CTA semantics and catalog/detail
  return behavior.

Validation:

- `npm run smoke:e2e:offer-detail-mobile-a11y`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #129.
Marker: offer detail mobile accessibility.
Marker: buyer decision route scanability.
Marker: 10,000 concurrent users.

## Batch #130 Supplier Profile Mobile Accessibility

Batch #130 hardens the public supplier profile trust route after Batch #129.
The supplier detail page now exposes mobile-safe breadcrumb, tab and not-found
recovery targets while preserving access gating, supplier identity redaction,
supplier approval behavior, catalog/profile bridge behavior, route behavior and
buyer-first supplier trust copy.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier profile detail fetching, fallback behavior, supplier access request
  state, buyer session reads and approval-refresh behavior are unchanged.
- The runtime changes are markup semantics, target-size classes and localized
  breadcrumb landmark naming on existing supplier profile controls.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs or additional network
  calls are introduced.
- The change does not alter supplier-profile request volume at the 10,000
  concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, supplier
  directory reads, profile reads, supplier pagination, auth persistence, access
  persistence or account persistence.
- Supplier profile data remains fetched through the existing access-level-aware
  directory detail path.

Failure mode and graceful degradation:

- Breadcrumb links, supplier trust tab triggers and not-found recovery remain
  normal links or Radix tab buttons.
- If CSS fails, the underlying controls still expose names, destinations and
  button/link semantics.
- If JavaScript hydration is delayed, breadcrumb and not-found links remain
  normal browser navigation targets, while profile tabs wait for the existing
  Radix handlers.

Observability and load-test plan:

- Regression coverage should assert marked supplier profile mobile controls
  expose at least 44px by 44px target boxes at 390px.
- Browser smoke verifies `/suppliers/:id` keeps mobile-safe breadcrumbs and
  trust tabs, no nested controls and zero horizontal overflow.
- Browser smoke verifies unknown supplier fallback keeps the supplier-directory
  recovery link mobile-safe.
- Existing supplier profile smoke continues to verify access gating, supplier
  identity redaction, approval refresh, stale identity removal and directory
  return behavior.

Validation:

- `npm run smoke:e2e:supplier-profile-mobile-a11y`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #130.
Marker: supplier profile mobile accessibility.
Marker: supplier trust route scanability.
Marker: 10,000 concurrent users.

## Batch #131 Public Pulse Estimate Disclosure

Batch #131 hardens the public Pulse trust layer after Lovable added marketplace
activity badges and market-pulse panels. The change makes offer-card Pulse
badges visibly disclose their estimate status on mobile and adds reduced-motion
guards to live-looking pulse animations while preserving deterministic initial
mock signal generation, client-side drift, buyer-first copy, offer routing,
access gating, supplier identity redaction and exact-price locking.

Expected read/write profile:

- No backend reads or writes are introduced.
- Pulse values remain client-side estimates from `pulseInt`, including the
  deterministic initial render and client-side drift rhythm.
- No marketplace activity, offer, supplier, auth, access or account API calls are
  added or changed.
- The runtime changes are visual disclosure text, accessible labels,
  reduced-motion classes and regression coverage.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, retries, timers, background jobs, subscriptions or live
  network streams are introduced.
- The change does not alter request volume at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Pulse estimates remain derived from existing offer IDs in the browser.

Failure mode and graceful degradation:

- If CSS fails, the visible Pulse count remains readable and the estimate
  disclosure remains available through `aria-label` and `title`.
- If motion preferences request reduced motion, pulse animation is disabled by
  `motion-reduce:animate-none`.
- If JavaScript hydration is delayed, Pulse badges degrade to static text and do
  not affect route navigation or access-gated controls.

Observability and load-test plan:

- Browser smoke verifies homepage Pulse badges expose an estimate accessible
  label/title, do not reintroduce the removed visible estimate chip and keep
  zero horizontal overflow.
- Browser smoke verifies the offer-detail market pulse estimate copy remains
  visible and motion-reduction classes are present.
- Unit coverage verifies the Pulse badge disclosure is localized,
  programmatic-only on the compact badge and protected for reduced-motion users.
- Existing public smoke continues to verify CTA semantics, offer detail access,
  supplier profile mobile accessibility and route shell behavior.

Validation:

- `npx vitest run src/components/PulseBadge.test.tsx`;
- `npm run smoke:e2e:public-pulse-disclosure`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #131.
Marker: public pulse estimate disclosure.
Marker: buyer trust signal honesty.
Marker: 10,000 concurrent users.

## Batch #132 Public Offer Locale A11y Hardening

Batch #132 removes hardcoded Russian visible and programmatic labels from the
English public offer decision path. The scoped change covers mobile catalog
offer cards, delivery-basis links, mixed-orientation photo hints and the public
offer-detail commercial summary. It preserves buyer-first access gating,
supplier identity redaction, price-lock behavior, route splitting and the
existing public CTA semantics.

Expected read/write profile:

- No backend reads or writes are introduced.
- Catalog and offer-detail routes continue to use the existing mock/API fallback
  data paths.
- The runtime changes are localized text lookups, accessible names and
  regression coverage.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing Vite route chunks and static assets remain browser/CDN cacheable.
- Translation bundle size increases only by a small set of static strings.
- No queues, polling, retries, timers, subscriptions or background jobs are
  introduced.
- Request volume is unchanged at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- URL-backed catalog sorting, filtering, page-size and pagination behavior are
  preserved.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, catalog and offer-detail links still
  expose browser-native navigation targets.
- If CSS fails, visible offer-detail labels remain readable text.
- If a translation key is missing during development, TypeScript catches the
  `TranslationKeys` contract.
- Access-gated exact price and supplier identity remain masked in anonymous and
  registered-locked states.

Observability and load-test plan:

- Unit coverage verifies English mobile catalog aria-labels and offer-detail
  summary labels do not leak Russian copy.
- Browser smoke verifies `/offers` mobile and `/offers/:id` expose English
  accessible names for offer details, delivery basis and inventory level.
- Existing public smoke continues to verify public CTA semantics, route shell,
  offer-detail mobile tap targets, supplier profile mobile accessibility and
  route chunk error handling.
- No new load-test dimension is required because the change is static frontend
  copy and DOM semantics only.

Validation:

- `npx vitest run src/components/catalog/CatalogOfferRow.locale.test.tsx src/components/offer-detail/OfferSummary.locale.test.tsx`;
- `npm run smoke:e2e:public-offer-locale-a11y`;
- `npm run smoke:e2e:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #132.
Marker: public offer locale a11y hardening.
Marker: buyer decision scanability.
Marker: 10,000 concurrent users.

## Batch #133 Public Breadcrumb Locale A11y

Batch #133 localizes public breadcrumb landmark names on `/suppliers`, `/blog`
and `/blog/:slug`. The scoped change replaces hardcoded English `Breadcrumb`
accessible names with the existing locale-owned `aria_breadcrumb` copy. It
preserves supplier directory behavior, blog content, article routing, SEO
metadata, mobile tap-target hardening and buyer-first public structure.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier directory, blog and article routes continue to use the existing
  static/local content paths.
- Runtime work is limited to localized accessible names and browser regression
  coverage.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No new translation keys are added; the batch reuses existing EN/RU/ES copy.
- No queues, polling, retries, timers, subscriptions or background jobs are
  introduced.
- Request volume is unchanged at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Supplier directory sorting/filtering, blog list filtering and article slug
  resolution remain unchanged.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, breadcrumb links remain native anchors.
- If CSS fails, breadcrumb text remains readable and navigation order remains
  intact.
- If a locale is missing, the existing LanguageProvider fallback still supplies
  the translation object.
- English public routes keep the same `Breadcrumb` accessible name through the
  EN translation, while RU/ES no longer hear hardcoded English.

Observability and load-test plan:

- Unit coverage verifies Suppliers, Blog and BlogArticle breadcrumbs use the
  Russian `aria_breadcrumb` label and do not leak the hardcoded English label.
- Browser smoke verifies `/suppliers`, `/blog` and `/blog/:slug` at 390px
  expose `Хлебные крошки`, do not expose `Breadcrumb`, and keep zero
  horizontal overflow.
- Existing public smoke continues to verify heading structure, landmark labels,
  skip-to-main, blog mobile tap targets and offer locale/a11y contracts.
- No new load-test dimension is required because the change is static frontend
  DOM semantics only.

Validation:

- `npx vitest run src/i18n/aria-tooltips-localized.ru.test.tsx`;
- `npm run smoke:e2e:public-breadcrumb-locale-a11y`;
- `npm run smoke:e2e:blog-mobile-tap-targets:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #133.
Marker: public breadcrumb locale a11y.
Marker: directory and insight route scanability.
Marker: 10,000 concurrent users.

## Batch #134 Supplier Directory Locale A11y

Batch #134 localizes supplier-directory programmatic trust labels on
`/suppliers`. The scoped change replaces hardcoded English accessible names and
image alt phrases in supplier rows and the selected supplier panel with
locale-owned EN/RU/ES strings. It preserves buyer-first directory content,
supplier identity redaction, access gating, shortlist behavior, sorting,
filtering, pagination and supplier profile routing.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier directory list/detail data paths are unchanged; the route continues
  to use the existing API/local fallback flow.
- Runtime work is limited to translation lookups for accessible names and image
  alt text, plus regression coverage.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- Translation bundle size increases only by a small set of static strings.
- No queues, polling, retries, timers, subscriptions or background jobs are
  introduced.
- Request volume is unchanged at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- URL-backed supplier sorting, filtering, page-size and pagination behavior are
  preserved.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, supplier rows and profile links remain
  readable native content.
- If CSS fails, supplier trust evidence, catalog preview and delivery preview
  remain visible text/images.
- If a locale is missing during development, TypeScript catches the translation
  contract.
- Locked supplier identity, contact channels, exact catalog breadth and exact
  delivery geography remain hidden until qualified access.

Observability and load-test plan:

- Unit coverage verifies RU supplier directory accessible names and image alt
  text no longer leak hardcoded English labels.
- Browser smoke verifies `/suppliers` at 390px exposes RU accessible names for
  selected supplier, trust signals, catalog preview and delivery preview, keeps
  localized image alt text and has zero horizontal overflow.
- Existing supplier-directory smoke continues to verify URL-backed sorting,
  filtering, pagination and locked search behavior.
- No new load-test dimension is required because the change is static frontend
  DOM semantics only.

Validation:

- `npx vitest run src/pages/Suppliers.i18n.test.tsx`;
- `npm run smoke:e2e:suppliers-directory-locale-a11y`;
- `npm run smoke:e2e:suppliers-directory:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #134.
Marker: supplier directory locale a11y.
Marker: supplier trust mechanism scanability.
Marker: 10,000 concurrent users.

## Batch #135 Supplier Profile Logo Locale A11y

Batch #135 localizes supplier-profile logo accessible names on
`/suppliers/:id`. The scoped change replaces a hardcoded Russian wrapper label
and hardcoded English image alt suffix in `SupplierLogoCard` with the existing
locale-owned `supplier_logo_aria` translation. It preserves buyer-first profile
content, supplier identity redaction, access gating, profile tabs, approval
bridge behavior, supplier directory routing and SEO.

Expected read/write profile:

- No backend reads or writes are introduced.
- Supplier profile detail data paths are unchanged; the route continues to use
  the existing API/local fallback flow.
- Runtime work is limited to one translation lookup for the logo accessible
  name and image alt text.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- Translation bundle size is unchanged because the existing `supplier_logo_aria`
  key is reused.
- No queues, polling, retries, timers, subscriptions or background jobs are
  introduced.
- Request volume is unchanged at the 10,000 concurrent-user target.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, supplier
  reads, offer reads, pagination, auth persistence, access persistence or
  account persistence.
- Supplier directory/profile approval bridge and profile routing remain
  unchanged.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, the supplier profile content remains
  readable native content.
- If CSS fails, the logo monogram or logo image remains visible.
- If a locale is missing during development, TypeScript catches the translation
  contract because `supplier_logo_aria` is typed.
- Locked supplier identity, contact channels, exact catalog breadth and exact
  delivery geography remain hidden until qualified access.

Observability and load-test plan:

- Unit coverage verifies supplier logo wrapper accessible names and image alt
  text follow EN/RU/ES translation templates and do not leak the previous
  hardcoded Russian/English labels.
- Browser smoke verifies `/suppliers/:id` at 390px exposes locale-owned supplier
  logo labels in EN/RU/ES, keeps zero horizontal overflow and has no nested
  interactive controls.
- Existing supplier-profile smoke continues to verify mobile targets, locked
  hints, access gating and directory/profile bridge behavior.
- No new load-test dimension is required because the change is static frontend
  DOM semantics only.

Validation:

- `npx vitest run src/pages/__tests__/SupplierProfile.i18n.test.tsx`;
- `npm run smoke:e2e:supplier-profile-logo-locale-a11y`;
- `npm run smoke:e2e:supplier-profile-mobile-a11y:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #135.
Marker: supplier profile logo locale a11y.
Marker: supplier trust route scanability.
Marker: 10,000 concurrent users.

## Batch #136 Offer Detail Supplier Trust Locale A11y

Batch #136 localizes the supplier trust panel on `/offers/:id`. The scoped
change moves verification status, review disclosure labels, mini-stat labels,
supplier evidence labels and qualified-buyer CTA text out of hardcoded English
strings and into the typed EN/RU/ES translation contract. It preserves the
buyer-first offer detail narrative, supplier identity redaction, exact-price
lock, access request panel, Market Pulse, CTA semantics and route SEO.

Expected read/write profile:

- No backend reads or writes are introduced.
- Offer detail data fetching remains unchanged and continues to use the
  existing offer-detail API/local fallback path.
- Runtime work is limited to translation lookup, one pluralized years-in-
  business label and a simple interpolation of the existing verification date.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- Translation bundle growth is static and small. No request volume changes at
  the 10,000 concurrent-user target.
- No queues, polling, timers, retries, subscriptions or background jobs are
  introduced.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Supplier access gating remains controlled by the existing buyer-session and
  supplier-access state.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, the supplier trust evidence remains
  readable native content after the route renders.
- If CSS fails, verification status, supplier stats, certifications and locked
  contact states remain visible as text and native buttons.
- If a locale key is missing during development, TypeScript catches the typed
  translation contract.
- Locked supplier identity, contact channels and exact commercial data remain
  hidden until qualified access.

Observability and load-test plan:

- Unit coverage verifies RU/ES supplier trust labels, disclosure text and
  qualified CTAs do not leak the previous hardcoded English UI labels.
- Browser smoke verifies `/offers/:id` at 390px exposes localized supplier
  trust labels in RU/ES, keeps the disclosure target mobile-safe, has no nested
  interactive controls and has zero horizontal overflow.
- Existing offer-detail runtime, CTA semantics and mobile accessibility smokes
  continue to verify access gating, redaction, gallery controls and route
  behavior.
- No new load-test dimension is required because the change is static frontend
  DOM semantics only.

Validation:

- `npx vitest run src/components/offer-detail/SupplierTrustPanel.access.test.tsx`;
- `npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y`;
- `npm run smoke:e2e:offer-detail-mobile-a11y:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #136.
Marker: offer detail supplier trust locale a11y.
Marker: buyer trust mechanism scanability.
Marker: 10,000 concurrent users.

## Batch #137 Offer Detail Decision Support Locale A11y

Batch #137 localizes the lower buyer decision-support blocks on `/offers/:id`.
The scoped change moves trust explanation, full specifications, similar
offers/products, related market insights and decision FAQ labels into the typed
EN/RU/ES translation contract. It also keeps similar offer/product prices
locked for anonymous and registered-locked buyers, and converts related insight
cards into real links. Buyer-first copy, supplier trust as a supply mechanism,
access gating, supplier identity redaction, exact-price lock, Market Pulse,
route SEO and CTA semantics are preserved.

Expected read/write profile:

- No backend reads or writes are introduced.
- Offer detail data fetching remains unchanged and continues through the
  existing offer-detail API/local fallback path.
- Runtime work is limited to translation lookup, interpolation and static
  filtering of already-rendered mock related items.
- No offer, supplier, auth, access, account or admin API contracts are changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- Translation bundle growth is static. No request volume changes at the
  10,000 concurrent-user target.
- No queues, polling, timers, retries, subscriptions, background jobs or new
  network calls are introduced.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Similar-offer and related-insight rendering continues to use existing offer
  detail data in the client route.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, the offer detail route still renders
  native links, buttons and readable content once hydrated.
- If CSS fails, decision FAQ controls remain native buttons and related
  insights remain native links.
- If a locale key is missing during development, TypeScript catches the typed
  translation contract.
- Locked supplier identity, contact channels and exact prices in similar
  offer/product recommendations remain hidden until qualified access.

Observability and load-test plan:

- Unit coverage verifies RU/ES decision-support labels, related insight links,
  FAQ disclosure state and locked-price copy without hardcoded English leakage.
- Browser smoke verifies `/offers/:id` at 390px exposes localized decision
  support in RU/ES, keeps related insights linkable, keeps FAQ targets at least
  44px tall, has no nested interactive controls and has zero horizontal
  overflow.
- Existing offer-detail supplier trust, mobile accessibility, runtime and CTA
  semantics smokes continue to guard access gating, redaction and route
  behavior.
- No new load-test dimension is required because the change is static frontend
  DOM semantics only.

Validation:

- `npx vitest run src/components/offer-detail/DecisionSupport.locale.test.tsx`;
- `npm run smoke:e2e:offer-detail-decision-support-locale-a11y`;
- `npm run smoke:e2e:offer-detail-supplier-trust-locale-a11y:run`;
- `npm run smoke:e2e:offer-detail-mobile-a11y:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #137.
Marker: offer detail decision support locale a11y.
Marker: buyer decision support scanability.
Marker: 10,000 concurrent users.

## Batch #138 Public Info Route SEO

Batch #138 gives shared public info/legal routes route-owned SEO metadata. The
scoped change covers `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`,
`/gdpr`, `/anti-fraud`, `/careers`, `/press` and `/partners` through
`InfoPageLayout`. Each page now owns localized title, description, canonical
URL, social metadata and WebPage JSON-LD while preserving the shared
back-to-home CTA, header skip link, mobile overflow safeguards and existing
localized page copy. The change strengthens the buyer trust/legal surface
without changing offer, supplier, auth, access or account behavior.

Expected read/write profile:

- No backend reads or writes are introduced.
- Runtime work is limited to client-side document head updates and JSON-LD
  insertion for already-rendered static public pages.
- No offer, supplier, auth, access, account, admin or API contracts are
  changed.
- No new user-generated data, persistence, files or external integrations are
  introduced.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, timers, retries, subscriptions, background jobs or new
  network calls are introduced.
- Metadata updates run once per route/language render and do not change request
  volume at the 10,000 concurrent-user target.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Static info/legal pages continue to render from localized frontend content.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, visible page content and the back-to-home
  link remain readable once hydrated.
- If CSS fails, pages retain semantic headings, links and text content.
- If metadata updates fail, the page still renders localized visible content
  and the global metadata fallback remains available.
- Route cleanup restores global metadata and previous canonical state when the
  shared info layout unmounts.

Observability and load-test plan:

- Unit coverage verifies all 10 info/legal routes set route-owned localized
  title, description, canonical URL, social metadata and JSON-LD.
- Browser smoke verifies all 10 routes at 390px expose route-owned SEO,
  preserve the direct back-to-home link, have no nested interactive controls
  and have zero horizontal overflow.
- RU direct-entry smoke verifies localized info-route metadata does not fall
  back to the generic global site metadata.
- No new load-test dimension is required because the change is static frontend
  document metadata only.

Validation:

- `npx vitest run src/pages/InfoPageSeo.test.tsx src/i18n/locale-document-meta-ru.test.tsx`;
- `npm run smoke:e2e:public-info-route-seo`;
- `npm run smoke:e2e:public-cta-semantics:run`;
- `npm run smoke:e2e:public-landmark-labels:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #138.
Marker: public info route SEO.
Marker: buyer trust and legal surface.
Marker: 10,000 concurrent users.

## Batch #139 Public Language Selector A11y

Batch #139 hardens the public header language selector. The scoped change gives
desktop and mobile language controls localized programmatic names and exposes
the selected language with `aria-pressed`. This supports multilingual buyer,
supplier and partner review without changing the visible header layout, route
structure, localization storage key, offer/supplier access behavior or SEO.

Expected read/write profile:

- No backend reads or writes are introduced.
- Runtime work is limited to static header DOM attributes and existing
  `LanguageProvider` state updates.
- The existing `localStorage["yorso-lang"]` write remains the only persistence
  path for language selection.
- No offer, supplier, auth, access, account, admin or API contracts are
  changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, timers, retries, subscriptions, background jobs or new
  network calls are introduced.
- Language selector attributes are computed in the already-rendered header and
  do not change request volume at the 10,000 concurrent-user target.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Language state remains local browser state under the existing storage
  contract.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, the visible language text remains present
  in the header once hydrated.
- If CSS fails, the language selector remains visible as ordinary buttons.
- If `localStorage` is unavailable, the existing language fallback behavior
  remains in place.
- Screen readers now receive explicit localized language-selector purpose and
  selected-state information instead of relying on abbreviated visible labels.

Observability and load-test plan:

- Unit coverage verifies EN/RU/ES desktop and mobile language selector labels
  and selected-state attributes.
- Browser smoke verifies desktop and mobile selector behavior, language
  persistence, absence of nested interactive controls and zero 390px horizontal
  overflow across representative public routes.
- Existing public landmark, skip-link, route SEO, CTA semantics and mobile
  overflow smokes continue to guard the header shell.
- No new load-test dimension is required because the change is static frontend
  semantics only.

Validation:

- `npx vitest run src/components/landing/Header.landmarks.test.tsx`;
- `npm run smoke:e2e:public-language-selector-a11y`;
- `npm run smoke:e2e:public-landmark-labels:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #139.
Marker: public language selector a11y.
Marker: multilingual buyer trust.
Marker: 10,000 concurrent users.

## Batch #140 Public Account Menu A11y

Batch #140 hardens the signed-in public header account menu. The scoped change
gives the desktop account chip a localized menu purpose, current-account
context, `aria-haspopup` and `aria-controls`, and gives the desktop dropdown
and mobile signed-in account panel named groups. This supports signed-in buyer
navigation from public routes without changing visible header layout, account
destinations, auth/session storage, offer/supplier access behavior or SEO.

Expected read/write profile:

- No backend reads or writes are introduced.
- Runtime work is limited to static header DOM attributes and existing buyer
  session state from `sessionStorage`.
- No new session writes are added; sign-out behavior remains the existing
  `signOutCurrentAuthSession()` path.
- No offer, supplier, auth API, access, account, admin or database contracts are
  changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, timers, retries, subscriptions, background jobs or new
  network calls are introduced.
- Account-menu attributes are computed in the already-rendered header and do
  not change request volume at the 10,000 concurrent-user target.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Buyer session state remains local prototype browser state under the existing
  storage contract.

Failure mode and graceful degradation:

- If JavaScript hydration is delayed, signed-in account content remains visible
  once hydrated through the existing header session branch.
- If CSS fails, the account menu remains ordinary buttons and links.
- If session storage is unavailable, the existing signed-out header branch
  remains the fallback.
- Screen readers now receive explicit localized account-menu purpose and
  current-account context instead of relying on a bare buyer name/email.

Observability and load-test plan:

- Unit coverage verifies EN/RU/ES desktop and mobile account-menu labels,
  `aria-expanded`, `aria-haspopup`, `aria-controls` and named groups.
- Browser smoke verifies desktop and mobile signed-in account menu behavior,
  absence of nested interactive controls and zero 390px horizontal overflow
  across representative public routes.
- Existing public language selector, landmark, skip-link, route SEO, CTA
  semantics and mobile overflow smokes continue to guard the public header
  shell.
- No new load-test dimension is required because the change is static frontend
  semantics only.

Validation:

- `npx vitest run src/components/landing/Header.landmarks.test.tsx src/i18n/aria-tooltips-localized.ru.test.tsx`;
- `npm run smoke:e2e:public-account-menu-a11y`;
- `npm run smoke:e2e:public-language-selector-a11y:run`;
- `npm run smoke:e2e:public-landmark-labels:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #140.
Marker: public account menu a11y.
Marker: signed-in buyer trust.
Marker: 10,000 concurrent users.

## Batch #141 Public Sheet Close Locale A11y

Batch #141 hardens shared catalog sheet close controls. `SheetContent` now
accepts a `closeLabel` prop while preserving the existing English default, and
public catalog drawers that use the shared Radix sheet pass the active locale's
`t.aria_close`. This removes the default English `Close` programmatic label
from RU/ES buyer catalog drawer states without changing visible layout, drawer
behavior, offer comparison logic, access gating, supplier redaction, exact-price
locks, SEO or route structure.

Expected read/write profile:

- No backend reads or writes are introduced.
- Runtime work is limited to a static accessible-name prop on already-rendered
  sheet close controls.
- No new localStorage/sessionStorage writes are added.
- No offer, supplier, auth API, access, account, admin or database contracts are
  changed.

Cache, queue and backpressure strategy:

- Existing route chunks and static assets remain browser/CDN cacheable.
- No queues, polling, timers, retries, subscriptions, background jobs or new
  network calls are introduced.
- Sheet close labels are computed from the existing i18n context and do not
  change request volume at the 10,000 concurrent-user target.
- Existing Vite route code-splitting and the route chunk error boundary remain
  unchanged.

Database indexing and pagination strategy:

- Unchanged. This batch does not touch database tables, indexes, offer reads,
  supplier reads, pagination, auth persistence, access persistence or account
  persistence.
- Catalog compare state remains the existing client-side selection state.

Failure mode and graceful degradation:

- If a future sheet does not pass `closeLabel`, the shared component keeps the
  previous English fallback `Close` to preserve behavior.
- Public catalog drawer usages now pass `t.aria_close`, so RU/ES assistive
  technology receives `Закрыть` / `Cerrar` instead of an English default.
- If CSS fails, the Radix close button remains an ordinary button.
- If JavaScript hydration is delayed, drawer behavior remains governed by the
  existing Radix sheet state once hydrated.

Observability and load-test plan:

- Unit coverage verifies RU/ES CompareTray and IntelligenceRail sheet close
  controls expose localized close labels and do not expose the default English
  `Close`.
- Browser smoke verifies `/offers` comparison drawer localization in RU/ES,
  locked-buyer access state, absence of nested interactive controls and no
  horizontal overflow.
- Existing public account menu, language selector, landmark, skip-link, route
  SEO, CTA semantics and mobile overflow smokes continue to guard the public
  shell.
- No new load-test dimension is required because the change is static frontend
  semantics only.

Validation:

- `npx vitest run src/components/catalog/SheetCloseLocale.test.tsx`;
- `npm run smoke:e2e:public-sheet-close-locale-a11y`;
- `npm run smoke:e2e:public-account-menu-a11y:run`;
- `npm run smoke:e2e:public-language-selector-a11y:run`;
- `npm run lint`;
- `npx tsc -b --noEmit`;
- `npm run check:production-scale-baseline`;
- `npm run build`.

Marker: Batch #141.
Marker: public sheet close locale a11y.
Marker: catalog drawer trust.
Marker: 10,000 concurrent users.

## Backend Phase 1A Account Session Authority Gate

Phase 1A changes the `/account/*` source-of-truth behavior when the
self-hosted API is configured. Editable account sections now wait for
`/v1/auth/session` validation and a successful account snapshot read before
rendering. Missing or invalid sessions clear the local buyer session and
redirect to `/signin`; backend load failures render an explicit unavailable
state instead of falling back to stale `localStorage` data.

Expected read/write profile:

- API-disabled local preview keeps the previous local account prototype path and
  introduces no backend traffic.
- API-enabled account route mount/retry performs one `GET /v1/auth/session`
  and one bounded parallel account snapshot read:
  `/v1/account/me`, `/company`, `/branches`, `/products`, `/meta-regions` and
  `/notifications`.
- API-enabled saves keep the existing broad account sync profile through
  `syncAccountProfileToApi`, but now the UI updates only after backend success.
- No polling, timers, subscriptions, background jobs or public catalog traffic
  are introduced.

Cache, queue and backpressure strategy:

- Session validation uses the existing self-hosted auth/session cache strategy;
  production remains expected to run Redis session cache in fail-closed mode.
- The frontend adds no queue and no automatic retry loop. Retry is
  user-initiated from the unavailable state.
- Under backend pressure, `/account/*` fails closed for editable private data:
  the account form does not silently switch to local authority.
- Batch #112 route splitting and Batch #113 route chunk error recovery are
  unchanged.

Database indexing and pagination strategy:

- No database schema, index or migration changes.
- Account snapshot endpoints remain bounded to current authenticated account
  records and workspace collections.
- Phase 1A introduces no new list pagination surfaces.
- Follow-up Phase 1B should narrow broad full-profile writes into
  section-scoped mutations with a clearer transaction boundary.

Failure mode and graceful degradation:

- `auth_session_required` and `auth_session_invalid` clear browser buyer session
  state and redirect to `/signin`.
- Auth/network/account load failures show a visible backend-unavailable state
  and keep editable sections closed.
- API-mode save failures propagate through the existing async `EditableCard`
  error path, keeping edit mode open.
- Local preview without `VITE_YORSO_API_URL` remains usable through the
  localStorage/mock fallback.

Observability and load-test plan:

- Targeted regression coverage verifies local fallback, backend session gate,
  backend account hydration, fail-closed unavailable state, session/user
  headers and remote-first save behavior.
- Existing backend auth/account tests continue to cover protected API route
  authority.
- Production load validation for Phase 1 should simulate account route open and
  representative section saves at 10,000 concurrent users with Redis session
  cache enabled, measuring p95 latency, account endpoint error rate, session
  cache events and database read/write volume.

Validation:

- `npx vitest run src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-api.test.ts src/lib/auth-runtime.test.ts`.
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Marker: Backend Phase 1A.
Marker: account session authority gate.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1B Account Section-Scoped Mutations

Phase 1B narrows API-mode `/account/*` writes from a broad full-profile save to
the backend section that the user actually edits. The existing self-hosted row
endpoints are reused: personal profile, company profile, branches, products,
meta-regions and notifications each keep their own mutation path.

Expected read/write profile:

- Account route mount remains Phase 1A behavior: one session validation plus
  bounded account snapshot reads.
- Personal edits send one `PATCH /v1/account/me`.
- Company profile edits send one `PATCH /v1/account/company`.
- Branch, product, meta-region and notification edits send one row-level
  `POST`, `PATCH` or `DELETE` for the changed row.
- A normal section edit no longer sends six broad account PATCH requests.
- No polling, subscription, background sync or public catalog traffic is added.

Cache, queue and backpressure strategy:

- No new frontend queue is introduced.
- The existing self-hosted auth/session cache remains the cache boundary.
- API-mode UI state updates only after backend success. If the backend is slow
  or fails, the edit form remains open and shows a localized inline error.
- API-disabled local preview keeps the localStorage/mock fallback.

Database indexing and pagination strategy:

- No schema or index change is required.
- Existing protected account row endpoints already address rows by account/user
  scope and row id.
- No new list pagination surface is introduced.

Failure mode and graceful degradation:

- Initial backend load failure remains Phase 1A fail-closed behavior:
  editable account content is not rendered.
- Section save failure no longer produces local success in API mode.
- Collection forms for branches, products, meta-regions and notifications wait
  for backend success before closing and surface `account_remoteSaveFailed` on
  failure.
- Current UI edits one row at a time. Future bulk editors should add a
  server-side transactional batch endpoint instead of issuing multiple row
  requests from the browser.

Observability and load-test plan:

- Unit coverage verifies endpoint granularity for personal, company, branch,
  product, meta-region and notification section sync.
- UI coverage verifies API-mode personal save and branch create use only the
  expected narrow endpoints.
- Production load validation should compare Phase 1A six-endpoint save volume
  against Phase 1B narrow writes at 10,000 concurrent users, measuring p95
  mutation latency, write error rate, auth/session cache misses, database row
  lock waits and retry/error-alert rates.

Validation:

- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/auth-runtime.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run build`.

Validated locally on 2026-05-28:

- focused account/auth/API suite passed: 4 files, 56 tests;
- production build passed with Account chunk
  `Account-4Y7df4zk.js` 111.70 kB / 25.36 kB gzip;
- known Supabase generated type and Browserslist warnings were preserved.

Marker: Backend Phase 1B.
Marker: account section-scoped mutations.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1C Account Conflict Version Handling

Phase 1C adds account snapshot versioning to the self-hosted `/account/*`
source-of-truth path. Current YORSO account clients receive an opaque
`accountVersion` from account responses and send it back as
`x-yorso-account-version` on account mutations. If the version is stale, the
backend returns `409 account_snapshot_conflict` and the account UI shows a
reloadable conflict state instead of silently overwriting newer backend data.

Expected read/write profile:

- Account route mount remains Phase 1A behavior: one session validation plus
  bounded account snapshot reads.
- Each account GET adds one account-version lookup scoped to the signed-in
  account owner.
- Each account mutation adds one precondition version lookup and one post-save
  response version lookup.
- Normal writes remain Phase 1B scoped writes:
  - personal edits: `PATCH /v1/account/me`;
  - company edits: `PATCH /v1/account/company`;
  - branch/product/meta-region/notification edits: one row-level
    `POST`, `PATCH` or `DELETE`.
- No public catalog traffic, polling, subscriptions or background sync are
  added.

Cache, queue and backpressure strategy:

- No new queue is introduced.
- The existing self-hosted auth/session cache remains the session authority
  boundary.
- Account version is derived from backend `updated_at` values and held only in
  the current frontend account API client instance.
- On `account_snapshot_conflict`, the browser does not retry automatically; it
  stops the write path and asks the user to reload the account snapshot.

Database indexing and pagination strategy:

- No new list or pagination surface is introduced.
- The version query is bounded to one account owner and one company scope.
- Required production indexes are the existing ownership indexes:
  `yorso_companies.owner_user_id`, workspace `company_id` columns, and
  `yorso_notification_preferences.user_id`.
- Collection replacement paths touch the parent company/user row so deletions
  and empty replacements still advance the account snapshot version.

Failure mode and graceful degradation:

- Current frontend writes with a stale version fail with
  `409 account_snapshot_conflict`.
- `/account/*` keeps the edited card open, shows an inline save error and a
  page-level `account-save-conflict` banner with reload action.
- API-enabled mode does not fall back to localStorage after a conflict.
- Missing version headers remain accepted for backward compatibility until a
  later strict precondition-required decision.
- API-disabled local preview remains localStorage/mock only and does not use
  backend versioning.

Observability and load-test plan:

- Track `409 account_snapshot_conflict` count/rate by account route, user and
  session.
- Track account-version lookup latency and account mutation p95/p99 latency.
- Load-test 10,000 concurrent users with account route load, personal/company
  edits, row-level collection edits and deliberate stale-tab saves.
- Watch DB CPU, row lock waits, session-cache misses, conflict rate and
  frontend reload-banner rate.

Validation:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run build`.

Validated locally on 2026-05-28:

- API repository/server tests passed: 2 files, 77 tests;
- frontend account conflict/version tests passed: 2 files, 37 tests;
- production build passed with Account chunk
  `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip;
- known Supabase generated type and Browserslist warnings were preserved.

Marker: Backend Phase 1C.
Marker: account conflict version handling.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1D Account Strict Precondition Policy

Phase 1D makes the Phase 1C version precondition production-enforceable.
Self-hosted production API config must set
`ACCOUNT_VERSION_PRECONDITION_MODE=required`; in that mode normal
`/v1/account/*` mutations without `x-yorso-account-version` return
`428 account_version_required` before mutation. Development, test and local
preview keep the default `optional` mode for compatibility.

Expected read/write profile:

- No new public read/write traffic is introduced.
- Valid current frontend writes use the same Phase 1C account-version
  precondition read before mutation and response version read after mutation.
- Missing-header writes in strict mode fail without a database mutation.
- Normal `/account/*` UI writes remain Phase 1B section-scoped writes.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or background retry loop is introduced.
- Existing self-hosted auth/session cache remains the session authority
  boundary.
- Strict-mode missing-header requests use a bounded error response and do not
  retry automatically.

Database indexing and pagination strategy:

- No new list or pagination surface is introduced.
- The account-version lookup remains bounded to one account owner and one
  company scope.
- Production index requirements remain the Phase 1C ownership indexes:
  `yorso_companies.owner_user_id`, collection `company_id`, and
  `yorso_notification_preferences.user_id`.

Failure mode and graceful degradation:

- Production strict mode rejects non-compliant account write clients with
  `428 account_version_required`.
- Current YORSO account frontend already sends `x-yorso-account-version` after
  backend load.
- Stale compliant clients still receive `409 account_snapshot_conflict`.
- API-disabled local preview remains outside the backend version contract.
- Storage/media/document account routes remain a separate follow-up scope
  because their document and media version boundaries differ from normal
  account workspace mutations.

Observability and load-test plan:

- Track `428 account_version_required` by route and client to find legacy or
  non-compliant write clients.
- Track `409 account_snapshot_conflict` separately for stale-tab conflicts.
- Load-test 10,000 concurrent users with account route opens, valid
  personal/company edits, valid row-level collection edits, missing-header
  writes and stale-header writes.
- Monitor p95/p99 mutation latency, account-version lookup latency, DB CPU,
  session-cache misses and rejection rates.

Validation:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Validated locally on 2026-05-28:

- API repository/server tests passed: 2 files, 79 tests;
- frontend account API/editable tests passed: 2 files, 37 tests;
- production build passed with Account chunk
  `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip;
- known Supabase generated type and Browserslist warnings were preserved.

Focused strict-mode validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts`.

- API server test suite passed: 1 file, 62 tests.

Marker: Backend Phase 1D.
Marker: account strict precondition policy.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1E Account Media/Document Version Boundary

Phase 1E extends the account version precondition contract to account-owned
storage mutations. Document list/create and company media upload JSON responses
now include `accountVersion`; strict production mode rejects media/document POST
requests without `x-yorso-account-version`; stale storage mutations return
`409 account_snapshot_conflict`.

Expected read/write profile:

- No public catalog or supplier access traffic is added.
- `GET /v1/account/documents` adds one account-version lookup to a bounded
  company-scoped document list.
- `POST /v1/account/documents` adds one precondition lookup and one response
  version lookup around existing document metadata creation.
- `POST /v1/account/company/media/:slot` adds the same precondition/response
  lookups around the existing file asset and company media update path.
- Missing-header strict requests fail before body parsing and do not create
  storage metadata.

Cache, queue and backpressure strategy:

- No new queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache remains the account authority boundary.
- Existing JSON body and upload-size limits remain the upload backpressure
  boundary.
- Object storage writes remain synchronous in this phase.

Database indexing and pagination strategy:

- No new pagination surface is introduced.
- Existing document listing remains company-scoped.
- Account version lookup now includes `yorso_file_assets.created_at` and
  `yorso_company_documents.updated_at`.
- Existing required indexes:
  `idx_yorso_file_assets_company_id`,
  `idx_yorso_company_documents_company_id`, plus Phase 1C account ownership
  indexes.

Failure mode and graceful degradation:

- Strict production clients without version headers receive
  `428 account_version_required`.
- Stale compliant media/document clients receive
  `409 account_snapshot_conflict`.
- Current YORSO account frontend uses the shared account API request helper, so
  it learns `accountVersion` from document/media responses and sends it on
  later writes.
- Read-only file streaming routes stay outside JSON account version payloads.
- A future media pipeline can move file metadata + account-version touch into a
  transactional metadata boundary or outbox if upload processing becomes async.

Observability and load-test plan:

- Track `428 account_version_required` and `409 account_snapshot_conflict` on
  storage account routes separately from profile/workspace account routes.
- Track upload p95/p99 latency, body-size distribution, account-version lookup
  latency and object storage write latency.
- Load-test 10,000 concurrent users with document list, valid document upload,
  valid media upload, missing-header upload and stale-header upload after
  another account mutation.

Validation:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts`;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Validated locally on 2026-05-28:

- API repository/server tests passed: 2 files, 80 tests;
- frontend account API/editable tests passed: 2 files, 37 tests;
- focused frontend account API adapter tests passed: 1 file, 16 tests;
- production build passed with Account chunk
  `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip;
- known Supabase generated type and Browserslist warnings were preserved.

Marker: Backend Phase 1E.
Marker: account media document version boundary.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1F Account Storage Client Authority Boundary

Phase 1F closes a frontend/account authority gap for account-owned storage
clients. The enabled account API adapter no longer silently falls back to
`DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID` when no session user, buyer-session user or
configured account user id exists. `/account/company` also passes its
session-bound account client into `CompanyDocumentsCard`, so document list/create
uses the same `x-yorso-user-id`, `x-yorso-session-id` and account-version state
as company profile/media writes.

Expected read/write profile:

- No public traffic is added.
- Account document list/create request volume is unchanged.
- Missing frontend session-user state fails before network I/O instead of
  sending a request under the deterministic demo account id.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache remains the account authority boundary.
- Existing upload size and JSON body limits remain unchanged.

Database indexing and pagination strategy:

- No schema, migration, index or pagination change is introduced.
- Existing Phase 1E account/file/document indexes remain sufficient.

Failure mode and graceful degradation:

- Enabled account API client calls without a session/configured user fail closed
  with `account_api_session_required` before fetch.
- API-disabled local prototype mode remains available for Lovable/offline
  review.
- Public catalog/supplier routes, supplier identity redaction and exact-price
  locks are unchanged.

Observability and load-test plan:

- Track frontend `account_api_session_required` sync failures separately from
  backend account/session/version errors.
- Keep the Phase 1E document list/create load-test scenario and add a negative
  case for missing frontend session user at 10,000 concurrent users.

Validation:

- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`;
- 3 files passed;
- 52 tests passed.
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Marker: Backend Phase 1F.
Marker: account storage client authority boundary.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1G Account Storage Transaction Boundary

Phase 1G closes the storage consistency decision left after Phase 1E/1F.
Document upload metadata now writes `yorso_file_assets` and
`yorso_company_documents` through one atomic PostgreSQL statement. The current
runtime stays synchronous and does not introduce an outbox queue until there is
an async storage worker, retry policy and operator status surface.

Expected read/write profile:

- No public traffic is added.
- Successful document upload keeps one object write and moves metadata from two
  sequential insert calls to one atomic CTE statement.
- Successful media upload request volume is unchanged.
- Media upload adds a cleanup path only when company profile update fails after
  file asset creation.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing upload size and JSON body limits remain the first backpressure
  boundary.
- Existing auth/session cache and account-version precondition remain the
  account authority boundary.
- Outbox remains deferred until virus scanning, document review or external
  object storage retry semantics require asynchronous processing.

Database indexing and pagination strategy:

- No schema migration, new index or pagination surface is introduced.
- Document list remains company-scoped.
- Atomic metadata writes use existing primary keys, foreign keys and indexes:
  `idx_yorso_file_assets_owner_user_id`,
  `idx_yorso_file_assets_company_id` and
  `idx_yorso_company_documents_company_id`.

Failure mode and graceful degradation:

- If object bytes are written but metadata persistence fails, the local object
  key is deleted.
- If company media profile update fails after asset creation, the route removes
  the newly created asset/object best-effort and preserves the original error.
- If cleanup fails for a future non-local storage driver, add cleanup-failure
  metrics and a durable cleanup queue before marking that driver
  production-ready.
- Account version strict/stale behavior from Phase 1E is unchanged.

Observability and load-test plan:

- Track storage metadata failure count by route and file purpose.
- Track cleanup attempts/failures before introducing non-local object storage.
- Load-test 10,000 concurrent users with successful document upload, simulated
  metadata failure after object write, successful media upload, simulated media
  profile-update failure and Phase 1E strict/stale storage writes.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- 1 file passed;
- 6 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- 3 files passed;
- 86 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Marker: Backend Phase 1G.
Marker: account storage transaction boundary.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1H Account Workspace Replace Transaction Boundary

Phase 1H closes the remaining backend collection-write risk from the Phase 1
source-of-truth audit. Bulk account workspace replacement endpoints still exist,
but PostgreSQL now applies each collection replacement as one atomic CTE
statement instead of delete + per-row insert + parent touch as separate calls.

Expected read/write profile:

- No public traffic is added.
- Normal `/account/*` UI edits remain Phase 1B row-level/section-scoped writes.
- Legacy/bulk branch, product, meta-region and notification replacements now
  reduce N+2 SQL statements per collection to one bounded write statement after
  the existing company lookup where needed.
- Replacement rows are returned from the write statement, so no extra reread is
  required after replacement.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache and account-version precondition remain the
  account authority boundary.
- Request-size/schema validation and bounded account list payloads remain the
  backpressure boundary.
- If branches/products grow beyond small account-management lists, add
  pagination instead of accepting unbounded replacement arrays.

Database indexing and pagination strategy:

- No schema migration, new index or pagination surface is introduced.
- Replacement statements remain scoped by one company id or user id.
- Existing indexes remain the bounded paths:
  `idx_yorso_company_branches_company_id`,
  `idx_yorso_company_products_company_id`,
  `idx_yorso_company_meta_regions_company_id` and
  `idx_yorso_notification_preferences_user_id`.

Failure mode and graceful degradation:

- If an inserted row violates enum/check/foreign-key constraints, PostgreSQL
  rejects the full statement. The previous rows are not independently deleted
  before a later failed insert.
- Account version strict/stale behavior from Phase 1C/1D is unchanged.
- API-disabled local prototype mode remains unchanged.

Observability and load-test plan:

- Track collection replacement p95/p99 latency by route.
- Track replacement row counts and validation/constraint failures.
- Load-test 10,000 concurrent users with row-level account edits, bounded bulk
  replacements, invalid-row replacement and stale-header writes.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts`;
- 1 file passed;
- 17 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- 3 files passed;
- 86 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Marker: Backend Phase 1H.
Marker: account workspace replace transaction boundary.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 1I Account Workspace Aggregate Read

Phase 1I reduces self-hosted account hydration fanout by adding
`GET /v1/account/workspace`. API-enabled `/account/*` now loads user, company,
branches, products, meta-regions, notifications and `accountVersion` through
one authenticated snapshot endpoint instead of six parallel account section
requests.

Expected read/write profile:

- No public traffic is added.
- Account entry performs one self-hosted read request instead of six account
  section reads.
- PostgreSQL production repository returns the snapshot through one user-scoped
  query with JSON aggregation and account-version calculation.
- Normal writes remain Phase 1B section-scoped or row-level mutations.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache remains the account authority boundary.
- Existing request-size/schema validation and bounded account collection
  contracts remain the backpressure boundary.
- The change reduces browser and API route fanout under account-entry load.

Database indexing and pagination strategy:

- No schema migration or new index is introduced.
- Snapshot reads stay scoped by one authenticated user id and one owned company.
- Existing indexes remain the bounded paths:
  `yorso_users.id`, `yorso_companies.owner_user_id`,
  `idx_yorso_company_branches_company_id`,
  `idx_yorso_company_products_company_id`,
  `idx_yorso_company_meta_regions_company_id` and
  `idx_yorso_notification_preferences_user_id`.
- If account products/branches grow beyond bounded account-management lists,
  add server pagination rather than returning unbounded arrays from the
  workspace snapshot.

Failure mode and graceful degradation:

- Missing/invalid sessions still fail closed through the existing account
  session errors.
- Missing user/company state returns an account resource error.
- Frontend account pages keep the existing backend-unavailable state on
  hydration failure.
- API-disabled Lovable/local prototype mode remains unchanged.

Observability and load-test plan:

- Track `/v1/account/workspace` p95/p99 latency, status code distribution,
  response size and account collection row counts.
- Compare account-entry load against the previous six-request hydration shape.
- Load-test 10,000 concurrent users with account entry, invalid sessions,
  row-level account edits and contract-bounded large workspace collections.

Validation:

- `npm run contracts:build`.
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`;
- 3 files passed;
- 52 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`;
- 2 files passed;
- 83 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-CK-9-38I.js` 112.88 kB / 25.69 kB gzip.

Marker: Backend Phase 1I.
Marker: account workspace aggregate read.
Marker: account source of truth.
Marker: 10,000 concurrent users.

## Backend Phase 2A Registration-To-Account Source Of Truth

Phase 2A moves API-enabled `/register/*` from frontend-only prototype state to
the self-hosted backend. Registration steps are stored in
`yorso_registration_drafts`; completion creates the user, credential, company,
workspace defaults and auth session in owned storage.

Expected read/write profile:

- Registration start creates one backend draft row.
- Email/phone verification, details, onboarding and markets each update one
  draft row by primary key.
- Completion performs one account creation write path and issues one auth
  session.
- API-disabled Lovable/local preview keeps the existing mock flow and is not a
  production source of truth.

Cache, queue and backpressure strategy:

- No external hosted BaaS, polling or subscription dependency is introduced.
- Verification request count is stored on the draft and capped.
- Request schema/body limits remain the first backpressure boundary.
- Email/SMS delivery outbox is deferred until YORSO chooses self-hosted delivery
  infrastructure; Phase 2A owns state, not external delivery.

Database indexing and pagination strategy:

- `yorso_registration_drafts.id` is the primary registration-step path.
- `idx_yorso_registration_drafts_email_recent` supports email checks and
  support diagnostics.
- `idx_yorso_registration_drafts_active_expiry` supports expired-draft cleanup.
- Account completion relies on existing user/company/session indexes and
  inserts bounded default workspace rows.

Failure mode and graceful degradation:

- Duplicate account email returns a conflict before creating a draft account.
- Missing/expired registration sessions fail closed.
- Invalid verification code does not advance the draft.
- Self-hosted completion failure does not silently create a local buyer session.
- Public catalog/supplier browsing remains redacted and unaffected.

Observability and load-test plan:

- Track registration route p95/p99 latency and status-code distribution.
- Track draft completion, invalid-code, duplicate-email and expired-session
  counts without logging credentials or full private contact data.
- Load-test registration start, verification updates and completion under
  10,000 concurrent-user pressure with duplicate email and expired draft mixes.

Validation:

- `npm run contracts:build`;
- `npx vitest run src/lib/api-contracts.registration.test.ts`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
- `npx vitest run src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/lib/auth-runtime.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-production-runtime`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Production build metrics:

- CSS `index-DbM2SN9t.css` 126.84 kB / 21.02 kB gzip.
- Entry `index-BqYFae4R.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.
- Registration route chunks:
  - `RegisterEmail-BcWzA97r.js` 3.50 kB / 1.60 kB gzip;
  - `RegisterVerify-6Et16ypU.js` 7.50 kB / 2.92 kB gzip;
  - `RegisterDetails-Dc2ayIXr.js` 11.92 kB / 3.55 kB gzip;
  - `RegisterReady-BoqIOkCC.js` 9.43 kB / 3.22 kB gzip.

Marker: Backend Phase 2A.
Marker: registration account source of truth.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2B Registration Verification Delivery Outbox

Phase 2B adds a self-hosted delivery outbox boundary for registration
verification. Registration start and phone verification request now create
durable delivery-intent rows in `yorso_registration_delivery_outbox` without
adding an external hosted email/SMS provider.

Expected read/write profile:

- Registration start writes one registration draft and one email verification
  outbox row.
- Phone verification request updates one registration draft and writes one
  SMS/WhatsApp outbox row.
- Future worker reads must lease bounded ready rows by index.
- No browser polling, subscription or hosted BaaS queue is introduced.

Cache, queue and backpressure strategy:

- The existing phone verification request cap remains the first per-session
  backpressure control.
- Outbox rows include `status`, `attempt_count`, `max_attempts`,
  `available_at`, `locked_at` and `locked_by` so worker retry/lease behavior can
  be added without changing the registration API contract.
- Outbox persistence happens in the same PostgreSQL statement as the triggering
  registration mutation.
- The outbox stores masked destinations and destination hashes, not
  verification codes, full contacts or provider credentials.

Database indexing and pagination strategy:

- `idx_yorso_registration_delivery_outbox_ready` supports bounded worker scans
  for queued delivery jobs.
- `idx_yorso_registration_delivery_outbox_draft_recent` supports support/debug
  lookup by draft id.
- `idx_yorso_registration_delivery_outbox_status_recent` supports operational
  status diagnostics.
- Worker reads must page or lease rows from the ready index and must not full
  scan the outbox.

Failure mode and graceful degradation:

- If delivery outbox persistence fails, registration start/phone-send fails
  instead of returning a false delivery success.
- Verification code and full destination are not returned to browser responses.
- API-disabled Lovable/local preview keeps its mock behavior and remains
  non-production.
- No Supabase or hosted BaaS runtime dependency is added.

Observability and load-test plan:

- Track delivery outbox insert success/failure by purpose and channel.
- When a worker is added, track queued job age, lease latency, retry counts and
  terminal failures.
- Load-test start and phone-send under 10,000 concurrent-user pressure with
  duplicate email, expired draft and phone rate-limit mixes.
- Audit and telemetry payloads must not include verification codes, raw email,
  raw phone or provider credentials.

Validation:

- `npm run contracts:build`;
- `npx vitest run src/lib/api-contracts.registration.test.ts`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
- `npx tsc -b --noEmit`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-production-runtime`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Production build metrics:

- CSS `index-DbM2SN9t.css` 126.84 kB / 21.02 kB gzip.
- Entry `index-BqYFae4R.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.

Marker: Backend Phase 2B.
Marker: registration verification delivery outbox.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2C Registration Verification Worker Lease Processing

Phase 2C adds the internal worker boundary for processing
`yorso_registration_delivery_outbox` rows. It leases bounded ready jobs,
delegates delivery to an injectable self-hosted sender, then marks each job
sent, requeued or failed.

Expected read/write profile:

- Worker batch reads up to `limit` ready rows.
- Each leased row gets one sender call.
- Each processed row gets one status update: sent, queued for retry or failed.
- Public registration routes are unchanged.

Cache, queue and backpressure strategy:

- `limit` bounds each batch.
- `leaseMs` prevents duplicate active processing and enables stale-lease
  recovery.
- `retryAfterMs`, `attempt_count` and `max_attempts` prevent hot retry loops.
- No hosted provider queue, Supabase function or browser polling is introduced.

Database indexing and pagination strategy:

- PostgreSQL lease uses the ready outbox index and `for update skip locked`.
- Worker runners must use bounded repeated batches rather than full queue scans.
- Status transitions reuse the Phase 2B outbox columns; no new migration is
  required.

Failure mode and graceful degradation:

- Sender failure requeues the job until retry budget is exhausted.
- Exhausted jobs become `failed` and stop retrying.
- Expired or completed registration drafts are excluded before a row is leased.
- Error text is sanitized before persistence.
- If no worker is running, registration still records durable queued delivery
  intent; the system does not claim provider delivery outside the outbox state.

Observability and load-test plan:

- Track leased, sent, requeued and failed counts per batch.
- Track queued job age, terminal failures and lease contention when a runtime
  scheduler is added.
- Load-test multiple worker processes using the same ready queue under 10,000
  concurrent-user registration pressure.
- Validate that logs and persisted errors do not contain verification codes,
  raw email or raw phone values.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-production-runtime`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Production build metrics:

- CSS `index-DbM2SN9t.css` 126.84 kB / 21.02 kB gzip.
- Entry `index-BqYFae4R.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.

Marker: Backend Phase 2C.
Marker: registration verification worker lease.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2D Registration Delivery Runtime

Phase 2D adds the self-hosted runtime decision for registration verification
delivery: a background scheduler and `file_spool` sender. The scheduler runs
the Phase 2C worker outside request handlers, while the sender writes durable
handoff JSON files to an owned local directory.

Expected read/write profile:

- Public registration routes remain unchanged.
- Scheduler reads at most one bounded batch per configured interval.
- Each job receives the Phase 2C lease and sent/retry/failure writes.
- File spool writes one local JSON handoff file per successfully handed-off job.

Cache, queue and backpressure strategy:

- `YORSO_REGISTRATION_DELIVERY_WORKER_BATCH_SIZE` bounds work per run.
- `YORSO_REGISTRATION_DELIVERY_WORKER_INTERVAL_MS` bounds scheduler frequency.
- Scheduler skips overlapping runs.
- File spool uses an owned mounted volume; no hosted provider queue, Supabase
  function or browser polling is introduced.

Database indexing and pagination strategy:

- Phase 2C ready index and `for update skip locked` lease query remain the DB
  queue strategy.
- Runtime never paginates through the full outbox; it repeatedly runs bounded
  lease batches.

Failure mode and graceful degradation:

- File-spool write failure propagates to the worker and uses Phase 2C retry /
  terminal failure semantics.
- Scheduler catches worker-level failures and records failure metrics instead
  of crashing request handling.
- The HTTP server stops the scheduler on `close`.
- Production config fails closed unless the worker is enabled, the sender is
  `file_spool` and the spool directory is absolute.

Observability and load-test plan:

- Metrics expose worker run outcomes and job result counts.
- Metrics do not contain destination, email, phone, draft id or delivery id.
- Load-test 10,000 concurrent-user registration pressure with worker enabled,
  multiple intervals and a mounted spool volume; inspect queue age, terminal
  failures and filesystem write latency.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run check:self-hosted-infra`;
- `npm run check:self-hosted-production-runtime`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-api`;
- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Production build metrics:

- CSS `index-DbM2SN9t.css` 126.84 kB / 21.02 kB gzip.
- Entry `index-BqYFae4R.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.

Marker: Backend Phase 2D.
Marker: registration delivery runtime.
Marker: file_spool sender.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2E Registration Verification Code Policy

Phase 2E replaces the fixed prototype registration verification code with
per-request OTP generation, code expiry, attempt counters and sealed backend
delivery handoff material.

Expected read/write profile:

- Registration start writes one draft row with hashed email code secret and
  expiry plus one delivery outbox row with sealed code material.
- Email verification reads the draft by session id and writes either one
  attempt-counter increment or one verified timestamp.
- Phone verification request updates the draft with a new hashed phone code
  secret, resets phone attempt count and writes one delivery outbox row.
- Worker lease decrypts sealed code material only after claiming a bounded
  outbox batch.

Cache, queue and backpressure strategy:

- OTP generation is local API CPU work and does not call a hosted provider.
- OTP attempt counters are durable per draft; sign-in rate limits remain
  separate Redis/audit-log policy.
- Delivery backpressure remains governed by Phase 2D batch size, interval,
  lease timeout and retry delay.
- Production fails closed without a non-default
  `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET`.

Database indexing and pagination strategy:

- Draft verification remains primary-key/session-id lookups.
- `idx_yorso_registration_drafts_email_code_expiry` and
  `idx_yorso_registration_drafts_phone_code_expiry` support bounded expiry
  cleanup/ops scans.
- Outbox leasing requires non-null `verification_code_sealed` and still uses
  ordered `for update skip locked` batches.

Failure mode and graceful degradation:

- Wrong code returns `registration_invalid_code` until the attempt ceiling.
- Expired code returns `registration_code_expired`.
- Max wrong attempts returns `registration_rate_limited` and blocks later
  correct-code attempts for that code cycle.
- Delivery rows without sealed material are not leased by the Phase 2E worker
  path.
- Delivery sender failures redact email, phone and verification-code shaped
  values before persisting retry errors.
- Browser-facing responses keep masked delivery metadata only: no OTP, full
  email or full phone number.

Observability and load-test plan:

- Existing worker metrics continue to avoid contact/draft/destination labels.
- Logs and persisted delivery errors must not contain OTP, raw email or raw
  phone.
- Load-test 10,000 concurrent-user registration starts, phone sends and verify
  attempts; inspect p95 latency, attempt-counter write pressure, queue age and
  spool write latency.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/verification-code.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/server.test.ts`.
- `npx tsc -b --noEmit`.
- `npm run contracts:build`.
- `npm run test:db-migrations`.
- `npm run check:self-hosted-infra`.
- `npm run check:self-hosted-production-runtime`.
- `npm run check:production-scale-baseline`.
- `npm run check:self-hosted-api`.
- `npx vitest run src/lib/api-contracts.registration.test.ts src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/i18n/locale-register-substeps-ru.test.tsx`.
- `npm run lint`.
- `npm run api:build`.
- `git diff --check`.
- `npm run build`.

Marker: Backend Phase 2E.

## Backend Phase 2F Password Recovery Source Of Truth

Phase 2F implements self-hosted password recovery/reset as an owned backend
source of truth. `/signin` reset requests now target
`POST /v1/auth/password-reset/request` when `VITE_YORSO_API_URL` is configured,
and `/reset-password?token=...` completes through
`POST /v1/auth/password-reset/complete`. Supabase remains a prototype fallback
only when the self-hosted API is not configured.

Expected read/write profile:

- Reset request: one indexed user lookup by normalized email. Known accounts
  create one `yorso_auth_password_recovery_tokens` row, one
  `yorso_auth_password_recovery_outbox` row and one auth security event.
  Unknown accounts write only the security event and return the same public
  response shape.
- Reset complete: one unique lookup by `token_lookup_hash`, one token state
  update, one credential update, bounded session revocation by user and one
  auth security event.

Cache/queue/backpressure strategy:

- Browser responses never expose reset tokens or raw account existence.
- Delivery is outbox-backed with backend-only `recovery_token_sealed` material.
- Session-cache entries for revoked sessions are removed after a successful
  reset.
- Request throttling for password recovery is intentionally not included; add a
  separate abuse-control batch if production telemetry shows pressure.

Database indexing and pagination strategy:

- `token_lookup_hash` is unique and backs reset completion lookup.
- `idx_yorso_auth_password_recovery_active_expiry` supports bounded cleanup and
  expiry scans.
- `idx_yorso_auth_password_recovery_user_recent` supports security/admin review.
- `idx_yorso_auth_password_recovery_outbox_ready` supports future bounded worker
  leasing without scanning completed rows.

Failure mode and graceful degradation:

- Known and unknown accounts receive the same generic request response.
- Invalid, expired and used tokens return structured errors without echoing the
  token.
- Missing recovery token in the browser keeps the existing invalid/expired link
  fallback.
- The outbox can queue owned delivery handoff even before a dedicated recovery
  sender runtime is implemented.

Observability and load-test plan:

- API audit records `auth.password_reset.request` and
  `auth.password_reset.complete`.
- Auth security events record `password_reset_requested`,
  `password_reset_completed` and `password_reset_invalid`.
- Validation covers API routes, frontend runtime adapter, migration plan,
  self-hosted DB/API policy guards and production-scale guard.
- Load testing should simulate mixed known/unknown reset requests and token
  completion traffic at the 10,000 concurrent-user baseline.

Marker: Backend Phase 2F.
Marker: registration verification code policy.
Marker: sealed verification code handoff.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2G Password Recovery Delivery Runtime

Phase 2G adds a self-hosted password recovery delivery worker/sender runtime
for the Phase 2F outbox. The runtime leases queued recovery deliveries, opens
sealed reset-token material only after lease, writes `file_spool` handoff files
and records worker metrics without adding hosted provider dependencies.

Expected read/write profile:

- Reset request writes remain unchanged from Phase 2F.
- Worker lease performs one bounded PostgreSQL lease query and one lease update
  per claimed row.
- Successful send performs one local spool file write and one terminal outbox
  update.
- Failed send performs one sanitized retry/failure update.

Cache, queue and backpressure strategy:

- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_BATCH_SIZE` bounds work per run.
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_INTERVAL_MS` bounds scheduler
  frequency.
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_LEASE_MS` bounds stuck leases.
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_RETRY_AFTER_MS` controls retry
  pressure.
- Scheduler skips overlapping runs and does not run inside public request
  handlers.

Database indexing and pagination strategy:

- `idx_yorso_auth_password_recovery_outbox_ready` supports ready delivery scans.
- PostgreSQL leasing uses ordered candidates and `for update skip locked`.
- Expired or used recovery tokens are excluded before delivery.
- Runtime repeats bounded batches rather than paginating across the outbox.

Failure mode and graceful degradation:

- File-spool failure requeues jobs until retry exhaustion, then marks failed.
- Persisted sender errors redact email, phone and reset-token shaped values.
- Scheduler-level worker errors emit metrics and do not crash the API process.
- Production config fails closed unless password recovery delivery runtime uses
  `file_spool` with an absolute owned spool directory.

Observability and load-test plan:

- Prometheus metrics track password recovery delivery worker runs and job
  counts by worker id/result.
- Metrics must not label email, recovery id, destination or reset token.
- Load-test mixed known/unknown password reset bursts plus worker sends at the
  10,000 concurrent-user baseline; inspect queue age, terminal failures, spool
  write latency and reset completion p95.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-delivery-worker.test.ts apps/api/src/modules/auth/password-recovery-delivery-sender.test.ts apps/api/src/modules/auth/password-recovery-delivery-runtime.test.ts`.
- `npx tsc -b --noEmit`.
- `npm run test:db-migrations`.
- `npm run check:self-hosted-db`.
- `npm run check:self-hosted-infra`.
- `npm run check:self-hosted-production-runtime`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.
- `npm run test:api`.
- `npm run lint`.
- `npm run api:build`.
- `git diff --check`.
- `npm run build`.

Marker: Backend Phase 2G.
Marker: password recovery delivery runtime.
Marker: file_spool sender.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2H Password Recovery Abuse-Control And Cleanup Policy

Phase 2H adds a dedicated self-hosted password reset request limiter and a
bounded cleanup policy for password recovery tokens and delivery outbox rows.
The request limiter runs before account lookup so known and unknown account
requests keep the same public response shape.

Expected read/write profile:

- Every reset request performs a password-reset-specific limiter check before
  account lookup.
- Redis/memory modes use hashed email and optional IP buckets; audit-log mode
  can count recent `password_reset_requested` events as a local fallback.
- Allowed known-account requests keep Phase 2F writes: one token row, one
  outbox row and one security event.
- Allowed unknown-account requests write only the security event.
- Cleanup deletes bounded batches of expired/used token rows and terminal
  delivery rows.

Cache, queue and backpressure strategy:

- Production keeps `AUTH_RATE_LIMIT_DRIVER=redis` and
  `AUTH_RATE_LIMIT_FAIL_MODE=closed`.
- `AUTH_PASSWORD_RESET_WINDOW_MS` and
  `AUTH_PASSWORD_RESET_MAX_REQUESTS` tune reset pressure separately from
  sign-in failures.
- IP and email buckets prevent one client from cycling unknown email addresses.
- Cleanup is decoupled from public request handlers and can be run as a
  maintenance worker batch.

Database indexing and pagination strategy:

- `idx_yorso_auth_password_recovery_cleanup_expired` backs expired unused token
  cleanup.
- `idx_yorso_auth_password_recovery_cleanup_used` backs used token cleanup.
- `idx_yorso_auth_password_recovery_outbox_terminal_cleanup` backs terminal
  delivery cleanup for `sent`, `failed` and `cancelled` rows.
- PostgreSQL cleanup uses ordered bounded candidates with `skip locked`.

Failure mode and graceful degradation:

- Redis limiter failure blocks reset request bursts in production fail-closed
  mode and returns `auth_rate_limited` plus `Retry-After`.
- Rate-limited reset requests do not run account lookup and do not create
  token/outbox rows.
- Successful known and unknown requests remain generic and do not reveal the
  email or reset token.
- Cleanup failures affect maintenance only; reset request and delivery runtime
  continue through existing tables.

Observability and load-test plan:

- Auth telemetry emits `auth.password_reset.rate_limited` with source, count,
  limit and degraded/fail-mode fields.
- Security audit records `password_reset_rate_limited`.
- Load-test known/unknown reset request bursts, repeated IPs, Redis
  unavailable fail-closed behavior, delivery worker throughput, token
  completion and cleanup batch latency at the 10,000 concurrent-user baseline.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/server.test.ts -t "password reset|rate limiters|cleanup policy"`.
- Release validation passed: contracts build, DB migration tests,
  self-hosted guards, production-scale guard, full API tests, full `npm test`,
  lint, API build, self-hosted auth smoke, diff check and production build.

Marker: Backend Phase 2H.
Marker: password recovery abuse-control.
Marker: cleanupPasswordRecovery.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2I Password Recovery Cleanup Runtime

Phase 2I connects the Phase 2H cleanup policy to a self-hosted scheduler. The
cleanup worker is disabled by default in local mode, enabled explicitly in
production examples and started/stopped with the API process lifecycle.

Expected read/write profile:

- No public request path performs cleanup work.
- Each scheduler tick runs at most one `cleanupPasswordRecovery` batch.
- Default batch size is 500 rows.
- Default retention removes terminal delivery rows after seven days and
  expired/used token rows after 24 hours.

Cache, queue and backpressure strategy:

- `PasswordRecoveryCleanupScheduler` skips overlapping runs with
  `already_running`.
- Worker failures become `worker_error` events and retry on the next interval.
- Production config requires
  `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`.

Database indexing and pagination strategy:

- Phase 2H cleanup indexes remain the active database support.
- PostgreSQL cleanup uses ordered bounded candidates and `for update skip
  locked`, so concurrent API replicas avoid claiming the same cleanup rows.

Failure mode and graceful degradation:

- Local/dev may leave the worker disabled.
- Production fails closed without the cleanup scheduler enabled.
- A cleanup failure affects retention only; password reset request, completion
  and delivery continue through the existing self-hosted tables.

Observability and load-test plan:

- `yorso_api_password_recovery_cleanup_worker_runs_total` tracks
  success/failure/skipped by worker id and reason.
- `yorso_api_password_recovery_cleanup_worker_rows_total` tracks deleted
  recovery/outbox rows by type.
- Load-test with seeded expired tokens and terminal outbox rows under multiple
  API replicas, and verify public auth latency does not regress.

Validation:

- Focused scheduler/runtime/metrics/server tests.
- Self-hosted infra/runtime/API guards.
- `smoke:self-hosted-auth-api:run` marker
  `password_recovery_cleanup_runtime_guard=ok`.

Marker: Backend Phase 2I.
Marker: password recovery cleanup runtime.
Marker: createPasswordRecoveryCleanupRuntime.
Marker: observePasswordRecoveryCleanupWorker.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 2J Auth Surface Closure And Supabase Prototype Removal

Phase 2J closes Phases 2A-2I as one self-hosted auth, registration and password
recovery surface. The remaining auth Supabase prototype fallback was removed
from code: `src/lib/auth-runtime.ts` no longer branches on `VITE_SUPABASE_*`,
no longer emits `supabase_prototype`, and no longer loads
`legacy-auth-supabase-adapter`.

Expected read/write profile:

- Configured deployments use `/v1/auth/sign-in`, `/v1/auth/session`,
  `/v1/auth/sign-out`, `/v1/auth/password-reset/request` and
  `/v1/auth/password-reset/complete`.
- API-disabled preview uses the local contract only.
- No browser auth path calls Supabase Auth.

Cache, queue and backpressure strategy:

- Existing Redis-backed auth rate limits, delivery workers and cleanup
  scheduler remain the production backpressure mechanisms.
- Removing the hosted auth fallback reduces runtime branching and prevents a
  hidden hosted provider from absorbing production auth traffic.

Database indexing and pagination strategy:

- No new database tables or queries are introduced.
- Phase 2A-2I PostgreSQL indexes and bounded worker leases remain active.

Failure mode and graceful degradation:

- Self-hosted auth errors remain fail-closed when `VITE_YORSO_API_URL` is
  configured; the runtime does not fall back to local or hosted auth.
- API-disabled preview remains local-contract only.
- `VITE_SUPABASE_*` values do not change auth runtime behavior.

Observability and load-test plan:

- Existing auth observability, security events, password recovery delivery
  metrics and cleanup metrics remain active.
- Load-test auth through the self-hosted API only; validate no browser auth
  bundle imports the Supabase client or removed auth adapter.

After Backend Phase 3C, that active Supabase/prototype debt is retired from the
tracked product surface. Catalog, supplier-access and auth runtime fallbacks are
removed; reference tooling/tests, empty prototype env keys and
`@supabase/supabase-js` are removed. Historical docs can still describe earlier
prototype decisions.

Validation:

- `test:auth-runtime`.
- `check:self-hosted-api`.
- `check:production-scale-baseline`.
- Self-hosted auth API smoke.

Marker: Backend Phase 2J.
Marker: auth surface closure.
Marker: Supabase prototype auth fallback removed.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 3C Provider Reference Tooling Retirement

Phase 3C makes the active product surface provider-free.
`check:supabase-boundary` is replaced by `check:provider-boundary`, the
frontend smoke is now `smoke:e2e:frontend-provider-free-env`, and active
Supabase project/tooling/dependency/env/reference-test files are removed.

Expected read/write profile:

- No new public request path is introduced.
- Runtime reads and writes continue through the owned API, PostgreSQL, Redis and
  owned storage paths already documented in previous phases.
- Removing hosted-provider tooling eliminates a possible secondary external
  dependency during auth/catalog/access/admin development and CI.

Cache, queue and backpressure strategy:

- No new cache, queue or worker is introduced.
- Existing Redis/session/rate-limit/worker controls remain the only production
  backpressure surface.
- Provider-free browser smoke does not add polling or subscriptions.

Database indexing and pagination strategy:

- No migrations are added.
- DB migration validation stays inside `packages/db`; it no longer carries a
  provider-specific manifest role.

Failure mode and graceful degradation:

- Production source cannot fall back to removed hosted-provider clients because
  the dependency, integration directory and active scripts are gone.
- API-disabled preview remains local fixture/local contract only.

Observability and load-test plan:

- CI guards: `check:provider-boundary`,
  `smoke:e2e:frontend-provider-free-env`, `check:self-hosted-api`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`.
- Load testing remains scoped to owned API/PostgreSQL/Redis/storage boundaries.

Validation:

- `check:provider-boundary`.
- `smoke:e2e:frontend-provider-free-env`.
- `test:backend-contract`.
- `test:api`.
- `build`.

Marker: Backend Phase 3C.
Marker: Provider Reference Tooling Retirement.
Marker: provider-free frontend smoke.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4A Supplier Directory/Profile Source Of Truth Audit

Phase 4A closes the supplier directory/profile configured-mode prototype
fallback. `/suppliers` and `/suppliers/:supplierId` still support local
API-disabled preview, but when `VITE_YORSO_API_URL` is configured the frontend
does not substitute `mockSuppliers` after `/v1/suppliers` or
`/v1/suppliers/:supplierId` fails.

Expected read/write profile:

- No new write path is introduced.
- Supplier discovery reads stay on `/v1/suppliers` with `q`, quick-filter
  query fields, `sortBy`, `sortDirection`, `limit` and `offset`.
- Supplier profile reads stay on `/v1/suppliers/:supplierId`.
- Refresh failure may preserve previous successful API data, but first-load
  failure returns a visible API error and no prototype supplier rows/profile.

Cache, queue and backpressure strategy:

- No queue, polling loop or worker is added.
- Existing backend supplier-directory pagination and access-grant shaping remain
  the scaling boundary.
- Removing the fallback prevents hidden local fixture traffic from masking API
  overload or outage symptoms during buyer discovery.

Database indexing and pagination strategy:

- No migration is introduced in Phase 4A.
- Supplier search and pagination continue to rely on
  `0005_supplier_directory_search_scaling` and
  `0009_supplier_directory_pagination_sort`.
- Page-level controls remain server-backed; no client-only sorting over a
  partial server page is introduced.

Failure mode and graceful degradation:

- Configured `/suppliers` first-load failure shows a localized live directory
  error and retry action with zero prototype rows.
- Configured `/suppliers/:supplierId` first-load failure shows a retry state,
  not a not-found result and not a local fallback supplier profile.
- API-disabled preview remains explicitly local and non-production.

Observability and load-test plan:

- Validate with `test:supplier-directory-frontend`, `check:self-hosted-api` and
  `check:production-scale-baseline`.
- Load tests should include paginated supplier list reads, private search after
  grants, detail reads and forced API failure/retry paths.
- API failure telemetry can be added later if support needs aggregate error
  tracking.

Validation:

- `npx vitest run src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`.

Marker: Backend Phase 4A.
Marker: Supplier Directory/Profile Source Of Truth Audit.
Marker: configured supplier API fail-closed.
Marker: no configured supplier prototype fallback.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4B Supplier Profile Backend-Owned Dossier Completeness

Phase 4B moves supplier profile production/logistics dossier facts into the
self-hosted supplier directory record. `/suppliers/:supplierId` renders
`productionFacts` and `logisticsFacts` from `/v1/suppliers/:supplierId`; local
preview helpers are explicitly limited to API-disabled preview mode.

Expected read/write profile:

- No new public route, polling loop or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page, with production/logistics facts included in the existing supplier
  payload.
- Future writes to these facts belong to supplier owner/admin operations, not
  to the public buyer profile page.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure remains the scaling boundary for supplier
  detail reads.
- Bounded contract fields prevent unbounded profile payload growth:
  `productionFacts` contains numeric capability fields, while `logisticsFacts`
  caps array and string lengths.

Database indexing and pagination strategy:

- Migration `0031_supplier_profile_dossier_facts` adds bounded JSONB fields to
  `yorso_suppliers_directory`.
- No new list filter or sort is introduced, so supplier list pagination still
  relies on `0005_supplier_directory_search_scaling` and
  `0009_supplier_directory_pagination_sort`.
- Detail reads continue to use supplier id lookup plus publication status.

Failure mode and graceful degradation:

- Configured API failures keep Phase 4A fail-closed behavior and do not fall
  back to local profile synthesis.
- Legacy rows use conservative backend defaults (`0`/`TBC`) until backfilled,
  avoiding false frontend precision.
- API-disabled local preview remains separate through explicit local preview
  helpers.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  with the enlarged supplier payload.
- Future write paths must add audit events and metrics before release.

Validation:

- `npx vitest run src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/pages/__tests__/SupplierProfile.access.test.tsx`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.
- `test:db-migrations`.
- `test:db-contract`.

Marker: Backend Phase 4B.
Marker: Supplier Profile Backend-Owned Dossier Completeness.
Marker: productionFacts.
Marker: logisticsFacts.
Marker: 0031_supplier_profile_dossier_facts.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4C Supplier Profile Backend-Owned Evidence Blocks

Phase 4C moves supplier profile shipment evidence and FAQ blocks into the
self-hosted supplier directory record. `/suppliers/:supplierId` renders
`shipmentCases` and `faqItems` from `/v1/suppliers/:supplierId`; local preview
helpers are explicitly limited to API-disabled preview mode.

Expected read/write profile:

- No new public route, polling loop or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page, with shipment evidence and FAQ blocks included in the existing supplier
  payload.
- Future writes to these blocks belong to supplier owner/admin operations, not
  to the public buyer profile page.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure remains the scaling boundary for supplier
  detail reads.
- Bounded contract fields prevent unbounded profile payload growth:
  `shipmentCases` caps entries, i18n keys, product labels and photo captions;
  `faqItems` caps entries, keys and interpolation params.

Database indexing and pagination strategy:

- Migration `0032_supplier_profile_evidence_blocks` adds bounded JSONB array
  fields to `yorso_suppliers_directory`.
- No new list filter or sort is introduced, so supplier list pagination still
  relies on `0005_supplier_directory_search_scaling` and
  `0009_supplier_directory_pagination_sort`.
- Detail reads continue to use supplier id lookup plus publication status.

Failure mode and graceful degradation:

- Configured API failures keep Phase 4A fail-closed behavior and do not fall
  back to local profile synthesis.
- Legacy rows use empty evidence/FAQ arrays until backfilled, avoiding false
  frontend-generated evidence.
- API-disabled local preview remains separate through explicit local preview
  helpers.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  with the enlarged supplier payload.
- Future write paths must add audit events and metrics before release.

Validation:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`.

Marker: Backend Phase 4C.
Marker: Supplier Profile Backend-Owned Evidence Blocks.
Marker: shipmentCases.
Marker: faqItems.
Marker: 0032_supplier_profile_evidence_blocks.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4D Supplier Profile Legal/Compliance Details Source Boundary

Phase 4D moves restricted supplier profile legal/compliance details into the
self-hosted supplier directory record. `/suppliers/:supplierId` renders
`legalDetails` from `/v1/suppliers/:supplierId` for `qualified_unlocked` buyers
only; locked supplier responses keep `legalDetails: null`.

Expected read/write profile:

- No new public route, polling loop or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page.
- `legalDetails` is a bounded object included only in qualified supplier detail
  payloads.
- Future writes to legal/compliance details belong to supplier owner/admin
  operations, not to the public buyer profile page.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure remains the scaling boundary for supplier
  detail reads.
- Bounded contract fields prevent unbounded profile payload growth and require
  a stable ISO founded-date shape.

Database indexing and pagination strategy:

- Migration `0033_supplier_profile_legal_details` adds nullable JSONB object
  storage to `yorso_suppliers_directory`.
- No new list filter or sort is introduced, so supplier list pagination still
  relies on `0005_supplier_directory_search_scaling` and
  `0009_supplier_directory_pagination_sort`.
- Detail reads continue to use supplier id lookup plus publication status.

Failure mode and graceful degradation:

- Configured API failures keep Phase 4A fail-closed behavior and do not fall
  back to local profile synthesis.
- Legacy rows may keep `legal_details = null` until backfilled; the frontend
  does not generate production legal identifiers.
- Locked buyer responses stay null even if the source supplier row has legal
  details.
- API-disabled local preview remains separate through explicit local preview
  helpers.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  to verify restricted legal payload shaping under concurrency.
- Future write paths must add audit events and metrics before release.

Validation:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`.

Marker: Backend Phase 4D.
Marker: Supplier Profile Legal/Compliance Details Source Boundary.
Marker: legalDetails.
Marker: legal_details.
Marker: 0033_supplier_profile_legal_details.
Marker: qualified_unlocked.
Marker: not safe for locked buyer views.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4E Supplier Profile Restricted Document Payload Boundary

Phase 4E moves restricted supplier profile document metadata into the
self-hosted supplier directory record. `/suppliers/:supplierId` renders
`supplierDocuments` from `/v1/suppliers/:supplierId` for `qualified_unlocked`
buyers only; locked supplier responses keep `supplierDocuments: null`.

Expected read/write profile:

- No new public route, polling loop, scheduler or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page.
- `supplierDocuments` is a bounded array included only in qualified supplier
  detail payloads.
- Future writes to supplier documents belong to supplier owner/admin
  operations, not to the public buyer profile page.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure remains the scaling boundary for supplier
  detail reads.
- Bounded contract fields prevent unbounded profile payload growth and do not
  expose direct download URLs.

Database indexing and pagination strategy:

- Migration `0034_supplier_profile_restricted_documents` adds JSONB array
  storage to `yorso_suppliers_directory`.
- No new list filter or sort is introduced, so supplier list pagination still
  relies on `0005_supplier_directory_search_scaling` and
  `0009_supplier_directory_pagination_sort`.
- Detail reads continue to use supplier id lookup plus publication status.

Failure mode and graceful degradation:

- Configured API failures keep Phase 4A fail-closed behavior and do not fall
  back to local profile synthesis.
- Legacy rows may keep `supplier_documents = []` until backfilled; the frontend
  does not generate production document payloads.
- Locked buyer responses stay null even if the source supplier row has document
  metadata.
- API-disabled local preview remains separate through explicit local preview
  helpers.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  to verify restricted document payload shaping under concurrency.
- Future document download grants must add audit events, failure metrics and
  abuse/backpressure controls before release.

Validation:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`.

Marker: Backend Phase 4E.
Marker: Supplier Profile Restricted Document Payload Boundary.
Marker: supplierDocuments.
Marker: supplier_documents.
Marker: 0034_supplier_profile_restricted_documents.
Marker: qualified_unlocked.
Marker: locked buyer responses must contain null.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4F Supplier Document Download Grant Endpoint

Phase 4F adds a qualified-only supplier document download grant endpoint while
keeping `/suppliers/:supplierId` metadata-only. The grant response is typed by
`supplierDocumentDownloadGrantResponseSchema` and excludes `fileAssetId`, raw
storage keys and direct file URLs.

Expected read/write profile:

- Grant issuance is one authenticated `POST
  /v1/suppliers/:supplierId/documents/:documentId/grant` per buyer action.
- Each request performs one supplier detail read, one supplier access check and
  one append-only audit insert into `yorso_supplier_document_download_grants`.
- No list/profile route polling, scheduler or background worker is introduced.

Cache, queue and backpressure strategy:

- No queue is needed for synchronous grant issuance.
- API request guardrails, auth session validation and supplier access checks
  remain the backpressure boundary.
- Grant TTL is 15 minutes; replay window is intentionally short.

Database indexing and pagination strategy:

- Migration `0035_supplier_document_download_grants` creates the append-only
  audit table.
- Buyer recent, supplier recent and status recent indexes support bounded admin
  review/audit reads later.
- Granted rows have an expiry index for future cleanup/download validation.

Failure mode and graceful degradation:

- Missing or invalid session fails before grant logic.
- Missing supplier returns `supplier_not_found`.
- Missing supplier access returns `supplier_document_access_required` and does
  not check document existence.
- Non-downloadable documents return `supplier_document_unavailable`.
- Audit persistence failure fails closed; no grant is returned without audit.

Observability and load-test plan:

- Release validation must include API route tests, supplier repository audit
  persistence tests, DB migration/manifest tests, `check:self-hosted-api`,
  `check:production-scale-baseline`, TypeScript, lint and production build.
- Load tests should cover denied and granted attempts at the same
  buyer/supplier/document tuple and audit table growth under concurrent writes.
- Future byte-serving route must re-check grant expiry before streaming.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"`.

Marker: Backend Phase 4F.
Marker: Supplier Document Download Grant Endpoint.
Marker: supplierDocumentDownloadGrant.
Marker: supplier_document_download_grants.
Marker: 0035_supplier_document_download_grants.
Marker: qualified-only.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4G Supplier Document Grant Consumption / File Serving Endpoint

Phase 4G consumes Phase 4F document grants and streams restricted supplier
document bytes through the self-hosted API. The route is:

`GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`

Expected read/write profile:

- One authenticated GET per buyer document download.
- Reads: session validation, grant lookup by primary key, supplier access
  check, supplier document metadata read, file asset metadata read and object
  storage read.
- Writes: one append-only audit insert into
  `yorso_supplier_document_download_events` per success/failure attempt.

Cache, queue and backpressure strategy:

- No queue is needed for synchronous serving.
- `cache-control: private, no-store` prevents shared cache reuse of restricted
  document bytes.
- Existing API request timeout, header size guard, lifecycle drain handling and
  supplier access checks remain the immediate backpressure layer.
- Range requests and large-file streaming are deferred to a separate serving
  performance phase.

Database indexing and pagination strategy:

- Grant lookup uses `yorso_supplier_document_download_grants.id`.
- Migration `0036_supplier_document_download_events` creates the append-only
  serving/consumption audit table.
- Buyer recent, supplier recent, grant recent and status recent indexes support
  bounded future admin review.

Failure mode and graceful degradation:

- Missing/invalid session fails before grant lookup.
- Missing `grantId` returns `supplier_document_grant_required`.
- Missing/non-granted grant returns `supplier_document_grant_not_found`.
- Buyer/supplier/document mismatch returns `supplier_document_grant_denied`.
- Expired grants return `supplier_document_grant_expired`.
- Revoked supplier access returns `supplier_document_access_required`.
- Missing file asset returns `supplier_document_file_unavailable`.
- Audit persistence failure fails closed.

Observability and load-test plan:

- Release validation must include route tests, storage internal asset read tests,
  supplier repository consumption-audit tests, DB migration/manifest tests,
  runtime smoke markers, `check:self-hosted-api`,
  `check:production-scale-baseline`, TypeScript, lint and production build.
- Load tests should cover missing grant, expired grant, valid download and
  repeated same-grant download attempts at concurrent load.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "supplier document download grants"`.

Marker: Backend Phase 4G Supplier Document Grant Consumption / File Serving Endpoint.
Marker: supplier_document_download_events.
Marker: 0036_supplier_document_download_events.
Marker: grant_expired.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4H Supplier Document Download UI Integration

Phase 4H connects the qualified supplier profile document rows to the
self-hosted Phase 4F grant endpoint and Phase 4G download endpoint. It does not
add new backend tables, workers, polling loops or provider dependencies.

Expected read/write profile:

- One buyer click issues one grant POST and one file GET through the API.
- Reads: current browser buyer session headers and the already-loaded supplier
  profile payload.
- Writes: no frontend-owned write; backend grant/download audit writes remain
  owned by Phase 4F and Phase 4G.
- Locked buyers do not trigger grant/download requests.

Cache, queue and backpressure strategy:

- The UI does not cache restricted document bytes.
- The download button is disabled while the clicked row is pending.
- Backend `cache-control: private, no-store`, grant TTL, request timeout and
  document-serving guardrails remain the backpressure boundary.
- No queue or runtime scheduler is introduced in the frontend.

Database indexing and pagination strategy:

- No new index is required in Phase 4H.
- Existing grant and download-event indexes continue to cover backend audit
  writes.
- Supplier profile document rows remain bounded by the supplier profile payload;
  a separate admin document listing must use pagination later.

Failure mode and graceful degradation:

- API-disabled preview shows no download action.
- Expired grants show localized retry copy.
- Failed download attempts show localized retry copy without `fileAssetId`,
  object key, storage key or direct file URL exposure.
- Backend document rows stay visible in the production passport even when
  optional logistics facts are absent.

Observability and load-test plan:

- Release validation must include the supplier-directory API client test,
  SupplierProfile access tests, API-backed profile e2e, self-hosted guards,
  TypeScript, lint, production build and full test gates.
- Load tests should combine Phase 4F/4G grant/download backend scenarios with
  browser-level qualified profile clicks at the 10,000 concurrent-user target.
- Track grant failure rate, download event failure rate, storage latency and
  duplicate-click suppression.

Validation:

- `npm test -- src/lib/supplier-directory-api.test.ts`.
- `npm run test:supplier-directory-frontend`.
- `npm run smoke:e2e:supplier-directory-profile-api-flow`.

Marker: Backend Phase 4H Supplier Document Download UI Integration.
Marker: downloadSupplierDocument.
Marker: supplier-document-download.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4I Supplier Document Download Audit Listing

Phase 4I adds a bounded admin read endpoint for supplier document download
audit events. It does not add owner upload/editing, grant audit listing,
exports, schedulers or new database tables.

Expected read/write profile:

- One admin request reads at most 100 rows from
  `yorso_supplier_document_download_events`.
- Optional filters: `status`, `supplierId`, `buyerUserId`.
- Writes: none in Phase 4I.
- Existing grant/download writes remain owned by Phase 4F and Phase 4G.

Cache, queue and backpressure strategy:

- No queue, worker or scheduler is introduced.
- Existing API auth, admin role guard, request timeout, lifecycle drain and
  JSON response limits are the backpressure boundary.
- Operator audit data is not shared-cacheable.
- The endpoint fails closed for missing sessions, non-admin sessions and invalid
  query params.

Database indexing and pagination strategy:

- Existing migration `0036_supplier_document_download_events` provides indexes
  for buyer, supplier and status recent reads:
  - `idx_yorso_supplier_document_download_events_buyer_recent`;
  - `idx_yorso_supplier_document_download_events_supplier_recent`;
  - `idx_yorso_supplier_document_download_events_status_recent`.
- Query order is `created_at desc, id asc`.
- Pagination is bounded by `limit <= 100` and `offset <= 10 000`.
- No unbounded export is introduced in this phase.

Failure mode and graceful degradation:

- Missing or invalid account session returns 401.
- Buyer/non-admin session returns `admin_role_required`.
- Invalid query params return `validation_error`.
- Empty result returns `ok: true` with `items: []`.
- Response shaping strips `fileAssetId`, object keys, storage keys, direct file
  URLs and `downloadPath`.

Observability and load-test plan:

- Reads emit audit action
  `admin.supplier_document_download_events.read`.
- Release validation must include the admin route test, supplier repository
  test, self-hosted API guard, production-scale guard, TypeScript, lint, build
  and full test suite.
- Load tests should cover unfiltered reads, `status=downloaded`,
  `supplierId`, `buyerUserId`, empty-result reads and blocked non-admin reads at
  the 10,000 concurrent-user target.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document download audit without file asset leakage"`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.

Marker: Backend Phase 4I Supplier Document Download Audit Listing.
Marker: /v1/admin/supplier-documents/download-events.
Marker: supplierDocumentDownloadEventAdminListResponseSchema.
Marker: admin.supplier_document_download_events.read.
Marker: yorso_supplier_document_download_events.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4J Supplier Document Grant Audit Listing

Phase 4J adds a bounded admin read endpoint for supplier document grant audit
records. It does not add owner upload/editing, exports, schedulers or new
database tables.

Expected read/write profile:

- One admin request reads at most 100 rows from
  `yorso_supplier_document_download_grants`.
- Optional filters: `status`, `supplierId`, `buyerUserId`.
- Writes: none in Phase 4J.
- Existing grant writes remain owned by Phase 4F.

Cache, queue and backpressure strategy:

- No queue, worker or scheduler is introduced.
- Existing API auth, admin role guard, request timeout, lifecycle drain and
  JSON response limits are the backpressure boundary.
- Operator audit data is not shared-cacheable.
- The endpoint fails closed for missing sessions, non-admin sessions and invalid
  query params.

Database indexing and pagination strategy:

- Existing migration `0035_supplier_document_download_grants` provides indexes
  for buyer, supplier and status recent reads:
  - `idx_yorso_supplier_document_grants_buyer_recent`;
  - `idx_yorso_supplier_document_grants_supplier_recent`;
  - `idx_yorso_supplier_document_grants_status_recent`.
- Query order is `created_at desc, id asc`.
- Pagination is bounded by `limit <= 100` and `offset <= 10 000`.
- No unbounded export is introduced in this phase.

Failure mode and graceful degradation:

- Missing or invalid account session returns 401.
- Buyer/non-admin session returns `admin_role_required`.
- Invalid query params return `validation_error`.
- Empty result returns `ok: true` with `items: []`.
- Response shaping strips `fileAssetId`, object keys, storage keys, direct file
  URLs and `downloadPath`.

Observability and load-test plan:

- Reads emit audit action
  `admin.supplier_document_download_grants.read`.
- Release validation must include the admin route test, supplier repository
  test, self-hosted API guard, production-scale guard, TypeScript, lint, build
  and full test suite.
- Load tests should cover unfiltered reads, `status=granted`,
  `status=access_denied`, `supplierId`, `buyerUserId`, empty-result reads and
  blocked non-admin reads at the 10,000 concurrent-user target.

Validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document grant audit without file asset leakage"`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.

Marker: Backend Phase 4J Supplier Document Grant Audit Listing.
Marker: /v1/admin/supplier-documents/download-grants.
Marker: supplierDocumentDownloadGrantAdminListResponseSchema.
Marker: admin.supplier_document_download_grants.read.
Marker: yorso_supplier_document_download_grants.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4K - Supplier Document Audit Admin UI

Status: implemented.

Phase 4K adds a read-only admin route over the existing Phase 4I/4J supplier
document audit endpoints:

- `/admin/supplier-document-audit`;
- `GET /v1/admin/supplier-documents/download-grants`;
- `GET /v1/admin/supplier-documents/download-events`.

Plan / Fact:

| Plan | Fact | Follow-up |
|---|---|---|
| Add one operator view for document grants and downloads. | `AdminSupplierDocumentAudit.tsx` renders a kind switch, bounded filters and audit rows. | Owner/admin document upload remains out of scope. |
| Reuse existing self-hosted backend endpoints. | No new backend endpoint, migration, scheduler or export is introduced. | Cursor pagination/export only after a separate requirement. |
| Preserve storage boundary. | Frontend client rejects responses containing `fileAssetId`, `downloadPath`, `objectKey` or `storage`; UI renders audit metadata only. | Backend file forensics remain repository/internal only. |
| Keep tests and browser smoke. | Added API client, hook, page tests and `e2e/admin-supplier-document-audit.spec.ts`. | Include in release validation for admin UI changes. |

Expected read/write profile:

- One bounded read on page load.
- Filter changes issue bounded reads with `limit=25`, `offset=0`.
- No writes, file reads, export, timers, polling or queues are added.

Cache, queue and backpressure strategy:

- No shared frontend cache for operator audit data.
- No queue/scheduler.
- Backend admin auth, request guardrails, timeout and lifecycle drain remain the
  production backpressure boundary.
- UI fails closed on API disabled, missing session, admin-role rejection and
  storage-leaking invalid responses.

Database indexing and pagination strategy:

- UI relies on existing Phase 4I/4J endpoint indexes:
  - grants by buyer, supplier and status recent reads;
  - download events by buyer, supplier, status and grant recent reads.
- UI sends `limit=25`, below backend `limit <= 100`.
- Offset remains fixed at 0 in this first view; deeper pagination can be added
  after operator workflow confirms it is needed.

Failure mode and graceful degradation:

- Empty result renders an explicit empty state.
- API-disabled deployments render a self-hosted API disabled state.
- Missing self-hosted session renders a sign-in gate.
- Non-admin sessions render the admin role guard.
- Invalid payloads render an error state and are not displayed.

Observability and load-test plan:

- Backend reads continue to emit:
  - `admin.supplier_document_download_grants.read`;
  - `admin.supplier_document_download_events.read`.
- Browser smoke verifies session headers, page route, admin role guard and
  absence of storage-only field names in visible UI.
- Load tests should cover grant list, event list, status filter, supplier
  filter, buyer filter, empty result and forbidden sessions at the 10,000
  concurrent-user target.

Validation:

- `npm run test:admin-supplier-document-audit-frontend`.
- `npm run smoke:e2e:admin-supplier-document-audit:run`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4K Supplier Document Audit Admin UI.
Marker: /admin/supplier-document-audit.
Marker: createAdminSupplierDocumentAuditApiClient.
Marker: useAdminSupplierDocumentAudit.
Marker: admin-document-audit-page.
Marker: admin-supplier-document-audit.spec.ts.
Marker: /v1/admin/supplier-documents/download-events.
Marker: /v1/admin/supplier-documents/download-grants.
Marker: fileAssetId.
Marker: downloadPath.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.

## Backend Phase 4L - Supplier Document Management Rules Gate

Status: implemented.

Phase 4L adds the owner/admin document management policy gate before any
supplier document upload/edit/delete runtime endpoint exists. It is a
contract-and-policy increment only: no browser route, API write route,
database migration, file write, queue or worker is introduced.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Define who can manage supplier documents. | Shared contract defines `supplier_owner` and `admin`; API policy evaluates those roles. | Bind roles to real session/account claims in a future write endpoint. |
| Lock approved documents against direct owner edits. | `approved_document_immutable` blocks metadata update/delete on approved docs. | Replacement/re-review flow remains separate. |
| Keep approval workflow admin-only. | `approve`, `reject` and `expire` require `admin`; supplier owner receives `admin_role_required`. | Admin mutation routes and UI remain future scoped work. |
| Protect storage internals. | Browser schemas reject `fileAssetId`, object/storage keys, `downloadPath` and direct URLs. | Upload runtime must bind files server-side from backend-owned upload ids. |
| Make audit names stable. | `supplierDocumentManagementAuditActionByAction` maps each action to `supplier_document.*`. | Runtime routes must emit these audit actions. |

Expected read/write profile:

- Current runtime profile is zero reads and zero writes.
- Future owner/admin writes should be low-volume operational actions.
- Each future mutation must perform one authenticated session read, one
  ownership/admin authorization read, one document read with row lock or version
  precondition, one bounded write and one audit write.

Cache, queue and backpressure strategy:

- No cache, queue, scheduler, polling or worker is added in this phase.
- Future write endpoints must remain uncached and rely on API request
  guardrails, body-size limits, session fail-closed behavior and transaction
  boundaries.
- Virus scanning, async file processing or external object-storage retries
  require a separate outbox/worker phase.

Database indexing and pagination strategy:

- No migration is introduced in Phase 4L.
- Existing supplier document read payload remains bounded.
- Future normalized document-management persistence must index by supplier,
  status and updated time, and keep admin listings bounded by `limit <= 100` or
  cursor pagination.

Failure mode and graceful degradation:

- Missing current status for non-create actions returns
  `current_status_required`.
- Invalid transitions return `invalid_status_transition`.
- Approved document metadata update/delete returns
  `approved_document_immutable`.
- Owner approval/rejection/expiry returns `admin_role_required`.
- Browser payloads with storage internals fail strict schema validation.

Observability and load-test plan:

- Future routes must emit the stable `supplier_document.*` audit actions.
- Unit coverage verifies contract schemas, strict storage-field rejection,
  audit-event shape and the owner/admin status decision matrix.
- Future load tests must cover owner create/update/submit, admin
  approve/reject/expire, immutable approved document failures, malformed
  payloads and concurrent version conflicts at the 10,000 concurrent-user
  baseline.

Validation:

- `npm run test:supplier-document-management-policy`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4L Supplier Document Management Rules Gate.
Marker: supplierDocumentManagementCreateRequestSchema.
Marker: supplierDocumentManagementAuditEventSchema.
Marker: evaluateSupplierDocumentManagementPolicy.
Marker: supplierDocumentManagementAuditActionByAction.
Marker: approved_document_immutable.
Marker: admin_role_required.
Marker: 10,000 concurrent users.

## Backend Phase 4M - Supplier Owner Document Create Runtime

Status: implemented.

Phase 4M adds the first supplier document management write path:
authenticated supplier owner creates a new `review` document from a
self-hosted backend-owned upload id.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Implement one write path only. | `POST /v1/suppliers/:supplierId/documents` creates `review` documents for supplier owners. | Admin approve/reject and owner update/delete are separate scopes. |
| Bind owner to account/company. | Route requires self-hosted session, `accountRole=supplier|both` and matching supplier `company_id`. | Supplier staff permission granularity remains future work. |
| Keep storage internals private. | Response omits `fileAssetId`, object keys, storage keys and direct URLs. | Supplier-specific upload UX can be added later. |
| Persist audit. | `supplier_document.create` is inserted into `yorso_supplier_document_management_events`. | Admin management-event listing remains future work. |

Expected read/write profile:

- This is low-volume operational write traffic, not public catalog browsing.
- A successful request performs one session resolution, one company read, one
  file asset ownership read, one supplier row update guarded by
  `supplier_id + company_id`, and one audit insert.
- The endpoint stays uncached.

Cache, queue and backpressure strategy:

- Existing request-size, timeout, lifecycle and session fail-closed guardrails
  apply.
- No queue, scheduler, polling, worker or external provider is added.
- File scanning/transformation requires a separate outbox/worker phase before
  production expansion.

Database indexing and pagination strategy:

- The write path is a point mutation on supplier id and company id.
- `yorso_supplier_document_management_events` has supplier/recent,
  actor/recent, action/recent and supplier/document/recent indexes.
- Future admin listing over this audit table must use bounded `limit <= 100`
  or cursor pagination.

Failure mode and graceful degradation:

- Missing/invalid session uses existing account session errors.
- Buyer-only account role or company mismatch returns
  `supplier_document_owner_required`.
- Missing file returns `file_asset_not_found`.
- Wrong company/file purpose returns `supplier_document_file_unavailable`.
- File-name mismatch returns `supplier_document_file_name_mismatch`.
- Duplicate document returns `supplier_document_conflict`.
- Failed responses do not reveal storage internals.

Observability and load-test plan:

- Successful mutations persist `supplier_document.create`.
- Smoke output must include `supplier_document_owner_create_review=ok`.
- Load tests should cover concurrent owner creates, duplicate file/document
  conflicts, malformed payloads, wrong owner company, missing files and
  storage-field redaction at the 10,000 concurrent-user baseline.

Validation:

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run test:db-migrations`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4M Supplier Owner Document Create Runtime.
Marker: /v1/suppliers/:supplierId/documents.
Marker: createSupplierDocumentForOwner.
Marker: supplierDocumentManagementCreateResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: 0037_supplier_document_management_events.
Marker: supplier_document_owner_create_review=ok.
Marker: supplier_document.create.
Marker: 10,000 concurrent users.

## Backend Phase 4N - Supplier Document Admin Decision Runtime

Status: implemented.

Phase 4N adds the admin decision mutation for supplier documents under review:
approve to `approved` or reject back to `on_request`.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Add admin-only decision route. | `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision` implemented. | Admin expire/delete and owner update/delete remain separate scopes. |
| Apply Phase 4L policy. | `decideSupplierDocumentAsAdmin` allows only `review -> approved` and `review -> on_request`. | Replacement/re-review flow remains future work. |
| Keep storage internals private. | Decision response omits `fileAssetId`, object keys, storage keys, `downloadPath` and direct URLs. | Same boundary must hold for future update/expire/delete. |
| Persist audit. | `supplier_document.approve` / `supplier_document.reject` are inserted into `yorso_supplier_document_management_events`. | Admin management-event listing remains future work. |

Expected read/write profile:

- This is low-volume admin/operator mutation traffic.
- A successful request performs one session resolution, one admin role check,
  one supplier detail read, one supplier row JSONB status update and one audit
  insert.
- The endpoint stays uncached.

Cache, queue and backpressure strategy:

- Existing request-size, timeout, lifecycle and session fail-closed guardrails
  apply.
- No queue, scheduler, polling, worker or external provider is added.
- Bulk approval/rejection must be a separate bounded queue/backpressure phase.

Database indexing and pagination strategy:

- The mutation is a point write by supplier id and document id.
- `yorso_supplier_document_management_events` already has supplier/recent,
  actor/recent, action/recent and supplier/document/recent indexes.
- Future management-event listing must use bounded `limit <= 100` or cursor
  pagination.

Failure mode and graceful degradation:

- Missing/invalid session uses existing account session errors.
- Non-admin sessions return `admin_role_required`.
- Missing supplier returns `supplier_not_found`.
- Missing document returns `supplier_document_not_found`.
- Repeated or stale decisions return `invalid_status_transition`.
- Failed responses do not reveal storage internals.

Observability and load-test plan:

- Successful mutations persist `supplier_document.approve` or
  `supplier_document.reject`.
- Admin route attempts are emitted through the admin audit sink as
  `admin.supplier_document_management.decide`.
- Smoke output must include `supplier_document_admin_decision_review=ok`.
- Load tests should cover concurrent decisions on the same review document,
  stale status conflicts, malformed payloads and admin role denial at the
  10,000 concurrent-user baseline.

Validation:

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4N Supplier Document Admin Decision Runtime.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision.
Marker: decideSupplierDocumentAsAdmin.
Marker: supplierDocumentManagementDecisionResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_admin_decision_review=ok.
Marker: supplier_document.approve.
Marker: supplier_document.reject.
Marker: 10,000 concurrent users.

## Backend Phase 4O - Supplier Document Owner Correction Runtime

Status: implemented.

Phase 4O adds supplier-owner metadata update and delete for non-approved
supplier documents. Admin expire/delete, approved-document replacement and
frontend document management UI remain outside this increment.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Add owner metadata update route. | `PATCH /v1/suppliers/:supplierId/documents/:documentId` updates `review/on_request` metadata. | File replacement and submit-for-review remain future scopes. |
| Add owner delete route. | `DELETE /v1/suppliers/:supplierId/documents/:documentId` deletes `review/on_request` documents. | Admin expire/delete and approved replacement remain future scopes. |
| Apply Phase 4L policy. | `updateSupplierDocumentForOwner` and `deleteSupplierDocumentForOwner` enforce owner mutability rules. | All future mutations must reuse the policy layer. |
| Keep storage internals private. | Responses omit `fileAssetId`, object keys, storage keys, `downloadPath` and direct URLs. | Same boundary must hold for file replacement. |
| Persist audit. | `supplier_document.update_metadata` / `supplier_document.delete` are inserted into `yorso_supplier_document_management_events`. | Admin management-event listing remains future work. |

Expected read/write profile:

- This is low-volume supplier-owner operational mutation traffic.
- A successful request performs one session resolution, one company read, one
  supplier detail read, one supplier/company ownership read, one supplier row
  JSONB update/delete and one audit insert.
- The endpoints stay uncached.

Cache, queue and backpressure strategy:

- Existing request-size, timeout, lifecycle and session fail-closed guardrails
  apply.
- No queue, scheduler, polling, worker or external provider is added.
- File replacement/scanning must be a separate outbox/worker phase.

Database indexing and pagination strategy:

- The mutations are point writes by supplier id, owner company id and document
  id.
- `yorso_supplier_document_management_events` already has supplier/recent,
  actor/recent, action/recent and supplier/document/recent indexes.
- Future management-event listing must use bounded `limit <= 100` or cursor
  pagination.

Failure mode and graceful degradation:

- Missing/invalid session uses existing account session errors.
- Buyer-only account role or company mismatch returns
  `supplier_document_owner_required`.
- Missing supplier returns `supplier_not_found`.
- Missing document returns `supplier_document_not_found`.
- Approved document update/delete returns `approved_document_immutable`.
- Stale status races return `invalid_status_transition`.
- Failed responses do not reveal storage internals.

Observability and load-test plan:

- Successful mutations persist `supplier_document.update_metadata` or
  `supplier_document.delete`.
- Smoke output must include `supplier_document_owner_update_delete=ok`.
- Load tests should cover concurrent owner update/delete on the same document,
  wrong company ids, malformed metadata, immutable approved-document attempts
  and stale status conflicts at the 10,000 concurrent-user baseline.

Validation:

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4O Supplier Document Owner Correction Runtime.
Marker: /v1/suppliers/:supplierId/documents/:documentId.
Marker: updateSupplierDocumentForOwner.
Marker: deleteSupplierDocumentForOwner.
Marker: supplierDocumentManagementUpdateResponseSchema.
Marker: supplierDocumentManagementDeleteResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_owner_update_delete=ok.
Marker: supplier_document.update_metadata.
Marker: supplier_document.delete.
Marker: approved_document_immutable.
Marker: 10,000 concurrent users.

## Backend Phase 4P - Supplier Document Admin Lifecycle Cleanup

Status: implemented.

Phase 4P adds admin lifecycle cleanup for supplier documents: expire approved
documents and delete review/on_request/expired documents through one
self-hosted admin route. Frontend UI, automated expiry scheduling and file
replacement remain outside this increment.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Add admin lifecycle route. | `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle` accepts `expire/delete`. | Admin UI and management-event listing remain future scopes. |
| Expire approved documents. | `action=expire` changes `approved -> expired`. | Automated expiry scheduler remains future work. |
| Delete cleanup documents. | `action=delete` removes `review/on_request/expired`; `approved` is immutable. | Replacement flow remains future work. |
| Keep storage internals private. | Responses omit `fileAssetId`, object keys, storage keys, `downloadPath` and direct URLs. | Same boundary must hold for replacement/file lifecycle. |
| Persist audit. | `supplier_document.expire` / admin `supplier_document.delete` are inserted into `yorso_supplier_document_management_events`. | Management-event listing/export remains future work. |

Expected read/write profile:

- This is low-volume admin operational mutation traffic.
- A successful request performs one session resolution, one admin role check,
  one supplier detail read, one supplier row JSONB update/delete and one audit
  insert.
- The endpoint stays uncached.

Cache, queue and backpressure strategy:

- Existing request-size, timeout, lifecycle and session fail-closed guardrails
  apply.
- No queue, scheduler, polling, worker or external provider is added.
- Automated expiry and file scanning/replacement must use separate
  outbox/worker phases.

Database indexing and pagination strategy:

- The mutation is a point write by supplier id, document id and current status.
- The current status predicate prevents stale lifecycle races.
- `yorso_supplier_document_management_events` already has supplier/recent,
  actor/recent, action/recent and supplier/document/recent indexes.
- Future management-event listing must use bounded `limit <= 100` or cursor
  pagination.

Failure mode and graceful degradation:

- Missing/invalid session uses existing account session errors.
- Non-admin accounts return `admin_role_required`.
- Missing supplier returns `supplier_not_found`.
- Missing document returns `supplier_document_not_found`.
- Approved document delete returns `approved_document_immutable`.
- Invalid lifecycle status transitions return `invalid_status_transition`.
- Failed responses do not reveal storage internals.

Observability and load-test plan:

- Successful expiry persists `supplier_document.expire`.
- Successful admin deletion persists `supplier_document.delete` with
  `actorRole=admin`.
- Admin route attempts emit `admin.supplier_document_management.lifecycle`.
- Smoke output must include `supplier_document_admin_lifecycle_cleanup=ok`.
- Load tests should cover concurrent expire/delete on the same document,
  repeated lifecycle actions, malformed payloads, non-admin denial and
  immutable approved-document delete at the 10,000 concurrent-user baseline.

Validation:

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4P Supplier Document Admin Lifecycle Cleanup.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle.
Marker: manageSupplierDocumentLifecycleAsAdmin.
Marker: expireSupplierDocumentAsAdmin.
Marker: deleteSupplierDocumentAsAdmin.
Marker: supplierDocumentManagementLifecycleRequestSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_admin_lifecycle_cleanup=ok.
Marker: supplier_document.expire.
Marker: supplier_document.delete.
Marker: approved_document_immutable.
Marker: 10,000 concurrent users.

## Backend Phase 4Q - Supplier Document Management Event Listing And Export

Status: implemented.

Phase 4Q adds bounded admin listing and export for supplier document management
events already persisted by Phases 4M-4P. Frontend UI, lifecycle mutations,
retention jobs and automated expiry scheduling remain outside this increment.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Add admin listing endpoint. | `GET /v1/admin/supplier-documents/management-events` reads management events. | Frontend admin UI remains future work. |
| Add bounded export. | `GET /v1/admin/supplier-documents/management-events/export?format=json|csv` exports the same bounded page. | Scheduled reporting remains future work. |
| Support indexed filters. | `action`, `supplierId`, `documentId`, `actorUserId`, `limit`, `offset`. | Cursor pagination if offset cap becomes insufficient. |
| Keep storage internals private. | Responses/exports omit `fileAssetId`, object keys, storage keys, `downloadPath` and direct URLs. | Same boundary must hold for UI/export consumers. |
| Reuse existing audit table. | Reads `yorso_supplier_document_management_events`; no new migration. | Retention policy remains a separate scope. |

Expected read/write profile:

- This is low-volume admin/operator read traffic.
- A successful request performs one session resolution, one admin role check and
  one bounded indexed read.
- The only write is the existing route-level API audit sink.
- No public browse or buyer workflow traffic depends on this route.

Cache, queue and backpressure strategy:

- No application cache is used because data is operational audit material.
- Existing request timeout, draining and session fail-closed guardrails apply.
- `limit <= 100` and `offset <= 10000` cap read amplification.
- JSON/CSV export uses the same bounded read path; no full-table export is
  introduced.

Database indexing and pagination strategy:

- Uses existing indexes on `yorso_supplier_document_management_events`:
  supplier/recent, actor/recent, action/recent and supplier/document/recent.
- PostgreSQL orders by `created_at desc, id desc`.
- Future cursor pagination can use `(created_at, id)` if operator volume grows
  beyond the offset cap.

Failure mode and graceful degradation:

- Missing/invalid session uses existing account session errors.
- Non-admin accounts return `admin_role_required`.
- Invalid filters or export format return contract validation errors.
- Empty pages return `ok=true` with `items=[]`.
- Failed responses do not expose storage internals.

Observability and load-test plan:

- Route-level admin reads emit
  `admin.supplier_document_management_events.read`.
- Route-level admin exports emit
  `admin.supplier_document_management_events.export`.
- Smoke output must include `supplier_document_management_events_export=ok`.
- Load tests should cover filtered listing, JSON export, CSV export, invalid
  query params and empty pages at the 10,000 concurrent-user baseline.

Validation:

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4Q Supplier Document Management Event Listing And Export.
Marker: /v1/admin/supplier-documents/management-events.
Marker: /v1/admin/supplier-documents/management-events/export.
Marker: listAdminSupplierDocumentManagementEvents.
Marker: exportAdminSupplierDocumentManagementEvents.
Marker: listSupplierDocumentManagementEvents.
Marker: supplierDocumentManagementEventAdminQuerySchema.
Marker: supplierDocumentManagementEventExportQuerySchema.
Marker: supplierDocumentManagementEventAdminListResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_management_events_export=ok.
Marker: admin.supplier_document_management_events.read.
Marker: admin.supplier_document_management_events.export.
Marker: 10,000 concurrent users.

## Backend Phase 4R - Supplier Document Management Events Admin UI

Status: implemented.

Phase 4R adds a read-only admin UI over the Phase 4Q supplier document
management event listing/export endpoints. No new backend tables, schedulers,
lifecycle mutations or storage behavior changes are introduced in this phase.

План / факт:

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Add read-only admin UI route. | `/admin/supplier-document-management-events` renders a bounded event list. | Add deep links only when supplier/document views exist. |
| Add adapter/hook contract and tests. | Adapter/hook/page unit tests cover disabled/session/forbidden/ready states. | Cursor pagination only if audit volume requires it. |
| Keep storage internals private in the browser. | Frontend rejects storage-only fields and keeps session ids out of DOM. | Preserve boundary when adding download UX. |
| Add browser smoke gate. | `smoke:e2e:admin-supplier-document-management-events` covers list + export. | Expand only if the UI becomes mutation-capable. |

Expected read/write profile:

- Admin/operator read-only traffic; not on the buyer/supplier critical path.
- UI performs one bounded list request per refresh and optional bounded export
  requests; no full-table exports exist.
- The only write is the existing route-level API audit sink.

Cache, queue and backpressure strategy:

- No application cache is added; audit visibility must be current.
- UI uses bounded `limit/offset` and relies on existing request timeouts and
  fail-closed session handling.

Failure mode and graceful degradation:

- If VITE_YORSO_API_URL is missing, UI shows an explicit disabled state.
- Missing/invalid session shows an explicit session-required state.
- Non-admin accounts show an explicit forbidden state.
- Errors surface a bounded message without leaking backend URLs or storage
  fields.

Observability and load-test plan:

- Admin list requests emit `admin.supplier_document_management_events.read`.
- Admin exports emit `admin.supplier_document_management_events.export`.
- Browser smoke covers:
  - session headers (`x-yorso-user-id`, `x-yorso-session-id`);
  - list + JSON/CSV export wiring;
  - storage-redaction guard in the DOM.

Validation:

- `npm run test:admin-supplier-document-management-events-frontend`;
- `npm run smoke:e2e:admin-supplier-document-management-events`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`.

Marker: Backend Phase 4R Supplier Document Management Events Admin UI.
Marker: /admin/supplier-document-management-events.
Marker: createAdminSupplierDocumentManagementEventsApiClient.
Marker: useAdminSupplierDocumentManagementEvents.
Marker: admin-supplier-document-management-events.spec.ts.
Marker: 10,000 concurrent users.

## Release Rule

If a change affects production frontend, backend, persistence, queues,
integrations or runtime behavior, release signoff must either:

1. reference a capacity review against this document; or
2. explicitly mark the change as prototype-only.

If neither is true, the change is not production-ready.
