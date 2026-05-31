# Self-Hosted Backend Validation

Status: active guard
Batch: #37
Date: 2026-05-14

This repository is moving toward one deployable YORSO product:

- frontend;
- self-hosted YORSO API;
- PostgreSQL;
- PgBouncer;
- Redis;
- object storage;
- workers and operational tooling.

Supabase is retired from the active product/tooling surface after Backend Phase
3C. Historical docs may still mention the prototype, but production code,
scripts, env examples and CI gates must stay provider-free. The same rule
applies to Firebase, Appwrite, Clerk, Auth0 and similar hosted BaaS/SaaS
application backends.

## Required Commands

Run these commands before merging backend-direction changes:

```bash
npm run check:backend-policy
npm run check:provider-boundary
npm run check:self-hosted-infra
npm run check:self-hosted-production-runtime
npm run check:self-hosted-api
npm run check:self-hosted-db
npm run check:production-scale-baseline
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:apply:dry-run
npm run api:build
npm run test:api
npm run test:supplier-document-management-policy
npm run test:supplier-document-management-runtime
npm run smoke:self-hosted-auth-api
npm run smoke:e2e:self-hosted-auth-frontend
npm run smoke:self-hosted-account-api
npm run smoke:self-hosted-offer-detail
npm run smoke:self-hosted-account-postgres
npm run smoke:self-hosted-workspace-postgres
npm run test:db-contract
npm run test:db-migrations
npm run test:backend-contract
npm run test:account-workspace
npm run test:supplier-directory-frontend
npm run test:offer-catalog-frontend
npm run ci:core
```

## What Each Check Protects

| Command | Purpose |
|---|---|
| `check:backend-policy` | Fails if backend docs describe Supabase as the production target. |
| `check:provider-boundary` | Fails if production source files regain hosted BaaS client imports, env keys, old Supabase integration directories or legacy provider fallback markers. |
| `check:self-hosted-infra` | Fails if the local self-hosted runtime skeleton loses PostgreSQL, PgBouncer, Redis, MinIO or required env keys. |
| `check:self-hosted-production-runtime` | Fails if production runtime docs, compose or `.env.production.example` drift back toward Supabase, Firebase, Appwrite, Clerk, Auth0 or similar hosted BaaS/SaaS application backends. |
| `check:self-hosted-api` | Fails if the standalone `apps/api` skeleton, Dockerfile, compose hook, account API, supplier directory API, offer catalog API, supplier access UX bridge or provider-free production boundary is broken. |
| `check:self-hosted-db` | Fails if the self-hosted PostgreSQL baseline under `packages/db` loses required account/company/supplier-directory/offer-catalog tables, marketplace search scaling indexes or drifts toward Supabase-owned schema. |
| `check:production-scale-baseline` | Fails if the 10,000 concurrent-user release gate, supplier/offer catalog trigram search indexes, bounded frontend API calls or CI hook are removed. |
| `db:migrations:check` | Builds the DB package and validates deterministic migration order, dependencies, safe relative paths and SQL checksums. |
| `db:migrations:status` | Prints the static local migration status without requiring PostgreSQL. |
| `db:migrations:apply:dry-run` | Prints a safe local apply preview without requiring PostgreSQL. |
| `db:migrations:status:live` | Connects to `MIGRATION_DATABASE_URL` and reads applied migration records. Not part of CI without a database. |
| `db:migrations:apply:live:dry-run` | Connects to `MIGRATION_DATABASE_URL`, checks drift and previews pending migrations without applying SQL. |
| `db:migrations:apply:live` | Applies pending migrations only through `--confirm` and `MIGRATION_DATABASE_URL`. Use manually during server deployment. |
| `db:migrations:smoke:live` | Runs live status plus live dry-run apply against `MIGRATION_DATABASE_URL`. Use for local/server smoke validation. |
| `api:build` | Compiles the self-hosted API service to `apps/api/dist`. |
| `test:api` | Runs API endpoint and config tests. |
| `test:supplier-document-management-policy` | Builds contracts and verifies supplier document owner/admin management schemas, storage-boundary rejection, audit actions and policy decisions. |
| `test:supplier-document-management-runtime` | Builds contracts and verifies supplier owner create plus admin approve/reject API/repository runtime paths. |
| `smoke:self-hosted-auth-api` | Builds and starts the standalone API, then verifies self-hosted sign-in, session read, sign-out, invalid credentials, validation guards, password reset abuse-control and password recovery cleanup scheduler wiring over real HTTP. |
| `smoke:e2e:self-hosted-auth-frontend` | Builds the frontend with `VITE_YORSO_API_URL` enabled and verifies `/signin` uses the owned auth API, stores backend session/user ids and sends them to downstream self-hosted API calls. |
| `smoke:self-hosted-account-api` | Builds and starts the standalone API, then verifies account session headers, company/profile writes, product matrix replacement, row-level workspace CRUD, media upload, document upload, file ownership, supplier directory access shaping and offer catalog access shaping over real HTTP. |
| `smoke:self-hosted-offer-detail` | Builds and starts the standalone API, then verifies `/v1/offers/:id` locked shaping, qualified unlock, not-found, method guard and validation guard over real HTTP. |
| `smoke:self-hosted-account-postgres` | Optionally applies live migrations and verifies the same account API over a real PostgreSQL repository when `MIGRATION_DATABASE_URL` is set; otherwise exits as skipped. |
| `smoke:self-hosted-workspace-postgres` | Optionally applies live migrations and verifies branches, products, meta-regions, notifications and supplier directory access shaping over the real PostgreSQL repository, including row-level CRUD, owner isolation and DB row counts. Exits as skipped when `MIGRATION_DATABASE_URL` is not set. |
| `test:account-workspace` | Runs account frontend adapter and workspace tests, including self-hosted API fallback behavior. |
| `test:supplier-directory-frontend` | Runs supplier directory frontend adapter, `/suppliers`, supplier profile tests and the shared supplier-directory runtime bridge for self-hosted API mode, debounce, access shaping, retry/error state and local fallback. |
| `test:offer-catalog-frontend` | Runs offer catalog frontend adapter plus list/detail runtime bridge tests for self-hosted API mode, backend-owned filters, server-filtered results, access shaping, visible fallback and local preview mode. |
| `test:supplier-access-frontend` | Runs supplier access frontend adapter, offer-detail access UI and approval-notification bridge tests for self-hosted API mode, grant-only approval, local fallback, request/status rendering, one-time toasts and bounded notification polling. |
| `test:db-contract` | Validates SQL baseline structure, enum boundaries and migration manifest. |
| `test:db-migrations` | Runs the DB package tests for the manifest planner, checksum generation and self-hosted SQL boundary. |
| `test:backend-contract` | Validates backend-facing DTOs and repository policy tests. |
| `ci:core` | Runs policy, infra, type, lint, build and contract checks together. |

## Static Docker Compose Validation

`check:self-hosted-infra` is intentionally static. It does not start Docker and
does not require Docker Desktop to be running.

It verifies:

- `api` is present as a self-hosted service;
- `infra/docker-compose.yml` declares PostgreSQL, PgBouncer, Redis and MinIO;
- PostgreSQL has a healthcheck;
- PgBouncer depends on healthy PostgreSQL and uses transaction pooling;
- Redis persists data locally;
- MinIO exposes API and console ports;
- `.env.example` contains all required self-hosted runtime variables;
- `.env.example` contains no hosted BaaS frontend variables, service-role text,
  JWT-looking tokens or hosted-provider database URLs.

## Production Runtime Validation

Batch #72 adds `check:self-hosted-production-runtime`. It validates the owned
server deployment boundary, not just the local prototype baseline.

It checks:

- `.env.production.example` exists and contains only self-hosted production
  runtime keys;
- `.env.production.example` does not contain Supabase, Firebase, Appwrite,
  Clerk, Auth0, service-role keys or hosted BaaS/SaaS runtime settings;
- `infra/docker-compose.yml` no longer carries `VITE_SUPABASE_*` variables as
  production runtime inputs;
- `docs/backend/self-hosted-production-deploy.md` documents the server deploy
  sequence, password recovery delivery runtime and cleanup scheduler knobs;
- `ci:core` runs the production runtime guard.

Backend Phase 3C adds `check:provider-boundary` and
`smoke:e2e:frontend-provider-free-env` as the active provider-free guards. The
old Supabase-specific boundary/type/smoke scripts are retired.

## DB Baseline Validation

`check:self-hosted-db` validates `packages/db` as the self-hosted PostgreSQL
source of truth. It checks:

- `_yorso_migrations`, the self-hosted schema registry;
- `yorso_users`, `yorso_companies`, `yorso_company_media`;
- `yorso_company_branches`, `yorso_company_products`,
  `yorso_company_meta_regions`, `yorso_notification_preferences`;
- `yorso_file_assets`, `yorso_company_documents`;
- `yorso_suppliers_directory`;
- supplier-directory trigram search indexes and verification-level filter index
  used by the 10,000 concurrent-user read path;
- `yorso_offers_catalog`;
- offer-catalog trigram search indexes and bounded filter indexes used by the
  10,000 concurrent-user read path;
- `yorso_supplier_access_requests`, `yorso_access_grants`,
  `yorso_access_events`, `yorso_access_notifications`;
- supplier-access request and grant indexes used by the 10,000 concurrent-user
  decision and unlock path;
- `yorso_auth_credentials`, `yorso_auth_sessions` and their active-session
  indexes used by the Batch #73 self-hosted auth/session foundation;
- enum boundaries matching account/company DTOs;
- indexes needed by account workspace and supplier directory reads;
- migration manifest ownership;
- absence of Supabase `auth.users` coupling in the self-hosted baseline.

## Production Scale Baseline Validation

`check:production-scale-baseline` validates the mandatory production capacity
contract. It checks:

- `docs/backend/production-scale-baseline.md` exists and defines the 10,000
  concurrent web-user target;
- capacity review fields include read/write profile, database strategy,
  connection pooling, cache, queue/backpressure, failure mode, observability and
  load testing;
- `self-hosted-backend-architecture.md` continues to state that 10,000 direct
  PostgreSQL connections are not acceptable architecture;
- supplier-directory trigram search indexes and verification-level index remain
  in migration `0005_supplier_directory_search_scaling.sql`;
