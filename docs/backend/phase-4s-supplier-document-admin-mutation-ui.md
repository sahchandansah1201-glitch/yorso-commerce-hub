# Backend Phase 4S - Supplier Document Admin Mutation UI

Status: implemented (local, uncommitted)

## Goal

Add admin mutation controls to the existing
`/admin/supplier-document-management-events` surface so an operator can run
the already implemented self-hosted document decision and lifecycle endpoints
without exposing storage internals in browser-visible state.

This phase does not add new backend tables, schedulers, object-storage
behavior, Supabase paths or new lifecycle policy. It only wires the admin UI to
the existing Phase 4N and Phase 4P endpoints.

## Surface

- Admin route: `/admin/supplier-document-management-events`
- Existing read/export sources:
  - `GET /v1/admin/supplier-documents/management-events`
  - `GET /v1/admin/supplier-documents/management-events/export?format=json|csv`
- Existing mutation endpoints:
  - `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`
  - `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle`

## Implementation Notes

Frontend API adapter:

- `runDocumentAction` in
  `src/lib/admin-supplier-document-management-events-api.ts`
- `approve` / `reject` post `{ decision, reason? }` to `/decision`.
- `expire` / `delete` post `{ action, reason? }` to `/lifecycle`.
- The adapter keeps self-hosted session headers and rejects storage-only
  response fields.

Admin UI:

- review rows expose `approve`, `reject` and `delete`;
- approved rows expose `expire`;
- on-request and expired rows expose `delete`;
- `reject`, `expire` and `delete` require an operator reason in the UI;
- successful mutations refresh the bounded management event list.

Browser smoke:

- `e2e/admin-supplier-document-management-events.spec.ts` covers list/export
  plus approve/expire action wiring and DOM redaction.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Decision actions | Дать admin UI для approve/reject поверх existing decision endpoint. | `runDocumentAction` вызывает `/decision`; review rows показывают `Approve`/`Reject`. | Backend policy Phase 4L остается источником правды для переходов. |
| Lifecycle actions | Дать admin UI для expire/delete поверх existing lifecycle endpoint. | `runDocumentAction` вызывает `/lifecycle`; approved rows показывают `Expire`, review/on_request/expired rows - `Delete`. | Автоматический expiry scheduler остается отдельным scope. |
| Reason guard | Не отправлять destructive/status cleanup без явной причины оператора. | `reject`/`expire`/`delete` disabled, пока reason пустой; approve reason не требует. | Добавить structured reason taxonomy только отдельным scope. |
| Refresh | После мутации перечитать события. | Успешное действие вызывает `events.refresh()`. | Optimistic updates не добавлять без backend cursor/version contract. |
| Redaction | Не раскрывать storage internals/session ids в UI. | Adapter, unit и e2e guard сохраняют запрет на `fileAssetId`, object keys, `downloadPath`, storage и session id в DOM. | Сохранять guard при любых расширениях. |
| Tests | Закрепить UI/API/browser contract. | Unit покрывает approve/reject/expire/delete payload mapping; e2e покрывает approve+expire, headers, refresh и redaction. | Delete/reject browser happy path можно добавить при появлении отдельного confirmation UX. |

## Scale Baseline (10,000 concurrent users)

Baseline assumption: 10,000 concurrent users across the product, with a small
operator/admin subset using this route. Phase 4S adds low-volume operator writes
on top of existing admin endpoints.

Expected read/write profile:

- one bounded list read on page load and after each successful mutation;
- one mutation write per explicit operator action;
- no polling, subscriptions, batch mutation or full-table export added.

Cache, queue and backpressure strategy:

- no frontend cache is added because admin decision state must remain current;
- list refresh stays bounded (`limit=50`, offset-backed);
- backend request limits, admin-role checks and existing policy validation
  remain the write backpressure/fail-closed boundary.

Database indexing and pagination strategy:

- Phase 4S reuses Phase 4Q bounded reads over
  `yorso_supplier_document_management_events`;
- decision/lifecycle writes reuse Phase 4N/4P repository paths and existing
  JSONB document mutation plus management event audit insert.

Failure mode and graceful degradation:

- missing API URL renders disabled state;
- missing session renders session-required state;
- non-admin session renders forbidden state;
- failed mutation surfaces the bounded error message and does not mutate local
  browser state optimistically.

Observability and load-test plan:

- mutations continue through existing API route observability and management
  event audit writes;
- browser smoke verifies session headers, endpoint selection, refresh and
  storage-redaction boundary;
- future load testing should replay low-rate admin writes with concurrent buyer
  catalog traffic to confirm admin mutations do not affect public route latency.

## Guardrails Preserved

- Self-hosted production direction; no Supabase or hosted BaaS dependency.
- Phase 4L document-management policy remains backend-owned.
- Access gating and admin-role enforcement fail closed.
- Storage/internal identifier redaction remains enforced in adapter and DOM.
- Public UX/a11y safeguards Batches #110-#141 remain unchanged.

Marker: Backend Phase 4S Supplier Document Admin Mutation UI.
Marker: runDocumentAction.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision.
Marker: /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle.
Marker: admin-document-management-events-approve.
Marker: admin-document-management-events-expire.
Marker: 10,000 concurrent users.
