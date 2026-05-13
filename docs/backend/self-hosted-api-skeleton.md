# Self-Hosted API Skeleton

Status: first runnable backend process with PostgreSQL account workspace persistence
Batch: #26
Date: 2026-05-13

`apps/api` is the first concrete backend service for the self-hosted YORSO
direction. It is intentionally small, but it is a real Node process that can be
compiled, started and wired into Docker Compose.

## Current Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health/live` | Confirms the API process is alive. |
| `GET /health/ready` | Confirms self-hosted dependencies are configured. |
| `GET /v1/account/company/schema` | Exposes the account/company DTO boundary used by frontend work. |
| `GET /v1/account/me` | Returns the current user profile through the account service. |
| `PATCH /v1/account/me` | Validates and updates editable user profile fields through the contract schema. |
| `GET /v1/account/company` | Returns the current company profile through the account service. |
| `PATCH /v1/account/company` | Validates and updates company profile fields through the contract schema. |
| `GET /v1/account/branches` | Returns company branches and loading points. |
| `PATCH /v1/account/branches` | Replaces company branches and loading points through the contract schema. |
| `GET /v1/account/products` | Returns the company product matching matrix. |
| `PATCH /v1/account/products` | Replaces the product matching matrix through the contract schema. |
| `GET /v1/account/meta-regions` | Returns logistics meta-regions. |
| `PATCH /v1/account/meta-regions` | Replaces logistics meta-regions through the contract schema. |
| `GET /v1/account/notifications` | Returns notification channel preferences. |
| `PATCH /v1/account/notifications` | Replaces notification channel preferences through the contract schema. |

## Account Module Boundary

`apps/api/src/modules/account` is split into:

- `routes.ts`: HTTP method/path handling and JSON body parsing;
- `service.ts`: validation and business-facing account operations;
- `repository.ts`: storage interface plus temporary in-memory implementation.

The in-memory repository is not the production storage layer. It exists only
for deterministic local tests and offline development. Production-oriented
account data now goes through `PostgresAccountRepository`, which reads and
writes the self-hosted PostgreSQL tables from `packages/db/migrations`.

Batch #20 adds the storage switch:

- `ACCOUNT_REPOSITORY=memory` keeps local dev and CI deterministic.
- `ACCOUNT_REPOSITORY=postgres` selects `PostgresAccountRepository`.
- `packages/db/migrations/0001_account_company_baseline.sql` defines the first
  self-hosted PostgreSQL schema for these endpoints.

Batch #24 makes the PostgreSQL repository functional:

- `GET /v1/account/me` reads `yorso_users`.
- `PATCH /v1/account/me` updates `yorso_users`.
- `GET /v1/account/company` reads `yorso_companies` plus
  `yorso_company_media`.
- `PATCH /v1/account/company` applies partial scalar updates to
  `yorso_companies`.
- `PATCH /v1/account/company` upserts logo/cover media into
  `yorso_company_media`.
- The repository returns the same contract DTOs as the memory adapter, so the
  frontend can switch from prototype storage to the self-hosted API without a
  new UI contract.

Batch #25 adds the frontend bridge:

- `src/lib/account-api.ts` maps current account workspace state to the
  self-hosted API DTOs.
- The account workspace hydrates from `/v1/account/me` and
  `/v1/account/company` when `VITE_YORSO_API_URL` is configured.
- Saves still write local prototype state first, then attempt API sync.
- If the API is unavailable or not configured, the UI remains usable and records
  a local sync state instead of failing the form.
- API CORS allows browser calls from the configured frontend origin.

Batch #26 expands the same bridge to the remaining account workspace sections:

- `packages/db/migrations/0002_account_workspace_sections.sql` adds tables for
  branches, products, meta-regions and notification preferences.
- `PostgresAccountRepository` reads and replaces those collections through
  YORSO-owned PostgreSQL tables.
- The API exposes `GET`/`PATCH` collection endpoints for each section.
- `src/lib/account-api.ts` hydrates and syncs the full account workspace, not
  only user/company records.
- Collection updates are replace-style for now because the current frontend
  edits complete account-profile sections. Row-level CRUD can be added later
  without changing the page-level adapter contract.

## Local Build

```bash
npm run api:build
npm run api:start
```

The API reads configuration from environment variables. Local defaults are
available for development, but production must provide real secrets and service
URLs.

## Docker Compose

The local compose baseline includes:

- `api`;
- `postgres`;
- `pgbouncer`;
- `redis`;
- `minio`.

The API service connects to PostgreSQL through PgBouncer, not directly to a
large pool of PostgreSQL connections.

## Supabase Boundary

The API skeleton does not import the Supabase client. In production mode it
rejects non-empty Supabase frontend env values. Supabase may remain only as a
prototype/schema-validation tool while the self-hosted backend matures.

## Validation

```bash
npm run check:self-hosted-api
npm run check:self-hosted-db
npm run api:build
npm run test:api
npm run test:db-contract
npm run ci:core
```
