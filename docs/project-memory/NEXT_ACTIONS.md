# Next Actions

## Current Next Action

Backend Phase 4O is implemented and committed locally at `4a9bbc2e`.

Phase 4O closes the supplier-owner correction path for non-approved supplier
documents:

- `PATCH /v1/suppliers/:supplierId/documents/:documentId` updates document
  metadata for documents currently in `review` or `on_request`;
- `DELETE /v1/suppliers/:supplierId/documents/:documentId` deletes documents
  currently in `review` or `on_request`;
- the route requires a self-hosted session, supplier/both account role and
  matching supplier company ownership;
- the API applies Phase 4L supplier_owner/update_metadata or
  supplier_owner/delete policy before mutation;
- `approved` documents remain immutable and return `approved_document_immutable`;
- browser responses are sanitized through
  `supplierDocumentManagementUpdateResponseSchema` and
  `supplierDocumentManagementDeleteResponseSchema`;
- PostgreSQL updates/deletes the supplier document and inserts
  `supplier_document.update_metadata` or `supplier_document.delete` audit
  metadata in bounded CTEs;
- the smoke marker `supplier_document_owner_update_delete=ok` verifies the
  full owner create -> admin reject -> owner update/delete flow.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Реализовать owner correction path, без admin expire/delete и без UI. | Реализованы owner `PATCH`/`DELETE` для non-approved документов. | Phase 4P: admin expire/delete lifecycle cleanup. |
| Access | Пускать только self-hosted supplier owner. | Missing session -> 401; wrong role/owner company -> owner required error. | Admin lifecycle route отдельно. |
| Status transitions | Сохранить Phase 4L policy. | `review`/`on_request` можно update/delete; `approved` immutable. | Replacement/re-review flow отдельно. |
| Response boundary | Не раскрывать backend file identifiers. | Update/delete response sanitized, без `fileAssetId`, storage keys, `downloadPath` или direct URLs. | Сохранять для admin lifecycle. |
| Persistence | Mutation и audit должны быть atomic. | PostgreSQL CTE update/delete + `supplier_document.update_metadata/delete` audit insert. | Event listing UI может читать существующую audit table. |
| Smoke | Проверить owner create -> admin reject -> owner update/delete. | `supplier_document_owner_update_delete=ok` в self-hosted account API smoke. | Добавить admin lifecycle smoke в Phase 4P. |
| Guards | Зафиксировать docs, tests, self-hosted и 10k-user guards. | Runtime script, self-hosted guard, production-scale guard обновлены. | Держать в release path. |

## Next Implementation After Phase 4O

Recommended next scoped implementation:

Backend Phase 4P - admin expire/delete supplier document lifecycle cleanup.

Concrete scope:

1. Add admin-only lifecycle route for `expire` on approved supplier documents.
2. Add admin-only delete route for non-approved supplier documents if policy
   permits it, without allowing owner bypass.
3. Preserve response redaction: no `fileAssetId`, object keys, storage keys,
   download paths or direct storage URLs.
4. Write durable audit events into
   `yorso_supplier_document_management_events`.
5. Add focused API/repository tests, smoke marker, docs and production-scale
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
