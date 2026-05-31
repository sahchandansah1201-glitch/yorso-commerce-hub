# Backend Phase 4G - Supplier Document Grant Consumption / File Serving Endpoint

Status: implemented.

Phase 4G adds the self-hosted file-serving side of the supplier document
access flow. Phase 4F issues a short-lived grant; Phase 4G consumes that grant
and streams the document through the YORSO API.

Endpoint:

- `GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`

The endpoint validates:

- authenticated self-hosted account session;
- grant id exists and was issued as `granted`;
- grant belongs to the same buyer user;
- supplier id and document id match the grant;
- grant is not expired;
- buyer still has supplier access;
- supplier document is still approved and points to the same backend-only file
  asset id.

The response intentionally excludes:

- `fileAssetId`;
- object storage keys;
- direct filesystem paths;
- third-party provider URLs;
- JSON metadata that could disclose backend storage layout.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить serving endpoint. | `apps/api/src/modules/suppliers/routes.ts` добавляет `GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...` before generic supplier detail matching. | UI download button remains separate scope. |
| Валидировать grant перед чтением файла. | `SupplierDirectoryService.consumeSupplierDocumentDownloadGrant` checks grant id/status, buyer user, supplier id, document id, expiry and current supplier access. | Admin grant/download listing can be added later. |
| Читать файл только по backend-only asset id. | `FileService.getFileByAssetId` is internal API service code; browser never sends or receives the asset id. | Future object-store drivers must preserve the same API boundary. |
| Стримить файл через self-hosted API. | Route returns bytes with `content-type`, `content-length`, attachment filename and `cache-control: private, no-store`. | Range requests are not implemented in this phase. |
| Persist/audit consumption attempts. | Migration `0036_supplier_document_download_events` creates `yorso_supplier_document_download_events`; repository records downloaded, missing, denied, expired and unavailable attempts. | Later admin route can expose bounded audit pages. |
| Сохранить self-hosted direction. | No Supabase/BaaS/provider dependency is added. | Supplier upload/owner document management remains later scope. |

## Access Decision

The download endpoint is qualified-only and grant-bound.

Request handling:

1. Resolve and validate authenticated account session.
2. Require `grantId`.
3. Load the grant audit record by id.
4. Reject missing/non-granted grants with `supplier_document_grant_not_found`.
5. Reject buyer/supplier/document mismatch with `supplier_document_grant_denied`.
6. Reject expired grants with `supplier_document_grant_expired`.
7. Re-check current supplier access before document lookup.
8. Check the current supplier document is still approved and matches the grant's
   backend-only `fileAssetId`.
9. Read bytes through `FileService.getFileByAssetId`.
10. Record a `downloaded` event and stream the file.

This keeps document probing closed for locked buyers and prevents stale grants
from bypassing supplier access revocation.

## Runtime Contract

Configured deployment:

- Requires `x-yorso-user-id` and `x-yorso-session-id`.
- Requires `grantId` query param.
- Returns `404 supplier_document_grant_not_found` for missing/non-granted grant.
- Returns `403 supplier_document_grant_denied` for buyer/supplier/document
  mismatch.
- Returns `410 supplier_document_grant_expired` for expired grants.
- Returns `403 supplier_document_access_required` if supplier access was
  revoked after grant issuance.
- Returns `409 supplier_document_unavailable` if the document is no longer
  approved or no longer points to the granted file asset.
- Returns `409 supplier_document_file_unavailable` if the backend file asset
  cannot be read.

Success response:

- binary body;
- `content-type` from the stored file asset;
- `content-disposition: attachment; filename="..."`;
- `cache-control: private, no-store`;
- no JSON body and no storage identifier exposure.

API-disabled preview:

- no durable supplier document serving is fabricated locally;
- Phase 4F `requestDocumentDownloadGrant` still requires configured API.

## 10,000 Concurrent-User Review

Expected read/write profile:

- One authenticated GET per buyer document download.
- Reads:
  - account session validation;
  - grant audit lookup by grant id;
  - supplier access check;
  - supplier document metadata read;
  - file asset metadata read;
  - object storage read.
- Writes:
  - one append-only download event for success/failure.

Cache, queue and backpressure strategy:

- No queue is required for synchronous file serving.
- Grant TTL limits replay window.
- `cache-control: private, no-store` prevents browser/proxy reuse of restricted
  document bytes.
- Existing HTTP timeout, header size and lifecycle drain guards remain the
  immediate backpressure layer.
- Larger supplier document workloads should move to signed internal object
  streaming or bounded range support only after a separate serving design.

Database indexing and pagination strategy:

- Migration `0036_supplier_document_download_events` adds:
  - buyer recent index;
  - supplier recent index;
  - grant recent index;
  - status recent index.
- Grant lookup uses the primary key of
  `yorso_supplier_document_download_grants`.
- Future admin listing must use bounded `limit/offset` or cursor pagination.

Failure mode and graceful degradation:

- Missing/invalid session fails before grant lookup.
- Missing `grantId` returns a 400 error.
- Missing grant and mismatched grant do not expose `fileAssetId`.
- Expired grants return 410 and record an audit event.
- Missing file asset returns 409 and records `file_unavailable`.
- If audit persistence fails, the request fails closed.

Observability and load-test plan:

- Release validation covers server route behavior, storage read by backend asset
  id, supplier repository audit persistence, DB migration/manifest checks,
  runtime smoke markers, `check:self-hosted-api` and
  `check:production-scale-baseline`.
- Load tests should include:
  - missing grant download attempts;
  - expired grant attempts;
  - valid grant file downloads;
  - repeated download attempts for the same grant;
  - storage read latency under concurrent document downloads;
  - audit table growth through the new recent indexes.

## Remaining Supplier Document Debt After Phase 4G

| Debt | Status после Phase 4G | Следующий scoped шаг |
|---|---|---|
| Restricted document metadata | Backend-owned and qualified-only since Phase 4E. | Keep guarded. |
| Download grant issuance | Implemented since Phase 4F. | Keep guarded. |
| Grant consumption / file serving | Implemented in Phase 4G. | Add UI download action later. |
| Range requests / large file streaming | Not implemented. | Separate file-serving performance phase if document sizes require it. |
| Owner/admin supplier document upload/editing | Not implemented. | Later supplier operations/admin phase with validation and audit. |
| Admin grant/download audit listing | Not implemented. | Later admin route with bounded pagination. |

## Validation

Completed validation:

- TDD red: `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "streams supplier document files"` initially failed with HTTP 404 before route implementation.
- TDD green: the same server test passed after implementing route/service/storage path.

Release validation covers:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "supplier document download grants"`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`.
- `npm run test:db-migrations`.
- `npm run test:db-contract`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.
- `npm run smoke:self-hosted-account-api:run`.
- Full release gates are run before commit.

Marker: Backend Phase 4G.
Marker: Supplier Document Grant Consumption / File Serving Endpoint.
Marker: GET /v1/suppliers/:supplierId/documents/:documentId/download.
Marker: supplier_document_download_events.
Marker: 0036_supplier_document_download_events.
Marker: grant_expired.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
