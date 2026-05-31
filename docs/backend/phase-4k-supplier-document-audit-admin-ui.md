# Backend Phase 4K - Supplier Document Audit Admin UI

Status: implemented.

Phase 4K добавляет read-only admin UI над уже реализованными Phase 4I/4J
audit listings. Инкремент не добавляет owner upload/editing, document export,
новые backend endpoints, новые таблицы, scheduler или файловые операции.

Новый frontend route:

- `/admin/supplier-document-audit`

Используемые backend endpoints:

- `GET /v1/admin/supplier-documents/download-grants`
- `GET /v1/admin/supplier-documents/download-events`

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Дать оператору одну read-only точку для supplier document audit. | Добавлена страница `/admin/supplier-document-audit` с переключателем `Grant attempts` / `Download events`. | Owner/admin document management остается отдельной supplier operations phase. |
| Не добавлять новый backend scope. | UI использует существующие bounded endpoints Phase 4I/4J. | Cursor pagination/export только после отдельного operator requirement. |
| Сохранить admin role guard. | Клиент требует self-hosted session headers; 401 показывает sign-in gate, 403 показывает admin role guard. | Более детальные admin subroles можно выделить позже. |
| Сохранить storage boundary в браузере. | Client отклоняет ответы с `fileAssetId`, `downloadPath`, `objectKey`, `storage`; страница выводит только audit metadata. | File asset forensics остаются внутри backend/repository boundary. |
| Добавить проверяемый frontend contract. | Добавлены API client, hook, page tests и API-backed Playwright smoke. | Visual densification можно делать отдельно, если operator usage покажет перегрузку. |
| Сохранить route code splitting. | Page подключена через `React.lazy`; `RouteChunkErrorBoundary` остается вокруг routes. | Manual vendor chunks не добавлялись. |

## Frontend Contract

Route:

```text
/admin/supplier-document-audit
```

UI filters:

- audit list kind: `download_grants` or `download_events`;
- status: bounded enum per selected list;
- `supplierId`;
- `buyerUserId`;
- fixed `limit=25`, `offset=0` in this first UI pass.

Rendered fields:

- audit id;
- status;
- supplier id;
- document id;
- buyer user id;
- grant id when available;
- reason;
- request id;
- created/granted/expires timestamps when available.

Forbidden browser-visible fields:

- `fileAssetId`;
- object key;
- storage key;
- direct filesystem path;
- direct storage URL;
- `downloadPath`.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Frontend is read-only.
- One page load issues one bounded admin read against either grants or events.
- Filter changes issue another bounded read with `limit=25`.
- No writes, exports, file reads, background timers, polling or new backend load
  are introduced.

Cache, queue and backpressure strategy:

- No shared frontend cache is used for operator audit data.
- No queue/scheduler is needed.
- Backend route-level auth, request timeout, lifecycle drain and JSON response
  limits remain the backpressure boundary.
- UI fails closed on API disabled, missing session and admin-role rejection.

Database indexing and pagination strategy:

- UI uses the Phase 4I/4J bounded endpoint contracts.
- Existing indexes cover recent reads by `status`, `supplierId` and
  `buyerUserId`.
- UI currently sends `limit=25`, `offset=0`, below the backend maximum
  `limit <= 100` and `offset <= 10 000`.
- Cursor pagination is deferred until audit volume requires it.

Failure mode and graceful degradation:

- Empty response renders an explicit empty state.
- Missing configured API renders a self-hosted API disabled state.
- Missing account session renders a sign-in gate.
- Non-admin session renders an admin role guard.
- Invalid or storage-leaking payload is rejected by the frontend client and
  shown as an error state.

Observability and load-test plan:

- Backend reads still emit:
  - `admin.supplier_document_download_grants.read`;
  - `admin.supplier_document_download_events.read`.
- Browser smoke verifies session headers, route rendering and storage-field
  redaction.
- Load tests should reuse Phase 4I/4J backend cases and add a browser flow for:
  grant listing load, event listing load, status filter, supplier filter,
  buyer filter, empty result, forbidden session and API disabled state.

## Validation

Completed focused validation:

- TDD RED:
  `npm test -- src/lib/admin-supplier-document-audit-api.test.ts src/lib/use-admin-supplier-document-audit.test.tsx src/pages/admin/AdminSupplierDocumentAudit.test.tsx`
  failed because the client, hook and page did not exist.
- TDD GREEN:
  `npm test -- src/lib/admin-supplier-document-audit-api.test.ts src/lib/use-admin-supplier-document-audit.test.tsx src/pages/admin/AdminSupplierDocumentAudit.test.tsx src/test/app-route-code-splitting.test.ts`.

Release validation must include:

- `npm run test:admin-supplier-document-audit-frontend`;
- `npm run smoke:e2e:admin-supplier-document-audit:run`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- TypeScript, lint, build and full test suite.

Marker: Backend Phase 4K Supplier Document Audit Admin UI.
Marker: /admin/supplier-document-audit.
Marker: createAdminSupplierDocumentAuditApiClient.
Marker: useAdminSupplierDocumentAudit.
Marker: admin-document-audit-page.
Marker: admin-supplier-document-audit.spec.ts.
Marker: /v1/admin/supplier-documents/download-events.
Marker: /v1/admin/supplier-documents/download-grants.
Marker: fileAssetId.
Marker: downloadPath.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
