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

Backend Phase 2I Password Recovery Cleanup Runtime is committed locally at
`70d65de6`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scheduler | Запускать password recovery cleanup вне public request handlers. | Реализовано: `PasswordRecoveryCleanupScheduler` вызывает worker, пропускает overlap и пишет success/failure/skipped events. | В будущем можно добавить admin visibility по queue age. |
| Runtime factory | Включать cleanup только явной self-hosted настройкой. | Реализовано: `createPasswordRecoveryCleanupRuntime` возвращает `null` по умолчанию и создаёт scheduler при `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`. | Production должен держать worker включённым. |
| Server lifecycle | Старт/стоп cleanup должен следовать lifecycle API process. | Реализовано: scheduler стартует на `listening` и останавливается на `close`. | Не связывать cleanup с request path. |
| Production guard | Production должен fail closed без cleanup runtime. | Реализовано: `assertSelfHostedProductionRuntime` требует `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`. | Retention остаётся config-owned. |
| Metrics/smoke | Проверить runtime без PII/token labels. | Реализовано: Prometheus metrics и smoke marker `password_recovery_cleanup_runtime_guard=ok`. | Alert thresholds позже. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2H are committed locally and validation green.
- Backend Phase 2I is committed locally at `70d65de6`; release validation passed.

## Phase 2I Files

- `docs/backend/phase-2i-password-recovery-cleanup-runtime.md`
- `apps/api/src/modules/auth/password-recovery-cleanup-scheduler.ts`
- `apps/api/src/modules/auth/password-recovery-cleanup-scheduler.test.ts`
- `apps/api/src/modules/auth/password-recovery-cleanup-runtime.ts`
- `apps/api/src/modules/auth/password-recovery-cleanup-runtime.test.ts`
- `apps/api/src/config.ts`
- `apps/api/src/metrics.ts`
- `apps/api/src/metrics.test.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `.env.example`
- `.env.production.example`
- `infra/docker-compose.yml`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-self-hosted-infra.mjs`
- `scripts/check-self-hosted-production-runtime.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `scripts/smoke-self-hosted-auth-api.mjs`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-auth-api-smoke.md`
- `docs/backend/self-hosted-production-deploy.md`
- `docs/backend/self-hosted-validation.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-cleanup-scheduler.test.ts apps/api/src/modules/auth/password-recovery-cleanup-runtime.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts -t "password recovery cleanup|metrics|production config"`
- `npx tsc -b --noEmit`
- `npm run check:self-hosted-infra`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:self-hosted-auth-api:run`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 2J: auth/registration/password recovery closure audit.

Concrete next function:

- verify Phase 2A-2I registration/auth/password recovery source-of-truth
  runtime as one closed backend surface;
- map remaining Supabase/prototype fallback surfaces and separate production
  blockers from local preview fallback;
- validate production guards, env examples, runtime smoke and docs are aligned;
- produce exact next implementation step after the closure audit;
- preserve no hosted BaaS/Supabase production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
