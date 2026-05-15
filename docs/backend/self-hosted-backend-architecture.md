# YORSO Self-Hosted Backend Architecture

Status: production direction
Batch: #39
Date: 2026-05-14

## Decision

YORSO production backend must be self-hosted and deployable as one coherent
software system. Supabase is not the future production backend. Existing
Supabase migrations, smoke scripts and generated types may remain only as:

- schema experiments;
- access-control prototypes;
- temporary smoke-test infrastructure;
- migration references while the self-hosted backend is created.

Frontend work should continue, but all new production-facing data contracts must
be designed for the self-hosted YORSO API first.

## Production Target

```text
users
  -> CDN / reverse proxy
  -> web frontend
  -> YORSO API
  -> PgBouncer
  -> PostgreSQL primary
  -> Redis
  -> object storage
  -> queue workers
  -> search service
```

Required components:

| Component | Role |
|---|---|
| Web frontend | Public pages, marketplace UI, account workspace |
| YORSO API | Auth, business logic, access checks, DTO shaping |
| PostgreSQL | Transactional source of truth |
| PgBouncer | Connection pooling for high concurrency |
| Redis | Cache, sessions, rate limits, short-lived workflow state |
| Object storage | Logos, covers, product photos, documents, certificates |
| Queue workers | Email, notifications, approvals, imports, reports |
| Search service | Catalog, supplier and product discovery at scale |
| Reverse proxy | TLS, routing, compression, request limits |
| Observability | Logs, metrics, traces, audit alerts |

## Capacity Assumption

PostgreSQL can support YORSO scale if users connect to the API, not directly to
the database.

Target assumptions:

- 900,000+ registered users can be stored in PostgreSQL.
- 10,000 concurrent web users can be served through horizontally scaled API
  instances.
- 10,000 direct PostgreSQL connections are not an acceptable architecture.
- PgBouncer should reduce application concurrency to a controlled number of real
  database connections.
- Hot reads, sessions and rate limits should use Redis.
- Heavy work must move to queues.
- Search and analytics should not overload the transactional database.

The mandatory project-wide scale contract is documented in
`docs/backend/production-scale-baseline.md`. Any production-facing feature must
either attach a capacity review against that baseline or explicitly remain
prototype-only.

## Repository Direction

The repository should evolve toward this structure:

```text
apps/
  web/        # current frontend, migrated from root when ready
  api/        # self-hosted backend service
packages/
  contracts/  # DTOs, validation schemas, generated clients
  db/         # PostgreSQL migrations, seed data, SQL tests
  core/       # business rules that do not depend on HTTP/UI
infra/
  docker-compose.yml
  postgres/
  pgbouncer/
  redis/
  object-storage/
  reverse-proxy/
docs/
  backend/
```

Do not move the current frontend immediately. First add contracts and adapters,
then move code only when the structure is stable.

## API Boundary Rule

Frontend pages and components must not depend on backend implementation details.
They must call typed adapters:

```text
src/lib/account-api.ts
src/lib/supplier-api.ts
src/lib/offer-api.ts
src/lib/access-api.ts
src/lib/rfq-api.ts
src/lib/notification-api.ts
src/lib/content-api.ts
```

Adapters may temporarily call mocks or Supabase prototype code, but their public
contract must match the future YORSO API.

Enforced guard:

```bash
npm run check:supabase-boundary
```

The guard fails if new page/component code imports the Supabase client directly.
Current direct imports in `SignIn.tsx` and `ResetPassword.tsx` are temporary
legacy exceptions until the self-hosted auth/session adapter exists.

## Validation Commands

The self-hosted direction is enforced by repository checks:

```bash
npm run check:backend-policy
npm run check:supabase-boundary
npm run check:self-hosted-infra
npm run check:self-hosted-api
npm run check:self-hosted-db
npm run check:production-scale-baseline
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:apply:dry-run
npm run api:build
npm run test:api
npm run test:db-contract
npm run test:db-migrations
npm run test:backend-contract
npm run test:account-workspace
npm run smoke:self-hosted-account-api
npm run smoke:self-hosted-offer-detail
npm run ci:core
```

`check:self-hosted-infra` is a static guard. It validates the local Docker
Compose baseline, required environment keys and the Supabase prototype boundary
without starting Docker. Details are documented in
`docs/backend/self-hosted-validation.md`.

