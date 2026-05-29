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

Backend Phase 3A Catalog Supabase Fallback Removal is committed locally at
`b5d1e9f8`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog facade | Убрать runtime-путь `catalog-api` → legacy Supabase catalog adapter. | Реализовано: `catalog-api.ts` вызывает только `createOfferCatalogApiClient().listOffers()` и `.getOfferById()`. | Не возвращать `fetchLegacyCatalog*`. |
| Adapter file | Удалить catalog Supabase fallback файл. | Реализовано: `src/lib/legacy-catalog-supabase-adapter.ts` удалён. | Guard tests требуют отсутствие файла. |
| Landing source | Убрать `supabase` из landing offers telemetry/source naming. | Реализовано: `useLandingOffers` и analytics source = `catalog-api` / `mock-fallback`. | Дашборды читать `catalog-api` как self-hosted facade result. |
| Guards | Запретить возврат catalog Supabase fallback. | Реализовано: `catalog-api.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать в CI. |
| Debt list | Точно выделить оставшийся Supabase/prototype debt после Phase 3A. | Реализовано: supplier-access fallback, reference tooling/tests, empty env keys и dependency listed. | Phase 3B начнёт supplier-access removal. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2I are committed locally and validation green.
- Backend Phase 2J is committed locally at `f753224f`; release validation passed.
- Backend Phase 3A is committed locally at `b5d1e9f8`; release validation passed.

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
- `npm run smoke:self-hosted-offer-detail:run`
- `git diff --check`
- `npm run build`
- `npm run smoke:e2e:frontend-no-supabase-env`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 3B: supplier-access Supabase fallback removal.

Concrete next function:

- remove runtime dependency on `src/lib/legacy-supplier-access-supabase-adapter.ts`
  from `src/lib/supplier-access-api.ts`;
- keep configured deployments on owned `/v1/access/*` API;
- keep API-disabled preview local-only without Supabase auth/RLS;
- delete the legacy supplier-access adapter only after boundary tests prove
  request status, request creation and notification behavior still pass;
- preserve no hosted BaaS/Supabase production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
