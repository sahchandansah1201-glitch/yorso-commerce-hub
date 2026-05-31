# Next Actions

## Current Next Action

Backend Phase 4E is implemented and committed locally at `7f566ca2`.

Phase 4E moves `/suppliers/:supplierId` restricted supplier document metadata
to the self-hosted supplier directory contract. The supplier profile now renders
`supplierDocuments` from the API-shaped supplier record only for
`qualified_unlocked` buyers. Locked buyers receive `supplierDocuments: null`
and keep the existing locked document placeholder without file names, URLs,
asset ids or storage keys.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Backend contract | Добавить restricted supplier document metadata в supplier-directory contract. | Реализовано: `supplierDocumentPayloadSchema` и `supplierDocuments`. | Phase 4F download grant endpoint. |
| Persistence | Сохранить document metadata в self-hosted supplier table. | Реализовано: migration `0034_supplier_profile_restricted_documents` добавляет `supplier_documents` JSONB array. | Backfill verified supplier documents later. |
| Access boundary | Не отдавать document metadata locked buyers. | Реализовано: `shapeSupplierForAccess` возвращает `supplierDocuments: null` для `anonymous_locked` и `registered_locked`; URLs/assets/storage keys не входят в payload. | Download grant must re-check access. |
| Profile page | Убрать static document list из production profile. | Реализовано: `SupplierProfile.tsx` читает `supplier?.supplierDocuments`; locked state показывает placeholder без file names. | Demo-mode retirement separate decision. |
| Guards | Зафиксировать contract/API/DB/UI boundary тестами и checks. | Реализовано: contracts, API, DB, supplier frontend tests, self-hosted checks and production-scale checks pass. | Держать guards в `ci:core`. |

## Next Implementation After Phase 4E

Recommended next scoped workstream:

Backend Phase 4F: Supplier Document Download Grant Endpoint.

Concrete scope:

- audit the current supplier document metadata payload and any document action
  affordances in `SupplierProfile.tsx`;
- define a self-hosted, qualified-only download grant route that re-checks
  buyer access before returning a short-lived grant response;
- keep the profile payload metadata-only: no direct file URLs, raw storage keys,
  asset ids or provider-specific paths in `/suppliers/:supplierId`;
- persist/audit grant attempts with bounded pagination and no PII/raw document
  material in logs;
- add tests, docs and 10,000 concurrent-user review for grant read/write load.

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
