# Self-Hosted Account PostgreSQL Smoke

Status: optional live runtime smoke
Batch: #31
Date: 2026-05-14

This smoke verifies the self-hosted account API against a real PostgreSQL
database, not the in-memory repository.

It is intentionally optional:

- CI and Lovable preview must not require a live database.
- If `MIGRATION_DATABASE_URL` is missing, the smoke prints
  `self_hosted_account_postgres_smoke=skipped` and exits with code `0`.
- When `MIGRATION_DATABASE_URL` is present, the smoke mutates the target
  database by applying pending migrations and upserting one deterministic smoke
  user/company.

## Command

```bash
npm run smoke:self-hosted-account-postgres
```

The command builds the API and then runs:

```bash
npm run smoke:self-hosted-account-postgres:run
```

## What It Does

When a live database URL is provided, the smoke:

1. Runs `npm run db:migrations:apply:live`.
2. Upserts a deterministic smoke user and company.
3. Starts `apps/api/dist/index.js` on a free local port with
   `ACCOUNT_REPOSITORY=postgres`.
4. Verifies `x-yorso-user-id` account session enforcement.
5. Reads `/v1/account/me`.
6. Updates `/v1/account/company`.
7. Replaces `/v1/account/products`.
8. Uploads a company logo through `/v1/account/company/media/logo`.
9. Reads the uploaded file through `/v1/account/files/:assetId`.
10. Verifies another account user cannot read that file.
11. Uploads and lists a company document through `/v1/account/documents`.

## Required Environment

```bash
MIGRATION_DATABASE_URL=postgres://...
MIGRATION_APPLIED_BY=local-operator
```

Optional overrides:

```bash
YORSO_POSTGRES_SMOKE_USER_ID=00000000-0000-4000-8000-000000000031
YORSO_POSTGRES_SMOKE_COMPANY_ID=11111111-1111-4111-8111-111111111131
```

Use a development or staging database. Do not run this smoke against production
until smoke users and cleanup policy are explicitly approved.

## Expected Output

Skipped:

```text
self_hosted_account_postgres_smoke=skipped
reason=MIGRATION_DATABASE_URL is not set
```

Successful live run:

```text
live_migrations_apply=ok
smoke_seed=ok
health_live=ok
session_required_guard=ok
account_me=ok
company_patch=ok
products_replace=ok
logo_upload=ok
logo_read=ok
file_owner_guard=ok
document_upload=ok
documents_list=ok
self_hosted_account_postgres_smoke=ok
```

## Why This Exists

Batch #30 proved that the standalone API works over HTTP with memory
persistence. Batch #31 proves the same account contract can cross the real
PostgreSQL repository boundary. This is a required step toward deploying YORSO
as one owned-server product.
