# Next Actions

## Current Next Action

Backend Phase 4I is implemented and committed locally at `bd05bc60`.

Phase 4I closes the first admin/operator read over supplier document download
events:

- `GET /v1/admin/supplier-documents/download-events` requires an authenticated
  admin session.
- Buyer/non-admin sessions receive `admin_role_required`.
- Query params are bounded by contract: optional `status`, `supplierId`,
  `buyerUserId`, `limit <= 100`, `offset <= 10 000`.
- The route reads `yorso_supplier_document_download_events` and orders by
  `created_at desc, id asc`.
- Admin JSON responses do not include `fileAssetId`, object keys, storage keys,
  direct file URLs or `downloadPath`.
- Reads emit audit action `admin.supplier_document_download_events.read`.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Решение по scope | Выбрать owner/admin upload или admin audit listing. | Выбрано audit listing, потому что event table уже есть после Phase 4G. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin endpoint | Дать admin bounded read по download events. | Реализовано: `/v1/admin/supplier-documents/download-events`. | Добавить grant audit listing, если нужен полный operator view. |
| Role guard | Не отдавать audit buyer-сессиям. | Реализовано: 401 без сессии, 403 `admin_role_required` для buyer. | Возможные subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers. | Реализовано: service response убирает `fileAssetId`; тесты защищают от object/storage/download leakage. | Держать admin responses без storage identifiers. |
| Пагинация и индексы | Сделать bounded pagination и indexed filters. | Реализовано: `status`, `supplierId`, `buyerUserId`, `limit<=100`, `offset<=10000`; Postgres query использует существующие recent indexes. | Cursor pagination только если объем audit этого потребует. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4I doc, contract map, validation doc, production baseline, guard markers. | Держать в release path. |

## Next Implementation After Phase 4I

Recommended next scoped workstream:

Backend Phase 4J: Supplier Document Grant Audit Listing.

Concrete scope:

- expose bounded admin reads over `yorso_supplier_document_download_grants`;
- keep response storage-id-free for browser/admin JSON while preserving
  backend-only file asset for repository/database forensics;
- support indexed filters that already exist or add no new unindexed scans;
- require admin session and audit reads;
- update docs, guards and 10,000 concurrent-user review;
- do not implement owner upload/editing yet.

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