`apps/api` is the first self-hosted backend process. It exposes health
endpoints, the account/company contract boundary and account profile endpoints.
It must remain deployable through `apps/api/Dockerfile` and the `api` service in
`infra/docker-compose.yml`.

## Batch #39: Supplier Access UX Bridge

The self-hosted supplier access backend is now consumed by the frontend access
UX, not only by backend smoke tests.

Production-facing behavior:

- locked offer responses may expose a public technical `supplier.id` so buyers
  can request access without exposing the real supplier name;
- `/offers/:id` shows the same one-click supplier access request flow as
  `/suppliers/:id` for registered locked buyers;
- request status is rendered as `sent`, `pending` or `approved`;
- backend approval notifications from `/v1/access/notifications` are consumed by
  the app-level notifier and persisted into local access state;
- approval notification sync is bounded for the 10,000-concurrent-user target:
  frontend mock approvals can tick locally, but self-hosted backend polling
  must not run every few seconds per active browser tab;
- Batch #49 adds access notification acknowledgement: after the notifier applies
  backend approvals, it calls `PATCH /v1/access/notifications` so unread rows
  become `read` and the API records a `notification_read` audit event in
  migration `0008_access_notification_ack`;
- Batch #50 adds the frontend refresh bridge for the same approval path:
  supplier access writes dispatch `SUPPLIER_ACCESS_CHANGE_EVENT`, and the
  offer catalog, offer detail, supplier directory and supplier profile runtime
  hooks refetch their self-hosted API data on that event instead of relying on
  manual reloads or extra polling;
- Batch #51 adds the buyer-visible refresh state for that bridge:
  `SupplierAccessRefreshBanner` listens for typed approval events and appears
  only on the matching offer or supplier page after `backend_notification` or
  mock approval progression. It does not poll and does not treat routine
  backend reads as new approvals;
- Batch #52 adds `SupplierAccessNotificationCenter` in the header. The center
  uses the existing self-hosted notification feed, shows unread access
  approvals, supports bulk read acknowledgement and falls back to local mock
  approval notifications when `VITE_YORSO_API_URL` is empty. The header bell
  uses `autoLoad: false` and fetches only when opened or after typed access
  approval events;
- Batch #53 makes supplier directory pagination and sorting part of the
  self-hosted contract. The API accepts `sortBy`, `sortDirection`, `limit` and
  `offset`; the frontend stores the supplier view in URL parameters; and
  migration `0009_supplier_directory_pagination_sort` adds composite indexes
  for default, country, verification and response-speed supplier directory
  pagination;
- when `VITE_YORSO_API_URL` is empty, the UI continues to use local prototype
  fallback and mock approval progression.

This keeps the product direction self-hosted while preserving Lovable preview
resilience.

## Batch #40: Supplier Directory Frontend Runtime Bridge

The supplier directory frontend now has an explicit runtime bridge between
local prototype data and the self-hosted supplier API.

Production-facing behavior:

- `/suppliers` uses a shared supplier directory state hook. When
  `VITE_YORSO_API_URL` is configured, server results are treated as the source
  of truth instead of being refiltered as a local mock page.
- `/suppliers/:supplierId` uses the same runtime bridge for profile detail,
  including remote-only suppliers that do not exist in local mocks.
- API failures are visible but non-blocking: the UI shows a localized fallback
  banner and continues with prototype data when safe fallback data exists.
- Locked access rules remain unchanged. The frontend still must not reconstruct
  real company name, website, WhatsApp, exact active-offer count or exact
  catalog breadth from local mocks when the API returns locked data.
- Empty `VITE_YORSO_API_URL` remains the default for Lovable and local preview,
  so frontend iteration works without a backend process.

This batch does not make Supabase a production dependency. It moves the
supplier directory read path toward the self-hosted API while keeping the
prototype fallback explicit and test-covered.

The account module now has a route/service/repository split. Its current
production-direction repository is `PostgresAccountRepository`, backed by
`yorso_users`, `yorso_companies` and `yorso_company_media`. The in-memory
repository remains only for deterministic local tests and offline development.
HTTP behavior and DTO validation must stay stable while storage implementation
keeps moving toward PostgreSQL.

