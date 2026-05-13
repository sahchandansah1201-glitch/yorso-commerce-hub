# Self-Hosted Backend Validation

Status: active guard
Batch: #17
Date: 2026-05-13

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
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:apply:dry-run
npm run api:build
npm run test:api
npm run test:db-contract
npm run test:db-migrations
npm run test:backend-contract
npm run test:account-workspace
npm run ci:core
```

## What Each Check Protects

| Command | Purpose |
|---|---|
| `check:backend-policy` | Fails if backend docs describe Supabase as the production target. |
| `check:supabase-boundary` | Fails if new pages/components import the Supabase client directly. |
| `check:self-hosted-infra` | Fails if the local self-hosted runtime skeleton loses PostgreSQL, PgBouncer, Redis, MinIO or required env keys. |
| `check:self-hosted-api` | Fails if the standalone `apps/api` skeleton, Dockerfile, compose hook or Supabase production boundary is broken. |
| `check:self-hosted-db` | Fails if the self-hosted PostgreSQL baseline under `packages/db` loses required account/company tables or drifts toward Supabase-owned schema. |
| `db:migrations:check` | Builds the DB package and validates deterministic migration order, dependencies, safe relative paths and SQL checksums. |
| `db:migrations:status` | Prints the static local migration status without requiring PostgreSQL. |
| `db:migrations:apply:dry-run` | Prints a safe local apply preview without requiring PostgreSQL. |
| `db:migrations:status:live` | Connects to `MIGRATION_DATABASE_URL` and reads applied migration records. Not part of CI without a database. |
| `db:migrations:apply:live:dry-run` | Connects to `MIGRATION_DATABASE_URL`, checks drift and previews pending migrations without applying SQL. |
| `db:migrations:apply:live` | Applies pending migrations only through `--confirm` and `MIGRATION_DATABASE_URL`. Use manually during server deployment. |
| `db:migrations:smoke:live` | Runs live status plus live dry-run apply against `MIGRATION_DATABASE_URL`. Use for local/server smoke validation. |
| `api:build` | Compiles the self-hosted API service to `apps/api/dist`. |
| `test:api` | Runs API endpoint and config tests. |
| `test:account-workspace` | Runs account frontend adapter and workspace tests, including self-hosted API fallback behavior. |
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
- enum boundaries matching account/company DTOs;
- indexes needed by account workspace reads;
- migration manifest ownership;
- absence of Supabase `auth.users` coupling in the self-hosted baseline.

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

## Frontend Account API Bridge

Batch #25 introduces `src/lib/account-api.ts` as the frontend bridge from the
current account workspace to the self-hosted API.

The bridge must preserve these rules:

- local prototype persistence remains the fallback;
- account pages do not import Supabase as a production data gateway;
- user and company saves map to `/v1/account/me` and `/v1/account/company`;
- branches, products, meta-regions and notification preferences map to their
  dedicated `/v1/account/*` collection endpoints;
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

## Production Direction

The self-hosted stack should become the production path. Supabase scripts,
migrations and smoke tests may remain while they protect the prototype, but new
production-facing work should target YORSO-owned API contracts and PostgreSQL
deployment.

If a future change needs Supabase for a temporary prototype flow, document the
reason and keep it behind an adapter. Do not let page/component code import the
Supabase client as a production data gateway.
