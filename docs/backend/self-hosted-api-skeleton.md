# Self-Hosted API Skeleton

Status: first runnable backend process with PostgreSQL account workspace persistence, local file storage, account UI storage bridge and explicit account session boundary
Batch: #29
Date: 2026-05-14

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
| `POST /v1/account/company/media/logo` | Uploads a company logo file, stores it in self-hosted storage and updates `company.media.logoObjectKey`. |
| `POST /v1/account/company/media/cover` | Uploads a company cover file, stores it in self-hosted storage and updates `company.media.coverObjectKey`. |
| `GET /v1/account/documents` | Returns company document metadata for the current account company. |
| `POST /v1/account/documents` | Uploads a company document file and creates a linked document record. |
| `GET /v1/account/files/:assetId` | Streams a stored account file owned by the current account user. |
| `GET /v1/account/files/by-object-key?objectKey=...` | Streams a stored account file by object key when the object belongs to the current account user. |

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

Batch #27 adds the first self-hosted file boundary:

- `packages/db/migrations/0003_account_files_and_documents.sql` adds
  `yorso_file_assets` and `yorso_company_documents`.
- `apps/api/src/modules/storage` stores local file bytes, calculates SHA-256
  checksums and persists metadata through memory/PostgreSQL repositories.
- Company logo and cover uploads update the existing company media contract
  instead of leaving images as arbitrary frontend strings.
- Company documents now have document type, visibility, status, checksum and a
  download route. This is the base for supplier certificates, trade documents
  and future access-gated document workflows.
- The current adapter is `STORAGE_DRIVER=local` for deterministic owned-server
  deployment. MinIO remains in compose as the S3-compatible target for the next
  storage driver.

Batch #28 connects that storage boundary to the account workspace UI:

- `CompanyMediaCard` can upload logo and cover files through the self-hosted
  API when `VITE_YORSO_API_URL` is configured.
- Stored logo and cover object keys are resolved back through
  `/v1/account/files/by-object-key`, so the UI can display private account
  media without storing public URLs.
- `CompanyDocumentsCard` lets a company add supplier/buyer documents from the
  account profile. API mode uploads and lists documents through
  `/v1/account/documents`; local prototype mode keeps metadata in localStorage
  so Lovable preview remains usable without an API process.
- `src/lib/account-api.ts` is the only browser adapter for these account file
  operations. Page and component code must not import Supabase as a production
  storage gateway.
- The frontend still saves local profile state first. API sync is an upgrade
  path, not a hard preview dependency.

Batch #29 adds the first explicit account session boundary:

- Account and storage routes no longer use a hidden fixed demo user fallback.
- Browser JSON requests must include `x-yorso-user-id`; optional
  `x-yorso-session-id` carries the current frontend session identifier.
- Native browser file requests, such as image previews, may pass
  `accountUserId` and `accountSessionId` query parameters because `<img>` tags
  cannot attach custom headers. This is a temporary bridge until cookie/JWT
  auth is implemented.
- `packages/contracts/src/account-session.ts` owns the header names and
  validation schema.
- `src/lib/account-api.ts` is responsible for attaching account session values.
  Components must not build account auth headers directly.

Batch #30 adds a runtime account API smoke test:

- `scripts/smoke-self-hosted-account-api.mjs` starts the compiled API process
  on a free local port.
- The smoke verifies account session headers, missing-session rejection,
  company profile writes, product matrix replacement, logo upload, document
  upload, file download by asset id and object key, and file owner isolation.
- `smoke:self-hosted-account-api` builds then runs the smoke locally.
- `ci:core` runs `smoke:self-hosted-account-api:run` after `api:build` and
  API tests, so GitHub catches runtime wiring regressions in the standalone API.
- The smoke uses `ACCOUNT_REPOSITORY=memory` and `STORAGE_DRIVER=local`; live
  PostgreSQL/Object Storage smoke tests remain a separate deployment step.

Batch #31 adds the optional live PostgreSQL account smoke:

- `scripts/smoke-self-hosted-account-postgres.mjs` runs only when
  `MIGRATION_DATABASE_URL` is configured.
- Without `MIGRATION_DATABASE_URL`, it exits successfully as skipped, so CI and
  Lovable preview remain independent from a live database.
- With a live database URL, it applies pending self-hosted migrations, upserts a
  deterministic smoke user/company, starts the compiled API with
  `ACCOUNT_REPOSITORY=postgres`, and verifies account reads/writes, product
  replacement, media upload, document upload and file owner isolation over
  HTTP.
- This does not replace the memory smoke in CI; it is a server/staging
  validation step for the PostgreSQL repository boundary.

## Local Build

```bash
npm run api:build
npm run api:start
```

The API reads configuration from environment variables. Local defaults are
available for development, but production must provide real secrets and service
URLs.

For local frontend-to-API testing, `.env.example` includes
`VITE_YORSO_ACCOUNT_USER_ID=00000000-0000-4000-8000-000000000001`. Production
must replace this development identity bridge with real account authentication.

## Docker Compose

The local compose baseline includes:

- `api`;
- `postgres`;
- `pgbouncer`;
- `redis`;
- `minio`.

The API also has a persistent local upload volume (`yorso-api-uploads`) for the
current `local` storage driver. This is not a CDN setup; it is a safe first
self-hosted storage boundary that can later be swapped for MinIO/S3 without
changing the account document DTOs.

Account UI media previews now resolve stored object keys through the same API
boundary. Direct `https:`, `data:` and `blob:` image values still render as-is
for prototype data and manual URL entry.

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
npm run smoke:self-hosted-account-api
npm run smoke:self-hosted-account-postgres
npm run test:account-workspace
npm run test:db-contract
npm run ci:core
```
