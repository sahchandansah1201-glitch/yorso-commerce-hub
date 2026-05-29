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

Backend Phase 2B Registration Verification Delivery Outbox is committed
locally and release validation has passed. Next step: choose Phase 2C
worker/lease processing or legacy Supabase consolidation.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Delivery source | Перевести registration verification delivery из mock-only события в backend-owned durable intent. | Реализовано: `yorso_registration_delivery_outbox` хранит purpose, channel, status, destination hash, masked preview, retry and lease fields. | Добавить worker только отдельным решением. |
| Email delivery intent | При `/v1/auth/register/start` создавать email verification outbox job. | Реализовано: draft insert и outbox insert идут одним PostgreSQL CTE. | Worker сможет резолвить raw destination backend-only через draft. |
| Phone delivery intent | При `/v1/auth/register/phone/send` создавать SMS/WhatsApp outbox job. | Реализовано: phone verification state update и outbox insert идут одним PostgreSQL CTE. | Добавить lease/retry processing в Phase 2C, если выбираем delivery infrastructure. |
| Browser hygiene | Не отдавать verification code или полный контакт в API response. | Реализовано: response содержит только delivery id, purpose, channel, status, masked destination preview. | Сохранять same hygiene в будущих worker/admin surfaces. |
| Validation | Проверить контракты, migration, API, frontend boundary, lint/build/runtime guards. | Passed: contracts, registration API client, DB migrations, API tests, TypeScript, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Выбрать следующий scoped workstream. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A is committed locally and validation green.
- Backend Phase 2B is committed locally and validation green.

## Phase 2B Files

- `docs/backend/phase-2b-registration-verification-delivery-outbox.md`
- `packages/db/migrations/0027_registration_verification_delivery_outbox.sql`
- `packages/db/migration-manifest.json`
- `packages/contracts/src/auth.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `src/lib/api-contracts.ts`
- `src/lib/api-contracts.registration.test.ts`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/phase-2a-registration-account-source-of-truth.md`
- `docs/backend/production-scale-baseline.md`

## Validation

Passed locally on 2026-05-29:

- `npm run contracts:build`
- `npx vitest run src/lib/api-contracts.registration.test.ts`
- `npm run test:db-migrations`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`
- `npx tsc -b --noEmit`
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

Backend Phase 2C: self-hosted verification worker/lease processing.

Alternative:

Self-hosted consolidation pass for remaining legacy Supabase/prototype surfaces.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