`packages/db` is now the self-hosted PostgreSQL baseline. Its migrations define
the `_yorso_migrations` registry, user/company profile tables, company media,
branches, product matrix rows, meta-regions, notification preferences, file
asset metadata, company document records and the initial supplier directory
table.
Supabase SQL may still be used as reference material, but the
production-direction schema must live under `packages/db`.

The DB package includes a migration planner. It currently performs static
planning and validation only: manifest order, dependencies, safe SQL paths and
SHA-256 checksums. Batch #22 added the runtime boundary for status, drift
detection and transactional apply through an injected PostgreSQL client. Batch
#23 adds the `pg` adapter and live commands guarded by `MIGRATION_DATABASE_URL`
and explicit `--confirm` for live apply. Default CI still uses static checks and
dry-run commands only.

Batch #32 expands live server/staging validation beyond the base account smoke.
`smoke:self-hosted-workspace-postgres` proves that branches, product matrix,
meta-regions and notification preferences persist through the YORSO API into
PostgreSQL, remain scoped to the current account owner, and reject invalid
enabled notification channels. The command skips successfully without
`MIGRATION_DATABASE_URL`, so local preview and GitHub CI stay portable.

Batch #33 adds row-level account workspace CRUD on top of the replace-all
collection endpoints. Branches, products, meta-regions and notification
preferences now have owner-scoped `GET`, `POST`, `PATCH` and `DELETE` item
routes under `/v1/account/*/:id`. This lets future frontend sections persist
one edited row at a time while the existing account workspace can continue using
full-section replacement until the UI is refactored. The row contract is
validated in shared DTOs, memory runtime smoke and optional PostgreSQL smoke.

Batch #34 adds the first supplier directory backend path. It defines supplier
directory DTOs, a `/v1/suppliers` list endpoint, a `/v1/suppliers/:id` detail
endpoint, memory/PostgreSQL repositories, migration `0004_supplier_directory`,
and a frontend adapter that falls back to existing mock suppliers when the API
URL is empty. The critical rule is access-shaped data: locked responses keep
the UI structure but return private identity/contact/exact-breadth fields as
`null`; `qualified_unlocked` responses may return the full allowed fields.

Batch #35 moves supplier discovery closer to production behavior. The
`/suppliers` page and `/suppliers/:id` profile now use the self-hosted supplier
directory adapter when `VITE_YORSO_API_URL` is configured, while Lovable/local
preview still uses mocks. Search is debounced, list calls stay paginated, and
quick filters that have backend equivalents are sent to the API. Migration
`0005_supplier_directory_search_scaling` adds trigram GIN indexes and a
verification-level index so supplier discovery stays index-backed under the
10,000 concurrent-user target.

Batch #53 extends that supplier directory bridge with server-owned sorting,
URL-state and page controls. `/suppliers` now keeps `q`, quick filter, sort,
direction, rows and page in the URL and sends the same view to `/v1/suppliers`.
The backend validates `sortBy` and `sortDirection`, applies a safe SQL
`orderByClause`, and migration `0009_supplier_directory_pagination_sort`
provides composite indexes for stable pagination instead of sorting a partial
client-side page.

Batch #36 promotes the 10,000 concurrent-user target from feature-level notes
to a repository-level release gate. `check:production-scale-baseline` now
guards the capacity baseline document, supplier-directory scaling migration,
bounded supplier frontend API calls and CI integration.

Batch #37 adds the first self-hosted offer catalog path. It defines offer
catalog DTOs, a `/v1/offers` list endpoint, a `/v1/offers/:id` detail endpoint,
memory/PostgreSQL repositories, migration `0006_offer_catalog`, and a frontend
adapter that takes priority when `VITE_YORSO_API_URL` is configured. Locked
offer responses may show public product, origin, MOQ and commercial terms, but
must return supplier identity and exact price fields as `null`; only
`qualified_unlocked` responses may include exact prices and supplier identity.
The offer catalog migration keeps search/filter paths paginated and
index-backed for the 10,000 concurrent-user target.

Batch #41 makes the offer catalog frontend bridge explicit. `/offers` now uses
`src/lib/use-offer-catalog.ts` as the single runtime state boundary between
local prototype data and the self-hosted `/v1/offers` API.

