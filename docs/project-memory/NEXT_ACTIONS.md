# Next Actions

## Current Next Action

Backend Phase 4S is committed locally at `3796bd80`; release validation passed.

Phase 4S adds admin mutation actions to the existing supplier document
management events surface:

- `/admin/supplier-document-management-events` now keeps list/export and adds
  status-aware action controls;
- `runDocumentAction` in `createAdminSupplierDocumentManagementEventsApiClient`
  calls existing self-hosted Phase 4N `/decision` and Phase 4P `/lifecycle`
  endpoints;
- `approve` / `reject` post `{ decision, reason? }`;
- `expire` / `delete` post `{ action, reason? }`;
- review rows expose approve/reject/delete, approved rows expose expire, and
  on_request/expired rows expose delete;
- reject/expire/delete require a reason before submission;
- successful actions refresh the bounded management event list;
- adapter, unit and e2e guards keep `fileAssetId`, object keys, storage keys,
  `downloadPath`, direct storage URLs and session identifiers out of browser
  state.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Decision actions | Подключить approve/reject к existing `/decision`. | `runDocumentAction` маппит approve/reject в `{ decision, reason? }`. | Backend policy остается source of truth. |
| Lifecycle actions | Подключить expire/delete к existing `/lifecycle`. | `runDocumentAction` маппит expire/delete в `{ action, reason? }`. | Scheduler expiry отдельно. |
| UI controls | Сделать действия status-aware. | Review: approve/reject/delete; approved: expire; on_request/expired: delete. | Confirmation/undo UX отдельным scope. |
| Reason guard | Не отправлять рискованные действия без причины. | Reject/expire/delete disabled, пока reason пустой. | Structured reason taxonomy отдельно. |
| Refresh/redaction | После действия перечитать список и не раскрывать storage/session internals. | `events.refresh()` после success; guards ловят storage/session leakage. | Сохранять boundary при расширениях. |
| Guards | Закрепить tests, e2e, docs, self-hosted/scale guards. | Unit/e2e, self-hosted/scale guards, lint, TypeScript и diff-check зелёные; implementation commit `3796bd80`. | Держать в release path. |

## Next Implementation After Phase 4S

Recommended next scoped implementation:

Backend Phase 4T - choose one small follow-up only:

1. Admin confirmation/undo UX around destructive supplier document actions
   (`reject`, `expire`, `delete`) on `/admin/supplier-document-management-events`;
   or
2. automated approved-document expiry scheduler decision and design.

Do not mix confirmation UX and scheduler work in one scope.

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
