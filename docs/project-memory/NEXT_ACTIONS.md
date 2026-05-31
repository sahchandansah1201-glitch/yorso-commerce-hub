# Next Actions

## Current Next Action

Backend Phase 4J is implemented and committed locally at `b5469880`.

Phase 4J closes the adjacent admin/operator read over supplier document grant
records:

- `GET /v1/admin/supplier-documents/download-grants` requires an authenticated
  admin session.
- Buyer/non-admin sessions receive `admin_role_required`.
- Query params are bounded by contract: optional `status`, `supplierId`,
  `buyerUserId`, `limit <= 100`, `offset <= 10 000`.
- The route reads `yorso_supplier_document_download_grants` and orders by
  `created_at desc, id asc`.
- Admin JSON responses do not include `fileAssetId`, object keys, storage keys,
  direct file URLs or `downloadPath`.
- Reads emit audit action `admin.supplier_document_download_grants.read`.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Закрыть adjacent grant-audit gap после Phase 4I. | Реализован admin listing по `yorso_supplier_document_download_grants`. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin endpoint | Дать admin bounded read по grant attempts. | Реализовано: `/v1/admin/supplier-documents/download-grants`. | Решить, нужен ли admin UI над grant/download audit listings. |
| Role guard | Не отдавать audit buyer-сессиям. | Реализовано: 401 без сессии, 403 `admin_role_required` для buyer. | Возможные subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers. | Реализовано: service response убирает `fileAssetId` и `downloadPath`; тесты защищают от object/storage leakage. | Держать admin responses без storage identifiers. |
| Пагинация и индексы | Сделать bounded pagination и indexed filters. | Реализовано: `status`, `supplierId`, `buyerUserId`, `limit<=100`, `offset<=10000`; Postgres query использует существующие recent indexes. | Cursor pagination только если объем audit этого потребует. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4J doc, contract map, validation doc, production baseline, guard markers. | Держать в release path. |

## Next Implementation After Phase 4J

Recommended next scoped decision:

Choose one of two concrete paths:

1. Admin UI for supplier document audit listings:
   - add a bounded admin console view over `/v1/admin/supplier-documents/download-events`;
   - add a companion view over `/v1/admin/supplier-documents/download-grants`;
   - preserve storage-id-free browser payloads and admin role guard.

2. Supplier owner/admin document management:
   - define ownership model, upload/edit/delete validation and audit events;
   - define file ownership and restricted document lifecycle;
   - keep buyer profile downloads grant-bound and storage-id-free.

Do not start both in one batch.

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
