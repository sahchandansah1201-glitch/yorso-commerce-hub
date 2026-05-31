# Next Actions

## Current Next Action

Backend Phase 4N is implemented and committed locally at `2d5a05ba`.

Phase 4N closes the admin decision path for review supplier documents:

- `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/decision`
  approves or rejects a document currently in `review`;
- the route requires a self-hosted session and admin role;
- the API applies Phase 4L admin/approve or admin/reject policy before status
  mutation;
- the browser response is sanitized through
  `supplierDocumentManagementDecisionResponseSchema`;
- PostgreSQL updates the supplier document status and inserts
  `supplier_document.approve` or `supplier_document.reject` audit metadata in
  one bounded CTE;
- the smoke marker `supplier_document_admin_decision_review=ok` verifies the
  full owner-create -> admin-approve/reject flow.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Реализовать только admin decision path, без owner update/delete и без UI. | Реализован approve/reject для документов в `review`. | Phase 4O: owner metadata update/delete для non-approved документов. |
| Access | Пускать только self-hosted admin. | Missing session -> 401; buyer/owner non-admin -> `admin_role_required`. | Owner routes отдельно. |
| Status transitions | Закрыть approve/reject без обхода policy. | `review -> approved`, `review -> on_request`; stale/repeated decision -> `invalid_status_transition`. | Replacement/re-review flow отдельно. |
| Response boundary | Не раскрывать backend file identifiers. | Decision response sanitized, без `fileAssetId`, storage keys, `downloadPath` или direct URLs. | Сохранять для update/delete/expire. |
| Persistence | Decision и audit должны быть atomic. | PostgreSQL CTE status update + `supplier_document.approve/reject` audit insert. | Event listing UI может читать существующую audit table. |
| Smoke | Проверить owner create -> admin approve/reject. | `supplier_document_admin_decision_review=ok` в self-hosted account API smoke. | Добавить owner correction smoke в Phase 4O. |
| Guards | Зафиксировать docs, tests, self-hosted и 10k-user guards. | Runtime script, self-hosted guard, production-scale guard обновлены. | Держать в release path. |

## Next Implementation After Phase 4N

Recommended next scoped implementation:

Backend Phase 4O - supplier owner metadata update/delete for non-approved
supplier documents.

Concrete scope:

1. Add supplier-owner mutation route for metadata update on documents with
   status `review` or `on_request`.
2. Add supplier-owner delete route for documents with status `review` or
   `on_request`.
3. Keep `approved` immutable and preserve Phase 4L policy decisions.
4. Write `supplier_document.update_metadata` and `supplier_document.delete`
   audit records into `yorso_supplier_document_management_events`.
5. Return sanitized document metadata only; no storage identifiers or backend
   file paths.
6. Add focused API/repository tests, smoke marker, docs and production-scale
   guard updates.

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
