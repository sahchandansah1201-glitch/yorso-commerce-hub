# Self-Hosted Account API Smoke

Status: active runtime smoke
Batch: #33
Date: 2026-05-14

This smoke test verifies that the standalone YORSO API can run as a real Node
process and serve account workspace operations without Supabase.

It is intentionally different from unit tests:

- it starts `apps/api/dist/index.js` as a child process;
- it uses a free local TCP port;
- it sends real HTTP requests with the account session boundary;
- it writes company data through `/v1/account/company`;
- it replaces product matrix data through `/v1/account/products`;
- it creates, updates and deletes individual workspace rows through
  `/v1/account/*/:id`;
- it checks duplicate row creation and notification row validation errors;
- it uploads company media through `/v1/account/company/media/logo`;
- it uploads and lists company documents through `/v1/account/documents`;
- it reads stored files through `/v1/account/files/:assetId` and
  `/v1/account/files/by-object-key`;
- it checks that another account user cannot read the uploaded file.

## Commands

```bash
npm run smoke:self-hosted-account-api
```

Use this when the API has not been compiled yet. It runs:

```bash
npm run api:build
npm run smoke:self-hosted-account-api:run
```

In CI, `ci:core` runs `smoke:self-hosted-account-api:run` after `api:build`
and API tests, so it reuses the compiled API output.

## What It Protects

The smoke test protects the production direction:

- account API routes must require `x-yorso-user-id`;
- missing account session must return `account_session_required`;
- the API must not rely on a hidden demo-user fallback;
- local file storage must be writable and readable through API routes;
- account file ownership must be enforced by user id;
- the account workspace contract must work over HTTP, not only in isolated
  unit tests.
- row-level workspace endpoints must preserve owner-scoped CRUD, conflict
  handling and validation behavior over real HTTP.

## Runtime Mode

The smoke uses:

```text
NODE_ENV=test
ACCOUNT_REPOSITORY=memory
STORAGE_DRIVER=local
VITE_SUPABASE_URL=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
```

This keeps the check deterministic and independent from Docker, Supabase,
PostgreSQL and MinIO. Live PostgreSQL and object-storage smoke tests should be
added separately when server deployment wiring is ready.

## Expected Output

A successful run prints:

```text
health_live=ok
session_required_guard=ok
account_me=ok
company_patch=ok
products_replace=ok
branch_row_create=ok
branch_row_conflict_guard=ok
product_row_patch=ok
meta_region_row_create=ok
notification_row_create=ok
notification_row_validation_guard=ok
branch_row_delete=ok
logo_upload=ok
logo_read_by_asset=ok
file_owner_guard=ok
logo_read_by_object_key=ok
document_upload=ok
documents_list=ok
self_hosted_account_api_smoke=ok
```

Any failure exits with code `1` and prints captured API stdout/stderr.
