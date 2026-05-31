# Next Actions

## Current Next Action

Backend Phase 4G is implemented and committed locally at `37cae608`.

Phase 4G adds self-hosted supplier document grant consumption and file serving:

`GET /v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`

The endpoint requires an authenticated self-hosted account session, validates
the grant id, buyer user, supplier id, document id, expiry, granted status and
current supplier access before reading backend-owned file bytes. Successful and
denied download attempts are recorded in `yorso_supplier_document_download_events`.
Browser responses stream the file through the API and do not expose `fileAssetId`,
object keys, storage keys or direct file URLs.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Download route | Добавить self-hosted GET download endpoint для grant consumption. | Реализовано: `/v1/suppliers/:supplierId/documents/:documentId/download?grantId=...`. | Phase 4H подключает UI download action. |
| Access validation | Проверять grant, buyer, supplier, document, expiry, granted status и текущий supplier access до чтения файла. | Реализовано в `consumeSupplierDocumentDownloadGrant`. | Owner/admin upload policy отдельно. |
| File boundary | Стримить файл через API без object keys/direct URLs. | Реализовано: response отдаёт bytes + attachment headers; asset id остаётся backend-only. | UI не должен показывать storage identifiers. |
| Audit persistence | Записывать successful/missing/denied/expired/access-denied/unavailable attempts. | Реализовано: migration `0036_supplier_document_download_events` и repository method `recordDocumentDownloadEvent`. | Добавить retention/cleanup policy later. |
| Guards | Зафиксировать route, migration, smoke и 10k-user review. | Реализовано: API/storage/repository/DB tests, smoke markers, self-hosted/scale guards. | Держать в release path. |

## Next Implementation After Phase 4G

Recommended next scoped workstream:

Backend Phase 4H: Supplier Document Download UI Integration.

Concrete scope:

- wire qualified supplier profile document rows to request a document download
  grant and then open the returned API download path;
- keep locked buyer states as non-downloadable trust/document-readiness signals;
- avoid exposing `fileAssetId`, object keys, storage keys or direct file URLs in
  React state, DOM, analytics or errors;
- add buyer-safe loading, expired-grant retry and failure copy;
- add frontend tests/e2e or smoke coverage for qualified download CTA and locked
  no-download states;
- update docs, guards and 10,000 concurrent-user review.

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
