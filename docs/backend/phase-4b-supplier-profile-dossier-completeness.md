# Backend Phase 4B - Supplier Profile Backend-Owned Dossier Completeness

Status: implemented.

Phase 4B moves the supplier profile production and logistics dossier from
frontend hash-based synthesis into the self-hosted supplier directory contract.
`/suppliers/:supplierId` now renders `productionFacts` and `logisticsFacts`
from the API-shaped supplier record. API-disabled local preview keeps explicit
local preview helpers, but configured deployments use the backend-owned facts.

No frontend hash-based production/logistics synthesis remains in
`src/pages/SupplierProfile.tsx`.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Закрепить production/logistics dossier в typed backend contract. | `packages/contracts/src/supplier-directory.ts` добавляет `supplierProductionFactsSchema`, `supplierLogisticsFactsSchema`, `productionFacts` и `logisticsFacts` в `supplierDirectoryRecordSchema`. | Later supplier owner/admin editing должен писать эти поля через backend validation, не через frontend helpers. |
| Прокинуть факты через memory и PostgreSQL supplier repositories. | `MemorySupplierRepository` содержит явные значения для demo records; `PostgresSupplierRepository` читает `production_facts` и `logistics_facts` из `yorso_suppliers_directory`. | Seed/import pipeline должен получать реальные verified facts от supplier operations. |
| Убрать вычисление supplier dossier из страницы профиля. | `SupplierProfile.tsx` читает `supplier?.productionFacts` и `supplier?.logisticsFacts`; `buildProductionFacts`, `buildLogisticsFacts` и page-level `hashSeed` удалены. | Остальные rich dossier sections надо отдельно проверить на frontend-only content derivation. |
| Сохранить API-disabled preview без смешения с production truth. | `src/lib/supplier-dossier-facts.ts` содержит explicit `localPreviewSupplierProductionFacts` / `localPreviewSupplierLogisticsFacts`; они используются только для mock/local preview adapters. | Можно удалить local preview отдельным demo-mode retirement batch. |
| Добавить persistence и guards. | Миграция `0031_supplier_profile_dossier_facts.sql` добавляет JSONB columns, object/array constraints и comments; self-hosted checks guard contracts, API adapters, profile page and docs. | Add numeric JSON shape constraints later if PostgreSQL-side strict validation becomes required. |

## Access Decision

`productionFacts` and `logisticsFacts` are published supplier capability facts.
They are safe for locked buyer views because they do not reveal private contact
details, company identity beyond the existing masked profile, exact offer price,
or restricted supplier documents.

Phase 4B does not unlock:

- `companyName`;
- website, phone, WhatsApp or direct contacts;
- exact prices;
- `totalProductsCount` and private product counts;
- restricted documents or supplier operations notes.

## Runtime Contract

Configured deployment:

- Supplier detail read: `GET /v1/suppliers/:supplierId`.
- API response includes `productionFacts` and `logisticsFacts`.
- Frontend renders the profile production passport and logistics sections from
  those API-owned fields.
- On configured API failure, Phase 4A fail-closed behavior remains in force.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Local preview facts are derived by explicit helpers in
  `src/lib/supplier-dossier-facts.ts`.
- This mode is non-production and exists for local/Lovable preview only.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new frontend route or polling path is introduced.
- Hot reads remain `GET /v1/suppliers` and `GET /v1/suppliers/:supplierId`.
- `productionFacts` and `logisticsFacts` are read with the supplier directory
  record, so profile reads stay one API request per visible detail page.
- Writes are not introduced in this phase; future writes belong to supplier
  owner/admin operations.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure and supplier-detail caching strategy remain
  the scaling boundary.
- Facts are stored as bounded JSONB objects; the contract caps arrays and string
  lengths to avoid unbounded profile payload growth.

Database indexing and pagination strategy:

- List pagination remains covered by `0005_supplier_directory_search_scaling`
  and `0009_supplier_directory_pagination_sort`.
- Migration `0031_supplier_profile_dossier_facts.sql` adds JSONB columns to the
  existing supplier row and does not introduce new list filters or indexes.
- Profile detail lookup continues to use the supplier id lookup and publication
  status guard already used by `PostgresSupplierRepository`.

Failure mode and graceful degradation:

- Configured API failures stay fail-closed with no local profile substitution.
- Missing legacy rows get conservative backend defaults (`0`/`TBC`) until data
  backfill is complete, avoiding frontend-generated false precision.
- API-disabled preview remains local and explicitly separate.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include supplier profile detail reads with the larger
  supplier payload under locked and qualified access states.
- Future owner/admin writes should add audit events and update metrics before
  being treated as production-ready.

## Remaining Supplier Profile Debt After Phase 4B

| Debt | Status после Phase 4B | Следующий scoped шаг |
|---|---|---|
| Production/logistics dossier facts | Backend-owned contract/API/DB fields implemented. | Keep guarded; backfill real supplier facts through backend operations later. |
| Legal/compliance details, shipment evidence, FAQ source | Still partially UI/content-driven depending on profile sections. | Phase 4C candidate: backend-owned supplier profile evidence blocks. |
| Supplier owner/admin editing | Not implemented. | Later supplier operations/admin phase with audit and validation. |
| API-disabled mock preview | Still present for local/Lovable preview only. | Separate demo-mode retirement decision. |

## Validation

Completed focused validation before full release validation:

- `npx vitest run src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run contracts:build`

Marker: Backend Phase 4B.
Marker: Supplier Profile Backend-Owned Dossier Completeness.
Marker: productionFacts.
Marker: logisticsFacts.
Marker: No frontend hash-based production/logistics synthesis remains.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
