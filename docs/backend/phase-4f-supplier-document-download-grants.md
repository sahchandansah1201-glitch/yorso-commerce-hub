# Backend Phase 4F - Supplier Document Download Grant Endpoint

Status: implemented.

Phase 4F adds a self-hosted, qualified-only supplier document download grant
endpoint. The supplier profile payload remains metadata-only: it does not
return direct file URLs, raw storage keys or `fileAssetId` values to the
browser. A buyer must already have supplier access before the backend issues a
short-lived grant.

Endpoint:

- `POST /v1/suppliers/:supplierId/documents/:documentId/grant`

Response:

- `supplierDocumentDownloadGrantResponseSchema`
- `grant.id`
- `grant.supplierId`
- `grant.documentId`
- `grant.fileName`
- `grant.downloadPath`
- `grant.grantedAt`
- `grant.expiresAt`

The response intentionally excludes:

- `fileAssetId`;
- object storage keys;
- direct filesystem paths;
- third-party provider URLs;
- raw document bytes.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить typed grant contract. | `packages/contracts/src/supplier-directory.ts` добавляет `supplierDocumentDownloadGrantSchema` и `supplierDocumentDownloadGrantResponseSchema`. | Future download-serving route can consume the grant id. |
| Добавить qualified-only API route. | `apps/api/src/modules/suppliers/routes.ts` добавляет `POST /v1/suppliers/:supplierId/documents/:documentId/grant` before generic supplier detail matching. | UI download button remains separate scope. |
| Повторно проверить buyer access. | `SupplierDirectoryService.createSupplierDocumentDownloadGrant` checks `SupplierAccessRepository.hasSupplierAccess` before document lookup/grant. | Future grant read/download must re-check expiry and status. |
| Не раскрывать backend file identifiers. | Grant response exposes relative `downloadPath` and `fileName`, but not `fileAssetId`, storage key or direct URL. | Future download route reads backend-only asset id from grant storage. |
| Persist/audit grant attempts. | Migration `0035_supplier_document_download_grants` creates `yorso_supplier_document_download_grants`; memory/PostgreSQL repositories record granted/denied/not-found/unavailable attempts. | Admin audit listing can be added later with bounded pagination. |
| Сохранить self-hosted direction. | No Supabase/BaaS/provider dependency is added. | Object serving remains owned YORSO infrastructure. |

## Access Decision

The grant endpoint is qualified-only.

Request handling:

1. Resolve and validate authenticated account session.
2. Load the published supplier by `supplierId`.
3. Re-check supplier access through `hasSupplierAccess`.
4. If access is missing, persist `access_denied` and return
   `supplier_document_access_required`.
5. Only after access is confirmed, find the `documentId`.
6. If the document is approved and has backend-only file asset metadata, persist
   a `granted` attempt and return the short-lived grant response.

This order prevents locked buyers from probing document ids or file asset ids.

## Runtime Contract

Configured deployment:

- Requires `x-yorso-user-id` and `x-yorso-session-id`.
- Returns `403 supplier_document_access_required` without supplier access.
- Returns `404 supplier_document_not_found` only after supplier access is
  confirmed.
- Returns `409 supplier_document_unavailable` for documents without an approved
  downloadable file asset.
- Returns no direct storage URL or `fileAssetId` in success/error responses.

API-disabled preview:

- `requestDocumentDownloadGrant` in `src/lib/supplier-directory-api.ts` throws
  `supplier_document_grant_requires_api`.
- Local/Lovable preview does not fabricate durable document grants.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Grant issuance is one authenticated write per buyer document action.
- Each request performs one supplier detail read, one supplier access check and
  one grant audit insert.
- The route is not used by supplier list/profile page load and does not add
  polling.

Cache, queue and backpressure strategy:

- No queue is required for synchronous grant creation.
- HTTP request guardrails, auth session validation and access checks remain the
  backpressure boundary.
- Grant TTL is 15 minutes to limit replay window.

Database indexing and pagination strategy:

- Migration `0035_supplier_document_download_grants` adds:
  - buyer recent index;
  - supplier recent index;
  - status recent index;
  - expiry cleanup index for granted rows.
- The table is append-only audit storage for grant attempts.
- Future admin listing must use bounded `limit/offset` or cursor pagination and
  the existing recent indexes.

Failure mode and graceful degradation:

- Missing/invalid session returns account-session errors before grant logic.
- Missing supplier returns `supplier_not_found`.
- Missing access returns `supplier_document_access_required` and does not check
  document existence.
- Non-downloadable documents return `supplier_document_unavailable`.
- Audit persistence failure fails closed; no grant is returned without audit.

Observability and load-test plan:

- Release validation covers server route behavior, supplier repository audit
  persistence, contract parsing, DB migration/manifest checks,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include:
  - denied grant attempts;
  - approved grant attempts;
  - repeated grant issuance for the same buyer/supplier/document;
  - audit table growth and cleanup reads through the expiry index.

## Remaining Supplier Profile Debt After Phase 4F

| Debt | Status после Phase 4F | Следующий scoped шаг |
|---|---|---|
| Restricted document metadata | Backend-owned and qualified-only since Phase 4E. | Keep guarded. |
| Download grant endpoint | Implemented as qualified-only grant issuance in Phase 4F. | Add actual self-hosted file serving route later. |
| Direct download/file serving | Not implemented. | Future phase should validate grant id, expiry and backend-only file asset id before streaming bytes. |
| Owner/admin document upload/editing | Not implemented. | Later supplier operations/admin phase with audit and validation. |
| Admin grant audit listing | Not implemented. | Later admin route with bounded pagination. |

## Validation

Completed validation:

- TDD red: `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"` initially failed with HTTP 405 before route implementation.
- TDD green: the same server test passed after implementing the route/service/repository path.

Release validation also covers:

- `npm run contracts:build`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.
- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-api.test.ts`.
- `npm run test:db-migrations`.
- `npm run test:db-contract`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.
- `npx tsc -b --noEmit`.
- `npm run lint`.
- `npm run api:build`.
- `npm run build`.
- `npm run test:api`.
- `git diff --check`.

Marker: Backend Phase 4F.
Marker: Supplier Document Download Grant Endpoint.
Marker: supplierDocumentDownloadGrant.
Marker: supplier_document_download_grants.
Marker: 0035_supplier_document_download_grants.
Marker: qualified-only.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
