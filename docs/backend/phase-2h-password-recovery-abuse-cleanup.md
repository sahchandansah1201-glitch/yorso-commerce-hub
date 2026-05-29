# Backend Phase 2H: Password Recovery Abuse-Control And Cleanup Policy

Status: implemented locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2H closes the immediate abuse-control and retention gap after Phase 2F
and Phase 2G. Password reset requests now use a dedicated self-hosted
rate-limit path before account lookup, and password recovery token/outbox data
has a bounded cleanup policy for expired, used and terminal delivery rows.

This does not add a hosted email provider, Supabase function, hosted BaaS,
public UI change, password policy change or admin cleanup console.

## Plan / Fact

| Пункт плана | Что реализуется | Факт реализации | Что будет реализовано дальше | Проверка |
|---|---|---|---|---|
| Request abuse-control | Ограничить burst-запросы `/v1/auth/password-reset/request` без раскрытия существования аккаунта. | Реализовано: `AuthRateLimiter` получил `checkPasswordReset` и `recordPasswordReset`; `AuthService.requestPasswordReset` проверяет лимит до `findUserByEmail`. | При необходимости добавить отдельные admin-графики по reset pressure. | `rate-limit.test.ts`, `server.test.ts`. |
| Constant-shape response | Known и unknown account не должны отличаться в успешном public response. | Реализовано: разрешённые known/unknown запросы возвращают одинаковую generic success shape; заблокированный burst отдаёт общий `auth_rate_limited` без email. | Текст public UI не менялся. | `server.test.ts`. |
| Audit/telemetry | Rate-limit событие должно быть доменным, без PII/token labels. | Реализовано: добавлен security event `password_reset_rate_limited`; telemetry event `auth.password_reset.rate_limited` пишет источник/лимит/окно, но не token/email labels. | Метрики по отдельным buckets можно добавить после admin observability decision. | `packages/contracts/src/auth.ts`, `0030_auth_password_recovery_abuse_cleanup.sql`, `service.ts`. |
| Cleanup policy | Удалять expired/used recovery tokens и старые terminal delivery rows bounded batches. | Реализовано: `cleanupPasswordRecovery` в repository contract, Memory/Postgres реализация, `PasswordRecoveryCleanupWorker` с retention cutoffs. | Scheduler/CLI можно добавить отдельным Phase, если нужен автоматический operator job. | `password-recovery-cleanup.test.ts`, `postgres-repository.ts`. |
| Database indexes | Cleanup не должен сканировать полные таблицы на 10k baseline. | Реализовано: migration `0030_auth_password_recovery_abuse_cleanup.sql` добавляет indexes для expired, used и terminal outbox cleanup. | Live PostgreSQL explain/load check после появления staging dataset. | `check:self-hosted-db`. |
| Config/infra | Password reset limiter должен иметь явные env controls. | Реализовано: `AUTH_PASSWORD_RESET_WINDOW_MS` и `AUTH_PASSWORD_RESET_MAX_REQUESTS` добавлены в config, env examples, docker compose и production guard scripts. | Production values tune by traffic. | `check:self-hosted-production-runtime`, `check:self-hosted-infra`. |

## Runtime Config

Local defaults:

- `AUTH_PASSWORD_RESET_WINDOW_MS=900000`
- `AUTH_PASSWORD_RESET_MAX_REQUESTS=5`

Production self-hosted requirements:

- `AUTH_RATE_LIMIT_DRIVER=redis`
- `AUTH_RATE_LIMIT_FAIL_MODE=closed`
- `AUTH_PASSWORD_RESET_WINDOW_MS=900000`
- `AUTH_PASSWORD_RESET_MAX_REQUESTS=5`

Cleanup defaults in `PasswordRecoveryCleanupWorker`:

- terminal delivery retention: 7 days;
- expired/used token retention: 24 hours;
- batch limit: 500 rows per run.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Every password reset request performs one rate-limit check before account
  lookup.
- Memory/Redis mode uses hashed email and optional IP buckets. Redis uses one
  `GET`/`INCR` plus TTL per bucket.
- Allowed known-account requests keep Phase 2F writes: one recovery token row,
  one outbox row and one security event.
- Allowed unknown-account requests write only the security event.
- Cleanup performs bounded deletes against indexed candidate sets.

Cache, queue and backpressure strategy:

- Production requires Redis fail-closed rate limiting.
- Password reset limiter has separate window/threshold from sign-in failures.
- IP and email buckets prevent one address from cycling unknown emails without
  changing public response shape.
- Cleanup uses explicit row limits and is not coupled to public request
  handlers.

Database indexing and pagination strategy:

- `idx_yorso_auth_password_recovery_cleanup_expired` supports expired unused
  token cleanup.
- `idx_yorso_auth_password_recovery_cleanup_used` supports cleanup of already
  used tokens after retention.
- `idx_yorso_auth_password_recovery_outbox_terminal_cleanup` supports cleanup
  of `sent`, `failed` and `cancelled` deliveries.
- PostgreSQL cleanup deletes bounded ordered candidate sets and uses `skip
  locked` to avoid blocking concurrent maintenance.

Failure mode and graceful degradation:

- Redis limiter fails closed in production and returns `auth_rate_limited` with
  `Retry-After`.
- Rate-limited password reset requests do not perform account lookup or create
  recovery/outbox rows.
- Successful known/unknown responses remain constant-shape.
- Cleanup failure affects only maintenance; reset request and delivery runtime
  continue to use existing tables.

Observability and load-test plan:

- Auth telemetry emits `auth.password_reset.rate_limited` with rate-limit
  source, count, limit, window and degraded/fail-mode flags.
- Security audit stores `password_reset_rate_limited` for operator review.
- Load test should mix known and unknown emails, repeated IPs, Redis fail-closed
  behavior, delivery worker sends, reset completion and cleanup runs at the
  10,000 concurrent-user baseline.

## Validation

Passed locally:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/rate-limit.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/server.test.ts -t "password reset|rate limiters|cleanup policy"`.
- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npm run check:self-hosted-db`;
- `npm run check:self-hosted-infra`;
- `npm run check:self-hosted-production-runtime`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npm run test:api`;
- `npm test`;
- `npm run lint`;
- `npm run api:build`;
- `npm run smoke:self-hosted-auth-api:run`;
- `git diff --check`;
- `npm run build`.

Known non-blocking warnings preserved:

- Supabase generated types out of sync in non-strict preview/build mode;
- Browserslist data stale.

Marker: Backend Phase 2H.
Marker: password recovery abuse-control.
Marker: cleanupPasswordRecovery.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
