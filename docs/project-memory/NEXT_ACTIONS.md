# Next Actions

## Current Next Action

Backend Phase 4D is implemented and committed locally at `84dd9588`.

Phase 4D moves `/suppliers/:supplierId` legal/compliance details to the
self-hosted supplier directory contract. The supplier profile now renders
`legalDetails` from the API-shaped supplier record only for
`qualified_unlocked` buyers. Locked buyers receive `legalDetails: null` and keep
the existing locked legal placeholder.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend contract | Добавить legal/compliance details в supplier-directory contract. | Реализовано: `supplierLegalDetailsSchema` и `legalDetails`. | Owner/admin write validation later. |
| Persistence | Сохранить legal details в self-hosted supplier table. | Реализовано: migration `0033_supplier_profile_legal_details` добавляет `legal_details` JSONB object. | Backfill verified supplier legal details later. |
| Access boundary | Не отдавать legal identifiers locked buyers. | Реализовано: `shapeSupplierForAccess` возвращает `legalDetails: null` для `anonymous_locked` и `registered_locked`. | Restricted documents require separate qualified-only payload/API. |
| Profile page | Убрать frontend legal hash synthesis из production profile. | Реализовано: `SupplierProfile.tsx` читает `supplier?.legalDetails`; local helper переименован в `localPreviewSupplierLegalDetails`. | Demo-mode retirement separate decision. |
| Guards | Зафиксировать contract/API/DB/UI boundary тестами и checks. | Реализовано: contracts, API, DB, supplier frontend tests, self-hosted checks and production-scale checks pass. | Держать guards в `ci:core`. |

## Next Implementation After Phase 4D

Recommended next scoped workstream:

Backend Phase 4E: Supplier Profile Restricted Document Payload Boundary.

Concrete scope:

- audit supplier profile document-readiness UI and any document/download paths
  still represented as frontend/local/prototype data;
- define a self-hosted, qualified-only supplier document payload contract that
  does not expose files, URLs or supplier identity to `anonymous_locked` or
  `registered_locked` buyers;
- move one restricted document payload group into backend-owned API/DB shape
  with access decision, tests, docs and 10,000 concurrent-user review.

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