Production-facing behavior:

- API-owned filters (`q`, category, origin country, supplier country, product
  state and certification) are sent to `/v1/offers` with `limit` and `offset`.
- When the API is enabled, server-filtered results are treated as the source of
  truth. The frontend must not refilter a paginated server page for those
  supported filters.
- Client-only filters remain local until backend equivalents exist: logistics
  basis, payment terms, cut type, currency, latin name and supplier name.
  Supplier-name filtering is allowed only inside the current buyer's approved
  supplier grant set.
- API failures are visible and non-blocking: `/offers` shows a localized
  fallback state and continues with access-shaped prototype offers when safe
  fallback data exists.
- Empty `VITE_YORSO_API_URL` remains the default for Lovable and local preview,
  so the page still works without a backend process.

This batch keeps the offer catalog aligned with the 10,000 concurrent-user
target: high-cardinality search/filter work belongs to PostgreSQL indexes and
bounded backend queries, not to a large frontend mock page.

Batch #42 makes the offer detail frontend bridge explicit. `/offers/:id` now
uses `src/lib/use-offer-detail.ts` as the runtime state boundary between local
prototype data and the self-hosted `/v1/offers/:id` API.

Production-facing behavior:

- Detail reads call `GET /v1/offers/:id` through
  `createOfferCatalogApiClient` when `VITE_YORSO_API_URL` is configured.
- Empty `VITE_YORSO_API_URL` keeps Lovable/local preview on access-shaped mock
  detail data.
- API failure can show a localized prototype fallback only when a safe local
  offer exists for that id.
- Remote 404 without a safe local fallback renders the normal not-found state,
  not a random mock offer.
- Locked access rules remain unchanged: exact price and supplier identity must
  not be reconstructed on the frontend.

This closes the first list-to-detail self-hosted catalog path: `/offers` owns
server-filtered list state, and `/offers/:id` owns one-off detail loading,
retry and safe fallback behavior.

Batch #43 adds a focused runtime gate for that detail path. The standalone
offer detail smoke starts the compiled API and verifies:

- anonymous and registered locked users receive product context without real
  supplier identity, exact price, currency or volume breaks;
- qualified users receive exact price and supplier identity;
- `404 offer_not_found`, `405 method_not_allowed` and `400 validation_error`
  stay stable;
- `ci:core` runs the smoke so detail regressions block merge.

This protects the 10,000 concurrent-user path because detail reads must stay
bounded, API-shaped and independent from frontend mock reconstruction.

Batch #44 moves offer detail access shaping closer to production behavior:

- `GET /v1/offers/:id?accessLevel=qualified_unlocked` no longer unlocks exact
  price or supplier identity by query parameter alone.
- The API checks the current account session against supplier-access grants
  before returning qualified fields.
- Without a grant, a signed account is downgraded to `registered_locked`; an
  unsigned request remains `anonymous_locked`.
- `src/lib/offer-catalog-api.ts` now sends the same account headers used by the
  account and access adapters, so the self-hosted API can evaluate grants.
- The supplier-access state hook treats an authoritative backend "no access"
  response as source of truth and clears stale local approvals.

Batch #47 extends this to offer catalog list/search:

- `GET /v1/offers?accessLevel=qualified_unlocked` is not a global unlock.
- The API loads active `supplier_identity` grants for the current account and
  unlocks only matching supplier rows.
- Private supplier-name search is scoped to those granted supplier IDs.
- Public offer search still works before approval, but exact prices and
  supplier identity remain masked until the grant exists.

This does not finish authentication. It removes the highest-risk detail
shortcut while the repository still uses the current self-hosted session header
bridge.

Batch #38 adds the first self-hosted supplier and price access path. It defines
supplier-access DTOs, `/v1/access/suppliers/:supplierId/request`,
`/v1/access/supplier-requests/:requestId/decision` and
`/v1/access/notifications`, memory/PostgreSQL repositories, migration
`0007_supplier_access_flow`, access acknowledgement migration
`0008_access_notification_ack`, frontend self-hosted adapter priority through
`VITE_YORSO_API_URL`, and smoke coverage for request, pending, approved,
grant, notification and notification-read states. Access requests are idempotent per
buyer/supplier pair. Approval creates both supplier identity and offer price
grants so the UI can unlock exact prices and supplier details through the same
backend decision. The access flow is part of the 10,000 concurrent-user target:
hot paths must use indexed request lookup, grant lookup and notification feed
queries rather than unbounded scans.

