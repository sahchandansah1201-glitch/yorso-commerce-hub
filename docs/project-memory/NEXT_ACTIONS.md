# Next Actions

## Current Next Action

Backend Phase 4A is implemented in the working tree.

Phase 4A closes the supplier directory/profile configured-mode source-of-truth
gap. `/suppliers` and `/suppliers/:supplierId` still support API-disabled local
preview, but when `VITE_YORSO_API_URL` is configured they no longer replace
failed self-hosted supplier API reads with prototype supplier rows or local
fallback profiles.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Data-path audit | Проверить `/suppliers` и `/suppliers/:supplierId` в configured API mode. | Реализовано: оба route surface используют `useSupplierDirectoryList` / `useSupplierDirectoryDetail`, а adapter идет в `/v1/suppliers`. | Phase 4B должен смотреть completeness profile data, не fallback. |
| Fail-closed | Убрать configured-mode подстановку `mockSuppliers` при ошибке supplier API. | Реализовано: API-enabled state остается `source: "api"`, first-load failure дает пустой list/detail retry state. | API-disabled preview можно убрать только отдельным demo-mode решением. |
| Buyer UI | Не прятать outage и не показывать ложные данные. | Реализовано: `/suppliers` показывает `Live directory error`; `/suppliers/:supplierId` показывает retry state вместо not-found/mock profile. | Возможная telemetry для API failures отдельным observability batch. |
| Guards | Зафиксировать контракт тестами и checks. | Реализовано: focused frontend tests, `check:self-hosted-api`, `check:production-scale-baseline` обновлены и проходят. | После полного validation зафиксировать commit. |

## Next Implementation After Phase 4A

Recommended next scoped workstream:

Backend Phase 4B: Supplier Profile Backend-Owned Dossier Completeness.

Concrete scope:

- audit which `/suppliers/:supplierId` dossier sections still derive rich
  profile content from frontend helpers/mock supplier shape;
- map those fields to existing supplier API contracts or missing backend fields;
- implement the first backend-owned section without weakening access gating or
  supplier identity redaction.

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