- offer-catalog trigram search indexes and filter indexes remain in migration
  `0006_offer_catalog`;
- supplier-access request and grant indexes remain in migration
  `0007_supplier_access_flow`;
- access notification acknowledgement remains in migration
  `0008_access_notification_ack`, including `notification_read` audit support
  and `PATCH /v1/access/notifications`;
- `/suppliers` and `/offers` frontend API mode keeps paginated requests instead
  of unbounded list reads;
- the self-hosted offer detail smoke keeps `/v1/offers/:id` access shaping,
  not-found, method and validation behavior under CI;
- the frontend approval-notification bridge keeps self-hosted
  `/v1/access/notifications` polling at 60 seconds, prevents overlapping
  backend sync, refreshes when a browser tab becomes visible and acknowledges
  processed notification IDs through the self-hosted API;
- the supplier-access change event refreshes offer list/detail and supplier
  list/detail API-mode state after approvals, avoiding stale locked UI without
  adding a high-frequency polling path;
- the refresh banner only reacts to typed matching approval events
  (`backend_notification` or `mock_progression`), so routine `backend_read`
  syncs do not repeatedly announce old access grants;
- the supplier access notification center reads the same self-hosted
  `/v1/access/notifications` feed, acknowledges unread rows through the same
  PATCH endpoint, falls back to local mock approval notifications, uses
  `autoLoad: false` in the header and avoids adding another polling timer;
- `ci:core` runs the scale baseline guard.

Batch #73 adds self-hosted auth/session foundation validation:

- `packages/contracts/src/auth.ts` owns the sign-in/session/sign-out DTOs;
- `apps/api/src/modules/auth` owns memory and PostgreSQL repositories, service
  validation and routes for `/v1/auth/sign-in`, `/v1/auth/session` and
  `/v1/auth/sign-out`;
- `packages/db/migrations/0011_auth_sessions.sql` owns credential/session
  tables for the self-hosted PostgreSQL baseline;
- `smoke:self-hosted-auth-api` proves the runtime endpoints over a real API
  process;
- this remains a foundation layer, not final production auth hardening.

`db:migrations:check` validates the TypeScript migration planner. It does not
connect to PostgreSQL yet. It verifies that every manifest entry points to a
safe SQL file, dependencies sort before dependents, SQL is checksumed, and the
plan is deterministic.

`db:migrations:apply:dry-run` validates the runtime boundary without connecting
to a database. Batch #23 also adds live commands for server deployment. They are
not part of default CI because they require `MIGRATION_DATABASE_URL`.

Manual server deployment commands:

```bash
npm run db:migrations:status:live
npm run db:migrations:apply:live:dry-run
npm run db:migrations:apply:live
npm run db:migrations:smoke:live
```

## API Skeleton Validation

`check:self-hosted-api` validates that `apps/api` is a real Node service, not a
documentation placeholder. Batch #24 also makes this guard reject a regression
back to a placeholder PostgreSQL repository.

It verifies:

- `apps/api/src/index.ts` starts a standalone HTTP server;
- `/health/live` and `/health/ready` exist;
- `/v1/account/company/schema` exposes the account/company contract boundary;
- `GET /v1/account/workspace` returns the authenticated account workspace
  snapshot used by API-enabled `/account/*` hydration;
- `apps/api/Dockerfile` builds and starts `apps/api/dist/index.js`;
- `infra/docker-compose.yml` wires the API service to PgBouncer, Redis and
  MinIO;
- `infra/docker-compose.yml` exposes the current local file-storage volume for
  API uploads;
- Supabase frontend env values stay empty in the API compose service.
- `PostgresAccountRepository` reads `yorso_users`, reads/updates
  `yorso_companies`, and upserts `yorso_company_media`.
- `PostgresAccountRepository` must not contain "not implemented" placeholders.
- `PATCH /v1/account/me` and `PATCH /v1/account/company` remain behind the
  contract validation layer.
- `GET`/`PATCH /v1/account/branches`, `/products`, `/meta-regions` and
  `/notifications` remain behind the contract validation layer.
- Row-level `GET`/`POST`/`PATCH`/`DELETE /v1/account/branches/:id`,
  `/products/:id`, `/meta-regions/:id` and `/notifications/:id` remain behind
  the same owner-scoped service/repository boundary.
- Row-level workspace routes preserve explicit errors: duplicate create returns
  `409 workspace_item_conflict`, missing row returns
  `404 workspace_item_not_found`.
- Account JSON routes require explicit `x-yorso-user-id` session headers and
  must not fall back to a hidden fixed demo user.
- `POST /v1/account/company/media/logo`, `/cover`, `GET`/`POST
  /v1/account/documents` and `GET /v1/account/files/:assetId` remain behind the
  self-hosted file service.
- `GET /v1/account/files/by-object-key` remains available for private account
  media previews that store object keys instead of public URLs.
- File stream routes accept the same account user id by header or query
  parameter for native browser media requests. This is a temporary bridge, not
  the final production auth model.
- File uploads are validated by contract, size checked, checksummed and stored
  through `apps/api/src/modules/storage`, not through Supabase Storage.
- The API exposes CORS headers for browser calls from the frontend origin.
- `GET /v1/suppliers` and `GET /v1/suppliers/:id` expose supplier discovery
  through an access-shaped API response, not through frontend-only mocks.
- Locked supplier directory responses preserve the card/profile structure but
  return private identity, contacts and exact breadth fields as `null`.
- `qualified_unlocked` supplier profile responses return the full allowed
  identity and contact fields only when the current account has an approved
  self-hosted supplier-access grant. Query parameters alone cannot unlock the
  profile.
- `GET /v1/offers` and `GET /v1/offers/:id` expose offer discovery through an
  access-shaped API response, not through frontend-only mocks.
- Locked offer catalog responses preserve product, origin, MOQ and commercial
  terms but return exact price and supplier identity fields as `null`.
- `qualified_unlocked` offer catalog responses return exact prices and supplier
  identity only for offers whose supplier has an active access grant for the
  current account.
- `/offers` uses `src/lib/use-offer-catalog.ts` to route backend-supported
  filters to `/v1/offers` with bounded `limit` and `offset`.
- API-mode offer catalog results are treated as server-filtered source of truth;
  local filtering is limited to fields not yet represented in the backend query
  contract.
- API failures must show a localized fallback state and keep locked prototype
  offers access-shaped.
- Batch #43 adds `smoke:self-hosted-offer-detail` so the same locked/unlocked
  access-shaping rules are checked over a real HTTP detail request, not only by
  frontend unit tests.
- Batch #44 makes `qualified_unlocked` on `/v1/offers/:id` dependent on a real
  supplier-access grant. Query parameters can request qualified data, but the
  API must downgrade the response unless the current account has access.

## Frontend Account API Bridge

Batch #25 introduces `src/lib/account-api.ts` as the frontend bridge from the
current account workspace to the self-hosted API.

The bridge must preserve these rules:

- local prototype persistence remains the fallback;
- account pages do not import Supabase as a production data gateway;
- user and company saves map to `/v1/account/me` and `/v1/account/company`;
- branches, products, meta-regions and notification preferences map to their
  dedicated `/v1/account/*` collection endpoints;
- row-level workspace helpers map to `/v1/account/*/:id` endpoints for future
  single-row saves while preserving the current replace-all page sync;
- company media and document upload helpers map to the self-hosted file
  endpoints while keeping local prototype mode available when the API URL is
  empty;
- account UI components use the adapter helpers for media/document uploads and
  stored-file URL resolution instead of importing any storage client directly;
- account API calls attach `x-yorso-user-id` and optional `x-yorso-session-id`
  from the frontend account API adapter;
- if a backend returns only a partial account payload during development,
  local sections must not be discarded accidentally;
- `.env.example` keeps `VITE_YORSO_API_URL` empty by default so Lovable preview
  works without a running API service.

Batch #28 frontend checks:

- `CompanyMediaCard` uploads logo/cover files through `uploadCompanyMedia`
  only when the API adapter is enabled.
- `SupplierProfilePreview` and account media previews resolve object keys
  through the self-hosted file endpoint while preserving direct prototype URLs.
- `CompanyDocumentsCard` supports API-backed document upload/list/download and
  a local metadata fallback for preview mode.
- `test:account-workspace` covers account adapter file helpers and the local
  company document fallback.

Batch #29 account session checks:

- Account routes return `401 account_session_required` when the user id header
  is missing.
- Account routes return `401 account_session_invalid` when the user id is not a
  UUID.
- Frontend account API requests always include the self-hosted account user id
  header when `VITE_YORSO_API_URL` is configured.
- CORS allows `x-yorso-user-id` and `x-yorso-session-id`.

## Supplier Directory API Bridge

Batch #34 introduces the self-hosted supplier directory backend path. Batch #35
connects the existing frontend `/suppliers` and `/suppliers/:id` surfaces to
that path when `VITE_YORSO_API_URL` is configured.

The supplier directory bridge must preserve these rules:

- frontend supplier directory code uses `src/lib/supplier-directory-api.ts`;
- shared supplier directory runtime state uses `src/lib/use-supplier-directory.ts`;
- the adapter calls `/v1/suppliers` and `/v1/suppliers/:id` only when
  `VITE_YORSO_API_URL` is configured;
- local/Lovable preview falls back to existing mock supplier data only when
  `VITE_YORSO_API_URL` is not configured;
- configured API failures render a visible localized live API error state and
  do not substitute prototype supplier rows or fallback profiles;
- frontend search is debounced before API calls;
- listing calls stay paginated with `limit` and `offset`;
- listing calls include validated `sortBy` and `sortDirection` parameters when
  the user changes supplier ordering;
- `/suppliers` stores `q`, quick filter, sort, direction, rows and page in the
  URL so the same server-backed supplier view can be reloaded and shared;
- quick filters that can be expressed as API query parameters must be sent to
  the backend instead of filtering only a local page;
- locked responses must not include real company name, about text, website,
  WhatsApp, exact active-offer count or exact catalog breadth;
- qualified detail responses may include those fields through the typed API
  contract only after a supplier-access grant exists for the current account;
- API code must not import the Supabase client.

Batch #53 adds supplier directory pagination controls and sort URLs. Validation
must confirm `supplier_directory_sort_pagination=ok`, the `0009_supplier_directory_pagination_sort`
migration, and the absence of client-only sorting over a partial server page.

