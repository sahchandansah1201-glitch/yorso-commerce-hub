# Backend Phase 4N - Supplier Document Admin Decision Runtime

Status: implemented.

Phase 4N implements the admin decision path for supplier documents that are in
`review`: approve to `approved`, or reject back to `on_request`.

This phase intentionally does not implement owner metadata edits, owner delete,
admin expire/delete, management-event listing UI, frontend supplier document
management UI, file scanning workers or external provider integration.

## План / факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить admin-only decision route. | Добавлен `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`. | Admin expire/delete и owner update/delete отдельными scope. |
| Применить Phase 4L policy. | `decideSupplierDocumentAsAdmin` использует `evaluateSupplierDocumentManagementPolicy` для `admin/approve` и `admin/reject`. | Все будущие mutations должны идти через тот же policy layer. |
| Закрыть approve/reject transitions. | `review -> approved` и `review -> on_request` реализованы; повторный reject approved документа даёт `invalid_status_transition`. | Replacement/re-review flow отдельно. |
| Писать durable audit. | `supplier_document.approve` / `supplier_document.reject` пишутся в `yorso_supplier_document_management_events`. | Admin listing по management events отдельным scope. |
| Не раскрывать storage internals. | Decision response возвращает sanitized document без `fileAssetId`, `objectKey`, storage keys, `downloadPath` и direct URLs. | Сохранять этот контракт для update/expire/delete. |
| Сохранить buyer-facing safeguards. | Locked buyer responses, supplier identity redaction, exact-price locks, grants and file serving не изменены. | Нет frontend surface в Phase 4N. |

## Runtime Contract

Endpoint:

```http
POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision
```

Request body:

- `decision`: `approve` or `reject`;
- `reason`: optional bounded audit reason.

The route:

1. resolves an authenticated self-hosted account session;
2. requires the authenticated user to have admin role;
3. validates the bounded decision body;
4. loads the supplier document;
5. applies the Phase 4L policy matrix for `admin/approve` or `admin/reject`;
6. updates the document status;
7. writes durable management audit metadata;
8. returns sanitized document metadata and audit metadata.

Browser response must not include:

- `fileAssetId`;
- `objectKey`;
- storage keys;
- storage driver internals;
- direct download URLs;
- `downloadPath`.

## Persistence

No new migration is needed. Phase 4N uses the Phase 4M management audit table:

- `packages/db/migrations/0037_supplier_document_management_events.sql`;
- `yorso_supplier_document_management_events`.

The PostgreSQL decision path is one bounded CTE:

- locate the target supplier document by `supplier_id`, `document_id` and
  current status;
- update only the JSONB `status` field with `jsonb_set`;
- insert the management audit event in the same statement.

## Expected Read/Write Profile

At 10,000 concurrent users this route is an operator/admin mutation, not public
browse traffic.

Per successful request:

- one admin session resolution;
- one admin role check;
- one supplier detail read;
- one supplier row JSONB status mutation;
- one management audit insert.

The route stays uncached.

## Cache, Queue And Backpressure Strategy

- No cache is used for mutations.
- Existing JSON body-size, idle timeout, request timeout and session
  fail-closed guardrails apply.
- No scheduler, queue or worker is introduced.
- Future bulk approvals must be a separate bounded queue/backpressure phase.

## Database Indexing And Pagination Strategy

- The mutation is a point write by supplier id and document id.
- Audit table already has supplier/recent, actor/recent, action/recent and
  supplier/document/recent indexes.
- Future management audit listing must use bounded `limit <= 100` or cursor
  pagination.

## Failure Mode And Graceful Degradation

- Missing/invalid session: existing account session errors.
- Non-admin account: `admin_role_required`.
- Missing supplier: `supplier_not_found`.
- Missing document: `supplier_document_not_found`.
- Invalid transition: `invalid_status_transition`.
- Malformed payload: contract validation error.

All failures keep storage internals out of the browser response.

## Observability And Load-Test Plan

- Successful decisions persist `supplier_document.approve` or
  `supplier_document.reject` in `yorso_supplier_document_management_events`.
- Admin route attempts are emitted through the existing admin audit sink as
  `admin.supplier_document_management.decide`.
- Smoke marker: `supplier_document_admin_decision_review=ok`.
- Focused tests cover API route behavior, non-admin block, response redaction,
  invalid transition handling, PostgreSQL CTE decision persistence and shared
  decision response contract.
- Future load tests should cover concurrent review decisions on the same
  document, stale status conflicts, malformed payloads and admin-role denial at
  the 10,000 concurrent-user baseline.

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

Marker: Backend Phase 4N Supplier Document Admin Decision Runtime.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision.
Marker: decideSupplierDocumentAsAdmin.
Marker: supplierDocumentManagementDecisionRequestSchema.
Marker: supplierDocumentManagementDecisionResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_admin_decision_review=ok.
Marker: supplier_document.approve.
Marker: supplier_document.reject.
Marker: 10,000 concurrent users.