## Access Control Rule

If a user does not have access to data, the API must not return the real value.
This applies to:

- supplier company name when locked;
- supplier contacts;
- legal details;
- exact price;
- restricted documents;
- exact catalog breadth if the product decision requires gating;
- access events that belong to another actor.

Frontend blur can remain as a UX hint, but it is not a security boundary.

## Backend Modules

Build in this order:

1. Identity and sessions.
2. Company profile. Initial self-hosted API and PostgreSQL persistence exist.
3. Company media and object storage. Initial self-hosted upload pipeline,
   file metadata, checksums and company document records exist through the API.
4. Branches and loading points. Initial self-hosted API and PostgreSQL
   persistence exist.
5. Product matrix. Initial self-hosted API and PostgreSQL persistence exist.
6. Supplier directory and profile. Initial self-hosted supplier directory API,
   DTOs, frontend adapter, frontend API bridge and PostgreSQL search-scaling
   migrations exist.
7. Offer catalog and offer detail. Initial self-hosted offer catalog API, DTOs,
   frontend adapter and PostgreSQL migration exist.
8. Supplier and price access requests. Initial self-hosted request, decision,
   grant, event and notification API exists.
9. RFQ and catalog request flow.
10. Notifications.
11. Audit log and admin review.
12. Search and market intelligence ingestion.

## Phase 0 Tasks

Before building feature modules:

1. Keep the current frontend working.
2. Freeze the API DTOs needed by existing pages.
3. Add contract tests for DTOs and access states.
4. Add `.env.example` for self-hosted services.
5. Add local Docker Compose skeleton.
6. Add PostgreSQL migration baseline under a self-hosted path.
7. Mark Supabase migrations as prototype/reference in docs.
8. Prevent new production code from importing Supabase directly from pages.
9. Remove the temporary SignIn/ResetPassword Supabase exceptions after the
   self-hosted auth/session adapter is implemented.

## Supabase Transition Rules

Allowed:

- keep existing Supabase smoke tests while they protect current prototype flows;
- use Supabase SQL as reference when designing PostgreSQL migrations;
- keep generated Supabase types for existing compatibility until adapters are
  replaced;
- run Supabase smoke checks when validating the temporary prototype.

Not allowed:

- designing new production modules around Supabase-only features;
- adding new page-level Supabase client imports;
- treating Supabase RLS as the final production authorization layer;
- storing production architecture decisions only in Supabase dashboard state;
- requiring Supabase to deploy YORSO on an owned server.

## First Implementation Increment

Completed baseline increments added the backend boundary:

- `docs/backend/self-hosted-backend-architecture.md`;
- a guard script that checks docs do not describe Supabase as the production
  backend;
- an API-contract placeholder for account/company DTOs;
- tests for the guard and contract shape;
- a Docker Compose skeleton only after the contract guard is green.

Batch #24 continues that direction by replacing the account PostgreSQL
repository placeholder with a functional adapter. The frontend is still not
forced to use it directly; the goal is to make the self-hosted API capable of
serving the existing account/company UI contract when the frontend data gateway
is switched from local prototype state to `/v1/account/*`.

Batch #25 starts that switch without breaking preview mode. The account
workspace now has a frontend API bridge that hydrates and syncs user/company
profile data through the self-hosted API when `VITE_YORSO_API_URL` is set. The
bridge stays disabled when the API URL is empty so Lovable preview and local
prototype mode keep working.

Batch #26 expands account persistence to branches, product matrix rows,
meta-regions and notification preferences. Batch #27 adds the first file
storage boundary: logo/cover uploads, company documents, file checksums and
download-by-asset endpoints. The current driver is local filesystem storage
inside the API container volume; MinIO remains the S3-compatible target for the
next storage driver. The local store remains the fallback because many Lovable
and local preview runs do not have the API process running. This is intentional:
the codebase moves toward one deployable product, while each intermediate commit
stays runnable.

