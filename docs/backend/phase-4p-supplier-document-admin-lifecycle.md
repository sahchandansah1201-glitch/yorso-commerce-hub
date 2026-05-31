# Backend Phase 4P - Supplier Document Admin Lifecycle Cleanup

Status: implemented.

Phase 4P implements the admin lifecycle cleanup path for supplier documents:
expire approved documents and delete non-approved/expired documents through the
self-hosted API.

This phase intentionally does not implement frontend UI, supplier-owner
replacement of approved documents, file replacement, file scanning workers,
management-event listing or external provider integration.

## План / факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить admin lifecycle route. | Добавлен `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle`. | Admin management-event listing отдельным scope. |
| Реализовать expire approved. | `action=expire` переводит `approved -> expired`. | Automated expiry scheduler отдельным scope. |
| Реализовать admin delete cleanup. | `action=delete` удаляет `review`, `on_request` и `expired`; `approved` остаётся immutable. | Approved replacement flow отдельным scope. |
| Применить Phase 4L policy. | `manageSupplierDocumentLifecycleAsAdmin` использует `evaluateSupplierDocumentManagementPolicy`. | Все будущие mutations должны идти через тот же policy layer. |
| Писать durable audit. | `supplier_document.expire` / `supplier_document.delete` пишутся в `yorso_supplier_document_management_events`. | Listing/export по management events отдельным scope. |
| Не раскрывать storage internals. | Responses возвращают sanitized document без `fileAssetId`, `objectKey`, storage keys, `downloadPath` и direct URLs. | Сохранять этот контракт для replacement/file lifecycle. |

## Runtime Contract

Endpoint:

```http
POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle
```

Request body:

```json
{
  "action": "expire",
  "reason": "certificate_expired"
}
```

Allowed `action` values:

- `expire`;
- `delete`.

The route:

1. resolves an authenticated self-hosted account session;
2. requires admin role through the self-hosted auth service;
3. loads the supplier document;
4. applies the Phase 4L policy matrix for `admin/expire` or `admin/delete`;
5. expires or removes the document;
6. writes durable management audit metadata;
7. returns sanitized document metadata and audit metadata.

Browser response must not include:

- `fileAssetId`;
- `objectKey`;
- storage keys;
- storage driver internals;
- direct download URLs;
- `downloadPath`.

## Status Rules

- `expire` succeeds only for `approved` documents and returns `expired`.
- `delete` succeeds for `review`, `on_request` and `expired`.
- `delete` against `approved` returns `approved_document_immutable`.
- `expire` against `review`, `on_request` or `expired` returns
  `invalid_status_transition`.
- Missing supplier/document return `supplier_not_found` /
  `supplier_document_not_found`.

## Persistence

No new migration is needed. Phase 4P uses the Phase 4M management audit table:

- `packages/db/migrations/0037_supplier_document_management_events.sql`;
- `yorso_supplier_document_management_events`.

The PostgreSQL expire path reuses the bounded status-update CTE:

- locate target supplier document by `supplier_id`, `document_id` and current
  status;
- update the JSONB status with `jsonb_set`;
- insert `supplier_document.expire` audit metadata in the same statement.

The PostgreSQL delete path is one bounded CTE:

- locate target supplier document by `supplier_id`, `document_id` and current
  status;
- rebuild `supplier_documents` without the target JSONB item;
- insert `supplier_document.delete` audit metadata in the same statement.

## Expected Read/Write Profile

At 10,000 concurrent users this route is operational admin mutation traffic,
not public browse traffic.

Per successful request:

- one authenticated session resolution;
- one admin role check;
- one supplier detail read;
- one supplier row JSONB mutation guarded by supplier/document/status;
- one management audit insert.

The route stays uncached.

## Cache, Queue And Backpressure Strategy

- No cache is used for mutations.
- Existing JSON body-size, idle timeout, request timeout, lifecycle draining and
  session fail-closed guardrails apply.
- No scheduler, queue or worker is introduced.
- Automated expiry, file replacement and scanning must be separate
  outbox/worker phases.

## Database Indexing And Pagination Strategy

- Lifecycle mutations are point writes by supplier id and document id.
- The current document status is included in the mutation predicate to prevent
  stale races.
- Audit table already has supplier/recent, actor/recent, action/recent and
  supplier/document/recent indexes.
- Future management audit listing must use bounded `limit <= 100` or cursor
  pagination.

## Failure Mode And Graceful Degradation

- Missing/invalid session: existing account session errors.
- Non-admin account: `admin_role_required`.
- Missing supplier: `supplier_not_found`.
- Missing document: `supplier_document_not_found`.
- Approved document delete: `approved_document_immutable`.
- Invalid status for expire/delete: `invalid_status_transition`.
- Malformed payload: contract validation error.

All failures keep storage internals out of browser responses.

## Observability And Load-Test Plan

- Successful admin expiry persists `supplier_document.expire` in
  `yorso_supplier_document_management_events`.
- Successful admin deletion persists `supplier_document.delete` with
  `actorRole=admin`.
- Route-level admin attempts emit `admin.supplier_document_management.lifecycle`
  into the API audit sink.
- Smoke marker: `supplier_document_admin_lifecycle_cleanup=ok`.
- Focused tests cover API route behavior, missing session, admin role denial,
  response redaction, approved-document delete immutability, PostgreSQL CTE
  persistence and shared lifecycle request contract.
- Future load tests should cover concurrent expire/delete on the same document,
  stale status conflicts, malformed payloads, non-admin denial and immutable
  approved-document deletion at the 10,000 concurrent-user baseline.

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

Marker: Backend Phase 4P Supplier Document Admin Lifecycle Cleanup.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle.
Marker: manageSupplierDocumentLifecycleAsAdmin.
Marker: expireSupplierDocumentAsAdmin.
Marker: deleteSupplierDocumentAsAdmin.
Marker: supplierDocumentManagementLifecycleRequestSchema.
Marker: supplierDocumentManagementUpdateResponseSchema.
Marker: supplierDocumentManagementDeleteResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_admin_lifecycle_cleanup=ok.
Marker: supplier_document.expire.
Marker: supplier_document.delete.
Marker: approved_document_immutable.
Marker: 10,000 concurrent users.
