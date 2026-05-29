# Handoff

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`
7. `docs/project-memory/RISKS.md`

## Current Goal

Backend Phase 3B Supplier Access Supabase Fallback Removal is committed locally
at `5b96f838`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog facade | Убрать runtime-путь `catalog-api` → legacy Supabase catalog adapter. | Реализовано: `catalog-api.ts` вызывает только `createOfferCatalogApiClient().listOffers()` и `.getOfferById()`. | Не возвращать `fetchLegacyCatalog*`. |
| Adapter file | Удалить catalog Supabase fallback файл. | Реализовано: `src/lib/legacy-catalog-supabase-adapter.ts` удалён. | Guard tests требуют отсутствие файла. |
| Landing source | Убрать `supabase` из landing offers telemetry/source naming. | Реализовано: `useLandingOffers` и analytics source = `catalog-api` / `mock-fallback`. | Дашборды читать `catalog-api` как self-hosted facade result. |
| Guards | Запретить возврат catalog Supabase fallback. | Реализовано: `catalog-api.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать в CI. |
| Supplier access facade | Убрать runtime-путь `supplier-access-api` → legacy Supabase adapter. | Реализовано: dynamic import/legacy branches удалены, `legacy-supplier-access-supabase-adapter.ts` удалён. | Не возвращать legacy markers. |
| Supplier access fail-closed | Не использовать local mock при ошибке configured API. | Реализовано: read failure очищает stale approval и возвращает `null`; request failure rejects без local request. | UI error copy отдельно, если понадобится. |
| Debt list | Точно выделить оставшийся Supabase/prototype debt после Phase 3B. | Реализовано: остались reference tooling/tests, empty env keys и dependency. | Phase 3C: reference tooling retirement. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2I are committed locally and validation green.
- Backend Phase 2J is committed locally at `f753224f`; release validation passed.
- Backend Phase 3A is committed locally at `b5d1e9f8`; release validation passed.
- Backend Phase 3B is committed locally at `5b96f838`; release validation passed.

## Phase 3B Files

- `docs/backend/phase-3b-supplier-access-supabase-fallback-removal.md`
- `src/lib/supplier-access-api.ts`
- `src/lib/supplier-access-api.boundary.test.ts`
- `src/lib/supplier-access-api.test.ts`
- deleted: `src/lib/legacy-supplier-access-supabase-adapter.ts`
- `src/components/suppliers/SupplierAccessRequestPanel.tsx`
- `e2e/offer-catalog-detail-api-flow.spec.ts`
- `e2e/offer-catalog-detail-flow.spec.ts`
- `e2e/offer-detail-runtime.spec.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-backend-architecture.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 3A Files

- `docs/backend/phase-3a-catalog-supabase-fallback-removal.md`
- `src/lib/catalog-api.ts`
- `src/lib/catalog-api.boundary.test.ts`
- `src/lib/useLandingOffers.ts`
- `src/lib/useLandingOffers.test.ts`
- `src/lib/analytics.ts`
- deleted: `src/lib/legacy-catalog-supabase-adapter.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-backend-architecture.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run src/lib/supplier-access-api.boundary.test.ts src/lib/supplier-access-api.test.ts`
- `npm run test:supplier-access-frontend`
- `npm run test:access-contract`
- `npm run check:supabase-boundary`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx vitest run src/lib/catalog-api.boundary.test.ts src/lib/useLandingOffers.test.ts src/components/landing/LiveOffers.highlight.test.tsx src/components/landing/offers-anchor.test.tsx src/components/landing/offers-highlight-focus.test.tsx src/components/landing/LiveOffers.empty-fallback.test.tsx`
- `npm run test:offer-catalog-frontend`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:e2e:api-backed-access-flows`
- `npm run smoke:self-hosted-offer-detail:run`
- `git diff --check`
- `npm run build`
- `npm run smoke:e2e:frontend-no-supabase-env`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 3C: Supabase reference tooling retirement.

Concrete next function:

- classify remaining Supabase references as historical docs, reference tests,
  CLI smoke tools, env examples or active package imports;
- remove or quarantine Supabase reference smoke tooling that no longer protects
  production behavior;
- remove empty prototype env keys from production/default examples if no guard
  needs them;
- decide whether `@supabase/supabase-js` and `src/integrations/supabase/client.ts`
  can be removed now or must remain as explicit historical reference artifacts;
- preserve no hosted BaaS/Supabase production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
