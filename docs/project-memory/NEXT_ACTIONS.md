# Next Actions

## Current Next Action

Backend Phase 4H is implemented and committed locally at `06ef6922`.

Phase 4H connects qualified supplier profile document rows to the self-hosted
document grant and serving flow:

- `SupplierProfile.tsx` renders a download button only for approved
  `qualified_unlocked` supplier documents when `VITE_YORSO_API_URL` is
  configured.
- `downloadSupplierDocument` requests
  `/v1/suppliers/:supplierId/documents/:documentId/grant`, then fetches the
  returned relative API `downloadPath` with the current buyer session headers.
- `fileAssetId`, object keys, storage keys and direct file URLs are stripped
  before React-visible state and guarded from DOM/e2e assertions.
- Locked buyers keep non-downloadable document-readiness states.
- Backend document rows remain visible in the production passport even when
  optional logistics facts are absent.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| UI download action | Подключить qualified supplier document rows к self-hosted grant/download flow. | Реализовано: `supplier-document-download` вызывает `downloadSupplierDocument`. | Owner/admin document management отдельно. |
| Access boundary | Не показывать скачивание locked buyers. | Реализовано: кнопка появляется only for approved qualified docs with configured API. | Keep access gating guarded. |
| Storage redaction | Не раскрывать `fileAssetId`, object keys, storage keys или direct URLs. | Реализовано: `redactSupplierDocumentFileAssets` и DOM/e2e assertions. | Keep backend payload guards from Phase 4E/4G. |
| Failure copy | Добавить buyer-safe loading, expired-grant и failed-download states. | Реализовано: localized preparing, started, expired and failed copy. | Dedicated retry button later if needed. |
| Production passport resilience | Не прятать документы, если optional logistics facts отсутствуют. | Реализовано: documents block renders independently when logistics is missing. | Backend should still provide complete facts. |
| Guards | Зафиксировать docs, self-hosted guard and 10k-user baseline. | Реализовано: `phase-4h-supplier-document-download-ui.md`, `check:self-hosted-api`, `check:production-scale-baseline`. | Keep in release path. |

## Next Implementation After Phase 4H

Recommended next scoped workstream:

Backend Phase 4I: Supplier Document Owner/Admin Management Decision.

Concrete scope:

- decide whether the next supplier-document step is owner upload/editing or
  admin download-audit listing;
- if owner/admin upload is selected, define source-of-truth tables, validation,
  file ownership, audit events and role guards;
- if audit listing is selected, expose bounded admin reads over
  `yorso_supplier_document_download_events`;
- keep buyer profile downloads grant-bound and storage-id-free;
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