Batch #28 wires that file boundary into the account UI. Company logo and cover
uploads can now go through the self-hosted API, and stored object keys resolve
back through an owned file endpoint instead of becoming public asset URLs. The
same batch adds the company documents card with API-backed upload/list/download
and a local prototype fallback. This keeps the frontend aligned with the
self-hosted backend path while Lovable preview remains operational without
Docker or a running API process.

Batch #29 removes the hidden fixed-user assumption from account routes. The
self-hosted API now requires an explicit account user id boundary for account
JSON calls, with a temporary query fallback only for browser-native file
previews that cannot send custom headers. This is still not final auth, but it
is a concrete separation between prototype session handling and the production
authorization layer that will later use server-issued cookies or JWTs.

Batch #30 adds the first runtime proof for that boundary. The smoke runner
starts `apps/api/dist/index.js` as a real Node process and verifies account
session headers, company writes, product matrix replacement, media uploads,
document uploads and file ownership over HTTP. This protects the direction that
YORSO must run as one self-hosted product, not only as isolated frontend mocks
or unit-tested modules.

Batch #31 extends that proof to real PostgreSQL. The optional live smoke applies
self-hosted migrations, seeds one deterministic account, starts the API with
`ACCOUNT_REPOSITORY=postgres` and verifies the same account/file flows over
HTTP. It skips when `MIGRATION_DATABASE_URL` is absent, so default CI remains
portable while server/staging checks can validate the database repository
boundary.

Batch #34 expands the same backend direction from account workspace to supplier
discovery. Supplier directory data can now be served by the owned API and owned
PostgreSQL schema, while the frontend remains safe in Lovable/local preview
through a mock fallback. This is the first step toward replacing the supplier
catalog/profiles mock layer with self-hosted production data.

Batch #35 connects the existing supplier frontend surfaces to that owned API
path and adds the first supplier-directory read-scaling guard. This is still
not the final search architecture, but it prevents the next development steps
from building high-traffic catalog discovery around unbounded frontend mocks or
database scans.

Batch #45 moves supplier profile identity unlocks from frontend state to the
self-hosted supplier-access grant model. `/v1/suppliers/:id` can be requested
with `qualified_unlocked`, but the API downgrades the response unless the
current account has an approved grant for that supplier. This protects supplier
identity, contacts and exact catalog breadth while keeping the public supplier
directory readable and paginated.

Batch #54 makes offer catalog pagination a server contract. `/v1/offers` owns
safe enum-driven sorting (`updated_at`, `category`, `origin`, `moq`),
bounded `limit/offset` reads and access-shaped rows. `/offers` stores the
list view in URL state so browser navigation and shared links do not require
client-side full-list loading. PostgreSQL migration
`0010_offer_catalog_pagination_sort` adds composite indexes for the supported
orders. Price sorting is deliberately excluded until exact price visibility is
handled by a grant-aware pricing endpoint.

Batch #55 adds offer catalog browser e2e as a release guard around that server
contract. The Playwright spec opens the actual `/offers` UI and verifies
URL-backed sort/page state, pagination controls, page clamping and private
supplier-name search gating. This is intentionally an end-to-end browser check,
not another repository unit test: the self-hosted API and frontend can be
correct independently while the visible catalog still regresses into unbounded
client browsing. The e2e keeps the UI aligned with the 10,000 concurrent-user
offer catalog read path.

Batch #56 adds supplier directory browser e2e as the same browser-level guard
for the supplier directory. The `/suppliers` page now has a dedicated
Playwright contract for URL-backed search, quick filters, safe sort keys,
bounded page sizes, pagination controls, page clamping and access-aware private
supplier search. This matters for the self-hosted deployment because supplier
discovery is a high-read surface: without the e2e guard, a UI-only regression
could bypass the server pagination contract and reintroduce full-list browsing
or hidden supplier identity leaks.

Batch #57 adds supplier profile detail browser e2e as the next guard around
supplier trust pages. The `/suppliers/:id` page now has a dedicated Playwright
contract for one-click access requests, approval-driven refresh, supplier-scoped
unlock, unrelated approval isolation and not-found cleanup. This keeps the
self-hosted supplier-access model enforceable in the visible product: the
browser may render local fallback data in Lovable, but it must preserve the same
grant-shaped behavior expected from the owned API and PostgreSQL deployment.

