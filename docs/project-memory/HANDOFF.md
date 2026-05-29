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

Backend Phase 2H Password Recovery Abuse-Control And Cleanup Policy is
committed locally at `8a8ac50f`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Rate limit | Ограничить burst-запросы password reset без раскрытия, есть ли аккаунт. | Реализовано: `requestPasswordReset` вызывает `AuthRateLimiter` до lookup пользователя; known/unknown идут через одинаковый публичный ответ до лимита. | Наблюдать метрики и security events. |
| Security event | Зафиксировать отдельное событие для rate-limit. | Реализовано: `password_reset_rate_limited` добавлен в contracts и migration 0030. | Использовать в будущей admin/security visibility. |
| Cleanup policy | Удалять expired/used reset tokens и terminal delivery rows ограниченными batch'ами. | Реализовано: `cleanupPasswordRecovery` в memory/Postgres и `PasswordRecoveryCleanupWorker` с retention cutoffs. | Phase 2I: подключить cleanup runtime/scheduler/CLI. |
| DB indexes | Поддержать bounded cleanup при росте данных. | Реализовано: migration `0030_auth_password_recovery_abuse_cleanup.sql` добавляет cleanup indexes. | Мониторить volume после подключения runtime. |
| Guards/docs | Зафиксировать env, smoke, 10k review и self-hosted boundary. | Реализовано: env examples, compose, guards, smoke, deploy/policy/validation docs обновлены. | Закрыто в commit `8a8ac50f`. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2G are committed locally and validation green.
- Backend Phase 2H is committed locally at `8a8ac50f`; release validation passed.

## Phase 2H Files

- `docs/backend/phase-2h-password-recovery-abuse-cleanup.md`
- `apps/api/src/modules/auth/rate-limit.ts`
- `apps/api/src/modules/auth/rate-limit.test.ts`
- `apps/api/src/modules/auth/password-recovery-cleanup.ts`
- `apps/api/src/modules/auth/password-recovery-cleanup.test.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/auth/observability.test.ts`
- `packages/contracts/src/auth.ts`
- `packages/db/migrations/0030_auth_password_recovery_abuse_cleanup.sql`
- `packages/db/migration-manifest.json`
- `.env.example`
- `.env.production.example`
- `infra/docker-compose.yml`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-self-hosted-db.mjs`
- `scripts/check-self-hosted-infra.mjs`
- `scripts/check-self-hosted-production-runtime.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `scripts/smoke-self-hosted-auth-api.mjs`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-auth-api-smoke.md`
- `docs/backend/self-hosted-production-deploy.md`
- `docs/backend/self-hosted-production-policy.md`
- `docs/backend/self-hosted-validation.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/modules/auth/observability.test.ts apps/api/src/server.test.ts -t "password reset|rate limiters|cleanup policy|auth observability"`
- `npm run contracts:build`
- `npm run test:db-migrations`
- `npm run check:self-hosted-db`
- `npm run check:self-hosted-infra`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
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

Backend Phase 2I: password recovery cleanup runtime/scheduler path.

Concrete next function:

- wire `PasswordRecoveryCleanupWorker` into an owned maintenance runtime,
  scheduler or explicit CLI command;
- add production config for retention limits if runtime-level override is
  required;
- add smoke/guard coverage proving cleanup runs outside public request handlers;
- preserve no hosted BaaS/Supabase production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
