# Backend Phase 4E - Supplier Profile Restricted Document Payload Boundary

Status: implemented.

Phase 4E moves supplier profile document metadata from static frontend copy into
the self-hosted supplier directory contract. `/suppliers/:supplierId` now
renders `supplierDocuments` from the API-shaped supplier record for
`qualified_unlocked` buyers only. Locked buyers receive `supplierDocuments:
null` and keep a locked document placeholder.

This phase intentionally does not add a download endpoint. It only establishes
the restricted document metadata boundary: title, type, status, dates, file
name and internal file asset id.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Закрепить document payload metadata в typed backend contract. | `packages/contracts/src/supplier-directory.ts` добавляет `supplierDocumentPayloadSchema` и `supplierDocuments`. | Download grant endpoint должен быть отдельным qualified-only контрактом. |
| Прокинуть document payload через memory и PostgreSQL repositories. | `MemorySupplierRepository` содержит явные demo document metadata; `PostgresSupplierRepository` читает `supplier_documents`. | Seed/import pipeline должен получать проверенные документы от supplier operations. |
| Убрать статический frontend-only список документов из production profile. | `SupplierProfile.tsx` рендерит `supplier.supplierDocuments`; locked state показывает placeholder без file names. | Owner/admin editing и upload validation остаются отдельным scope. |
| Сохранить API-disabled preview без смешения с production truth. | `src/lib/supplier-documents.ts` содержит explicit `localPreviewSupplierDocuments`; helper используется только в local/API-disabled preview adapters. | Demo-mode retirement отдельным решением. |
| Сохранить restricted access boundary. | `shapeSupplierForAccess` отдаёт `supplierDocuments: null` для `anonymous_locked` и `registered_locked`; qualified получает bounded array. | Future file downloads must require supplier access grant and audit. |
| Добавить persistence и guards. | Миграция `0034_supplier_profile_restricted_documents.sql` добавляет JSONB array column, constraint и restricted-access comment; self-hosted checks guard migration/docs. | Stricter PostgreSQL JSON shape validation can be added later if needed. |

## Access Decision

`supplierDocuments` are restricted supplier document metadata. They are not safe
for locked buyer views because file names, document titles and internal asset ids
can reveal the exact supplier, batch workflow, certification scope or prepared
trade documents.

Phase 4E keeps locked views from receiving/rendering:

- document titles;
- document type;
- approval/review status;
- issue and expiry dates;
- file names;
- internal file asset ids;
- any document URL or download path.

## Runtime Contract

Configured deployment:

- Supplier detail read: `GET /v1/suppliers/:supplierId`.
- API response includes `supplierDocuments` only when resolved access is
  `qualified_unlocked`.
- For `anonymous_locked` and `registered_locked`, the backend-shaped supplier
  item contains `supplierDocuments: null`.
- Frontend renders the per-batch document block only from API-owned
  `supplier.supplierDocuments`.
- No direct document download endpoint is introduced in this phase.
- On configured API failure, Phase 4A fail-closed behavior remains in force.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Local preview document metadata is derived by explicit helper
  `localPreviewSupplierDocuments`.
- This mode is non-production and exists for local/Lovable preview only.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new public route, polling loop, scheduler or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page.
- `supplierDocuments` is a bounded array capped by contract and included only
  in qualified supplier detail payloads.
- Writes are not introduced in this phase; future writes belong to supplier
  owner/admin operations with audit.

Cache, queue and backpressure strategy:

- No queue or worker is added.
- Existing HTTP/API backpressure remains the scaling boundary for supplier
  detail reads.
- The contract caps array length and string sizes to prevent unbounded profile
  payload growth.

Database indexing and pagination strategy:

- List pagination remains covered by `0005_supplier_directory_search_scaling`
  and `0009_supplier_directory_pagination_sort`.
- Migration `0034_supplier_profile_restricted_documents.sql` adds bounded JSONB
  array storage to the existing supplier row and does not introduce new list
  filters, sorts or indexes.
- Profile detail lookup continues to use supplier id lookup and publication
  status guard already used by `PostgresSupplierRepository`.

Failure mode and graceful degradation:

- Configured API failures stay fail-closed with no local profile substitution.
- Legacy rows can keep `supplier_documents = []` until backfilled.
- Locked buyer responses stay null even if the source record has document
  metadata.
- API-disabled preview remains local and explicitly separate.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  to verify restricted document shaping under concurrency.
- Future document download grants must add audit events, failure metrics and
  abuse/backpressure controls before being treated as production-ready.

## Remaining Supplier Profile Debt After Phase 4E

| Debt | Status после Phase 4E | Следующий scoped шаг |
|---|---|---|
| Production/logistics dossier facts | Backend-owned contract/API/DB fields implemented in Phase 4B. | Keep guarded; backfill real supplier facts through backend operations later. |
| Shipment evidence and FAQ | Backend-owned contract/API/DB fields implemented in Phase 4C. | Keep guarded; add owner/admin editing later. |
| Legal/compliance details | Backend-owned restricted contract/API/DB field implemented in Phase 4D. | Add owner/admin editing and stricter JSON validation later. |
| Restricted document metadata | Backend-owned restricted contract/API/DB field implemented in Phase 4E. | Add qualified-only document download grant endpoint later. |
| Supplier owner/admin editing | Not implemented. | Later supplier operations/admin phase with audit and validation. |
| API-disabled mock preview | Still present for local/Lovable preview only. | Separate demo-mode retirement decision. |

## Validation

Completed validation:

- TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
  failed because `SupplierProfile` ignored backend-owned `supplierDocuments`.
- `npm run contracts:build`.
- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`.

Release validation also covers:

- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`.
- `npm run test:db-migrations`.
- `npm run test:db-contract`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.
- `npx tsc -b --noEmit`.
- `npm test`.
- `npm run lint`.
- `npm run api:build`.
- `npm run build`.
- `npm run test:api`.
- `npm run test:supplier-directory-frontend`.
- `npm run test:backend-contract`.
- `npm run check:self-hosted-db`.
- `git diff --check`.

Marker: Backend Phase 4E.
Marker: Supplier Profile Restricted Document Payload Boundary.
Marker: supplierDocuments.
Marker: supplier_documents.
Marker: 0034_supplier_profile_restricted_documents.
Marker: qualified_unlocked.
Marker: locked buyer responses must contain null.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
