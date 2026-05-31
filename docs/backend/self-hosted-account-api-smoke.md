# Self-Hosted Account API Smoke

Status: active runtime smoke
Batch: #38
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
- it reads supplier directory data through `/v1/suppliers` and
  `/v1/suppliers/:id`;
- it verifies locked supplier responses do not expose private identity,
  contact or exact-breadth fields;
- it verifies `qualified_unlocked` supplier detail does not expose private
  supplier values before grant approval;
- it creates and approves a supplier access request, then verifies
  `qualified_unlocked` supplier responses expose the full allowed supplier
  values through the same API process.
- it reads offer catalog data through `/v1/offers` and `/v1/offers/:id`;
- it verifies locked offer responses do not expose supplier identity or exact
  price fields;
- it verifies `qualified_unlocked` offer list and detail responses expose exact
  price and supplier identity only after supplier access approval;
- it verifies private supplier-name offer search remains scoped to the buyer's
  approved supplier grants.
- it creates a one-click supplier price access request through
  `/v1/access/suppliers/:supplierId/request`;
- it moves the request through `sent`, `pending` and `approved` states through
  `/v1/access/supplier-requests/:requestId/decision`;
- it verifies approval creates supplier identity and offer price grants;
- it verifies buyer approval notifications are visible through
  `/v1/access/notifications`.
- it verifies processed buyer approval notifications can be acknowledged through
  `PATCH /v1/access/notifications`, returning
  `supplier_access_notifications_ack=ok`.

The frontend bridge consumes that notification feed through
`SupplierApprovalNotifier`. Backend polling is intentionally bounded to 60
seconds and also runs once when a hidden browser tab becomes visible. The local
mock approval ticker remains fast because it is browser-only and does not
create API load.

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
- supplier directory endpoints must be access-shaped by the API, not by
  frontend blur or client-side filtering.
- offer catalog endpoints must be access-shaped by the API, not by frontend
  blur or client-side filtering.
- supplier and price access requests must work through the self-hosted API,
  not through Supabase RPCs or browser-only localStorage.
- supplier approval must create server-side grants and a buyer notification.
- frontend approval notifications must be sourced from the self-hosted API when
  configured, without relying on Supabase or unbounded 2-second backend polling.
- protected account, storage and supplier-access calls must use a real
  self-hosted auth session from `/v1/auth/sign-in`; `x-yorso-user-id` alone is
  not authority.
- supplier document owner correction must work through the self-hosted API:
  rejected `on_request` documents can be updated and deleted by the supplier
  owner without exposing backend file asset identifiers.
- supplier document admin lifecycle cleanup must work through the self-hosted
  API: approved documents can be expired, expired documents can be deleted by
  admin, and browser responses do not expose backend file asset identifiers.

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
account_session_authority=ok
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
supplier_document_owner_create_review=ok
supplier_document_admin_decision_review=ok
supplier_document_owner_update_delete=ok
supplier_document_admin_lifecycle_cleanup=ok
documents_list=ok
supplier_directory_locked=ok
supplier_directory_verified_filter=ok
supplier_directory_sort_pagination=ok
supplier_directory_requires_grant=ok
supplier_directory_private_search_requires_grant=ok
supplier_directory_unlocked=ok
supplier_directory_granted_private_search=ok
supplier_directory_ungranted_private_search_guard=ok
offer_catalog_locked=ok
offer_catalog_private_search_guard=ok
offer_catalog_private_search_requires_grant=ok
offer_catalog_list_requires_grant=ok
offer_catalog_filters=ok
offer_catalog_sort_pagination=ok
offer_catalog_unlocked=ok
offer_catalog_granted_private_search=ok
offer_catalog_ungranted_private_search_guard=ok
supplier_access_initial=ok
supplier_access_request=ok
supplier_access_pending=ok
supplier_access_approved=ok
supplier_access_grant=ok
supplier_access_notifications=ok
supplier_access_notifications_ack=ok
self_hosted_account_api_smoke=ok
```

Any failure exits with code `1` and prints captured API stdout/stderr.