Batch #41 connects the existing `/offers` surface to the self-hosted offer
catalog backend path when `VITE_YORSO_API_URL` is configured.

The offer catalog bridge must preserve these rules:

- frontend offer catalog code uses `src/lib/offer-catalog-api.ts`;
- shared offer catalog runtime state uses `src/lib/use-offer-catalog.ts`;
- backend-supported filters are sent to `/v1/offers` instead of filtering only a
  local page;
- listing calls stay paginated with `limit` and `offset`;
- server-filtered API results are not refiltered locally for `q`, category,
  origin, supplier country, product state or certification;
- client-only filters remain local until backend support exists;
- supplier-name filtering remains hidden until `qualified_unlocked`;
- local/Lovable preview falls back to existing mock offer data;
- API failures render a visible localized fallback state;
- locked responses must not include exact price or real supplier identity;
- API code must not import the Supabase client.

Batch #42 connects the existing `/offers/:id` surface to the self-hosted offer
detail backend path when `VITE_YORSO_API_URL` is configured.

The offer detail bridge must preserve these rules:

- frontend offer detail code uses `src/lib/use-offer-detail.ts`;
- API-mode detail calls use `src/lib/offer-catalog-api.ts` and
  `GET /v1/offers/:id`;
- local/Lovable preview uses `findFallbackOfferById`, not a random replacement
  offer;
- API 404 without a safe local fallback renders the not-found state;
- API failure for a seeded local offer renders a visible localized recovery
  state and continues with access-shaped prototype data;
- locked detail responses and fallback data must not include exact price or real
  supplier identity;
- `OfferDetail.tsx` must not import `useResilientOffer`.

Batch #43 adds a dedicated offer detail runtime smoke:

- `scripts/smoke-self-hosted-offer-detail.mjs` starts `apps/api/dist/index.js`
  with memory repositories and checks `GET /v1/offers/:id`;
- success markers include `offer_detail_locked=ok`,
  `offer_detail_registered_locked=ok`, `offer_detail_unlocked=ok`,
  `offer_detail_not_found=ok`, `offer_detail_method_guard=ok`,
  `offer_detail_validation_guard=ok` and
  `self_hosted_offer_detail_smoke=ok`;
- `ci:core` runs `smoke:self-hosted-offer-detail:run`, so a broken detail API
  blocks merge before the frontend can depend on it.

Batch #44 extends this runtime smoke with `offer_detail_requires_grant=ok`.
The marker proves that a signed account without an approved supplier-access
grant is downgraded to `registered_locked` even when the request asks for
`qualified_unlocked`.

Batch #45 applies the same rule to supplier profiles. The account API smoke and
optional PostgreSQL workspace smoke include `supplier_directory_requires_grant=ok`
before approval and `supplier_directory_unlocked=ok` after approval. This keeps
supplier identity, contacts and exact catalog breadth behind server-side grants,
not frontend state.

Batch #46 tightens supplier directory search. Private supplier identity search
is no longer a global `qualified_unlocked` behavior. It is scoped to suppliers
where the current buyer has an active `supplier_identity` grant:

- before approval, `supplier_directory_private_search_requires_grant=ok` proves
  that searching a real company name returns no rows;
- after approval, `supplier_directory_granted_private_search=ok` proves that
  the same private company name becomes searchable for the granted supplier;
- `supplier_directory_ungranted_private_search_guard=ok` proves that an
  unrelated supplier company name remains hidden after a different grant.

Batch #47 applies the same rule to offer catalog list/search. A requested
`qualified_unlocked` list no longer unlocks every row by query parameter alone:

- before approval, `offer_catalog_private_search_requires_grant=ok` proves that
  private supplier-name offer search returns no rows;
- `offer_catalog_list_requires_grant=ok` proves that public offer matches still
  hide exact price and supplier identity before approval;
- after approval, `offer_catalog_granted_private_search=ok` proves the granted
  supplier's offer can be found by private supplier name and returned unlocked;
- `offer_catalog_ungranted_private_search_guard=ok` proves unrelated supplier
  private names remain hidden after a different grant.

Batch #54 adds offer catalog pagination and sort validation:

- `/v1/offers` accepts only enum-backed `sortBy` and `sortDirection` values;
- `limit` and `offset` remain bounded by the shared offer catalog contract;
- `/offers` stores `q/category/origin/supplierCountry/state/certification/sort/dir/rows/page`
  in URL state;
- migration `0010_offer_catalog_pagination_sort` adds indexes for latest,
  category, origin and MOQ ordering;
- the account API smoke prints `offer_catalog_sort_pagination=ok`.

Batch #55 adds offer catalog browser e2e validation:

- `smoke:e2e:offers-catalog` builds the frontend and runs
  `e2e/offers-catalog-paging.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks URL hydration, sort controls, page-size changes,
  Next/Previous navigation, out-of-range page clamping and private supplier
  search gating;
- this protects the production offer catalog read path from returning to
  unbounded client-side full-list browsing under the 10,000 concurrent-user
  baseline.

Batch #56 adds supplier directory browser e2e validation:

- `smoke:e2e:suppliers-directory` builds the frontend and runs
  `e2e/suppliers-directory-paging.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks URL hydration, quick filters, sort controls, page-size
  changes, Next/Previous navigation, out-of-range page clamping, private
  supplier-name search gating and locked supplier breadth masking;
- this protects the production supplier directory read path from returning to
  unbounded client-side full-list browsing or hidden supplier identity discovery
  under the 10,000 concurrent-user baseline.

Batch #57 adds supplier profile detail browser e2e validation:

- `smoke:e2e:supplier-profile-detail` builds the frontend and runs
  `e2e/supplier-profile-detail.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks one-click supplier access request creation, locked
  identity no-leak behavior, approval refresh banner behavior, matching-supplier
  unlock, unrelated supplier approval isolation and unknown supplier not-found
  cleanup;
- this protects `/suppliers/:id` from regressing into frontend-only unlocks,
  stale structured data leaks or polling-heavy approval refreshes under the
  10,000 concurrent-user baseline.

Batch #58 adds offer detail runtime browser e2e validation:

- `smoke:e2e:offer-detail-runtime` builds the frontend and runs
  `e2e/offer-detail-runtime.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks one-click price-access request creation, locked supplier
  and exact-price no-leak behavior, approval refresh banner behavior,
  matching-supplier unlock, unrelated supplier approval isolation and unknown
  offer not-found cleanup;
- local fallback shaping and self-hosted offer API shaping both redact
  delivery-basis prices and volume-break prices until access is granted;
- this protects `/offers/:id` from leaking commercial terms through DOM text,
  route metadata or fallback mock data under the 10,000 concurrent-user
  baseline.

Batch #59 adds offer catalog detail flow browser e2e validation:

