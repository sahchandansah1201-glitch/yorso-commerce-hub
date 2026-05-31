# Next Actions

## Current Next Action

Backend Phase 4M is implemented and committed locally at `a6765b4f`.

Phase 4M closes the first supplier document management write path:

- `POST /v1/suppliers/:supplierId/documents` creates a `review` document for
  an authenticated supplier owner;
- the file input is an existing self-hosted account file asset for the same
  company, not browser-supplied object storage metadata;
- the API applies Phase 4L owner/create policy and rejects duplicate file reuse,
  file-name mismatch, wrong company, wrong account role and missing sessions;
- the browser response is sanitized through
  `supplierDocumentManagementCreateResponseSchema`;
- PostgreSQL appends the supplier document and inserts
  `supplier_document.create` audit metadata in one bounded CTE;
- migration `0037_supplier_document_management_events` owns durable management
  audit records.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Реализовать один первый write path, без admin approve/reject и без frontend UI. | Реализован supplier owner create review document. | Phase 4N: admin approve/reject review flow. |
| Access | Пускать только self-hosted supplier owner. | Требуются session, account role `supplier`/`both`, company ownership. | Admin route отдельно, с admin session. |
| File boundary | Не принимать storage internals из браузера. | Принимается только `fileUploadId`; asset проверяется по owner user/company. | Upload UX может использовать этот backend-owned file id. |
| Response boundary | Не раскрывать backend file identifiers. | Response schema отдает sanitized document + audit, без `fileAssetId`/storage fields. | Сохранять такой контракт для update/approve. |
| Persistence | Запись документа и audit должны быть atomic. | PostgreSQL CTE append+audit; migration `0037` для audit table. | Admin approve/reject должен писать в ту же audit table. |
| Smoke | Проверить реальный account file -> supplier document create. | `supplier_document_owner_create_review=ok` в self-hosted account API smoke. | Добавить admin approve/reject smoke в Phase 4N. |
| Guards | Зафиксировать docs, tests, self-hosted и 10k-user guards. | Runtime script, DB tests, self-hosted guard, production-scale guard обновлены. | Держать в release path. |

## Next Implementation After Phase 4L

Recommended next scoped implementation:

Backend Phase 4N - admin approve/reject supplier document review flow.

Concrete scope:

1. Add admin-only mutation route for review document decisions.
2. Approve `review -> approved` and reject `review -> on_request` using the
   Phase 4L policy matrix.
3. Write `supplier_document.approve` / `supplier_document.reject` audit records
   into `yorso_supplier_document_management_events`.
4. Return sanitized document metadata only; no storage identifiers.
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
