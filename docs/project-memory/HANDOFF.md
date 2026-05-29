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

Backend Phase 2G Password Recovery Delivery Runtime is committed locally at
`9485bd36`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Worker leasing | Owned recovery delivery queue processing. | Реализовано: `leasePasswordRecoveryDeliveryJobs` leases bounded rows and excludes expired/used recoveries. | Queue-age stats later. |
| File-spool sender | Self-hosted reset-link handoff without provider coupling. | Реализовано: `FileSpoolPasswordRecoverySender` writes `password_recovery_delivery` JSON files with mode `0600`. | SMTP only if self-hosted/operator-owned. |
| Runtime scheduler | Background worker outside public requests. | Реализовано: `PasswordRecoveryDeliveryScheduler` and runtime factory; server starts/stops scheduler with HTTP lifecycle. | Admin visibility later if needed. |
| Retry/failure hygiene | Failed sends retry without persisting secrets. | Реализовано: sent/requeued/failed states and sanitizer for email, phone and reset-token shaped values. | Dead-letter review later. |
| Production readiness | 10k review, env, compose and guards updated. | Реализовано: production config requires enabled worker, `file_spool` and absolute spool dir. | Закрыто в commit `9485bd36`. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2F are committed locally and validation green.
- Backend Phase 2G is committed locally at `9485bd36`; release validation passed.

## Phase 2G Files

- `docs/backend/phase-2g-password-recovery-delivery-runtime.md`
- `apps/api/src/modules/auth/password-recovery-delivery-worker.ts`
- `apps/api/src/modules/auth/password-recovery-delivery-sender.ts`
- `apps/api/src/modules/auth/password-recovery-delivery-scheduler.ts`
- `apps/api/src/modules/auth/password-recovery-delivery-runtime.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/config.ts`
- `apps/api/src/metrics.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `.env.example`
- `.env.production.example`
- `infra/docker-compose.yml`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-self-hosted-infra.mjs`
- `scripts/check-self-hosted-production-runtime.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-production-deploy.md`

## Validation

Passed locally on 2026-05-29:

- `npm run contracts:build`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-delivery-worker.test.ts apps/api/src/modules/auth/password-recovery-delivery-sender.test.ts apps/api/src/modules/auth/password-recovery-delivery-runtime.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`
- `npx tsc -b --noEmit`
- `npm run test:db-migrations`
- `npm run check:self-hosted-db`
- `npm run check:self-hosted-infra`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run test:api`
- `npm run lint`
- `npm run api:build`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 2H: password recovery abuse-control and cleanup policy.

Concrete next function:

- rate-limit password reset request bursts without account enumeration;
- add cleanup/retention policy for expired/used password recovery tokens and
  sent/failed delivery rows;
- keep public responses constant-shape for known and unknown accounts;
- preserve self-contained production direction with no hosted BaaS/Supabase
  production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
