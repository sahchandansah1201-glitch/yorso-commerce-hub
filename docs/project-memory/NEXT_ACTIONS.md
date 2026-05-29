# Next Actions

## Current Next Action

Backend Phase 4B is implemented and committed locally at `799af493`.

Phase 4B moves `/suppliers/:supplierId` production/logistics dossier facts to
the self-hosted supplier directory contract. The supplier profile now renders
`productionFacts` and `logisticsFacts` from the API-shaped supplier record; the
old page-level `buildProductionFacts` / `buildLogisticsFacts` synthesis is gone.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend contract | Добавить production/logistics facts в supplier-directory contract. | Реализовано: `supplierProductionFactsSchema`, `supplierLogisticsFactsSchema`, `productionFacts`, `logisticsFacts`. | Owner/admin write API later. |
| Persistence | Сохранить facts в self-hosted supplier table. | Реализовано: migration `0031_supplier_profile_dossier_facts` добавляет `production_facts` / `logistics_facts`. | Backfill real verified supplier facts later. |
| Profile page | Убрать frontend hash-based dossier synthesis. | Реализовано: `SupplierProfile.tsx` читает `supplier?.productionFacts` / `supplier?.logisticsFacts`; старые helpers удалены. | Phase 4C должен проверить evidence/FAQ/shipment sections. |
| Local preview | Не смешивать local preview с production truth. | Реализовано: explicit helpers в `supplier-dossier-facts.ts` используются только для API-disabled preview. | Demo-mode retirement отдельным решением. |
| Guards | Зафиксировать контракт тестами и checks. | Реализовано: tests, DB guards, `check:self-hosted-api`, `check:production-scale-baseline` проходят. | Держать в `ci:core`. |

## Next Implementation After Phase 4B

Recommended next scoped workstream:

Backend Phase 4C: Supplier Profile Backend-Owned Evidence Blocks.

Concrete scope:

- audit which `/suppliers/:supplierId` evidence sections still derive legal,
  shipment, FAQ or trust text from frontend/mock content;
- choose one section to move to a backend-owned supplier record field or related
  table;
- keep locked-safe evidence separate from restricted legal/contact/document
  payloads.

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
