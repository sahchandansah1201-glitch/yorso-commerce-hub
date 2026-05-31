# Backend Phase 4D - Supplier Profile Legal/Compliance Details Source Boundary

Status: implemented.

Phase 4D moves supplier profile legal/compliance details from frontend/local
hash-based generation into the self-hosted supplier directory contract.
`/suppliers/:supplierId` now renders `legalDetails` from the API-shaped supplier
record for `qualified_unlocked` buyers only. Locked buyers receive `null` for
legal details and continue to see the existing locked legal placeholder.

No frontend hash-based legal/compliance synthesis remains in
`src/pages/SupplierProfile.tsx`.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Закрепить legal/compliance details в typed backend contract. | `packages/contracts/src/supplier-directory.ts` добавляет `supplierLegalDetailsSchema` и `legalDetails`. | Later owner/admin editing должен валидировать legal/compliance details на backend, не на странице профиля. |
| Прокинуть legal details через memory и PostgreSQL repositories. | `MemorySupplierRepository` содержит явные demo legal values; `PostgresSupplierRepository` читает `legal_details`. | Seed/import pipeline должен получать проверенные legal details от supplier operations. |
| Убрать вычисление legal details из профиля. | `SupplierProfile.tsx` читает `supplier?.legalDetails`; прямой вызов frontend helper удалён. | Следующий supplier scope: owner/admin editing or document payload boundary. |
| Сохранить API-disabled preview без смешения с production truth. | `src/lib/supplier-legal.ts` содержит explicit `localPreviewSupplierLegalDetails`; она используется только для local/API-disabled preview adapters. | Demo-mode retirement отдельным решением. |
| Сохранить restricted access boundary. | `shapeSupplierForAccess` отдаёт `legalDetails: null` для `anonymous_locked` и `registered_locked`; UI рендерит legal block только при `qualified_unlocked` и наличии `legalDetails`. | Future document downloads must use a separate qualified-only payload/API. |
| Добавить persistence и guards. | Миграция `0033_supplier_profile_legal_details.sql` добавляет nullable JSONB object column, constraint и restricted-access comment; self-hosted checks guard migration/docs. | Add stricter PostgreSQL JSON shape validation later if needed. |

## Access Decision

`legalDetails` are restricted supplier compliance facts. They are not safe for
locked buyer views because registration numbers, VAT/EORI identifiers, legal
form and founded date can help reconstruct or verify the exact legal entity.

Phase 4D keeps locked views from receiving/rendering:

- registration label and number;
- VAT number;
- EORI number;
- legal form;
- founded date;
- any direct contact channel, exact price or restricted supplier document.

## Runtime Contract

Configured deployment:

- Supplier detail read: `GET /v1/suppliers/:supplierId`.
- API response includes `legalDetails` only when resolved access is
  `qualified_unlocked`.
- For `anonymous_locked` and `registered_locked`, the backend-shaped supplier
  item contains `legalDetails: null`.
- Frontend renders the legal/compliance block only from API-owned
  `supplier.legalDetails`.
- On configured API failure, Phase 4A fail-closed behavior remains in force.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Local preview legal details are derived by explicit helper
  `localPreviewSupplierLegalDetails`.
- This mode is non-production and exists for local/Lovable preview only.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new public route, polling loop or write path is introduced.
- Profile reads remain one `GET /v1/suppliers/:supplierId` request per detail
  page.
- `legalDetails` is a bounded object included only in qualified supplier detail
  payloads.
- Writes are not introduced in this phase; future writes belong to supplier
  owner/admin operations.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure and supplier-detail caching strategy remain
  the scaling boundary.
- Contract caps all legal detail strings and requires an ISO date shape.

Database indexing and pagination strategy:

- List pagination remains covered by `0005_supplier_directory_search_scaling`
  and `0009_supplier_directory_pagination_sort`.
- Migration `0033_supplier_profile_legal_details.sql` adds nullable JSONB object
  storage to the existing supplier row and does not introduce new list filters
  or indexes.
- Profile detail lookup continues to use supplier id lookup and publication
  status guard already used by `PostgresSupplierRepository`.

Failure mode and graceful degradation:

- Configured API failures stay fail-closed with no local profile substitution.
- Legacy rows can keep `legal_details = null` until backfilled; the frontend
  does not generate production legal identifiers.
- Locked buyer responses stay null even if the source record has legal details.
- API-disabled preview remains local and explicitly separate.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  to verify the restricted field does not change list/pagination behavior.
- Future owner/admin writes should add audit events and update metrics before
  being treated as production-ready.

## Remaining Supplier Profile Debt After Phase 4D

| Debt | Status после Phase 4D | Следующий scoped шаг |
|---|---|---|
| Production/logistics dossier facts | Backend-owned contract/API/DB fields implemented in Phase 4B. | Keep guarded; backfill real supplier facts through backend operations later. |
| Shipment evidence and FAQ | Backend-owned contract/API/DB fields implemented in Phase 4C. | Keep guarded; add owner/admin editing later. |
| Legal/compliance details | Backend-owned restricted contract/API/DB field implemented. | Add owner/admin editing and stricter JSON validation later. |
| Restricted documents/downloads | Not implemented. | Separate qualified-only document payload/API boundary. |
| Supplier owner/admin editing | Not implemented. | Later supplier operations/admin phase with audit and validation. |
| API-disabled mock preview | Still present for local/Lovable preview only. | Separate demo-mode retirement decision. |

## Validation

Completed validation:

- TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
  failed because `SupplierProfile` ignored backend-owned legal details.
- `npm run contracts:build`.
- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`.
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

Marker: Backend Phase 4D.
Marker: Supplier Profile Legal/Compliance Details Source Boundary.
Marker: legalDetails.
Marker: legal_details.
Marker: 0033_supplier_profile_legal_details.
Marker: qualified_unlocked.
Marker: not safe for locked buyer views.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
