# Backend Phase 3A: Catalog Supabase Fallback Removal

Status: implemented.

Phase 3A removes the catalog Supabase prototype fallback from the production-facing
offer catalog facade. The catalog surface is now self-hosted API first, with
API-disabled preview using local fixtures only. No catalog path falls back to Supabase.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Удалить runtime-путь `catalog-api` → legacy Supabase catalog adapter. | `src/lib/catalog-api.ts` вызывает только `createOfferCatalogApiClient().listOffers()` и `.getOfferById()`. | Не возвращать `fetchLegacyCatalogOffers` / `fetchLegacyCatalogOfferById`. |
| Удалить файл catalog Supabase fallback. | `src/lib/legacy-catalog-supabase-adapter.ts` удалён. Boundary test и guard scripts требуют его отсутствия. | Supplier-access Supabase fallback остаётся отдельным Phase 3B debt. |
| Сохранить API-disabled preview без hosted backend. | Preview идёт через local fixture path внутри `src/lib/offer-catalog-api.ts`: `mockOffers`, access shaping, approved supplier ids, pagination. | Позже заменить preview fixtures на seedable local API/dev dataset, если понадобится. |
| Обновить landing source naming. | `useLandingOffers` и analytics source используют `catalog-api` / `mock-fallback`, а не `supabase`. | Дашборды должны трактовать `catalog-api` как self-hosted facade result. |
| Зафиксировать release guards. | `catalog-api.boundary.test.ts`, `check:self-hosted-api` и `check:production-scale-baseline` запрещают возврат удалённого catalog Supabase fallback. | В Phase 3B добавить аналогичный closure guard для supplier-access fallback. |

## Current Catalog Runtime Contract

Configured deployments:

- `/` landing live offers call `fetchOffers("anonymous_locked")`;
- `/offers` and `/offers/:id` use the same offer catalog adapter family;
- `src/lib/catalog-api.ts` delegates to `src/lib/offer-catalog-api.ts`;
- `src/lib/offer-catalog-api.ts` calls owned endpoints `/v1/offers` and
  `/v1/offers/:id` when `VITE_YORSO_API_URL` is configured;
- account/session headers remain owned YORSO headers, not Supabase auth.

API-disabled preview:

- `src/lib/offer-catalog-api.ts` uses local `mockOffers` fixtures;
- access shaping still redacts supplier identity and exact price for locked buyers;
- approved supplier access ids can unlock individual fixture rows locally;
- this preview path performs no Supabase calls.

Removed catalog fallback:

- `src/lib/legacy-catalog-supabase-adapter.ts`;
- `fetchLegacyCatalogOffers`;
- `fetchLegacyCatalogOfferById`;
- `SupplierPublicRow` re-export from `catalog-api.ts`;
- landing source value `supabase`.

## Remaining Supabase / Prototype Debt After Phase 3A

| Area | Confirmed files | Status | Next removal |
|---|---|---|---|
| Supplier access prototype fallback | `src/lib/supplier-access-api.ts` | Removed after Phase 3A in Phase 3B. | No runtime action remains. |
| Supabase reference tooling/tests | `supabase/`, `scripts/check-supabase-access-types.mjs`, `scripts/supabase-access-*.mjs`, RLS/reference tests | Still present as historical/reference tooling. | Phase 3C. |
| Empty prototype env keys | `.env.example` `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Still present as empty prototype markers used by guards. | Remove after access/reference retirement. |
| Supabase dependency | `@supabase/supabase-js` | Still needed by remaining reference tooling/tests. | Remove in final Supabase retirement batch. |

## 10,000 Concurrent-User Review

Read/write profile:

- Catalog reads are bounded `GET /v1/offers` and `GET /v1/offers/:id` calls in
  configured deployments.
- API-disabled preview reads local fixtures in memory and is not a production
  backend.
- No writes are added by this phase.

Cache/queue/backpressure strategy:

- Production catalog backpressure remains owned by the self-hosted API, database
  indexes, pagination limits and existing frontend retry/fallback behavior.
- No queue is introduced because this is read-only catalog removal work.
- Removing Supabase fallback eliminates an unowned external read path under load.

Database indexing and pagination strategy:

- Existing offer catalog indexes and pagination stay unchanged:
  `/v1/offers` owns bounded `limit` / `offset`, filters, sorting and access shaping.
- Frontend catalog facade still requests a bounded landing limit of 50.

Failure mode and graceful degradation:

- Configured API failure continues through existing catalog runtime fallback and
  error UI behavior.
- API-disabled preview uses local fixtures only; it does not attempt Supabase.
- Locked buyer redaction remains fail-closed for supplier identity and exact price.

Observability and load-test plan:

- Existing catalog analytics continue through `live_offers_source_resolved`,
  now with `source: "catalog-api"` or `"mock-fallback"`.
- Existing self-hosted offer catalog smoke/e2e flows remain the release path.
- Load tests should target `/v1/offers` and `/v1/offers/:id` only; no Supabase
  catalog endpoint exists in the production path.

## Validation

Run before release signoff:

- `npx vitest run src/lib/catalog-api.boundary.test.ts src/lib/useLandingOffers.test.ts`
- `npm run test:offer-catalog-frontend`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run check:supabase-boundary`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:self-hosted-offer-detail:run`
- `npm run build`
- `git diff --check`

Known warnings preserved:

- Supabase generated types can remain out of sync in non-strict reference mode
  until Supabase reference tooling is retired.
- Browserslist data can remain stale until dependency maintenance.
