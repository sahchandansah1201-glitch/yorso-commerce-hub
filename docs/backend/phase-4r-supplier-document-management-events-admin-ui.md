# Backend Phase 4R - Supplier Document Management Events Admin UI

Status: implemented (local, uncommitted)

## Goal

Expose a read-only admin UI over the Phase 4Q supplier document management
events listing/export endpoints, without leaking backend storage identifiers,
object keys, download paths or direct URLs into browser-visible state.

This phase does not add any new backend tables, storage providers, schedulers
or document lifecycle mutations.

## Surface

- Admin route: `/admin/supplier-document-management-events`
- Data source:
  - `GET /v1/admin/supplier-documents/management-events`
  - `GET /v1/admin/supplier-documents/management-events/export?format=json|csv`

## Implementation Notes

Frontend API adapter and hook:

- `createAdminSupplierDocumentManagementEventsApiClient` in
  `src/lib/admin-supplier-document-management-events-api.ts`
- `useAdminSupplierDocumentManagementEvents` in
  `src/lib/use-admin-supplier-document-management-events.ts`

Browser smoke:

- `e2e/admin-supplier-document-management-events.spec.ts` (Phase 4R browser guard)

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Admin route | Добавить read-only страницу для операторов. | Реализована `/admin/supplier-document-management-events`. | Добавить deep-link на supplier/document views, если появятся. |
| API client | Добавить frontend adapter к Phase 4Q endpoints. | Реализован `createAdminSupplierDocumentManagementEventsApiClient`. | Не расширять поля, которые могут открыть storage internals. |
| Hook | Дать loading/session/forbidden/ready состояния. | Реализован `useAdminSupplierDocumentManagementEvents` со state machine. | Добавить bounded pagination UI, если понадобится. |
| Filters | Action/supplier/document/actor + bounded paging. | Фильтры есть в UI и прокидываются в query. | Cursor pagination только отдельным scope. |
| Export | JSON/CSV кнопки на основе export endpoint. | Экспорт вызывает Phase 4Q `/export` и сохраняет boundary. | Добавить download UX, если оператору нужен файл. |
| Redaction | Запретить storage-only поля в UI/DOM. | Adapter+tests запрещают `fileAssetId`, object keys, `downloadPath`, storage. | Сохранять guard при любых refactor. |
| Tests | Закрепить контракт через unit + e2e. | Adapter/hook/page unit tests + e2e smoke. | Держать в `ci:core` и `ci:full`. |

## Scale Baseline (10,000 concurrent users)

Baseline assumption: 10,000 concurrent users across the product, with a small
subset being admins/operators. Phase 4R is a read-only admin surface and must:

- use bounded list queries (`limit`/`offset`) and avoid unbounded exports;
- keep payloads sanitized (no file asset ids, storage keys, download paths);
- degrade gracefully on self-hosted API unavailability (explicit disabled state);
- keep browser-visible state free of secrets (session id, direct URLs).

## Guardrails Preserved

- Self-hosted production direction (no hosted BaaS/Supabase expansion).
- Access gating and admin-role enforcement (fail closed).
- Storage/internal identifier redaction.
- Public UX/a11y safeguards Batches #110-#141 remain unchanged.
