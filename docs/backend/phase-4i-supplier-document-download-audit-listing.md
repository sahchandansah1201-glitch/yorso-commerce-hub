# Backend Phase 4I - Supplier Document Download Audit Listing

Status: implemented.

Phase 4I выбирает самый узкий следующий шаг после Phase 4H: bounded
admin-read над уже существующим `yorso_supplier_document_download_events`.
Owner upload/editing документов поставщика не реализуется в этом инкременте.

Новый backend endpoint:

- `GET /v1/admin/supplier-documents/download-events`

Назначение endpoint:

- дать оператору/admin возможность проверить, кто, когда и с каким результатом
  пытался скачать restricted supplier document;
- сохранить buyer-facing download flow grant-bound и storage-id-free;
- не раскрывать в admin API browser-facing ответе `fileAssetId`, object keys,
  storage keys, direct storage URLs или `downloadPath`.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Выбрать следующий supplier-document scope. | Выбран admin download-audit listing, потому что таблица событий уже существует после Phase 4G, а Phase 4H зафиксировал этот долг явно. | Owner/admin upload/editing остается отдельной supplier operations phase. |
| Добавить bounded admin endpoint. | Добавлен `GET /v1/admin/supplier-documents/download-events` с `limit` max 100 и `offset` max 10 000. | Cursor pagination можно добавить позже, если audit volume покажет, что offset больше не подходит. |
| Защитить endpoint admin role guard. | Без сессии endpoint возвращает 401, buyer session получает `admin_role_required`, admin session получает listing. | Более детальные admin roles/scopes можно выделить позже, когда появятся operator subroles. |
| Сохранить backend-only storage boundary. | Response включает `id`, `buyerUserId`, `supplierId`, `documentId`, `grantId`, `status`, `reason`, `requestId`, `createdAt`; `fileAssetId` вырезается на service layer. | File asset forensics остаются внутри repository/database boundary. |
| Использовать существующую audit table. | Listing читает `yorso_supplier_document_download_events`; новых таблиц и миграций нет. | Grant audit listing может быть добавлен отдельно, если operator workflow потребует видеть grant attempts рядом с download events. |
| Добавить contract/test coverage. | Добавлены supplier-directory contract schemas, API route test и Postgres repository test. | Frontend admin console для этой страницы не входит в Phase 4I. |

## API Contract

Request:

```http
GET /v1/admin/supplier-documents/download-events?status=downloaded&supplierId=sup-no-001&limit=50&offset=0
```

Query parameters:

- `status`: optional, one of `downloaded`, `grant_not_found`, `grant_denied`,
  `grant_expired`, `access_denied`, `document_unavailable`,
  `file_unavailable`;
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
      "id": "sdde_event_1",
      "buyerUserId": "00000000-0000-4000-8000-000000000001",
      "supplierId": "sup-no-001",
      "documentId": "sup-no-001-health-certificate",
      "grantId": "sdg_grant_1",
      "status": "downloaded",
      "reason": "downloaded",
      "requestId": "req-download",
      "createdAt": "2026-05-31T08:01:00.000Z"
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
- No write is introduced; download/grant audit writes remain Phase 4F/4G-owned.

Cache, queue and backpressure strategy:

- No queue or scheduler is needed for admin listing.
- Responses are operator data and should be served with existing API auth,
  request timeout, lifecycle drain and JSON response limits.
- No shared cache should be used for operator audit data.
- The route fails closed on session validation, role validation and schema
  validation.

Database indexing and pagination strategy:

- Existing `0036_supplier_document_download_events` indexes cover:
  - `(buyer_user_id, created_at desc, id asc)`;
  - `(supplier_id, created_at desc, id asc)`;
  - `(status, created_at desc, id asc)`;
  - `(grant_id, created_at desc, id asc)` for future grant-focused reads.
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
  `admin.supplier_document_download_events.read`.
- Release validation must include the API route test, Postgres repository test,
  self-hosted API guard, production-scale guard, TypeScript, lint and build.
- Load tests should cover:
  - unfiltered listing at `limit=100`;
  - `status=downloaded`;
  - `supplierId=...`;
  - `buyerUserId=...`;
  - empty-result queries;
  - non-admin blocked reads.

## Validation

Completed focused validation:

- TDD RED:
  `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "serves admin supplier document download audit without file asset leakage"` returned 404 before the route existed.
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

## Remaining Supplier Document Debt After Phase 4I

| Debt | Status после Phase 4I | Следующий scoped шаг |
|---|---|---|
| Buyer document metadata | Backend-owned and redacted for locked buyers. | Keep guarded. |
| Grant issuance | Implemented in Phase 4F. | Keep guarded. |
| File serving | Implemented in Phase 4G. | Add large-file/range support only if required. |
| Buyer UI download action | Implemented in Phase 4H. | Keep guarded. |
| Admin download audit listing | Implemented in Phase 4I. | Add frontend admin console only if operator workflow is prioritized. |
| Admin grant audit listing | Not implemented. | Possible adjacent admin route. |
| Owner/admin upload/editing | Not implemented. | Later supplier operations/admin phase. |

Marker: Backend Phase 4I.
Marker: Supplier Document Download Audit Listing.
Marker: /v1/admin/supplier-documents/download-events.
Marker: supplierDocumentDownloadEventAdminListResponseSchema.
Marker: admin.supplier_document_download_events.read.
Marker: yorso_supplier_document_download_events.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
