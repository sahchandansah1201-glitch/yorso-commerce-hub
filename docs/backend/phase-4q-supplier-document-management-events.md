# Backend Phase 4Q - Supplier Document Management Event Listing And Export

Status: implemented.

Phase 4Q adds the admin read/export surface for supplier document management
events already written by Phases 4M-4P.

This phase intentionally does not implement frontend UI, lifecycle mutations,
automated expiry scheduling, file replacement or new storage/file-serving
behavior.

## План / факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Добавить admin listing endpoint. | Добавлен `GET /v1/admin/supplier-documents/management-events`. | Frontend admin UI отдельным scope. |
| Добавить bounded export. | Добавлен `GET /v1/admin/supplier-documents/management-events/export?format=json|csv`. | Scheduled reports отдельным scope. |
| Поддержать фильтры. | Поддержаны `action`, `supplierId`, `documentId`, `actorUserId`, `limit`, `offset`. | Cursor pagination можно добавить позже, если offset станет узким местом. |
| Не раскрывать storage internals. | Ответы и export не содержат `fileAssetId`, object/storage keys, `downloadPath` или direct URLs. | Сохранять для будущего UI/export. |
| Использовать existing audit table. | Чтение идёт из `yorso_supplier_document_management_events`; новая миграция не нужна. | Event retention policy отдельным scope. |
| Зафиксировать smoke/guards. | `supplier_document_management_events_export=ok`, self-hosted и production-scale guards обновлены. | Lovable/UI sync отдельным шагом, если появится UI. |

## Runtime Contract

List endpoint:

```http
GET /v1/admin/supplier-documents/management-events
```

Export endpoint:

```http
GET /v1/admin/supplier-documents/management-events/export?format=json|csv
```

Supported query params:

- `action`: one of `supplier_document.create`, `supplier_document.update_metadata`,
  `supplier_document.submit_for_review`, `supplier_document.approve`,
  `supplier_document.reject`, `supplier_document.expire`,
  `supplier_document.delete`;
- `supplierId`;
- `documentId`;
- `actorUserId`;
- `limit`: `1..100`, default `50`;
- `offset`: `0..10000`, default `0`;
- `format`: `json|csv` on export only, default `json`.

The route:

1. resolves an authenticated self-hosted account session;
2. requires admin role through the self-hosted auth service;
3. validates bounded query params;
4. reads `yorso_supplier_document_management_events`;
5. returns or exports sanitized event metadata only.

Browser/export responses must not include:

- `fileAssetId`;
- `objectKey`;
- storage keys;
- storage driver internals;
- direct download URLs;
- `downloadPath`.

## Expected Read/Write Profile

At 10,000 concurrent users this route is admin/operator read traffic, not public
browse traffic.

Per request:

- one authenticated session resolution;
- one admin role check;
- one bounded indexed read from `yorso_supplier_document_management_events`;
- no writes except the route-level API audit sink.

The route stays uncached because it exposes operational audit data.

## Cache, Queue And Backpressure Strategy

- No application cache is used.
- Existing request timeout, draining and session fail-closed guardrails apply.
- `limit <= 100` and `offset <= 10000` cap read amplification.
- CSV/JSON export uses the same bounded read path; no unbounded full-table
  export is introduced.

## Database Indexing And Pagination Strategy

Phase 4Q uses existing Phase 4M indexes:

- `idx_yorso_supplier_document_management_events_supplier_recent`;
- `idx_yorso_supplier_document_management_events_actor_recent`;
- `idx_yorso_supplier_document_management_events_action_recent`;
- `idx_yorso_supplier_document_management_events_document_recent`.

PostgreSQL reads order by `created_at desc, id desc` and apply bounded
`limit/offset`.

If operator volume grows beyond the offset cap, the next step should add cursor
pagination over `(created_at, id)`.

## Failure Mode And Graceful Degradation

- Missing/invalid session: existing account session errors.
- Non-admin account: `admin_role_required`.
- Invalid filter/action/limit/offset/format: contract validation error.
- Empty result: `ok=true`, `items=[]`.

All failures keep storage internals out of browser responses.

## Observability And Load-Test Plan

- Route-level admin attempts emit:
  - `admin.supplier_document_management_events.read`;
  - `admin.supplier_document_management_events.export`.
- Smoke marker: `supplier_document_management_events_export=ok`.
- Focused tests cover missing session, non-admin denial, filtered listing,
  JSON export, CSV export, response redaction, contract validation and
  PostgreSQL filter SQL.
- Load tests should cover action/supplier/document/actor filters, malformed
  query params, empty result pages, max-limit exports and repeated admin reads
  at the 10,000 concurrent-user baseline.

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

Marker: Backend Phase 4Q Supplier Document Management Event Listing And Export.
Marker: /v1/admin/supplier-documents/management-events.
Marker: /v1/admin/supplier-documents/management-events/export.
Marker: listAdminSupplierDocumentManagementEvents.
Marker: exportAdminSupplierDocumentManagementEvents.
Marker: listSupplierDocumentManagementEvents.
Marker: supplierDocumentManagementEventAdminQuerySchema.
Marker: supplierDocumentManagementEventExportQuerySchema.
Marker: supplierDocumentManagementEventAdminListResponseSchema.
Marker: yorso_supplier_document_management_events.
Marker: supplier_document_management_events_export=ok.
Marker: admin.supplier_document_management_events.read.
Marker: admin.supplier_document_management_events.export.
Marker: 10,000 concurrent users.
