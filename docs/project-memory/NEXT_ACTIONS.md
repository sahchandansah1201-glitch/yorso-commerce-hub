# Next Actions

## Current Next Action

Backend Phase 4T is committed locally at `609ff7d1`; release validation passed.

Phase 4T adds confirmation before risky admin document actions on the existing
supplier document management events surface:

- `/admin/supplier-document-management-events` keeps Phase 4R list/export and
  Phase 4S status-aware mutation controls;
- `approve` remains immediate;
- `reject`, `expire` and `delete` require reason plus explicit confirmation;
- canceling the confirmation dialog does not call `/decision` or `/lifecycle`;
- confirming calls the existing `runDocumentAction` path and refreshes the
  bounded event list on success;
- unit/e2e guards keep `fileAssetId`, object keys, storage keys, `downloadPath`,
  direct storage URLs and session identifiers out of browser state.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Confirmation gate | Добавить confirm перед risky actions. | Reject/expire/delete открывают confirmation dialog. | Undo/audit taxonomy отдельно. |
| Safe immediate action | Не замедлять approve. | Approve остается immediate action. | Confirm для approve только при compliance requirement. |
| Cancel behavior | Cancel не должен делать backend write. | Unit/e2e проверяют отсутствие `/lifecycle` до confirm. | Сохранять при dialog refactor. |
| Operator context | Показать, что будет изменено. | Dialog показывает action/supplier/document/reason. | Добавить safe document title, если backend вернет его. |
| Guards | Закрепить tests, e2e, docs, self-hosted/scale guards. | Unit/e2e, self-hosted/scale guards, lint, TypeScript и diff-check зелёные; implementation commit `609ff7d1`. | Держать в release path. |

## Next Implementation After Phase 4T

Recommended next scoped implementation:

Backend Phase 4U - choose one small follow-up only:

1. automated approved-document expiry scheduler decision/design; or
2. structured reason taxonomy for supplier document management actions.

Do not mix scheduler work and reason-taxonomy/admin UI work in one scope.

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
