# Backend Phase 4C - Supplier Profile Backend-Owned Evidence Blocks

Status: implemented.

Phase 4C moves supplier profile shipment evidence and FAQ blocks from frontend
hash-based synthesis into the self-hosted supplier directory contract.
`/suppliers/:supplierId` now renders `shipmentCases` and `faqItems` from the
API-shaped supplier record. API-disabled local preview keeps explicit local
preview helpers, but configured deployments use backend-owned evidence blocks.

No frontend hash-based shipment/FAQ synthesis remains in
`src/pages/SupplierProfile.tsx`.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Закрепить shipment evidence и FAQ в typed backend contract. | `packages/contracts/src/supplier-directory.ts` добавляет `supplierShipmentCaseSchema`, `supplierFaqItemSchema`, `shipmentCases` и `faqItems` в supplier directory record/item. | Later owner/admin editing должен валидировать эти блоки на backend, не на странице профиля. |
| Прокинуть evidence blocks через memory и PostgreSQL repositories. | `MemorySupplierRepository` содержит явные demo shipment/FAQ values; `PostgresSupplierRepository` читает `shipment_cases` и `profile_faq_items`. | Seed/import pipeline должен получать verified shipment evidence от supplier operations. |
| Убрать вычисление shipment cases и FAQ из профиля. | `SupplierProfile.tsx` читает `supplier?.shipmentCases` и `supplier?.faqItems`; старые `buildShipmentCasesI18n` / `buildFaqItemsI18n` удалены. | Legal/compliance details остаются отдельным Phase 4D candidate. |
| Сохранить API-disabled preview без смешения с production truth. | `src/lib/supplier-evidence-blocks.ts` содержит explicit `localPreviewSupplierShipmentCases` / `localPreviewSupplierFaqItems`; они используются только для mock/local preview adapters. | Demo-mode retirement отдельным решением. |
| Добавить persistence и guards. | Миграция `0032_supplier_profile_evidence_blocks.sql` добавляет JSONB array columns, constraints и comments; self-hosted checks guard migration/docs. | Add stricter PostgreSQL JSON shape validation later if needed. |

## Access Decision

`shipmentCases` and `faqItems` are published supplier evidence blocks. They are
safe for locked buyer views because they describe shipped product evidence,
delivery basis, localized FAQ copy and photo-report captions without revealing
private contact channels, exact prices, restricted documents or unmasked legal
identity.

Phase 4C does not unlock:

- `companyName`;
- website, phone, WhatsApp or direct contacts;
- exact prices;
- restricted supplier documents;
- owner/admin operations notes.

## Runtime Contract

Configured deployment:

- Supplier detail read: `GET /v1/suppliers/:supplierId`.
- API response includes `shipmentCases` and `faqItems`.
- Frontend renders the shipment evidence tab and FAQ/FAQPage JSON-LD from those
  API-owned fields.
- On configured API failure, Phase 4A fail-closed behavior remains in force.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Local preview blocks are derived by explicit helpers in
  `src/lib/supplier-evidence-blocks.ts`.
- This mode is non-production and exists for local/Lovable preview only.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new frontend route, polling path or public write path is introduced.
- Hot reads remain `GET /v1/suppliers` and `GET /v1/suppliers/:supplierId`.
- `shipmentCases` and `faqItems` are read with the supplier directory record,
  so profile reads stay one API request per visible detail page.
- Writes are not introduced in this phase; future writes belong to supplier
  owner/admin operations.

Cache, queue and backpressure strategy:

- No queue, scheduler or worker is added.
- Existing HTTP/API backpressure and supplier-detail caching strategy remain
  the scaling boundary.
- Contract caps list length, key length, product labels, photo captions and FAQ
  params to prevent unbounded profile payload growth.

Database indexing and pagination strategy:

- List pagination remains covered by `0005_supplier_directory_search_scaling`
  and `0009_supplier_directory_pagination_sort`.
- Migration `0032_supplier_profile_evidence_blocks.sql` adds bounded JSONB array
  columns to the existing supplier row and does not introduce new list filters
  or indexes.
- Profile detail lookup continues to use supplier id lookup and publication
  status guard already used by `PostgresSupplierRepository`.

Failure mode and graceful degradation:

- Configured API failures stay fail-closed with no local profile substitution.
- Legacy rows use empty arrays until backfilled, avoiding frontend-generated
  false evidence.
- API-disabled preview remains local and explicitly separate.

Observability and load-test plan:

- Release validation must include `test:supplier-directory-frontend`,
  `test:backend-contract`, `test:db-migrations`, `test:db-contract`,
  `check:self-hosted-api` and `check:production-scale-baseline`.
- Load tests should include locked and qualified supplier profile detail reads
  with the enlarged supplier payload.
- Future owner/admin writes should add audit events and update metrics before
  being treated as production-ready.

## Remaining Supplier Profile Debt After Phase 4C

| Debt | Status после Phase 4C | Следующий scoped шаг |
|---|---|---|
| Production/logistics dossier facts | Backend-owned contract/API/DB fields implemented in Phase 4B. | Keep guarded; backfill real supplier facts through backend operations later. |
| Shipment evidence and FAQ | Backend-owned contract/API/DB fields implemented. | Keep guarded; add owner/admin editing later. |
| Legal/compliance details | Still generated through frontend helper. | Phase 4D candidate: backend-owned legal/compliance profile details with stricter access decision. |
| Supplier owner/admin editing | Not implemented. | Later supplier operations/admin phase with audit and validation. |
| API-disabled mock preview | Still present for local/Lovable preview only. | Separate demo-mode retirement decision. |

## Validation

Completed focused validation before full release validation:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`

Marker: Backend Phase 4C.
Marker: Supplier Profile Backend-Owned Evidence Blocks.
Marker: shipmentCases.
Marker: faqItems.
Marker: 0032_supplier_profile_evidence_blocks.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
