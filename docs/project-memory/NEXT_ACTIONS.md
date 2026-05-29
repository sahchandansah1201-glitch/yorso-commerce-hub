# Next Actions

## Current Next Action

Backend Phase 4C is implemented and committed locally at `d8988d50`.

Phase 4C moves `/suppliers/:supplierId` shipment evidence and FAQ blocks to the
self-hosted supplier directory contract. The supplier profile now renders
`shipmentCases` and `faqItems` from the API-shaped supplier record; the old
frontend hash-based evidence/FAQ builders are gone.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend contract | Добавить shipment/FAQ evidence в supplier-directory contract. | Реализовано: `supplierShipmentCaseSchema`, `supplierFaqItemSchema`, `shipmentCases`, `faqItems`. | Owner/admin write API later. |
| Persistence | Сохранить evidence/FAQ в self-hosted supplier table. | Реализовано: migration `0032_supplier_profile_evidence_blocks` добавляет `shipment_cases` / `profile_faq_items`. | Backfill verified supplier evidence later. |
| Profile page | Убрать frontend hash-based evidence/FAQ synthesis. | Реализовано: `SupplierProfile.tsx` читает `supplier?.shipmentCases` / `supplier?.faqItems`; старые builders удалены. | Phase 4D должен проверить legal/compliance details source boundary. |
| Local preview | Не смешивать local preview с production truth. | Реализовано: explicit helpers в `supplier-evidence-blocks.ts` используются только для API-disabled preview. | Demo-mode retirement отдельным решением. |
| Guards | Зафиксировать контракт тестами и checks. | Реализовано: tests, DB guards, `check:self-hosted-api`, `check:production-scale-baseline` проходят. | Держать в `ci:core`. |

## Next Implementation After Phase 4C

Recommended next scoped workstream:

Backend Phase 4D: Supplier Profile Legal/Compliance Details Source Boundary.

Concrete scope:

- audit `getSupplierLegalDetails` and all `/suppliers/:supplierId` legal,
  compliance and document-readiness details still derived from frontend/local
  mappings;
- decide which legal/compliance fields are safe for locked buyer views and which
  require `qualified_unlocked`;
- move one legal/compliance detail group into backend-owned supplier contract,
  API repository and DB storage without exposing company identity or restricted
  documents to locked buyers.

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
