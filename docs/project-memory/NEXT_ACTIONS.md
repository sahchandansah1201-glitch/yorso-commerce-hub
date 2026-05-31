# Next Actions

## Current Next Action

Backend Phase 4R is implemented and committed locally at `474c290c`.

Phase 4R closes the read-only admin UI over supplier document management events:

- `/admin/supplier-document-management-events` renders a read-only operator page;
- `createAdminSupplierDocumentManagementEventsApiClient` reads Phase 4Q list/export endpoints;
- `useAdminSupplierDocumentManagementEvents` handles disabled, session-required, forbidden, loading, ready and error states;
- filters cover `action`, `supplierId`, `documentId` and `actorUserId`;
- JSON/CSV export controls call `/v1/admin/supplier-documents/management-events/export`;
- browser-facing rows are sanitized and do not render `fileAssetId`, object keys, storage keys, `downloadPath`, direct storage URLs or session identifiers;
- e2e guard `admin-supplier-document-management-events.spec.ts` verifies list rendering, headers, export wiring, RU forbidden copy, redaction and no horizontal overflow.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Admin route | Добавить read-only страницу для management events. | Реализована `/admin/supplier-document-management-events`. | Phase 4S: mutation actions на той же admin surface. |
| API client | Подключить frontend к Phase 4Q list/export. | Adapter читает `/management-events` и `/management-events/export`. | Переиспользовать client для action refresh. |
| Hook | Дать явные runtime states. | Disabled/session/forbidden/loading/ready/error покрыты тестами. | Сохранять fail-closed поведение. |
| Filters/export | Дать operator filters + JSON/CSV handoff. | UI фильтры и export controls реализованы. | Добавить action controls отдельно. |
| Redaction | Не раскрывать storage internals в браузере. | Adapter/page/e2e ловят `fileAssetId`, object keys, storage, `downloadPath`. | Сохранить для mutation UI. |
| Guards | Закрепить тестами, e2e, docs и CI. | Frontend tests, browser smoke, self-hosted/production guards зелёные. | Держать в release path. |

## Next Implementation After Phase 4R

Recommended next scoped implementation:

Backend Phase 4S - admin mutation UI actions for supplier documents.

Concrete scope:

1. Add approve/reject controls for review documents by calling the existing
   Phase 4N `/v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`
   endpoint.
2. Add expire/delete controls by calling the existing Phase 4P
   `/v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle`
   endpoint.
3. Keep controls status-aware: approve/reject only for `review`, expire only for
   `approved`, delete only for `review`, `on_request` and `expired`.
4. Require explicit reason input for reject/delete/expire actions.
5. Refresh the Phase 4R event list after successful mutation and keep all
   storage/internal fields out of browser state.
6. Add focused API-client/page tests, e2e smoke, docs and production-scale guards.

Alternative next scoped implementation:

Backend Phase 4S - automated approved-document expiry scheduler decision, only
if product priority shifts from operator-controlled document actions to
automatic lifecycle cleanup.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Supplier document download grants and file serving remain qualified-only and audit-bound.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase dependency in production paths.
