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

Backend Phase 2A Registration-To-Account Source Of Truth is committed locally
and release validation has passed. Next step: choose Phase 2B verification
delivery/outbox or a legacy Supabase consolidation pass.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Registration source of truth | Перенести API-enabled registration funnel из browser-only state в self-hosted backend. | Реализовано: `yorso_registration_drafts` и `/v1/auth/register/*` хранят шаги регистрации на backend. | Добавить delivery/outbox только отдельным решением. |
| Account creation | На завершении регистрации создать полноценный backend account workspace. | Реализовано: user, credential, company, media row, roles, notification defaults, optional target-market meta-region и auth session создаются в owned storage. | Расширять bootstrap только под подтвержденные onboarding-требования. |
| Frontend boundary | `/register/*` должен использовать self-hosted API при `VITE_YORSO_API_URL`. | Реализовано: `authApi` вызывает backend routes; mock остался только API-disabled preview. | Не использовать preview-flow как production behavior. |
| Self-contained runtime | Не добавлять hosted BaaS/Supabase dependency. | Сохранено: Phase 2A использует owned API/PostgreSQL/session path; Supabase warning остался legacy/prototype debt. | Выносить оставшиеся Supabase references в отдельный consolidation workstream. |
| Validation | Проверить контракты, DB migration, API, frontend funnel, lint, build and runtime guards. | Passed: contracts, focused API/frontend/DB tests, TypeScript, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Выбрать следующий scoped workstream. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A is committed locally and validation green.

## Phase 2A Files

- `docs/backend/phase-2a-registration-account-source-of-truth.md`
- `packages/db/migrations/0026_registration_account_source.sql`
- `packages/db/migration-manifest.json`
- `packages/contracts/src/auth.ts`
- `apps/api/src/modules/auth/routes.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/modules/auth/factory.ts`
- `apps/api/src/modules/account/repository.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `src/lib/api-contracts.ts`
- `src/lib/api-contracts.registration.test.ts`
- `src/pages/register/RegisterVerify.tsx`
- `src/pages/register/RegisterReady.tsx`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`

## Validation

Passed locally on 2026-05-29:

- `npm run contracts:build`
- `npx vitest run src/lib/api-contracts.registration.test.ts`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`
- `npx vitest run src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/lib/auth-runtime.test.ts`
- `npx tsc -b --noEmit`
- `npm run test:db-migrations`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
- `npm run lint`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-production-runtime`
- `npm run api:build`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 2B: self-hosted registration verification delivery/outbox
decision.

Alternative:

Self-hosted consolidation pass for remaining legacy Supabase/prototype surfaces.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
