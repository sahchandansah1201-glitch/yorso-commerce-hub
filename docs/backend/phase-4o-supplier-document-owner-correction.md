# Backend Phase 4O - Supplier Document Owner Correction Runtime

Status: implemented.

Phase 4O implements the supplier-owner correction path for supplier documents
that are not approved: metadata update and delete for `review` and
`on_request` documents.

This phase intentionally does not implement admin expire/delete, admin metadata
edits, replacement of approved documents, frontend supplier document management
UI, file replacement, file scanning workers or external provider integration.

## План / факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить owner metadata update route. | Добавлен `PATCH /v1/suppliers/:supplierId/documents/:documentId` для `review/on_request`. | File replacement и submit-for-review отдельными scope. |
| Добавить owner delete route. | `DELETE /v1/suppliers/:supplierId/documents/:documentId` удаляет `review/on_request` документы. | Admin expire/delete и approved replacement отдельно. |
| Применить Phase 4L policy. | `updateSupplierDocumentForOwner` и `deleteSupplierDocumentForOwner` используют `evaluateSupplierDocumentManagementPolicy`. | Все будущие mutations должны идти через тот же policy layer. |
| Сохранить immutable approved. | Owner update/delete approved документов возвращает `approved_document_immutable`. | Replacement/re-review flow отдельно. |
| Писать durable audit. | `supplier_document.update_metadata` / `supplier_document.delete` пишутся в `yorso_supplier_document_management_events`. | Admin listing по management events отдельным scope. |
| Не раскрывать storage internals. | Responses возвращают sanitized document без `fileAssetId`, `objectKey`, storage keys, `downloadPath` и direct URLs. | Сохранять этот контракт для file replacement и expire/delete. |

## Runtime Contract

Endpoints:

```http
PATCH /v1/suppliers/:supplierId/documents/:documentId
DELETE /v1/suppliers/:supplierId/documents/:documentId
```

`PATCH` request body accepts bounded metadata only:

- `title`;
- `documentType`;
- `issuedAt`;
- `expiresAt`.

The routes:

1. resolve an authenticated self-hosted account session;
2. read the account company profile;
3. require company `accountRole` to be `supplier` or `both`;
4. bind the supplier row to the same `company_id` in persistence;
5. load the supplier document;
6. apply the Phase 4L policy matrix for `supplier_owner/update_metadata` or
   `supplier_owner/delete`;
7. update metadata or remove the document;
8. write durable management audit metadata;
9. return sanitized document metadata and audit metadata.

Browser response must not include:

- `fileAssetId`;
- `objectKey`;
- storage keys;
- storage driver internals;
- direct download URLs;
- `downloadPath`.

## Persistence

No new migration is needed. Phase 4O uses the Phase 4M management audit table:

- `packages/db/migrations/0037_supplier_document_management_events.sql`;
- `yorso_supplier_document_management_events`.

The PostgreSQL update path is one bounded CTE:

- locate the target supplier document by `supplier_id`, `company_id`,
  `document_id` and current status;
- replace the JSONB document item with a sanitized metadata update via
  `jsonb_set`;
- insert the management audit event in the same statement.

The PostgreSQL delete path is one bounded CTE:

- locate the target supplier document by `supplier_id`, `company_id`,
  `document_id` and current status;
- rebuild `supplier_documents` without that JSONB item;
- insert the management audit event in the same statement.

## Expected Read/Write Profile

At 10,000 concurrent users these routes are operational supplier-owner
mutations, not public browse traffic.

Per successful request:

- one authenticated session resolution;
- one account company read;
- one supplier detail read;
- one supplier/company ownership read;
- one supplier row JSONB mutation guarded by `supplier_id + company_id`;
- one management audit insert.

The routes stay uncached.

## Cache, Queue And Backpressure Strategy

- No cache is used for mutations.
- Existing JSON body-size, idle timeout, request timeout and session
  fail-closed guardrails apply.
- No scheduler, queue or worker is introduced.
- File replacement, scanning and external storage retries must be separate
  outbox/worker phases.

## Database Indexing And Pagination Strategy

- Update/delete are point writes by supplier id, owner company id and document
  id.
- Audit table already has supplier/recent, actor/recent, action/recent and
  supplier/document/recent indexes.
- Future management audit listing must use bounded `limit <= 100` or cursor
  pagination.

## Failure Mode And Graceful Degradation

- Missing/invalid session: existing account session errors.
- Missing company: `company_not_found`.
- Buyer-only account role or supplier/company mismatch:
  `supplier_document_owner_required`.
- Missing supplier: `supplier_not_found`.
- Missing document: `supplier_document_not_found`.
- Approved document update/delete: `approved_document_immutable`.
- Stale status race: `invalid_status_transition`.
- Malformed payload: contract validation error.

All failures keep storage internals out of the browser response.

## Observability And Load-Test Plan

- Successful owner updates persist `supplier_document.update_metadata` in
  `yorso_supplier_document_management_events`.
- Successful owner deletes persist `supplier_document.delete` in
  `yorso_supplier_document_management_events`.
- Smoke marker: `supplier_document_owner_update_delete=ok`.
- Focused tests cover API route behavior, missing session, response redaction,
  approved-document immutability, PostgreSQL CTE persistence and shared
  update/delete response contracts.
- Future load tests should cover concurrent owner update/delete on the same
  document, stale status conflicts, malformed payloads, wrong company ids and
  immutable approved-document attempts at the 10,000 concurrent-user baseline.

## Validation

- `npm run test:supplier-document-management-runtime`;
- `npm run test:supplier-document-management-policy`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npm run smoke:self-hosted-account-api:run`;
- `npm run test:api`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run build`;
- `npm test`;
- `git diff --check`.

Marker: Backend Phase 4O Supplier Document Owner Correction Runtime.
Marker: /v1/suppliers/:supplierId/documents/:documentId.
Marker: updateSupplierDocumentForOwner.
Marker: deleteSupplierDocumentForOwner.
Marker: supplierDocumentManagementUpdateResponseSchema.
Marker: supplierDocumentManagementDeleteResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_owner_update_delete=ok.
Marker: supplier_document.update_metadata.
Marker: supplier_document.delete.
Marker: approved_document_immutable.
Marker: 10,000 concurrent users.
