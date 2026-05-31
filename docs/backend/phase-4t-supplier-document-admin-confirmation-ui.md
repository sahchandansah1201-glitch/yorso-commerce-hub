# Backend Phase 4T - Supplier Document Admin Confirmation UI

Status: implemented (local, uncommitted)

## Goal

Add an explicit confirmation step before risky supplier document admin
mutations on `/admin/supplier-document-management-events`.

This phase does not add backend endpoints, migrations, schedulers, queues,
storage behavior, Supabase paths or new lifecycle policy. It refines the Phase
4S admin UI so `reject`, `expire` and `delete` require both a reason and an
operator confirmation before the existing self-hosted endpoints are called.

## Surface

- Admin route: `/admin/supplier-document-management-events`
- Existing mutation endpoints:
  - `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`
  - `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle`

## Implementation Notes

- `approve` remains an immediate action.
- `reject`, `expire` and `delete` open an `AlertDialog` confirmation.
- The confirmation summarizes action, supplier id, document id and reason.
- Cancel closes the dialog without a backend request.
- Confirm calls the same Phase 4S `runDocumentAction` path and refreshes the
  bounded management event list on success.
- The confirmation UI uses existing localized page copy and keeps storage-only
  fields out of browser-visible state.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Confirmation gate | Добавить explicit confirm перед risky actions. | `reject`, `expire`, `delete` открывают confirmation dialog. | Undo/audit comment taxonomy отдельно. |
| Safe immediate action | Не замедлять approve без причины. | `approve` остается immediate action. | Если появится compliance requirement, добавить confirm отдельно. |
| Cancel behavior | Cancel не должен делать backend write. | Unit/e2e проверяют, что `/lifecycle` не вызывается до confirm. | Сохранять при refactor dialog. |
| Operator context | Показать, что именно будет изменено. | Dialog показывает action, supplier, document и reason. | Добавить document title только если backend вернет safe label. |
| Redaction | Не раскрывать file/storage/session internals. | Browser smoke сохраняет redaction guard. | Сохранять при любых admin UI расширениях. |

## Scale Baseline (10,000 concurrent users)

Baseline assumption: 10,000 concurrent users across the product, with a small
admin/operator subset using this route. Phase 4T reduces accidental writes and
does not add background traffic.

Expected read/write profile:

- no extra backend reads or writes for opening/canceling the confirmation;
- one existing mutation write only after explicit confirm;
- one bounded list refresh after successful mutation.

Cache, queue and backpressure strategy:

- no cache, queue, polling or scheduler is introduced;
- backend role checks, document-management policy and request limits remain the
  write backpressure/fail-closed boundary.

Database indexing and pagination strategy:

- no new database query, index or migration;
- reads and writes remain the Phase 4Q/4N/4P bounded paths.

Failure mode and graceful degradation:

- cancel closes the dialog without side effects;
- failed confirmed mutation surfaces the existing bounded action error;
- disabled/session-required/forbidden states remain unchanged.

Observability and load-test plan:

- confirmed mutations continue through existing API route observability and
  durable management audit writes;
- browser smoke verifies that destructive lifecycle writes do not fire before
  confirmation;
- future load tests do not need a new traffic class because this is client-side
  gating over existing low-volume admin writes.

## Guardrails Preserved

- Self-hosted production direction; no hosted BaaS/Supabase dependency.
- Phase 4L backend policy remains the source of valid transitions.
- Storage/internal identifier redaction remains enforced.
- Public UX/a11y safeguards Batches #110-#141 remain unchanged.

Marker: Backend Phase 4T Supplier Document Admin Confirmation UI.
Marker: admin-document-management-events-confirmation.
Marker: admin-document-management-events-confirm-submit.
Marker: admin-document-management-events-confirm-cancel.
Marker: Confirm document action.
Marker: 10,000 concurrent users.
