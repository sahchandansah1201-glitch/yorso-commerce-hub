# Next Actions

## Current Next Action

Backend Phase 4P is implemented and committed locally at `84954e9d`.

Phase 4P closes the admin lifecycle cleanup path for supplier documents:

- `POST /v1/admin/supplier-documents/:supplierId/documents/:documentId/lifecycle`
  accepts `action: "expire"` or `action: "delete"`;
- the route requires a self-hosted account session and admin role;
- `expire` is allowed only for `approved` documents and transitions them to
  `expired`;
- `delete` is allowed for `review`, `on_request` and `expired` documents;
- direct delete of `approved` documents returns `approved_document_immutable`;
- the API applies Phase 4L `admin/expire` or `admin/delete` policy before
  mutation;
- responses are sanitized through existing supplier document management update
  and delete schemas;
- PostgreSQL writes the lifecycle mutation and
  `supplier_document.expire` / `supplier_document.delete` audit metadata in
  bounded CTEs;
- the smoke marker `supplier_document_admin_lifecycle_cleanup=ok` verifies the
  create -> approve -> expire -> delete cleanup path.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Реализовать admin lifecycle cleanup, без UI, scheduler и file replacement. | Реализован lifecycle endpoint с `expire`/`delete`. | Phase 4Q: listing/export management events или scheduler decision. |
| Access | Пускать только self-hosted admin. | Missing session -> 401; non-admin -> `admin_role_required`. | Owner bypass не расширять. |
| Status transitions | `expire` только для `approved`; `delete` не должен удалять `approved`. | `approved -> expired`; `review`/`on_request`/`expired` можно delete; approved delete -> `approved_document_immutable`. | Replacement/re-review flow отдельно. |
| Response boundary | Не раскрывать backend file identifiers. | Responses sanitized, без `fileAssetId`, storage keys, `downloadPath` или direct URLs. | Сохранять для event listing/export. |
| Persistence | Mutation и audit должны быть atomic. | PostgreSQL CTE expire/delete + management audit insert. | Event listing может читать `yorso_supplier_document_management_events`. |
| Smoke | Проверить owner create -> admin approve -> expire -> delete. | `supplier_document_admin_lifecycle_cleanup=ok` в self-hosted account API smoke. | Добавить listing/export smoke в Phase 4Q, если выбран этот scope. |
| Guards | Зафиксировать docs, tests, self-hosted и 10k-user guards. | Runtime script, self-hosted guard, production-scale guard обновлены. | Держать в release path. |

## Next Implementation After Phase 4P

Recommended next scoped implementation:

Backend Phase 4Q - supplier document management event listing/export.

Concrete scope:

1. Add admin-only bounded listing endpoint over
   `yorso_supplier_document_management_events`.
2. Support filters by action, supplierId, actorUserId, documentId and bounded
   pagination.
3. Return sanitized management event metadata only, with no file asset,
   storage key, download path or direct URL fields.
4. Add optional JSON/CSV export if it fits the same bounded read path.
5. Add focused API/repository tests, smoke marker, docs and production-scale
   guard updates.

Alternative next scoped implementation:

Backend Phase 4Q - supplier document automated expiry scheduler decision,
only if the product priority is automatic cleanup instead of operator audit
visibility.

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
