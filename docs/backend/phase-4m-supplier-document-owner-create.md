# Backend Phase 4M - Supplier Owner Document Create Runtime

Status: implemented.

Phase 4M implements the first supplier document management write path:
authenticated supplier owner creates a new `review` supplier document from a
self-hosted backend-owned upload id.

This phase intentionally does not implement admin approve/reject/expire,
metadata editing, deletion, frontend UI, file scanning workers or external
storage/provider integration.

## План / факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Реализовать один первый write path. | Добавлен `POST /v1/suppliers/:supplierId/documents` только для owner create -> `review`. | Admin approve/reject, owner update/delete и replacement flow отдельными scope. |
| Привязать supplier owner к real account/session. | Route требует self-hosted session, company profile с `accountRole=supplier|both` и совпадение `supplier.company_id`. | Более тонкие supplier staff roles можно добавить отдельно. |
| Использовать Phase 4L policy. | `createSupplierDocumentForOwner` вызывает `evaluateSupplierDocumentManagementPolicy` для `supplier_owner/create`. | Все будущие mutations должны проходить тот же policy layer. |
| Не принимать storage internals из browser payload. | Payload принимает только safe metadata + `fileUploadId`; response возвращает sanitized document без `fileAssetId`, `objectKey`, storage keys и direct URLs. | Отдельный supplier-specific upload UX может заменить временное переиспользование account document upload. |
| Сделать persistence + audit атомарными. | PostgreSQL repository использует один CTE: append в `yorso_suppliers_directory.supplier_documents` + insert в `yorso_supplier_document_management_events`. | Admin audit listing for management events отдельным scope. |
| Сохранить buyer-facing safeguards. | Locked buyer responses, download grants, file serving, supplier identity redaction and exact-price locks не изменены. | Нет изменений до будущего owner/admin UI. |

## Runtime Contract

Endpoint:

```http
POST /v1/suppliers/:supplierId/documents
```

Request body:

- `title`;
- `documentType`;
- `issuedAt`;
- `expiresAt`;
- `fileUploadId`;
- `fileName`.

The route:

1. resolves an authenticated self-hosted account session;
2. reads the account company profile;
3. requires company `accountRole` to be `supplier` or `both`;
4. validates the safe management create payload;
5. resolves the backend-owned file asset metadata through
   `FileService.getFileAssetForUser`;
6. checks the file belongs to the same company and is an allowed document
   purpose;
7. applies the Phase 4L policy decision for `supplier_owner/create`;
8. creates a `review` supplier document;
9. writes a `supplier_document.create` management audit event;
10. returns sanitized document metadata and audit metadata.

Browser response must not include:

- `fileAssetId`;
- `objectKey`;
- storage keys;
- storage driver internals;
- direct download URLs.

## Persistence

New migration:

- `packages/db/migrations/0037_supplier_document_management_events.sql`.

New table:

- `yorso_supplier_document_management_events`.

Indexes:

- supplier recent;
- actor recent;
- action recent;
- supplier/document recent.

The PostgreSQL create path is one bounded CTE:

- update `yorso_suppliers_directory.supplier_documents`;
- condition on matching `company_id`;
- reject duplicate document ids;
- insert the management audit event from the same mutation statement.

## Expected Read/Write Profile

At 10,000 concurrent users this endpoint is operational, not public browse
traffic.

Per successful request:

- one auth/session resolution;
- one account company read;
- one file asset ownership read;
- one supplier row mutation guarded by `supplier_id + company_id`;
- one management audit insert.

Expected write volume is low compared with catalog and supplier-directory
reads. The endpoint stays uncached.

## Cache, Queue And Backpressure Strategy

- No cache is used for mutations.
- Existing HTTP body-size, timeout, session fail-closed and request lifecycle
  guardrails apply.
- No scheduler, queue or worker is introduced.
- Virus scanning, file transformation or external delivery must be a separate
  outbox/worker phase before production upload expansion.

## Database Indexing And Pagination Strategy

- Owner create is a point write by `supplier_id + company_id`.
- Audit table has recent indexes by supplier, actor, action and document.
- Future admin listings over management events must use bounded `limit <= 100`
  or cursor pagination.

## Failure Mode And Graceful Degradation

- Missing/invalid session: existing account session errors.
- Missing company: `company_not_found`.
- Buyer-only account role or supplier/company mismatch:
  `supplier_document_owner_required`.
- Missing file: `file_asset_not_found`.
- Wrong company/file purpose: `supplier_document_file_unavailable`.
- File name mismatch: `supplier_document_file_name_mismatch`.
- Duplicate supplier document: `supplier_document_conflict`.
- Malformed payload: contract validation error.

All failures keep storage internals out of the browser response.

## Observability And Load-Test Plan

- Each successful mutation persists `supplier_document.create` in
  `yorso_supplier_document_management_events`.
- Smoke marker: `supplier_document_owner_create_review=ok`.
- Focused tests cover API route behavior, response redaction, PostgreSQL CTE
  write/audit persistence and shared response contract.
- Future load tests must cover concurrent owner creates, duplicate file/document
  conflicts, malformed payloads, wrong company ids and file-not-found cases at
  the 10,000 concurrent-user baseline.

## Validation

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run test:db-migrations`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run test:api`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run build`;
- `npm test`;
- `git diff --check`.

Marker: Backend Phase 4M Supplier Owner Document Create Runtime.
Marker: /v1/suppliers/:supplierId/documents.
Marker: createSupplierDocumentForOwner.
Marker: supplierDocumentManagementCreateResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_owner_create_review=ok.
Marker: supplier_document.create.
Marker: 10,000 concurrent users.
