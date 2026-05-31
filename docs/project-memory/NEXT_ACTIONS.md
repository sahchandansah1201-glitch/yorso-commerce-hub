# Next Actions

## Current Next Action

Backend Phase 4L is implemented and committed locally at `ff286919`.

Phase 4L closes the supplier document management rules gate before runtime
upload/edit/delete work:

- shared contracts define management roles, actions, create/update payloads and
  audit events;
- `evaluateSupplierDocumentManagementPolicy` defines owner/admin status
  transitions;
- browser payload schemas reject `fileAssetId`, object/storage keys,
  `downloadPath` and direct download URLs;
- stable audit actions are fixed through
  `supplierDocumentManagementAuditActionByAction`;
- no browser route, API write route, migration, file write, queue or worker was
  added.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Закрыть rules gate перед upload/edit/delete. | Реализованы contracts + API policy, без runtime writes. | Выбрать один первый write path. |
| Roles | Зафиксировать `supplier_owner` и `admin`. | Роли закреплены в shared contract. | Привязать роли к real session/account claims. |
| Status transitions | Не дать owner менять approved документы напрямую. | `approved_document_immutable` блокирует update/delete approved. | Replacement/re-review flow отдельно. |
| Admin-only actions | Approval/rejection/expiry должны быть admin-only. | Owner получает `admin_role_required`. | Admin mutation route отдельно. |
| Storage boundary | Browser не должен присылать storage internals. | Strict schemas reject `fileAssetId`, keys, `downloadPath`, URLs. | Upload runtime должен выдавать backend-owned upload id. |
| Audit | Будущие writes должны иметь стабильные audit actions. | Зафиксированы `supplier_document.*` actions. | Runtime routes обязаны писать эти actions. |
| Guards | Зафиксировать docs, tests, self-hosted и 10k-user guards. | `test:supplier-document-management-policy`, guards и docs обновлены. | Держать в release path. |

## Next Implementation After Phase 4L

Recommended next scoped decision:

Backend Phase 4M - choose one first supplier document management write path.

Do not implement owner upload/create and admin approve/reject in the same batch.
Pick one:

1. Supplier owner create/upload review document:
   - authenticated supplier owner only;
   - accepts safe metadata and backend-owned upload id;
   - creates `review` document;
   - writes `supplier_document.create` audit event;
   - keeps approved buyer-facing document downloads unchanged.
2. Admin approve/reject document:
   - authenticated admin only;
   - applies Phase 4L status transitions;
   - writes `supplier_document.approve` or `supplier_document.reject`;
   - keeps storage identifiers backend-only.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Supplier document download grants and file serving remain qualified-only and
  audit-bound.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
