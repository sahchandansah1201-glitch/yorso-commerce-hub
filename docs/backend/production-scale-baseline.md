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
- Supabase, Firebase, Appwrite, Clerk, Auth0, hosted BaaS platforms and similar
  third-party application backends must not be production dependencies.
- Legacy Supabase files may remain only as prototype/reference material while
  they are being retired behind self-hosted YORSO adapters.

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

Batch #69 closes the legacy supplier access Supabase adapter boundary.
`src/lib/supplier-access-api.ts` remains the self-hosted-first access facade:
configured deployments use `/v1/access/suppliers/:supplierId/request` and
`/v1/access/notifications`, while the temporary Supabase read/write path is
isolated in `src/lib/legacy-supplier-access-supabase-adapter.ts`. The legacy
adapter owns `supplier_access_requests` reads/inserts and
`log_supplier_access_event` calls for prototype continuity only. At 10,000
concurrent users this prevents the buyer access hot path from depending on
prototype Supabase auth/RLS while preserving local fallback behavior for
unfinished environments. `src/lib/supplier-access-api.boundary.test.ts`,
`check:self-hosted-api` and `check:production-scale-baseline` prevent direct
Supabase imports from returning to the supplier access facade.

Batch #70 closes the legacy auth Supabase adapter boundary.
`src/lib/auth-runtime.ts` remains the production-facing auth facade for
sign-in, password reset, recovery-session observation and recovered password
updates, but it no longer imports the Supabase client directly. Prototype
Supabase email auth is isolated in `src/lib/legacy-auth-supabase-adapter.ts`
and is loaded only when prototype Supabase env variables are present. At 10,000
concurrent users this keeps sign-in and reset routes deployable without
prototype credentials and prevents page-level auth flows from becoming hidden
Supabase production dependencies. `src/lib/auth-runtime.boundary.test.ts`,
`check:self-hosted-api` and `check:production-scale-baseline` prevent direct
Supabase imports from returning to the auth runtime facade.

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
`VITE_SUPABASE_*` inputs, while the no-Supabase frontend smoke continues to
prove that public, auth and catalog routes boot without prototype credentials.
At 10,000 concurrent users this matters because the production hot path must
be operable, observable and recoverable inside the owned stack rather than
depending on third-party application backend availability.

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

## Release Rule

If a change affects production frontend, backend, persistence, queues,
integrations or runtime behavior, release signoff must either:

1. reference a capacity review against this document; or
2. explicitly mark the change as prototype-only.

If neither is true, the change is not production-ready.
