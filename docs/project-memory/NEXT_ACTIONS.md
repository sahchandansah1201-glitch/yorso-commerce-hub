# Next Actions

## Current Next Action

Backend Phase 4F is implemented and committed locally at `75c42a60`.

Phase 4F adds a self-hosted, qualified-only supplier document download grant
endpoint:

`POST /v1/suppliers/:supplierId/documents/:documentId/grant`

The endpoint requires an authenticated self-hosted account session, re-checks
supplier access before document lookup, returns a short-lived grant response,
and records every attempt in a backend audit table. Browser responses do not
include `fileAssetId`, storage keys, object keys or direct file URLs.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend contract | Добавить typed download grant response без storage details. | Реализовано: `supplierDocumentDownloadGrantSchema` и response schema. | Phase 4G должен валидировать grant при фактической выдаче файла. |
| Endpoint | Сделать qualified-only grant route после supplier access re-check. | Реализовано: `POST /v1/suppliers/:supplierId/documents/:documentId/grant`; без доступа возвращает 403 до раскрытия document/file данных. | Добавить `/download` consumption endpoint. |
| Audit persistence | Записывать granted/denied/unavailable attempts. | Реализовано: migration `0035_supplier_document_download_grants` и repository method `recordDocumentDownloadGrant`. | Добавить consumption/download audit при Phase 4G. |
| Frontend API | Не создавать local fake grants. | Реализовано: `requestDocumentDownloadGrant` работает только при configured API; API-disabled preview throws explicit error. | Подключить UI download action после serving endpoint. |
| Runtime smoke and guards | Зафиксировать locked/unlocked grant behavior. | Реализовано: smoke markers `supplier_document_grant_requires_access=ok` и `supplier_document_grant_unlocked=ok`; self-hosted/scale guards обновлены. | Держать guards в release path. |

## Next Implementation After Phase 4F

Recommended next scoped workstream:

Backend Phase 4G: Supplier Document Grant Consumption / File Serving Endpoint.

Concrete scope:

- add a self-hosted `GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...` route;
- validate grant id, buyer user, supplier id, document id, expiry and granted status before reading the backend file asset;
- stream the owned file payload through the API without exposing object keys or direct storage URLs;
- persist/audit successful download consumption and denied/expired attempts;
- add bounded cleanup or expiry policy for stale grants if needed;
- add tests, smoke markers, docs and 10,000 concurrent-user review.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
