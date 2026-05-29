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

Backend Phase 3C Provider Reference Tooling Retirement is committed locally at
`6c2f5368`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Provider files | Убрать активные Supabase project/reference files. | Реализовано: удалены `supabase/`, `src/integrations/supabase`, Supabase CLI/access/type scripts и RLS/reference tests. | Исторические docs остаются архивным контекстом. |
| Dependency | Убрать hosted BaaS SDK из продукта. | Реализовано: `@supabase/supabase-js` удалён из `package.json` и `package-lock.json`. | Не возвращать SDK без нового architecture decision. |
| Env | Убрать Supabase env debt. | Реализовано: `.env` и `.env.example` без `VITE_SUPABASE_*`; smoke scripts больше не инжектят Supabase stubs. | Provider secrets не хранить в repo/env examples. |
| Guard | Заменить Supabase-specific boundary. | Реализовано: `check:provider-boundary` сканирует production source roots и запрещает hosted-provider imports/env/legacy markers. | Держать в `ci:core`. |
| Browser smoke | Заменить старый no-Supabase smoke. | Реализовано: `smoke:e2e:frontend-provider-free-env` строит и проверяет public/auth/catalog routes без hosted BaaS env/SDK. | Держать в `ci:full`. |
| Runtime policy | Сделать admin/runtime policy provider-neutral. | Реализовано: удалены `supabaseProductionBackend` / `prototypeSupabaseConfigured`; сохраняется `hostedBaasProductionBackend: false`. | Не возвращать provider-specific status fields. |
| DB contract | Убрать provider role из migration manifest. | Реализовано: `supabaseRole` удалён; migrator валидирует self-hosted PostgreSQL baseline. | Продолжать live migrations через `packages/db`. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2J are complete and validation green.
- Backend Phase 3A is committed locally at `b5d1e9f8`; release validation passed.
- Backend Phase 3B is committed locally at `5b96f838`; release validation passed.
- Backend Phase 3C is committed locally at `6c2f5368`; release validation passed.

## Phase 3C Files

- `docs/backend/phase-3c-provider-reference-tooling-retirement.md`
- `scripts/check-provider-production-boundary.mjs`
- `scripts/smoke-frontend-provider-free-env.mjs`
- `e2e/frontend-provider-free-env.spec.ts`
- `package.json`
- `package-lock.json`
- `.env`
- `.env.example`
- `.github/workflows/ci.yml`
- `apps/api/src/config.ts`
- `packages/contracts/src/admin-runtime.ts`
- `packages/db/migration-manifest.json`
- `packages/db/src/migrator.ts`
- `docs/backend/self-hosted-production-policy.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`

Removed active provider surface:

- `supabase/`
- `src/integrations/supabase/`
- Supabase CLI/access/type scripts
- Supabase/RLS reference tests under `src/test/`
- `@supabase/supabase-js`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run src/test/self-hosted-backend-policy.test.ts src/test/self-hosted-infra.test.ts src/test/self-hosted-contracts.test.ts src/test/provider-free-tooling-retirement.test.ts`
- `npm run check:provider-boundary`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-db`
- `npm run check:backend-policy`
- `npm run check:self-hosted-infra`
- `npm run db:migrations:check`
- `npm run test:backend-contract`
- `npm run test:access-contract`
- `npm run test:admin-runtime-frontend`
- `npm run test:admin-operations-frontend`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm run db:build`
- `npm run contracts:build`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `npm run smoke:e2e:frontend-provider-free-env`
- `git diff --check`

Known non-blocking warning:

- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 4A: Supplier Directory/Profile Source Of Truth Audit.

Concrete first question:

- Does configured API mode for `/suppliers` and `/suppliers/:supplierId`
  strictly use the self-hosted supplier directory/profile API, or can
  `mockSuppliers`/local preview state still leak into production-configured
  reads?

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
