# Backend Phase 4J - Supplier Document Grant Audit Listing

Status: implemented.

Phase 4J добавляет соседний admin-read над уже существующей таблицей
`yorso_supplier_document_download_grants`. Инкремент не добавляет owner/admin
upload, редактирование документов, export, scheduler или новую persistence.

Новый backend endpoint:

- `GET /v1/admin/supplier-documents/download-grants`

Назначение endpoint:

- дать оператору/admin возможность проверить, кому, когда и с каким результатом
  выдавались short-lived document grants;
- видеть denied/unavailable grant attempts рядом с successful grants;
- сохранить browser-facing admin response без `fileAssetId`, object keys,
  storage keys, direct storage URLs и `downloadPath`.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Закрыть adjacent audit gap после Phase 4I. | Добавлен bounded admin listing по `yorso_supplier_document_download_grants`. | Owner/admin upload остается отдельной supplier operations phase. |
| Добавить admin endpoint. | Реализован `GET /v1/admin/supplier-documents/download-grants` с `limit` max 100 и `offset` max 10 000. | Cursor pagination только если audit volume этого потребует. |
| Защитить endpoint admin role guard. | Без сессии endpoint возвращает 401, buyer session получает `admin_role_required`, admin session получает listing. | Более детальные admin roles/scopes можно выделить позже. |
| Сохранить backend-only file boundary. | Response включает audit metadata, `grantedAt`, `expiresAt`, `createdAt`; `fileAssetId` и `downloadPath` вырезаются на service layer. | File asset forensics остаются внутри repository/database boundary. |
| Использовать существующую audit table. | Listing читает `yorso_supplier_document_download_grants`; новых таблиц и миграций нет. | Retention/export отдельно, если появится operator requirement. |
| Добавить contract/test coverage. | Добавлены supplier-directory contract schemas, API route test и PostgreSQL repository test. | Frontend admin console не входит в Phase 4J. |

## API Contract

Request:

```http
GET /v1/admin/supplier-documents/download-grants?status=granted&supplierId=sup-no-001&limit=50&offset=0
```

Query parameters:

- `status`: optional, one of `granted`, `access_denied`,
  `document_not_found`, `document_unavailable`;
- `supplierId`: optional supplier directory id;
- `buyerUserId`: optional UUID;
- `limit`: integer 1-100, default 50;
- `offset`: integer 0-10 000, default 0.

Response:

```json
{
  "ok": true,
  "items": [
    {
      "id": "sdg_grant_1",
      "buyerUserId": "00000000-0000-4000-8000-000000000001",
      "supplierId": "sup-no-001",
      "documentId": "sup-no-001-health-certificate",
      "status": "granted",
      "reason": "granted",
      "requestId": "req-grant",
      "grantedAt": "2026-05-31T08:00:00.000Z",
      "expiresAt": "2026-05-31T08:15:00.000Z",
      "createdAt": "2026-05-31T08:00:00.000Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "requestId": "req_api"
}
```

Forbidden response fields:

- `fileAssetId`;
- object key;
- storage key;
- direct filesystem path;
- direct storage URL;
- `downloadPath`.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Admin listing is read-only.
- One request reads at most 100 rows.
- Filters are optional and bounded: `status`, `supplierId`, `buyerUserId`.
- No write is introduced; grant writes remain Phase 4F-owned.

Cache, queue and backpressure strategy:

- No queue, worker or scheduler is needed for admin listing.
- Responses are operator audit data and should use existing API auth, request
  timeout, lifecycle drain and JSON response limits.
- No shared cache should be used for operator audit data.
- The route fails closed on session validation, role validation and schema
  validation.

Database indexing and pagination strategy:

- Existing `0035_supplier_document_download_grants` indexes cover:
  - `(buyer_user_id, created_at desc, id asc)`;
  - `(supplier_id, created_at desc, id asc)`;
  - `(status, created_at desc, id asc)`;
  - `expires_at` for later cleanup/expiry reads.
- Query order is `created_at desc, id asc`.
- Pagination is `limit/offset`, hard bounded to `limit <= 100` and
  `offset <= 10 000`.
- No unbounded export is added in this phase.

Failure mode and graceful degradation:

- Missing/invalid account session returns 401.
- Non-admin authenticated users receive `admin_role_required`.
- Invalid query params return `validation_error`.
- Repository/database failure bubbles to existing API error telemetry.
- Empty audit result returns `ok: true` with `items: []`.

Observability and load-test plan:

- Route reads emit an audit event with action
  `admin.supplier_document_download_grants.read`.
- Release validation must include the API route test, PostgreSQL repository
  test, self-hosted API guard, production-scale guard, TypeScript, lint and
  build.
- Load tests should cover:
  - unfiltered listing at `limit=100`;
  - `status=granted`;
  - `status=access_denied`;
  - `supplierId=...`;
  - `buyerUserId=...`;
  - empty-result queries;
  - non-admin blocked reads.

## Validation

Completed focused validation:

- TDD RED:
  `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document grant audit without file asset leakage"` returned 404 before the route existed.
- TDD GREEN:
  the same focused test passes after route/service/repository implementation.
- Repository validation:
  `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.

Release validation must also include:

- `npm run contracts:build`;
- `npm run test:api`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run build`;
- `npm test`;
- `git diff --check`.

## Remaining Supplier Document Debt After Phase 4J

| Debt | Status после Phase 4J | Следующий scoped шаг |
|---|---|---|
| Buyer document metadata | Backend-owned and redacted for locked buyers. | Keep guarded. |
| Grant issuance | Implemented in Phase 4F. | Keep guarded. |
| File serving | Implemented in Phase 4G. | Add large-file/range support only if required. |
| Buyer UI download action | Implemented in Phase 4H. | Keep guarded. |
| Admin download audit listing | Implemented in Phase 4I. | Add frontend admin console only if operator workflow is prioritized. |
| Admin grant audit listing | Implemented in Phase 4J. | Add frontend admin console only if operator workflow is prioritized. |
| Owner/admin upload/editing | Not implemented. | Later supplier operations/admin phase. |

Marker: Backend Phase 4J.
Marker: Supplier Document Grant Audit Listing.
Marker: /v1/admin/supplier-documents/download-grants.
Marker: supplierDocumentDownloadGrantAdminListResponseSchema.
Marker: admin.supplier_document_download_grants.read.
Marker: yorso_supplier_document_download_grants.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
