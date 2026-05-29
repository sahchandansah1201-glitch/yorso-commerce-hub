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

Backend Phase 2C Registration Verification Worker Lease Processing is
committed locally and release validation has passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Worker lease | Обрабатывать queued registration delivery jobs через bounded backend worker. | Реализовано: `RegistrationDeliveryWorker.processBatch` leases jobs via repository with `limit`, `workerId`, `leaseMs`. | Добавить scheduler only in Phase 2D. |
| Queue safety | Избежать double-processing и hot retry loops. | Реализовано: PostgreSQL uses ordered `for update skip locked`; retry uses `retryAfterMs`, `attempt_count`, `max_attempts`; expired/completed drafts are not leased. | Load-test lease contention under multiple workers. |
| Sender boundary | Не привязывать core backend к hosted provider. | Реализовано: injectable `RegistrationVerificationDeliverySender`; no Supabase function/provider coupling. | Choose self-hosted SMTP/SMS/WhatsApp/manual sender adapter. |
| Result states | Successful/failed delivery must be durable. | Реализовано: `sent`, `queued` retry and terminal `failed` status transitions. | Add operator visibility and metrics for failed jobs. |
| Data hygiene | Не отдавать verification code/raw contact в browser/public surfaces. | Реализовано: worker payload has backend-only destination, masked preview and template key; no `code`/`verificationCode`; errors are sanitized. | Preserve this in sender/admin surfaces. |
| Validation | Проверить worker, repository boundary, contracts, DB, runtime guards and build. | Passed: delivery worker tests, TypeScript, contracts, DB migrations, focused API tests, lint, production-scale, self-hosted runtime, api build, diff check, production build. | Start Phase 2D or Supabase consolidation. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A and 2B are committed locally and validation green.
- Backend Phase 2C is committed locally and validation green.

## Phase 2C Files

- `docs/backend/phase-2c-registration-verification-worker-lease.md`
- `apps/api/src/modules/auth/delivery-worker.ts`
- `apps/api/src/modules/auth/delivery-worker.test.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/phase-2b-registration-verification-delivery-outbox.md`
- `docs/backend/production-scale-baseline.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts`
- `npx tsc -b --noEmit`
- `npm run contracts:build`
- `npm run test:db-migrations`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
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

Backend Phase 2D: self-hosted verification sender and runtime scheduler
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
