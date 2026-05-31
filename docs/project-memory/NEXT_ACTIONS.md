# Next Actions

## Current Next Action

Backend Phase 4K is implemented and committed locally at `3b74b498`.

Phase 4K closes the admin/operator UI over supplier document audit listings:

- `/admin/supplier-document-audit` is a read-only admin route.
- It switches between existing endpoints:
  `GET /v1/admin/supplier-documents/download-grants` and
  `GET /v1/admin/supplier-documents/download-events`.
- The frontend client requires `VITE_YORSO_API_URL` and self-hosted session
  headers.
- Missing sessions render a sign-in gate; buyer/non-admin sessions render
  `admin_role_required`.
- Browser-facing responses are rejected if they contain `fileAssetId`,
  `downloadPath`, `objectKey` or `storage`.
- UI renders audit metadata only: audit id, status, supplier id, document id,
  buyer user id, grant id where available, reason, request id and timestamps.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scope | Закрыть admin UI над audit listings Phase 4I/4J. | Реализован `/admin/supplier-document-audit`. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin UI | Дать оператору одну read-only точку для grants/downloads. | Есть kind switch, filters и sanitized rows. | Deep pagination/export только после отдельного operator requirement. |
| API client | Использовать self-hosted API и session headers. | Реализован `createAdminSupplierDocumentAuditApiClient`; 401/403 маппятся в явные UI states. | Возможные admin-subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers в браузере. | Client отвергает `fileAssetId`, `downloadPath`, `objectKey`, `storage`; UI не выводит эти поля. | Держать admin responses без storage identifiers. |
| Tests/smoke | Зафиксировать page/client/hook и browser smoke. | Реализованы unit tests и `e2e/admin-supplier-document-audit.spec.ts`. | Держать в release path. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4K doc, contract map, validation doc, production baseline, guard markers. | Держать в release path. |

## Next Implementation After Phase 4K

Recommended next scoped decision:

Supplier owner/admin document management decision:

- define ownership model for company/supplier documents;
- define upload/edit/delete validation;
- define document lifecycle and audit events;
- keep buyer profile downloads grant-bound and storage-id-free;
- do not implement upload/edit/delete until those rules are explicit.

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