Batch #58 adds the same browser-level runtime guard for `/offers/:id`. Offer
detail now has a dedicated Playwright contract for registered price-access
requests, event-driven approval refresh, supplier-scoped unlock, unrelated
approval isolation, unknown-offer cleanup and exact-price no-leak behavior.
Local fallback shaping and self-hosted API shaping both redact delivery-basis
price ranges and volume tiers until a supplier grant exists, so the UI and API
follow the same owned-backend access boundary.

Batch #59 connects the list and detail access paths into one browser contract.
The offer catalog detail flow browser e2e opens `/offers`, navigates to
`/offers/:id`, requests supplier access, applies an approval event, returns to
the catalog and verifies that only the matching row is unlocked while URL state
is preserved. The frontend now treats access as offer-level state:
`SeafoodOffer.accessLevel` can override the global buyer level, catalog rows
and the right-side intelligence panel receive `forceLevel`, and local fallback
uses approved supplier access records instead of unlocking the whole catalog.
For the self-hosted API path, signed-in catalog/detail reads may request
`qualified_unlocked`; the API still downgrades each row or detail response
unless a real grant exists. This keeps the future production deployment aligned
with owned API + PostgreSQL grant enforcement rather than frontend-only global
qualification flags.

Batch #60 applies the same contract to supplier discovery. The supplier
directory profile flow browser e2e opens `/suppliers`, navigates to
`/suppliers/:id`, requests supplier access, applies an approval event, returns
to the directory and verifies that only the matching supplier row is unlocked
while URL state is preserved. The frontend now treats supplier access as
supplier-level state in the directory: local fallback rows carry an effective
`accessLevel`, selected directory panels use that supplier-specific level, and
private supplier-name search only opens for approved supplier records or API
responses already shaped as unlocked. For the self-hosted API path, signed-in
directory/profile reads may request `qualified_unlocked`; the API still
downgrades each supplier response unless a grant exists. This prevents global
frontend qualification from becoming a production data-access boundary.

Batch #61 hardens the self-hosted API-backed frontend path for the same
supplier discovery flow. The dedicated API-mode smoke builds the frontend with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` and uses Playwright route
interception to emulate `/v1/suppliers`, `/v1/suppliers/:id`,
`/v1/access/suppliers/:id/request` and `/v1/access/notifications`. This proves
the page is no longer only protected by local prototype storage: backend-style
notification approval unlocks the matching supplier, the profile refreshes from
API-shaped data, and the directory row remains locked when approval belongs to
another supplier. The API-backed supplier directory profile flow browser e2e is
kept separate from the default smoke suite because it requires a Vite build
with API mode enabled; the default smoke continues to cover prototype fallback.

Batch #62 applies the same API-backed browser guard to offer discovery and
offer detail. The dedicated API-mode smoke builds the frontend with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` and intercepts
`/v1/offers`, `/v1/offers/:id`, `/v1/access/suppliers/:id/request` and
`/v1/access/notifications`. This proves the production path no longer depends
only on localStorage fallback for the offer access bridge: backend-style
approval unlocks the matching offer row and detail response, preserves the
catalog URL state on return, and keeps unrelated supplier approvals isolated.
The API-backed offer catalog detail flow browser e2e stays separate from the
default smoke suite for the same reason as Batch #61: it must be built with API
mode enabled, while default smoke keeps validating the local prototype fallback.

Batch #63 applies the same API-backed browser guard to the buyer notification
center in the header. The dedicated API-mode smoke builds the frontend with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` and intercepts
`/v1/access/notifications`. This proves the production notification center path
uses the self-hosted adapter, does not read the feed on every header render,
refreshes only when the buyer opens the bell, sends session headers, and
acknowledges unread access notifications through `PATCH /v1/access/notifications`.
The guard stays separate from default smoke because it requires API mode; the
default suite continues to validate local prototype fallback behavior.

Batch #64 groups the API-backed browser guards into a single CI suite:
`smoke:e2e:api-backed-access-flows`. The suite builds with
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api` and runs the API-mode
supplier directory/profile, offer catalog/detail and supplier access
notification center specs in one pass. This keeps the self-hosted production
path explicit in CI instead of relying on engineers to run separate API-mode
commands manually. The local fallback smoke remains separate and continues to
prove that Lovable preview works without a configured backend.
