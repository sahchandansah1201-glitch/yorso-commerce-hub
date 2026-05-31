# Next Actions

## Current Next Action

Backend Phase 4Q is implemented and committed locally at `b2473ede`.

Phase 4Q closes the backend audit visibility path for supplier document
management events:

- `GET /v1/admin/supplier-documents/management-events`
  returns a bounded admin-only list of supplier document management events;
- `GET /v1/admin/supplier-documents/management-events/export`
  exports the same bounded event set as JSON or CSV;
- both routes require a self-hosted account session and admin role;
- filters cover `action`, `supplierId`, `documentId`, `actorUserId`, `limit`
  and `offset`;
- listing and exports are sanitized and do not expose `fileAssetId`, object
  keys, storage keys, `downloadPath` or direct storage URLs;
- route-level audit actions are
  `admin.supplier_document_management_events.read` and
  `admin.supplier_document_management_events.export`;
- the smoke marker `supplier_document_management_events_export=ok` verifies
  listing plus JSON/CSV export.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Дать admin-only audit visibility по management events без UI и без новой миграции. | Реализованы list/export routes поверх существующей `yorso_supplier_document_management_events`. | Phase 4R: admin UI поверх этих endpoints или scheduler expiry decision. |
| Access | Пускать только self-hosted admin. | Missing session -> 401; non-admin -> `admin_role_required`. | Сохранять owner/admin разделение. |
| Filters | Дать bounded фильтры по action/supplier/document/actor. | Поддержаны `action`, `supplierId`, `documentId`, `actorUserId`, `limit`, `offset`; export добавляет `format`. | UI сможет переиспользовать тот же контракт. |
| Export | Нужен operator handoff без storage leakage. | JSON и CSV export используют тот же sanitized event shape. | Добавить frontend download controls в Phase 4R, если выбран UI scope. |
| Response boundary | Не раскрывать backend file identifiers. | Нет `fileAssetId`, storage keys, `downloadPath` или direct URLs в list/export. | Держать этот guard во всех admin audit clients. |
| Persistence | Не создавать новую таблицу, читать существующий audit ledger. | PostgreSQL читает `yorso_supplier_document_management_events` с bounded where/order. | При росте объема добавить cursor pagination только отдельным scope. |
| Smoke/guards | Закрепить docs, tests, runtime smoke и 10k-user review. | Runtime script, self-hosted guard, production-scale guard и release checks зелёные. | Поддерживать в release path. |

## Next Implementation After Phase 4Q

Recommended next scoped implementation:

Backend Phase 4R - admin UI over supplier document management events.

Concrete scope:

1. Add a read-only admin page, likely
   `/admin/supplier-document-management-events`, using the Phase 4Q list/export
   endpoints.
2. Show action, actor role/user, supplier, document, status transition, reason
   and request id without backend storage identifiers.
3. Add filters for action, supplier id, document id and actor user id, using
   bounded pagination.
4. Add JSON/CSV export controls that call the Phase 4Q export endpoint.
5. Add frontend API client/hook tests, page tests, e2e smoke, route/nav wiring,
   docs and production-scale guards.

Alternative next scoped implementation:

Backend Phase 4R - automated approved-document expiry scheduler decision,
only if product priority shifts from operator audit visibility to automatic
document lifecycle cleanup.

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
