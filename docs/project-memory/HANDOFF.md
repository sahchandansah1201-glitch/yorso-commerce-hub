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

Backend Phase 4A Supplier Directory/Profile Source Of Truth Audit is
implemented in the working tree. Focused supplier-directory tests and
self-hosted/production-scale guards pass.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Supplier directory source | Проверить `/suppliers` API-enabled data path. | Реализовано: first-load API failure не подставляет prototype rows; source остается `api`. | Держать через tests/guards. |
| Supplier profile source | Проверить `/suppliers/:supplierId` API-enabled detail path. | Реализовано: first-load API failure показывает retry state без local fallback profile. | Phase 4B: backend-owned dossier completeness. |
| Local preview | Сохранить Lovable/local preview без API. | Реализовано: `mockSuppliers` остается только при пустом `VITE_YORSO_API_URL`. | Отдельное demo-mode retirement decision позже. |
| Buyer UI | Не скрывать supplier API outage. | Реализовано: `/suppliers` показывает `Live directory error`, profile показывает retry. | Возможная telemetry отдельным batch. |
| Guards | Зафиксировать no-fallback contract. | Реализовано: focused tests, `check:self-hosted-api`, `check:production-scale-baseline` проходят. | Перед commit запустить full validation. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2J are complete and validation green.
- Backend Phase 3A is committed locally at `b5d1e9f8`; release validation passed.
- Backend Phase 3B is committed locally at `5b96f838`; release validation passed.
- Backend Phase 3C is committed locally at `6c2f5368`; release validation passed.
- Backend Phase 4A is implemented in the working tree; focused validation passed.

## Phase 4A Files

- `docs/backend/phase-4a-supplier-directory-source-of-truth-audit.md`
- `src/lib/use-supplier-directory.ts`
- `src/pages/Suppliers.tsx`
- `src/pages/SupplierProfile.tsx`
- `src/i18n/translations.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/production-scale-baseline.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

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

Phase 4A focused validation passed locally on 2026-05-29:

- `npx vitest run src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`

Phase 3C passed locally on 2026-05-29:

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

Backend Phase 4B: Supplier Profile Backend-Owned Dossier Completeness.

Concrete first question:

- Which `/suppliers/:supplierId` dossier sections still derive rich content
  from frontend helpers/mock supplier shape instead of backend-owned supplier
  fields?

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