- `smoke:e2e:offer-catalog-detail-flow` builds the frontend and runs
  `e2e/offer-catalog-detail-flow.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks the complete registered buyer path: catalog row locked,
  detail one-click access request, matching supplier approval, refresh banner,
  unlocked detail, back-to-catalog URL state preservation and unlocked matching
  catalog row;
- the same spec verifies that unrelated supplier approval does not unlock the
  current catalog/detail flow;
- this protects the production offer discovery path from stale access state,
  global frontend unlocks and unnecessary polling under the 10,000 concurrent
  users baseline.

Batch #60 adds supplier directory profile flow browser e2e validation:

- `smoke:e2e:supplier-directory-profile-flow` builds the frontend and runs
  `e2e/supplier-directory-profile-flow.spec.ts`;
- the shared `smoke:e2e:run` suite also includes this spec;
- the browser checks the complete registered buyer path: directory row locked,
  profile one-click access request, matching supplier approval, refresh banner,
  unlocked profile, back-to-directory URL state preservation and unlocked
  matching supplier row;
- the same spec verifies that unrelated supplier approval does not unlock the
  current directory/profile flow;
- this protects the production supplier discovery path from stale access state,
  hidden identity leaks, global frontend unlocks and unnecessary polling under
  the 10,000 concurrent users baseline.

Batch #61 adds API-backed supplier directory profile flow browser e2e
validation:

- `smoke:e2e:supplier-directory-profile-api-flow` builds the frontend with
  `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`;
- the run step executes `e2e/supplier-directory-profile-api-flow.spec.ts` with
  Playwright-intercepted `/v1/suppliers` and `/v1/access/*` responses;
- the browser checks that backend-style notification approval unlocks the
  matching supplier after profile refresh and preserves the directory
  `q/filter/sort/rows` URL state on return;
- the browser also checks that approval for another supplier does not unlock
  the current supplier row/profile;
- this protects the production self-hosted API path from regressions that would
  pass only in local mock fallback mode.

Batch #62 adds API-backed offer catalog detail flow browser e2e validation:

- `smoke:e2e:offer-catalog-detail-api-flow` builds the frontend with
  `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`;
- the run step executes `e2e/offer-catalog-detail-api-flow.spec.ts` with
  Playwright-intercepted `/v1/offers`, `/v1/offers/:id` and `/v1/access/*`
  responses;
- the browser checks that backend-style notification approval unlocks the
  matching offer after detail refresh and preserves the catalog
  `q/category/sort/rows` URL state on return;
- the browser also checks that approval for another supplier does not unlock
  the current offer row/detail;
- this protects the production self-hosted API path from regressions that would
  pass only in local mock fallback mode.

Batch #63 adds API-backed supplier access notification center browser e2e
validation:

- `smoke:e2e:supplier-access-notification-center-api-flow` builds the frontend
  with `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`;
- the run step executes
  `e2e/supplier-access-notification-center-api-flow.spec.ts` with
  Playwright-intercepted `/v1/access/notifications` responses;
- the browser checks that the header bell does not auto-load the feed on render
  beyond the bounded app-level sync, and that opening the bell refreshes the
  feed on demand;
- the browser checks that "Mark all read" and opening a notification row both
  acknowledge unread rows through `PATCH /v1/access/notifications`;
- the browser checks that notification API requests carry `x-yorso-user-id` and
  `x-yorso-session-id`;
- this protects the production notification center from regressions that would
  create unbounded header reads or repeated unread notification payloads.

Batch #64 adds a single API-backed access browser suite:

- `smoke:e2e:api-backed-access-flows` builds the frontend with
  `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`;
- the run step executes the API-backed supplier directory/profile flow,
  offer catalog/detail flow and supplier access notification center flow in one
  Playwright command;
- CI runs this suite after the default browser smoke, so both local fallback
  and self-hosted API adapter paths are release-gated;
- this prevents API-mode access regressions from hiding behind passing
  prototype-only localStorage smoke tests.

Batch #65 adds real self-hosted API browser validation:

- `smoke:e2e:self-hosted-access-runtime` builds `apps/api`, starts the API in
  memory mode on a free local port, builds the frontend with
  `VITE_YORSO_API_URL` pointed at that API, then runs
  `e2e/self-hosted-access-runtime.spec.ts` against Vite preview on a separate
  free port;
- the test uses no Playwright route interception, so browser requests go
  through the same self-hosted API adapter that production will use;
- the browser starts locked, creates a supplier access request from offer
  detail, receives approval through the real access decision endpoint, then
  verifies that the same grant unlocks offer detail, offer catalog private
  search and supplier directory private search;
- the wrapper prints `self_hosted_access_runtime_e2e=ok` only when the runtime
  path succeeds end to end;
- this is the first CI-level guard that validates frontend + self-hosted API
  together instead of validating either the API or mocked API browser mode in
  isolation.

Batch #66 originally added optional Supabase frontend validation. Backend
Phase 3C supersedes it with provider-free frontend validation:

- `smoke:e2e:frontend-provider-free-env` builds the frontend with the owned API
  contract only and no hosted BaaS frontend env;
- the wrapper starts Vite preview on a free local port and runs
  `e2e/frontend-provider-free-env.spec.ts`;
- the spec opens `/`, `/signin`, `/reset-password` and `/offers`, then checks
  that no fatal hosted-provider client construction error appears in browser
  console;
- the sign-in screen falls back to the local contract when the self-hosted API
  is not configured;
- this guard prevents accidental reintroduction of hosted BaaS as a required
  production runtime dependency.

Batch #67 added auth runtime boundary validation; Phase 2J removes the auth
Supabase fallback from that boundary:

- `src/lib/auth-runtime.ts` owns self-hosted/local-only email sign-in,
  password reset request, recovery-session observation and recovered password
  update;
- `src/pages/SignIn.tsx` and `src/pages/ResetPassword.tsx` import only that
  adapter, not `@/integrations/supabase/client`;
- `test:auth-runtime` verifies self-hosted API mode, local fallback mode and
  self-hosted password recovery behavior;
- `check:provider-boundary` scans production source roots for hosted-provider
  imports, env keys and legacy runtime markers;
- `ci:core` runs `test:auth-runtime`, so the boundary is checked before merge.

Backend Phase 3A replaces the old legacy catalog Supabase adapter boundary with
removal validation:

- `src/lib/catalog-api.ts` is the self-hosted-first facade and delegates only to
  `createOfferCatalogApiClient`;
- API-disabled preview uses the local fixture path inside
  `src/lib/offer-catalog-api.ts`, not Supabase;
- `src/lib/legacy-catalog-supabase-adapter.ts` must stay absent;
- `src/lib/catalog-api.boundary.test.ts` verifies the self-hosted catalog source
  of truth, local preview delegation and removed fallback file;
- `test:offer-catalog-frontend` includes that boundary test;
- `check:self-hosted-api` and `check:production-scale-baseline` fail if
  `fetchLegacyCatalogOffers`, `fetchLegacyCatalogOfferById`, `SupplierPublicRow`
  or a direct Supabase client dependency returns to the catalog facade.

Backend Phase 3B replaces Batch #69's legacy supplier access Supabase adapter
boundary with a removal guard:

- `src/lib/supplier-access-api.ts` remains the self-hosted-first access facade
  for request status, request creation and notification acknowledgement;
- configured deployments use only `/v1/access/suppliers/:supplierId/request`
  and `/v1/access/notifications`;
- API-disabled preview uses only local `supplier-access-requests` storage;
- `src/lib/legacy-supplier-access-supabase-adapter.ts` is removed and must stay
  absent;
- `src/lib/supplier-access-api.boundary.test.ts` verifies API-disabled local
  preview behavior, fail-closed configured API behavior and absence of deleted
  legacy Supabase markers in `supplier-access-api.ts`;
- `test:supplier-access-frontend` includes that boundary test;
- `check:self-hosted-api` and `check:production-scale-baseline` fail if the
  supplier access facade regains a direct Supabase client dependency or the
  removed legacy adapter file returns.

Backend Phase 3C replaces remaining active provider reference tooling with
provider-free guards:

- `supabase/` and `src/integrations/supabase/` are removed from the tracked
  product surface;
- Supabase CLI/type/access scripts and RLS reference tests are removed;
- `@supabase/supabase-js` is removed from package manifests;
- `.env` and `.env.example` contain no `VITE_SUPABASE_*` keys;
- `check:provider-boundary` replaces `check:supabase-boundary`;
- `smoke:e2e:frontend-provider-free-env` replaces the old no-Supabase smoke.

Phase 2J replaces Batch #70's legacy auth Supabase adapter boundary with a
removal guard:

- `src/lib/auth-runtime.ts` remains the production-facing auth facade for
  sign-in, password reset, recovery observation and recovered password update;
- `src/lib/legacy-auth-supabase-adapter.ts` is deleted;
- `src/lib/auth-runtime.boundary.test.ts` verifies the removed adapter file does
  not exist and `auth-runtime.ts` contains no `supabase_prototype`,
  `legacy-auth-supabase-adapter`, `VITE_SUPABASE` or direct Supabase imports;
- `test:auth-runtime` includes both runtime behavior tests and the boundary
  test;
- `check:self-hosted-api` and `check:production-scale-baseline` fail if the
  auth runtime facade regains the removed Supabase prototype fallback.

Batch #71 adds self-hosted production policy validation:

- `docs/backend/self-hosted-production-policy.md` states that YORSO production
  must run as one self-hosted product on owned server infrastructure;
- Supabase and similar hosted BaaS/SaaS application backends are explicitly
  excluded from production auth, database, storage, access-control and
  deployment dependencies;
- legacy Supabase assets are documented as prototype/reference only;
- `check:backend-policy` and `check:production-scale-baseline` guard this
  direction before merge.

Batch #75 adds backend session authority validation:

- `apps/api/src/modules/auth/session.ts` exposes
  `resolveAuthenticatedAccountSession` and
  `resolveOptionalAuthenticatedAccountSession`;
- protected account, storage and supplier-access routes validate
  `x-yorso-session-id` through the self-hosted auth service before using
  `x-yorso-user-id`;
- optional offer and supplier directory routes remain public when no session
  headers are sent, but reject invalid or mismatched sessions instead of
  accepting client-provided user ids;
- runtime smokes sign in through `/v1/auth/sign-in` before protected calls and
  print session-authority markers;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the new
  session authority boundary.

Batch #76 adds revoked-session guards:

- `smoke:self-hosted-auth-api` verifies that a session id rejected after
  `/v1/auth/sign-out` cannot read `/v1/account/me`,
  `/v1/access/notifications`, or authenticated `/v1/offers` unlock paths;
- the same smoke verifies that `/v1/offers` without session headers still
  returns public redacted catalog data instead of failing the anonymous
  browsing path;
- `server.test.ts` covers the same revoked-session behavior at API unit level;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the new
  Batch #76 smoke markers and documentation.

Batch #77 adds auth security-event validation:

- `packages/db/migrations/0012_auth_security_events.sql` owns
  `yorso_auth_security_events` and the event-type enum;
- `AuthService` records sign-in success/failure, rate-limit, invalid-session
  and sign-out events through the self-hosted auth repository;
- repeated failed sign-ins for the same email return `429 auth_rate_limited`
  after the configured window threshold;
- `smoke:self-hosted-auth-api` prints `auth_rate_limit_guard=ok`;
- `check:self-hosted-db`, `check:self-hosted-api` and
  `check:production-scale-baseline` guard the migration, smoke marker and
  10,000 concurrent-user notes.

Batch #78 adds production rate-limit runtime validation:

- `AUTH_RATE_LIMIT_DRIVER=redis` and `AUTH_RATE_LIMIT_FAIL_MODE=closed` are
  required by the production runtime guard;
- `AUTH_PASSWORD_RESET_WINDOW_MS` and `AUTH_PASSWORD_RESET_MAX_REQUESTS`
  configure password reset request bursts separately from sign-in failures;
- `AuthService` consumes the shared rate-limiter interface before password
  verification and records `sign_in_rate_limited` events with limiter metadata;
- password reset requests are checked before account lookup and record
  `password_reset_rate_limited` when blocked;
- the Redis limiter stores only hashed email/IP keys with TTL, not raw
  identifiers;
- local tests keep the audit-log fallback so the API smoke remains deterministic
  without a live Redis server;
- `smoke:self-hosted-auth-api` verifies `Retry-After: 900` alongside
  `auth_rate_limit_guard=ok`.

Batch #79 adds production session-cache validation:

- `AUTH_SESSION_CACHE_DRIVER=redis` and `AUTH_SESSION_CACHE_FAIL_MODE=closed`
  are required by the production runtime guard;
- the auth service reads sessions through a cache boundary first, falls back to
  PostgreSQL on cache miss, and writes the cache after sign-in or miss reload;
- sign-out deletes the cached session before the same id can be reused;
- local smoke runs the cache in memory mode and prints
  `auth_session_cache_invalidation=ok`;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  session-cache module, production env and smoke marker.

Batch #80 adds negative fail-closed validation for the same boundary:

- `smoke:self-hosted-session-cache-fail-closed` starts the API with Redis
  session cache enabled and a deliberately unavailable Redis endpoint;
- sign-in and `/v1/auth/session` must return
  `auth_session_cache_unavailable`;
- `/v1/account/me` and authenticated `/v1/offers?...accessLevel=qualified_unlocked`
  must fail closed instead of falling through to PostgreSQL;
- anonymous `/v1/offers` must still return public redacted data;
- `ci:core`, `check:self-hosted-api` and `check:production-scale-baseline`
  guard the new smoke and markers.

Batch #81 adds auth runtime observability validation:

- `AUTH_OBSERVABILITY_DRIVER=console` is required by production runtime config
  and docker-compose;
- `smoke:self-hosted-auth-observability` starts the compiled API with console
  telemetry enabled and parses emitted JSONL records;
- the smoke verifies `auth.sign_in.failed`, `auth.sign_in.rate_limited`,
  `auth.sign_in.succeeded`, `auth.sign_out.succeeded` and
  `auth.session.invalid`;
- the same smoke verifies that raw email, session id and user id values are not
  present in telemetry payloads;
- `ci:core`, `check:self-hosted-api` and `check:production-scale-baseline`
  guard the observability smoke and production-scale notes.

Batch #82 adds health/readiness validation:

- `/health/live` and `/v1/health/live` remain process liveness probes;
- `/health/ready` and `/v1/health/ready` check PostgreSQL, Redis, local storage
  and production runtime config with `HEALTH_READINESS_TIMEOUT_MS`;
- Docker Compose uses `/health/ready` for the API container healthcheck;
- `smoke:self-hosted-health-readiness` verifies local ready state, Redis outage,
  PostgreSQL outage and method guards;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the readiness contract.

Batch #83 adds graceful shutdown validation:

- `ApiLifecycle` tracks active requests and exposes drain state to readiness;
- `SIGTERM`/`SIGINT` move the API into `server_draining`;
- readiness returns `503 not_ready` with `shutdownDrain.reason=server_draining`;
- live health remains available during the drain window;
- non-health work receives `503 server_draining` while the process drains;
- Docker Compose `stop_grace_period` is longer than the default drain plus
  grace timeout;
- `smoke:self-hosted-graceful-shutdown` verifies the compiled API behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the graceful shutdown drain contract.

Batch #84 adds request guardrails validation:

- `apps/api/src/server.ts` enforces bounded request timeout, header timeout,
  keep-alive timeout and maximum header bytes from runtime env;
- `apps/api/src/http.ts` enforces JSON body max bytes and body idle timeout
  before route validation or repository writes;
- oversized JSON bodies return `413 request_body_too_large`;
- stalled body uploads return `408 request_body_timeout`;
- long-running work returns `408 request_timeout`;
- oversized headers are rejected by the HTTP parser with `431`;
- `smoke:self-hosted-request-guardrails` starts the compiled API and verifies
  large body, body idle timeout and header-size failure modes;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the request timeout and backpressure contract.

Batch #85 adds request observability validation:

- production runtime config requires `YORSO_REQUEST_OBSERVABILITY_DRIVER=console`;
- `apps/api/src/request-observability.ts` emits sanitized `api_request_event`
  JSONL records for normal requests and request guardrails;
- route values are normalized and query strings are dropped before logging;
- request payload data, email addresses, passwords and session identifiers must
  not appear in request telemetry;
- `smoke:self-hosted-request-observability` verifies completion telemetry,
  `request_body_too_large`, `request_body_timeout`, `request_header_too_large`
  and no-PII stdout behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the request observability contract.

Batch #86 adds error observability validation:

- production runtime config requires `YORSO_ERROR_OBSERVABILITY_DRIVER=console`;
- `apps/api/src/http.ts` adds `errorId`, `correlationId`, `x-error-id` and
  `x-correlation-id` to structured JSON errors;
- `apps/api/src/error-observability.ts` emits sanitized `api_error_event`
  JSONL records for error responses and parser/header errors;
- error telemetry includes route, status, error code, category, retryability,
  request id, correlation id and error id;
- error telemetry must not include payload values, query strings, email
  addresses, passwords, session ids or stack traces;
- `smoke:self-hosted-error-observability` verifies envelope correlation,
  `auth_invalid_credentials`, `request_body_too_large`,
  `request_header_too_large` and no-PII stderr/stdout behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the error observability contract.

Batch #87 adds metrics validation:

- production runtime config requires `YORSO_METRICS_DRIVER=prometheus`;
- `apps/api/src/metrics.ts` exposes a Prometheus-compatible registry;
- `/metrics` and `/v1/metrics` return Prometheus text with
  `yorso_api_requests_total`, `yorso_api_request_duration_seconds`,
  `yorso_api_errors_total`, `yorso_api_auth_events_total`,
  `yorso_api_guardrails_total`, `yorso_api_readiness_checks_total` and lifecycle
  gauges;
- labels are low-cardinality and sanitized: normalized route, method, status
  class, outcome, error category/code and guardrail kind only;
- metrics must not include payload values, query strings, email addresses,
  passwords, supplier ids, offer ids or session ids;
- `smoke:self-hosted-metrics` verifies Prometheus output, request histogram,
  error, auth, guardrail and readiness counters plus no-PII behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the metrics contract.

Batch #88 adds audit trail validation:

- local runtime validation can use `YORSO_AUDIT_DRIVER=console`;
- `apps/api/src/audit.ts` emits sanitized `api_audit_event` JSONL records;
- auth, account, supplier-access and storage routes record protected mutations
  and auth outcomes through the audit sink;
- audit events include request id, correlation id, action, outcome, route and
  hashed actor/session/resource identifiers only;
- audit events must not include request bodies, query strings, email
  addresses, passwords, raw user ids, raw session ids, supplier ids, file names
  or business profile values;
- `smoke:self-hosted-audit-trail` verifies auth failure/success, company
  update, supplier access request/decision, notification ack, file/document
  upload and no-PII stdout behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-infra`,
  `check:self-hosted-production-runtime` and `check:production-scale-baseline`
  guard the audit trail contract.

Batch #89 adds durable audit persistence validation:

- production runtime config requires `YORSO_AUDIT_DRIVER=postgres`;
- production/runtime env defines `YORSO_AUDIT_MAX_IN_FLIGHT=2000`;
- `packages/db/migrations/0013_api_audit_events.sql` creates
  `yorso_api_audit_events` for sanitized audit envelopes only;
- audit persistence indexes support time, action/outcome, actor-hash,
  resource-hash and correlation-id investigations;
- `PostgresAuditSink` writes to PostgreSQL and applies in-flight backpressure;
- backpressure emits sanitized `api_audit_dropped` metadata without raw user,
  session, supplier, file or business values;
- `smoke:self-hosted-audit-persistence` verifies insert shape, hash-only
  parameters and backpressure behavior without requiring a live database;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-db`,
  `check:self-hosted-infra`, `check:self-hosted-production-runtime` and
  `check:production-scale-baseline` guard the durable audit contract.

Batch #90 adds admin audit read/export validation:

- `packages/db/migrations/0014_admin_audit_access.sql` creates
  `yorso_user_roles` and read-support indexes for audit status/route filters;
- `apps/api/src/modules/admin-audit/*` exposes an admin-only repository,
  service and route layer;
- `/v1/admin/audit-events` returns cursor-paginated JSON with a maximum of 500
  rows per request;
- `/v1/admin/audit-events/export` returns bounded JSONL with a maximum of
  10,000 rows per request and an `x-next-cursor` continuation header;
- non-admin sessions are denied with `403 admin_role_required`;
- `smoke:self-hosted-admin-audit` verifies session guard, role guard, list,
  export and validation behavior;
- `ci:core`, `check:self-hosted-api`, `check:self-hosted-db` and
  `check:production-scale-baseline` guard the admin audit contract.

Batch #91 extends the validation:

- `packages/db/migrations/0015_admin_audit_retention_query_hardening.sql`
  adds route/status investigation indexes and `yorso_purge_api_audit_events`;
- `YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS` limits JSONL export windows;
- `YORSO_ADMIN_AUDIT_RETENTION_DAYS` documents and guards retention;
- `smoke:self-hosted-admin-audit` also verifies route/status filtering,
  export-window rejection and Prometheus admin audit metrics;
- `check:self-hosted-production-runtime`, `check:self-hosted-api`,
  `check:self-hosted-db` and `check:production-scale-baseline` guard the new
  admin audit hardening markers.

Batch #92 extends the validation again:

- `packages/db/migrations/0016_admin_audit_retention_runtime.sql` adds
  `yorso_purge_api_audit_events_batch` and the retention scan index;
- `POST /v1/admin/audit-events/retention` supports dry-run and bounded apply;
- `admin:audit:retention` gives operators a CLI that defaults to dry-run and
  requires `--apply` for deletion;
- `/v1/admin/audit-events/export?format=csv` verifies escaped CSV output while
  preserving the same pagination and export-window limits;
- `smoke:self-hosted-admin-audit` verifies CSV export, retention dry-run,
  retention apply and retention Prometheus metrics;
- `check:self-hosted-api`, `check:self-hosted-db` and
  `check:production-scale-baseline` guard the Batch #92 markers.

Batch #93 adds admin runtime status validation:

- `GET /v1/admin/runtime/status` requires a self-hosted session and `admin`
  role;
- the response confirms `selfHostedBackend`, `targetConcurrentUsers: 10000`,
  request guardrails, admin audit retention/export limits and lifecycle drain
  state;
- the response excludes secrets, connection strings, storage endpoints, emails,
  raw user ids and raw session ids;
- `smoke:self-hosted-admin-runtime-status` verifies auth guard, role guard,
  safe payload shape, no-secret serialization and Prometheus status metrics;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  Batch #93 admin runtime status contract.

Batch #94 adds admin runtime UI validation:

- `/admin/runtime` is the operator-facing frontend route for the same
  self-hosted runtime status contract;
- the route uses the self-hosted API adapter and sends `x-yorso-user-id` plus
  `x-yorso-session-id` from the browser session;
- disabled, missing-session and non-admin states are rendered explicitly;
- the page renders the 10,000 concurrent-user policy, runtime drivers, auth
  protection, request guardrails, audit limits, lifecycle state and production
  policy without rendering emails, raw ids, session ids, connection strings or
  storage endpoints;
- `test:admin-runtime-frontend` covers adapter, hook and page behavior;
- `smoke:e2e:admin-runtime-status` verifies the browser route with an
  API-backed mock and guards the no-secret UI contract;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  Batch #94 admin runtime UI contract.

Batch #95 adds admin runtime diagnostics validation:

- `GET /v1/admin/runtime/diagnostics` uses the same self-hosted session and
  `admin` role protection as `/v1/admin/runtime/status`;
- diagnostics returns checks for production policy, capacity baseline, auth
  rate limiting, session cache, observability, audit durability, request
  guardrails and lifecycle drain;
- diagnostics returns a capacity plan covering read/write profile, cache,
  backpressure, database strategy, failure mode, observability and load-test
  plan;
- diagnostics excludes secrets, connection strings, storage endpoints, emails,
  raw user ids and raw session ids;
- `smoke:self-hosted-admin-runtime-status` verifies
  `admin_runtime_diagnostics_read=ok` and diagnostics metrics;
- `test:admin-runtime-frontend` verifies adapter, hook and page diagnostics;
- `smoke:e2e:admin-runtime-status` verifies the browser diagnostics panel and
  capacity plan;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  Batch #95 admin runtime diagnostics contract.

Batch #96 adds supplier access review validation:

- `GET /v1/admin/access-requests` requires a self-hosted session and `admin`
  role;
- `POST /v1/admin/access-requests/:requestId/decision` approves, rejects,
  marks pending or revokes an existing supplier access request;
- approval creates `supplier_identity` and `offer_price` grants and a buyer
  `price_access_approved` notification through the existing access service;
- `0017_supplier_access_review_queue` provides bounded open-queue and history
  indexes for the operator path;
- `smoke:self-hosted-admin-access-review` verifies auth guard, role guard,
  list filtering, pending decision, approval grants, buyer notification and
  invalid-decision validation;
- `test:admin-access-review-frontend` covers adapter, hook and page states;
- `smoke:e2e:admin-access-review` verifies browser headers, row refresh and
  role-guard rendering with an API-backed mock;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  Batch #96 supplier access review contract.

Batch #97 adds supplier access grants validation:

- `GET /v1/admin/access-grants` requires a self-hosted session and `admin`
  role;
- `POST /v1/admin/access-grants/:grantId/revoke` expires both supplier
  identity and offer price grants for the same buyer and supplier;
- revoked access must downgrade offer catalog/detail and supplier directory
  responses back to locked data shaping;
- `0018_admin_access_grants_console` provides active, expired, buyer, supplier
  and revoke-event indexes for bounded operator reads;
- `smoke:self-hosted-admin-access-grants` verifies auth guard, role guard,
  active list, revoke, post-revoke masking, expired filter and validation;
- `test:admin-access-grants-frontend` covers adapter, hook and page states;
- `smoke:e2e:admin-access-grants` verifies browser headers, row refresh and
  role-guard rendering with an API-backed mock;
- `check:self-hosted-api` and `check:production-scale-baseline` guard the
  Batch #97 supplier access grants contract.

## Production Direction

The self-hosted stack is the production path. Supabase scripts, migrations and
smoke tests may remain only as legacy prototype/reference checks while they are
being retired, but they must not be required for production deployment. New
production-facing work must target YORSO-owned API contracts, PostgreSQL,
owned object storage, Redis/PgBouncer and self-hosted deployment tooling.

If a future prototype experiment tries to use Supabase or a similar hosted
BaaS/SaaS backend, document it as non-production, keep it behind an adapter and
add a removal path. Do not let page/component code import the Supabase client as
a production data gateway.
## Batch #99 Admin Operations Validation

Batch #99 adds the following validation surface:

```bash
npm run test:admin-operations-frontend
npm run smoke:self-hosted-admin-operations
npm run smoke:e2e:admin-operations
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/operations/overview` requires a valid self-hosted session;
- buyer sessions receive `admin_role_required`;
- admin sessions receive sanitized runtime and access overview data;
- review and grants previews stay bounded to 5 rows;
- frontend adapter sends `x-yorso-user-id` and `x-yorso-session-id`;
- `/admin` renders disabled, session-required, forbidden, error and ready states;
- operator payloads do not render emails, session ids or connection strings.

## Batch #100 Admin Command Center Validation

Batch #100 adds the following validation surface:

```bash
npm run test:admin-operations-frontend
npm run test:admin-audit-frontend
npm run smoke:self-hosted-admin-operations
npm run smoke:e2e:admin-operations
npm run smoke:e2e:admin-audit-events
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/operations/overview` includes audit summary, readiness and operator
  actions without leaking secrets;
- `/admin` renders audit card, readiness checklist, action shortcuts and recent
  audit feed;
- `/admin/audit` renders disabled, session-required, forbidden, loading, error
  and ready states;
- `/admin/audit` sends only supported audit filters and self-hosted session
  headers to `/v1/admin/audit-events`;
- CSV export points to `/v1/admin/audit-events/export?format=csv`;
- the browser smoke keeps admin audit reads on the self-hosted API contract,
  not Supabase or another hosted BaaS.

## Batch #101 Admin Incident Response Validation

Batch #101 adds the following validation surface:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incidents
npm run smoke:self-hosted-admin-operations
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/incidents` requires a valid self-hosted admin session;
- `/v1/admin/incidents` returns bounded, sanitized incident lists and summary;
- `/v1/admin/incidents/:incidentId` returns a single incident detail;
- `/v1/admin/incidents/:incidentId/acknowledge` persists acknowledged/resolved
  state without leaking emails, session ids or connection strings;
- `/admin/incidents` renders disabled, session-required, forbidden, loading,
  error and ready states;
- `/admin` includes incident summary, incident readiness and incident operator
  actions;
- `0019_admin_incident_acknowledgements.sql` stores only durable admin state and
  keeps derived incident reads bounded for the 10,000 concurrent users baseline.

## Batch #102 Admin Incident Workflow Validation

Batch #102 extends the same validation surface with assignment, escalation,
operator comments, SLA state and timeline events:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incidents
npm run test:db-contract
npm run test:db-migrations
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/incidents/:incidentId/workflow` requires the same self-hosted admin
  session and role boundary as incident reads;
- `/v1/admin/incidents/workflow/bulk` applies the same validation and admin
  session boundary to selected incidents and reports partial not-found rows;
- `/v1/admin/incidents/export` returns sanitized JSON/CSV handoff data under
  the same admin session and typed filter constraints;
- assignment requires an explicit assignee id and returns only a hashed assignee
  identifier to the browser;
- escalation requires a non-`none` escalation level;
- list filters support assignment state, escalation level and SLA state without
  accepting arbitrary SQL sort/filter fields;
- operator comments are stored as bounded timeline events;
- runbook steps and workload summary counters are rendered from the typed
  incident response contract, not generated in the browser;
- invalid workflow requests return validation errors;
- `0020_admin_incident_workflow.sql` stores only durable workflow state and
  indexed timeline events, not raw audit payloads or secrets;
- `/admin/incidents` renders SLA, due, assignment, escalation and timeline
  state without exposing raw user ids.

## Batch #103 Admin Incident Detail Handoff Validation

Batch #103 extends incident validation with a dedicated detail page,
per-incident handoff export, per-incident remediation plan and per-incident
postmortem draft:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-detail
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/incidents/:incidentId/handoff` requires the same self-hosted admin
  session and role boundary as incident reads;
- `/v1/admin/incidents/:incidentId/remediation` returns bounded operator steps,
  verification checks, rollback plan and capacity notes;
- `/v1/admin/incidents/:incidentId/postmortem` returns bounded JSON/Markdown
  executive summary, impact, hypotheses, action items, prevention checks and
  capacity review;
- JSON and Markdown handoffs are generated from the typed incident contract and
  do not include raw emails, session ids, passwords, connection strings or
  storage endpoints;
- workflow notes reject raw emails, UUIDs and token-like secret assignments
  before they reach the incident timeline;
- `/admin/incidents/:incidentId` renders incident snapshot, evidence, runbook,
  timeline, workflow controls, handoff controls, remediation controls and
  postmortem controls;
- `/admin/incidents/:incidentId` renders `admin-incident-detail-readiness`
  with evidence, runbook, owner, SLA and capacity handoff checks;
- `/admin/incidents` links each row to the detail route;
- the browser detail smoke is API-backed and not added to generic `smoke:e2e`;
- no new database migration is required because Batch #103 reuses the indexed
  Batch #102 acknowledgement and event tables.

Required runtime smoke markers:

- `admin_incidents_handoff_json=ok`;
- `admin_incidents_handoff_markdown=ok`;
- `admin_incidents_remediation_plan=ok`;
- `admin_incidents_postmortem_json=ok`;
- `admin_incidents_postmortem_markdown=ok`;
- `admin_incidents_note_hygiene_guard=ok`.

## Batch #104 Admin Incident Execution Tracker Validation

Batch #104 extends the admin incident detail flow with durable remediation and
postmortem execution items:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-detail
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/incidents/:incidentId/execution` requires the same self-hosted
  admin session and role boundary as incident detail reads;
- `/v1/admin/incidents/:incidentId/execution/export?format=json|csv` returns the
  same bounded execution item set for operator handoff and offline review;
- `/v1/admin/incidents/:incidentId/execution/:itemId` accepts only typed status
  updates and rejects unknown execution item ids;
- `status=done` requires bounded evidence and `status=blocked` requires a
  bounded blocked reason;
- execution notes reject raw emails, UUIDs and token-like secret assignments;
- `0021_admin_incident_execution.sql` stores per-incident execution state keyed
  by `(incident_id, item_id)` with incident/status, assignee/status and
  source/status indexes;
- `/admin/incidents/:incidentId` renders `admin-incident-detail-execution`, the
  explicit load control and the bounded execution plan without browser polling;
- the browser detail smoke exercises load, unsafe-note guard and mark-done
  workflow against API-backed route mocks.

Required runtime smoke markers:

- `admin_incidents_execution_plan=ok`;
- `admin_incidents_execution_export_json=ok`;
- `admin_incidents_execution_export_csv=ok`;
- `admin_incidents_execution_start=ok`;
- `admin_incidents_execution_done=ok`;
- `admin_incidents_execution_blocked=ok`;
- `admin_incidents_execution_note_hygiene_guard=ok`;
- `admin_incidents_execution_missing_item_guard=ok`.

## Batch #105 Admin Incident Execution Queue Validation

Batch #105 extends incident execution from a single incident detail view into a
bounded cross-incident operator queue:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-execution-queue
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

The validation checks:

- `/v1/admin/incidents/execution-queue` requires the same self-hosted admin
  session and role boundary as incident detail and execution routes;
- queue filters are typed and bounded: execution status, priority, source,
  owner role, assignment, incident status, incident severity, incident SLA and
  overdue state;
- `/v1/admin/incidents/execution-queue/export?format=json|csv` exports only the
  current bounded queue page;
- `/v1/admin/incidents/execution-queue/bulk` accepts at most 50 selected
  `(incidentId, itemId)` refs and returns partial success/failure results;
- bulk notes, evidence and blocked reasons reject raw emails, UUIDs, session ids
  and token-like secrets before they reach durable execution state;
- `/admin/incident-execution` renders disabled, session-required, forbidden,
  loading, error and ready states without fabricating execution data;
- the browser smoke exercises filters, JSON/CSV exports, bulk update and header
  propagation against the API-backed route mock.

Required runtime smoke markers:

- `admin_incidents_execution_queue=ok`;
- `admin_incidents_execution_queue_filters=ok`;
- `admin_incidents_execution_queue_export_json=ok`;
- `admin_incidents_execution_queue_export_csv=ok`;
- `admin_incidents_execution_queue_bulk=ok`;
- `admin_incidents_execution_queue_note_hygiene_guard=ok`.

## Batch #106 Admin Incident Workload Validation

Run:

```bash
npm run test:admin-incidents-frontend
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-workload
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `/admin/incident-workload` renders disabled, session-required, forbidden and
  ready states.
- Workload filters call `/v1/admin/incidents/execution-workload`.
- JSON and CSV exports call `/v1/admin/incidents/execution-workload/export`.
- Capacity forecast calls `/v1/admin/incidents/execution-workload/forecast`.
- Correlation drill-down calls `/v1/admin/incidents/:incidentId/correlation`.
- Sensitive values such as raw emails and session IDs stay out of the DOM.
- Migration `0022_admin_incident_workload_correlation` exists and is guarded.

Required runtime smoke markers:

- `admin_incidents_workload=ok`;
- `admin_incidents_workload_filters=ok`;
- `admin_incidents_workload_export_json=ok`;
- `admin_incidents_workload_export_csv=ok`;
- `admin_incidents_workload_forecast=ok`;
- `admin_incidents_correlation=ok`;
- `smoke:e2e:admin-incident-workload`.

## Batch #107 Admin Incident Trend Analytics Validation

Run:

```bash
npm run test:admin-incidents-frontend
npm run test:backend-contract
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-trends
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `/admin/incident-trends` renders disabled, session-required, forbidden,
  loading, error and ready states.
- Trend filters call `/v1/admin/incidents/trends`.
- JSON and CSV exports call `/v1/admin/incidents/trends/export`.
- Anomaly review calls `/v1/admin/incidents/trends/anomalies`.
- Operator briefing calls `/v1/admin/incidents/trends/briefing`.
- Sensitive values such as raw emails, session ids, database URLs and Redis
  URLs stay out of the browser DOM and export payloads.
- Migration `0023_admin_incident_trend_analytics` exists and is guarded.

Required runtime smoke markers:

- `admin_incidents_trends=ok`;
- `admin_incidents_trends_filters=ok`;
- `admin_incidents_trends_export_json=ok`;
- `admin_incidents_trends_export_csv=ok`;
- `admin_incidents_trends_anomalies=ok`;
- `admin_incidents_trends_briefing=ok`;
- `smoke:e2e:admin-incident-trends`.

## Batch #108 Admin Incident Trend Actions Validation

Run:

```bash
npm run test:admin-incidents-frontend
npm run test:api
npm run test:backend-contract
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-trends
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `/admin/incident-trends` renders the trend action panel.
- The action panel loads `/v1/admin/incidents/trends/actions`.
- Accept decisions call
  `/v1/admin/incidents/trends/actions/:actionId/decision` and update action
  state to `accepted`.
- Dismiss decisions store durable decision state without creating timeline
  events.
- Unsafe notes are rejected by the existing note hygiene guard.
- Sensitive values such as raw emails, raw UUIDs, session ids, tokens,
  database URLs and Redis URLs stay out of API responses and browser DOM.
- Migration `0024_admin_incident_trend_actions` exists and is guarded.

Required runtime smoke markers:

- `admin_incidents_trend_actions=ok`;
- `admin_incidents_trend_action_accept=ok`;
- `admin_incidents_trend_action_dismiss=ok`;
- `admin_incidents_trend_action_validation_guard=ok`;
- `smoke:e2e:admin-incident-trends`.

## Batch #109 Admin Incident Trend Action Queue Validation

Run:

```bash
npm run test:admin-incidents-frontend
npm run test:api
npm run smoke:self-hosted-admin-incidents
npm run smoke:e2e:admin-incident-trend-actions
npm run check:self-hosted-db
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `/admin/incident-trend-actions` renders disabled, session-required,
  forbidden, loading, error and ready states.
- The page calls `/v1/admin/incidents/trend-action-queue`.
- JSON and CSV exports call
  `/v1/admin/incidents/trend-action-queue/export`.
- Bulk accept/dismiss calls `/v1/admin/incidents/trend-action-queue/bulk`.
- Sensitive values such as raw emails, raw UUIDs, session ids, tokens,
  database URLs and Redis URLs stay out of API responses and browser DOM.
- Migration `0025_admin_incident_trend_action_queue` exists and is guarded.

Required runtime smoke markers:

- `admin_incidents_trend_action_queue=ok`;
- `admin_incidents_trend_action_queue_filters=ok`;
- `admin_incidents_trend_action_queue_export_json=ok`;
- `admin_incidents_trend_action_queue_export_csv=ok`;
- `admin_incidents_trend_action_queue_bulk=ok`;
- `admin_incidents_trend_action_queue_note_hygiene_guard=ok`;
- `smoke:e2e:admin-incident-trend-actions`.

## Backend Phase 4B Supplier Profile Dossier Facts Validation

Run:

```bash
npm run test:supplier-directory-frontend
npm run test:backend-contract
npm run test:db-migrations
npm run test:db-contract
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `productionFacts` and `logisticsFacts` are part of the typed
  supplier-directory contract.
- `MemorySupplierRepository` and `PostgresSupplierRepository` return those
  fields from the self-hosted supplier record.
- `SupplierProfile.tsx` renders production/logistics dossier sections from
  `supplier?.productionFacts` and `supplier?.logisticsFacts`.
- API-disabled preview facts are generated only by explicit local preview
  helpers, not by page-level profile synthesis.
- Migration `0031_supplier_profile_dossier_facts` exists and is guarded.

Required markers:

- `Backend Phase 4B`;
- `Supplier Profile Backend-Owned Dossier Completeness`;
- `No frontend hash-based production/logistics synthesis remains`;
- `production_facts`;
- `logistics_facts`.

## Backend Phase 4C Supplier Profile Evidence Blocks Validation

Run:

```bash
npm run test:supplier-directory-frontend
npm run test:backend-contract
npm run test:db-migrations
npm run test:db-contract
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `shipmentCases` and `faqItems` are part of the typed supplier-directory
  contract.
- `MemorySupplierRepository` and `PostgresSupplierRepository` return those
  fields from the self-hosted supplier record.
- `SupplierProfile.tsx` renders shipment evidence and FAQ from
  `supplier?.shipmentCases` and `supplier?.faqItems`.
- API-disabled preview evidence is generated only by explicit local preview
  helpers, not by page-level profile synthesis.
- Migration `0032_supplier_profile_evidence_blocks` exists and is guarded.

Required markers:

- `Backend Phase 4C`;
- `Supplier Profile Backend-Owned Evidence Blocks`;
- `No frontend hash-based shipment/FAQ synthesis remains`;
- `shipment_cases`;
- `profile_faq_items`.

## Backend Phase 4D Supplier Profile Legal Details Validation

Run:

```bash
npm run test:supplier-directory-frontend
npm run test:backend-contract
npm run test:db-migrations
npm run test:db-contract
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `legalDetails` is part of the typed supplier-directory contract.
- `MemorySupplierRepository` and `PostgresSupplierRepository` return
  `legalDetails` from the self-hosted supplier record.
- `shapeSupplierForAccess` returns `legalDetails: null` for
  `anonymous_locked` and `registered_locked`.
- `SupplierProfile.tsx` renders legal/compliance details from
  `supplier?.legalDetails` only for qualified buyers.
- API-disabled preview legal details are generated only by explicit local
  preview helper `localPreviewSupplierLegalDetails`.
- Migration `0033_supplier_profile_legal_details` exists and is guarded.

Required markers:

- `Backend Phase 4D`;
- `Supplier Profile Legal/Compliance Details Source Boundary`;
- `No frontend hash-based legal/compliance synthesis remains`;
- `legal_details`;
- `qualified_unlocked`;
- `not safe for locked buyer views`.

## Backend Phase 4E Supplier Restricted Documents Validation

Run:

```bash
npm run test:supplier-directory-frontend
npm run test:backend-contract
npm run test:db-migrations
npm run test:db-contract
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `supplierDocuments` is part of the typed supplier-directory contract.
- `MemorySupplierRepository` and `PostgresSupplierRepository` return
  `supplierDocuments` from the self-hosted supplier record.
- `shapeSupplierForAccess` returns `supplierDocuments: null` for
  `anonymous_locked` and `registered_locked`.
- `SupplierProfile.tsx` renders restricted document metadata from
  `supplier.supplierDocuments` only for qualified buyers.
- API-disabled preview document metadata is generated only by explicit local
  preview helper `localPreviewSupplierDocuments`.
- Migration `0034_supplier_profile_restricted_documents` exists and is guarded.

Required markers:

- `Backend Phase 4E`;
- `Supplier Profile Restricted Document Payload Boundary`;
- `supplierDocuments`;
- `supplier_documents`;
- `qualified_unlocked`;
- `locked buyer responses must contain null`.

## Backend Phase 4F Supplier Document Download Grants Validation

Run:

```bash
npm run contracts:build
npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"
npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts
npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-api.test.ts
npm run test:db-migrations
npm run test:db-contract
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `supplierDocumentDownloadGrantResponseSchema` is part of the typed
  supplier-directory contract.
- `POST /v1/suppliers/:supplierId/documents/:documentId/grant` requires an
  authenticated account session.
- The grant route re-checks supplier access and returns
  `supplier_document_access_required` before document lookup for locked buyers.
- Successful grant responses include a short-lived relative `downloadPath` but
  no `fileAssetId`, storage key or direct file URL.
- `MemorySupplierRepository` and `PostgresSupplierRepository` persist grant
  attempts in audit storage.
- Migration `0035_supplier_document_download_grants` exists and is guarded.

Required markers:

- `Backend Phase 4F`;
- `Supplier Document Download Grant Endpoint`;
- `supplierDocumentDownloadGrant`;
- `supplier_document_download_grants`;
- `qualified-only`;
- `must never expose file_asset_id, storage keys or direct file URLs`.

## Backend Phase 4G Supplier Document Download Serving Validation

Run:

```bash
npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "supplier document download grants"
npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts
npm run test:db-migrations
npm run test:db-contract
npm run smoke:self-hosted-account-api:run
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`
  requires an authenticated account session.
- The route validates grant id, buyer user, supplier id, document id, expiry,
  granted status and current supplier access before reading a file asset.
- Successful responses stream bytes with `content-disposition: attachment` and
  `cache-control: private, no-store`.
- Error responses do not include `fileAssetId`, object keys, storage keys or
  direct file URLs.
- `FileService.getFileByAssetId` is internal backend code and is not exposed as
  a browser-facing asset endpoint.
- `MemorySupplierRepository` and `PostgresSupplierRepository` persist download
  consumption attempts in `yorso_supplier_document_download_events`.
- Migration `0036_supplier_document_download_events` exists and is guarded.

Required markers:

- `Backend Phase 4G`;
- `Supplier Document Grant Consumption / File Serving Endpoint`;
- `GET /v1/suppliers/:supplierId/documents/:documentId/download`;
- `supplier_document_download_events`;
- `0036_supplier_document_download_events`;
- `grant_expired`.

## Backend Phase 4H Supplier Document Download UI Validation

Run:

```bash
npm test -- src/lib/supplier-directory-api.test.ts
npm run test:supplier-directory-frontend
npm run smoke:e2e:supplier-directory-profile-api-flow
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `downloadSupplierDocument` requests a self-hosted document grant before
  fetching the returned API `downloadPath`.
- The browser download fetch includes `x-yorso-user-id` and
  `x-yorso-session-id`.
- `SupplierProfile.tsx` renders `data-testid="supplier-document-download"` only
  for approved qualified documents when the self-hosted API is configured.
- Locked buyers keep non-downloadable document-readiness states.
- `fileAssetId`, object keys, storage keys and direct file URLs are not present
  in React-visible supplier document state, DOM, analytics or errors.
- Expired/failed grants show localized retry copy.
- The production passport keeps backend document rows visible even when
  optional logistics facts are absent from the supplier payload.

Required markers:

- `Backend Phase 4H`;
- `Supplier Document Download UI Integration`;
- `downloadSupplierDocument`;
- `supplier-document-download`;
- `fileAssetId`;
- `10,000 concurrent users`.

## Backend Phase 4I Supplier Document Download Audit Listing Validation

Run:

```bash
npm run contracts:build
npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document download audit without file asset leakage"
npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts
npm run test:api
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `GET /v1/admin/supplier-documents/download-events` requires an authenticated
  admin session.
- Buyer sessions receive `admin_role_required`.
- Query params are bounded by contract: `limit <= 100`, `offset <= 10 000`,
  optional `status`, `supplierId`, `buyerUserId`.
- The route reads `yorso_supplier_document_download_events` and orders by
  `created_at desc, id asc`.
- The browser-facing admin JSON response does not include `fileAssetId`, object
  keys, storage keys, direct file URLs or `downloadPath`.
- Reads emit audit action `admin.supplier_document_download_events.read`.

Required markers:

- `Backend Phase 4I`;
- `Supplier Document Download Audit Listing`;
- `/v1/admin/supplier-documents/download-events`;
- `supplierDocumentDownloadEventAdminListResponseSchema`;
- `admin.supplier_document_download_events.read`;
- `10,000 concurrent users`.

## Backend Phase 4J Supplier Document Grant Audit Listing Validation

Run:

```bash
npm run contracts:build
npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document grant audit without file asset leakage"
npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts
npm run test:api
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `GET /v1/admin/supplier-documents/download-grants` requires an authenticated
  admin session.
- Buyer sessions receive `admin_role_required`.
- Query params are bounded by contract: `limit <= 100`, `offset <= 10 000`,
  optional `status`, `supplierId`, `buyerUserId`.
- The route reads `yorso_supplier_document_download_grants` and orders by
  `created_at desc, id asc`.
- The browser-facing admin JSON response does not include `fileAssetId`, object
  keys, storage keys, direct file URLs or `downloadPath`.
- Reads emit audit action `admin.supplier_document_download_grants.read`.

Required markers:

- `Backend Phase 4J`;
- `Supplier Document Grant Audit Listing`;
- `/v1/admin/supplier-documents/download-grants`;
- `supplierDocumentDownloadGrantAdminListResponseSchema`;
- `admin.supplier_document_download_grants.read`;
- `10,000 concurrent users`.

## Backend Phase 4K Supplier Document Audit Admin UI Validation

Run:

```bash
npm run test:admin-supplier-document-audit-frontend
npm run smoke:e2e:admin-supplier-document-audit:run
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `/admin/supplier-document-audit` renders a read-only admin UI over grant
  attempts and download events.
- The frontend client sends self-hosted account session headers and requires a
  configured `VITE_YORSO_API_URL`.
- Missing sessions render a sign-in gate.
- Non-admin sessions render `admin_role_required`.
- UI responses are rejected if they contain `fileAssetId`, `downloadPath`,
  object keys or storage-only fields.
- Route code splitting stays intact through `React.lazy`.

Required markers:

- `Backend Phase 4K`;
- `Supplier Document Audit Admin UI`;
- `/admin/supplier-document-audit`;
- `createAdminSupplierDocumentAuditApiClient`;
- `useAdminSupplierDocumentAudit`;
- `admin-document-audit-page`;
- `admin-supplier-document-audit.spec.ts`;
- `10,000 concurrent users`.

## Backend Phase 4M Supplier Owner Document Create Runtime Validation

Run:

```bash
npm run test:supplier-document-management-runtime
npm run test:supplier-document-management-policy
npm run test:db-migrations
npm run smoke:self-hosted-account-api:run
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `POST /v1/suppliers/:supplierId/documents` requires an authenticated
  self-hosted account session.
- The authenticated company must have `accountRole=supplier|both`.
- The supplier row must belong to the same `company_id`.
- The payload accepts safe metadata plus backend-owned `fileUploadId`, not
  browser-controlled `fileAssetId`, object keys, storage keys or direct URLs.
- `createSupplierDocumentForOwner` applies the Phase 4L policy and creates a
  `review` document only.
- PostgreSQL writes the document append and
  `yorso_supplier_document_management_events` audit insert in one CTE.
- The browser response is sanitized and contains no storage identifiers.
- Smoke output includes `supplier_document_owner_create_review=ok`.

Required markers:

- `Backend Phase 4M`;
- `Supplier Owner Document Create Runtime`;
- `/v1/suppliers/:supplierId/documents`;
- `createSupplierDocumentForOwner`;
- `supplierDocumentManagementCreateResponseSchema`;
- `yorso_supplier_document_management_events`;
- `supplier_document_owner_create_review=ok`;
- `10,000 concurrent users`.

## Backend Phase 4N Supplier Document Admin Decision Runtime Validation

Run:

```bash
npm run test:supplier-document-management-runtime
npm run test:supplier-document-management-policy
npm run smoke:self-hosted-account-api:run
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`
  requires an authenticated self-hosted admin session.
- Buyer/supplier owner sessions receive `admin_role_required`.
- The request body accepts only `decision=approve|reject` and optional bounded
  audit `reason`.
- `decideSupplierDocumentAsAdmin` applies the Phase 4L policy: `review ->
  approved` and `review -> on_request`.
- Invalid repeated decisions return `invalid_status_transition`.
- PostgreSQL updates the JSONB document status and inserts
  `yorso_supplier_document_management_events` audit metadata in one CTE.
- The browser response is sanitized and contains no storage identifiers or
  `downloadPath`.
- Smoke output includes `supplier_document_admin_decision_review=ok`.

Required markers:

- `Backend Phase 4N`;
- `Supplier Document Admin Decision Runtime`;
- `/v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`;
- `decideSupplierDocumentAsAdmin`;
- `supplierDocumentManagementDecisionResponseSchema`;
- `supplier_document_admin_decision_review=ok`;
- `supplier_document.approve`;
- `supplier_document.reject`;
- `10,000 concurrent users`.

## Backend Phase 4O Supplier Document Owner Correction Runtime Validation

Run:

```bash
npm run test:supplier-document-management-runtime
npm run test:supplier-document-management-policy
npm run smoke:self-hosted-account-api:run
npm run check:self-hosted-api
npm run check:production-scale-baseline
```

Expected coverage:

- `PATCH /v1/suppliers/:supplierId/documents/:documentId` requires an
  authenticated self-hosted supplier owner session.
- `DELETE /v1/suppliers/:supplierId/documents/:documentId` requires the same
  owner/session/company boundary.
- Buyer-only sessions receive `supplier_document_owner_required`; missing
  sessions fail through the account session boundary.
- Metadata update accepts only bounded safe metadata and keeps storage
  internals out of the browser payload.
- `updateSupplierDocumentForOwner` and `deleteSupplierDocumentForOwner` apply
  the Phase 4L policy: only `review` and `on_request` are mutable by owner.
- Approved documents return `approved_document_immutable`.
- PostgreSQL update/delete paths mutate the JSONB document array and insert
  `yorso_supplier_document_management_events` audit metadata in one CTE.
- The browser response is sanitized and contains no storage identifiers or
  `downloadPath`.
- Smoke output includes `supplier_document_owner_update_delete=ok`.

Required markers:

- `Backend Phase 4O`;
- `Supplier Document Owner Correction Runtime`;
- `/v1/suppliers/:supplierId/documents/:documentId`;
- `updateSupplierDocumentForOwner`;
- `deleteSupplierDocumentForOwner`;
- `supplierDocumentManagementUpdateResponseSchema`;
- `supplierDocumentManagementDeleteResponseSchema`;
- `supplier_document_owner_update_delete=ok`;
- `supplier_document.update_metadata`;
- `supplier_document.delete`;
- `approved_document_immutable`;
- `10,000 concurrent users`.
