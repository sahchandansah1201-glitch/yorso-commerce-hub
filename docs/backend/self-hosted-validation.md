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

Supabase remains a temporary prototype and schema-validation tool. It must not
be treated as the future production backend.

## Required Commands

Run these commands before merging backend-direction changes:

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
| `check:supabase-boundary` | Fails if new pages/components import the Supabase client directly. |
| `check:self-hosted-infra` | Fails if the local self-hosted runtime skeleton loses PostgreSQL, PgBouncer, Redis, MinIO or required env keys. |
| `check:self-hosted-api` | Fails if the standalone `apps/api` skeleton, Dockerfile, compose hook, account API, supplier directory API, offer catalog API, supplier access UX bridge or Supabase production boundary is broken. |
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
| `smoke:self-hosted-account-api` | Builds and starts the standalone API, then verifies account session headers, company/profile writes, product matrix replacement, row-level workspace CRUD, media upload, document upload, file ownership, supplier directory access shaping and offer catalog access shaping over real HTTP. |
| `smoke:self-hosted-offer-detail` | Builds and starts the standalone API, then verifies `/v1/offers/:id` locked shaping, qualified unlock, not-found, method guard and validation guard over real HTTP. |
| `smoke:self-hosted-account-postgres` | Optionally applies live migrations and verifies the same account API over a real PostgreSQL repository when `MIGRATION_DATABASE_URL` is set; otherwise exits as skipped. |
| `smoke:self-hosted-workspace-postgres` | Optionally applies live migrations and verifies branches, products, meta-regions, notifications and supplier directory access shaping over the real PostgreSQL repository, including row-level CRUD, owner isolation and DB row counts. Exits as skipped when `MIGRATION_DATABASE_URL` is not set. |
| `test:account-workspace` | Runs account frontend adapter and workspace tests, including self-hosted API fallback behavior. |
| `test:supplier-directory-frontend` | Runs supplier directory frontend adapter, `/suppliers`, supplier profile tests and the shared supplier-directory runtime bridge for self-hosted API mode, debounce, access shaping, retry/error state and local fallback. |
| `test:offer-catalog-frontend` | Runs offer catalog frontend adapter plus list/detail runtime bridge tests for self-hosted API mode, backend-owned filters, server-filtered results, access shaping, visible fallback and local preview mode. |
| `test:supplier-access-frontend` | Runs supplier access frontend adapter and offer-detail access UI tests for self-hosted API mode, grant-only approval, local fallback and request/status rendering. |
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
- `.env.example` keeps Supabase frontend variables empty;
- `.env.example` does not contain service-role text, JWT-looking tokens or
  Supabase database URLs.

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
- `/suppliers` and `/offers` frontend API mode keeps paginated requests instead
  of unbounded list reads;
- the self-hosted offer detail smoke keeps `/v1/offers/:id` access shaping,
  not-found, method and validation behavior under CI;
- `ci:core` runs the scale baseline guard.

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
  identity through the same DTO contract.
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
- local/Lovable preview falls back to existing mock supplier data;
- API failures render a visible localized fallback state rather than silently
  hiding the backend problem;
- frontend search is debounced before API calls;
- listing calls stay paginated with `limit` and `offset`;
- quick filters that can be expressed as API query parameters must be sent to
  the backend instead of filtering only a local page;
- locked responses must not include real company name, about text, website,
  WhatsApp, exact active-offer count or exact catalog breadth;
- qualified detail responses may include those fields through the typed API
  contract only after a supplier-access grant exists for the current account;
- API code must not import the Supabase client.

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

## Production Direction

The self-hosted stack should become the production path. Supabase scripts,
migrations and smoke tests may remain while they protect the prototype, but new
production-facing work should target YORSO-owned API contracts and PostgreSQL
deployment.

If a future change needs Supabase for a temporary prototype flow, document the
reason and keep it behind an adapter. Do not let page/component code import the
Supabase client as a production data gateway.
