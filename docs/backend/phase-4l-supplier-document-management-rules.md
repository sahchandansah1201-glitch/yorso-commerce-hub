# Backend Phase 4L - Supplier Document Management Rules Gate

Status: implemented.

Phase 4L closes the policy/contract gate before supplier document upload,
metadata editing, approval, rejection, expiry or deletion can become runtime
endpoints.

It does not add browser routes, API write routes, database writes, file writes,
queues or background workers. It defines the enforceable decision layer that
future owner/admin document management routes must call.

## План / Факт

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Определить роли управления документами поставщика. | Закреплены `supplier_owner` и `admin` в shared contract. | Привязать роли к реальным session/account claims в write endpoints. |
| Запретить supplier owner менять approved-документы напрямую. | `evaluateSupplierDocumentManagementPolicy` возвращает `approved_document_immutable` для owner metadata update/delete approved-документов. | Добавить replacement flow: новый документ на review вместо silent edit approved-файла. |
| Оставить approval/rejection/expiry только admin-действиями. | `approve`, `reject`, `expire` разрешены только `admin`; owner получает `admin_role_required`. | Подключить к admin write routes после отдельного UI/API scope. |
| Защитить storage boundary. | Browser create/update schemas `.strict()` и не принимают `fileAssetId`, `objectKey`, `storageKey`, `downloadPath`, `downloadUrl`. | Реальный upload endpoint должен выдавать backend-owned `fileUploadId`/asset binding без storage keys в UI. |
| Сделать audit actions обязательными и стабильными. | Зафиксированы `supplier_document.create/update_metadata/submit_for_review/approve/reject/expire/delete`. | Runtime routes будут писать эти actions в audit sink/outbox. |
| Сохранить buyer-facing document access. | Phase 4F-4K download grants, file serving and audit UI не менялись. | Ничего не раскрывать locked buyers при owner/admin management writes. |

## Management Decision Matrix

| Actor | Action | Current status | Result |
|---|---|---|---|
| `supplier_owner` | `create` | none | allowed, next `review` |
| `supplier_owner` | `update_metadata` | `review`, `on_request` | allowed, status unchanged |
| `supplier_owner` | `submit_for_review` | `on_request` | allowed, next `review` |
| `supplier_owner` | `delete` | `review`, `on_request` | allowed, next `null` |
| `supplier_owner` | `approve`, `reject`, `expire` | any | denied, `admin_role_required` |
| `supplier_owner` | `update_metadata`, `delete` | `approved` | denied, `approved_document_immutable` |
| `admin` | `approve` | `review` | allowed, next `approved` |
| `admin` | `reject` | `review` | allowed, next `on_request` |
| `admin` | `expire` | `approved` | allowed, next `expired` |
| `admin` | `update_metadata` | `review`, `on_request`, `expired` | allowed, status unchanged |
| `admin` | `delete` | `review`, `on_request`, `expired` | allowed, next `null` |
| `admin` | `delete` | `approved` | denied, `approved_document_immutable` |

## Contract Boundary

New shared schemas:

- `supplierDocumentTypeSchema`;
- `supplierDocumentStatusSchema`;
- `supplierDocumentManagementRoleSchema`;
- `supplierDocumentManagementActionSchema`;
- `supplierDocumentManagementAuditActionSchema`;
- `supplierDocumentManagementCreateRequestSchema`;
- `supplierDocumentManagementUpdateRequestSchema`;
- `supplierDocumentManagementAuditEventSchema`.

The create request accepts document metadata plus a backend-issued
`fileUploadId` and safe `fileName`. It does not accept `fileAssetId`,
`objectKey`, `storageKey`, `downloadPath`, direct download URLs or storage
bucket details from browser clients.

The update request accepts metadata only. Status changes are not part of the
metadata payload; they must go through the policy action path.

## Expected Read/Write Profile

- Current Phase 4L runtime profile: zero reads and zero writes.
- Future owner/admin document management write endpoints are expected to be
  low-volume operational writes, not public catalog traffic.
- Each future mutation must perform:
  - one authenticated account/session read;
  - one supplier ownership/admin authorization read;
  - one document row read with row lock or version precondition;
  - one bounded write;
  - one audit write.

## Cache, Queue And Backpressure Strategy

- No cache, queue, scheduler, polling or worker is introduced in Phase 4L.
- Future write endpoints must remain uncached and use API request guardrails,
  body-size limits, session fail-closed behavior and database transaction
  boundaries.
- File processing, virus scanning or external storage retries must not be added
  without a separate outbox/worker phase.

## Database Indexing And Pagination Strategy

- No migration is introduced in Phase 4L.
- Existing `supplier_documents` remains a bounded JSONB payload on supplier
  records for the current read surface.
- A future document-management persistence phase must decide whether to keep
  JSONB replacement writes or normalize supplier documents into a dedicated
  table before adding high-volume owner/admin workflows.
- Future admin listings must keep `limit <= 100`, bounded offsets or cursor
  pagination, and indexes by supplier, status and updated time.

## Failure Mode And Graceful Degradation

- Missing current status for non-create decisions returns
  `current_status_required`.
- Invalid status/action transitions return `invalid_status_transition`.
- Approved document metadata update/delete returns
  `approved_document_immutable`.
- Owner approval/rejection/expiry returns `admin_role_required`.
- Browser payloads containing storage internals fail schema validation before
  route code can persist them.

## Observability And Load-Test Plan

- Future runtime routes must emit one of the stable audit actions from
  `supplierDocumentManagementAuditActionByAction`.
- Tests cover shared schemas, strict browser payload rejection, audit event
  shape and role/status decision matrix.
- Load tests for future write routes must cover owner create/update/submit,
  admin approve/reject/expire, rejected immutable approved-document writes,
  malformed payloads and concurrent version conflicts at the 10,000 concurrent
  user baseline.

## Validation

- `npm run test:supplier-document-management-policy`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npm run contracts:build`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run build`;
- `npm test`.

Marker: Backend Phase 4L Supplier Document Management Rules Gate.
Marker: supplierDocumentManagementCreateRequestSchema.
Marker: supplierDocumentManagementAuditEventSchema.
Marker: evaluateSupplierDocumentManagementPolicy.
Marker: supplierDocumentManagementAuditActionByAction.
Marker: approved_document_immutable.
Marker: admin_role_required.
Marker: Plan / Fact.
Marker: 10,000 concurrent users.
