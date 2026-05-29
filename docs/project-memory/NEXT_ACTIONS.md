# Next Actions

## Current Next Action

Backend Phase 3A is implemented and committed locally at `b5d1e9f8`.

Phase 3A removes the catalog Supabase prototype fallback. Catalog runtime is now
self-hosted API first with API-disabled local fixture preview only.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog facade | Убрать runtime-путь `catalog-api` → legacy Supabase catalog adapter. | Реализовано: `catalog-api.ts` вызывает только `createOfferCatalogApiClient().listOffers()` и `.getOfferById()`. | Не возвращать `fetchLegacyCatalog*`. |
| Adapter file | Удалить catalog Supabase fallback файл. | Реализовано: `src/lib/legacy-catalog-supabase-adapter.ts` удалён. | Boundary test проверяет отсутствие файла. |
| Landing source | Убрать `supabase` из landing offers source/analytics. | Реализовано: `catalog-api` / `mock-fallback`. | Дашборды читать `catalog-api` как self-hosted facade result. |
| Guards | Запретить возврат catalog Supabase fallback. | Реализовано: `catalog-api.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать guards в `ci:core`. |
| Debt list | Точно выделить оставшийся debt после Phase 3A. | Реализовано: supplier-access fallback, reference tooling/tests, empty env keys и dependency. | Phase 3B: supplier-access fallback removal. |

## Next Implementation After Phase 3A

Recommended next scoped workstream:

Backend Phase 3B: supplier-access Supabase fallback removal.

Concrete scope:

- убрать runtime dependency на `src/lib/legacy-supplier-access-supabase-adapter.ts`
  из `src/lib/supplier-access-api.ts`;
- configured deployments оставить на owned `/v1/access/*` API;
- API-disabled preview сделать local-only без Supabase auth/RLS;
- обновить `supplier-access-api.boundary.test.ts`, self-hosted guards и docs;
- удалить legacy supplier-access adapter только если request status, request
  creation и notification behavior остаются зелёными.

Alternative after Phase 3B:

Backend Phase 3C: Supabase reference tooling retirement.

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
