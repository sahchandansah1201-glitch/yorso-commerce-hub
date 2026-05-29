# Next Actions

## Current Next Action

Backend Phase 3B is implemented and committed locally at `5b96f838`.

Phase 3B removes the supplier-access Supabase prototype fallback. Supplier
access runtime is now self-hosted API first with API-disabled local preview only.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog facade | Убрать runtime-путь `catalog-api` → legacy Supabase catalog adapter. | Реализовано: `catalog-api.ts` вызывает только `createOfferCatalogApiClient().listOffers()` и `.getOfferById()`. | Не возвращать `fetchLegacyCatalog*`. |
| Adapter file | Удалить catalog Supabase fallback файл. | Реализовано: `src/lib/legacy-catalog-supabase-adapter.ts` удалён. | Boundary test проверяет отсутствие файла. |
| Landing source | Убрать `supabase` из landing offers source/analytics. | Реализовано: `catalog-api` / `mock-fallback`. | Дашборды читать `catalog-api` как self-hosted facade result. |
| Guards | Запретить возврат catalog Supabase fallback. | Реализовано: `catalog-api.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать guards в `ci:core`. |
| Supplier access facade | Убрать runtime-путь `supplier-access-api` → legacy Supabase adapter. | Реализовано: dynamic import/legacy branches удалены, `src/lib/legacy-supplier-access-supabase-adapter.ts` удалён. | Не возвращать `readLegacySupplierAccessRequest` / `requestLegacySupplierAccess`. |
| Supplier access fail-closed | Не использовать local mock при ошибке configured API. | Реализовано: read failure очищает stale approval и возвращает `null`; request failure rejects без local request. | UI error copy можно сделать отдельным UX batch. |
| Supplier access guards | Запретить возврат supplier-access Supabase fallback. | Реализовано: `supplier-access-api.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать guards в `ci:core`. |
| Debt list | Точно выделить оставшийся debt после Phase 3B. | Реализовано: reference tooling/tests, empty env keys и dependency. | Phase 3C: Supabase reference tooling retirement. |

## Next Implementation After Phase 3B

Recommended next scoped workstream:

Backend Phase 3C: Supabase reference tooling retirement.

Concrete scope:

- classify remaining Supabase references as historical docs, reference tests,
  CLI smoke tools, env examples or active package imports;
- remove or quarantine Supabase reference smoke tooling that no longer protects
  production behavior;
- remove empty prototype env keys from production/default examples if no guard
  needs them;
- decide whether `@supabase/supabase-js` and `src/integrations/supabase/client.ts`
  can be removed now or must remain as explicit historical reference artifacts;
- keep `check:supabase-boundary` or replace it with a provider-free production
  boundary guard.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Self-contained product direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
