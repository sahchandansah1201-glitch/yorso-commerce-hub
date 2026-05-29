# Backend Phase 2I: Password Recovery Cleanup Runtime

Status: release validation passed
Date: 2026-05-29

## Scope

Phase 2I wires the Phase 2H password recovery cleanup policy into an owned
self-hosted runtime scheduler. It does not add hosted BaaS, Supabase functions,
SaaS email providers or public UI changes.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scheduler | Cleanup должен запускаться вне public request handlers. | Реализовано: `PasswordRecoveryCleanupScheduler` runs `PasswordRecoveryCleanupWorker.runOnce()`, skips overlap and reports success/failure/skipped events. | Добавить queue-age gauges позже, если появится admin visibility. |
| Runtime factory | Worker должен включаться только явной self-hosted config. | Реализовано: `createPasswordRecoveryCleanupRuntime` returns `null` by default and creates scheduler when `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`. | Production keeps it enabled. |
| Server lifecycle | Cleanup должен стартовать/останавливаться вместе с API process. | Реализовано: `createApiServer` starts scheduler on `listening` and stops on `close`. | No request-path coupling. |
| Production guard | Production must fail closed without cleanup runtime. | Реализовано: `assertSelfHostedProductionRuntime` требует `YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true`. | Retention values stay config-owned. |
| Metrics/smoke | Нужна проверка runtime без PII/token labels. | Реализовано: Prometheus metrics `yorso_api_password_recovery_cleanup_worker_*`; auth smoke waits for a cleanup run marker. | Alerting thresholds later. |

## Runtime Config

```env
YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED=true
YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_INTERVAL_MS=3600000
YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_BATCH_SIZE=500
YORSO_PASSWORD_RECOVERY_CLEANUP_DELIVERY_RETENTION_MS=604800000
YORSO_PASSWORD_RECOVERY_CLEANUP_TOKEN_RETENTION_MS=86400000
YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ID=password-recovery-cleanup-worker
```

Local defaults keep the worker disabled. Production examples and Docker Compose
enable it explicitly.

## 10,000 Concurrent-User Review

### Read/Write Profile

- Runtime runs on an interval, not per request.
- Each run executes at most one bounded cleanup batch through
  `cleanupPasswordRecovery`.
- Default batch size is 500 rows for recovery tokens and terminal outbox rows.

### Backpressure Strategy

- Scheduler skips overlapping runs with `already_running`.
- Worker failures are converted into `worker_error` metrics and do not crash
  the API process.
- Cleanup remains outside public auth request handlers, so user-facing latency
  is not tied to retention work.

### Database Indexing And Pagination

- Phase 2H migration `0030_auth_password_recovery_abuse_cleanup.sql` provides:
  - `idx_yorso_auth_password_recovery_cleanup_expired`;
  - `idx_yorso_auth_password_recovery_cleanup_used`;
  - `idx_yorso_auth_password_recovery_outbox_terminal_cleanup`.
- PostgreSQL cleanup uses ordered bounded candidates with `for update skip
  locked`.

### Failure Mode And Graceful Degradation

- Local/dev can leave cleanup disabled for prototype work.
- Production self-hosted config fails closed if cleanup runtime is disabled.
- Runtime failure emits metrics and retries on the next interval.

### Observability And Load-Test Plan

- `yorso_api_password_recovery_cleanup_worker_runs_total` tracks
  success/failure/skipped by worker id and reason.
- `yorso_api_password_recovery_cleanup_worker_rows_total` tracks deleted row
  counts by type.
- Load test plan: seed expired tokens and terminal delivery rows, run multiple
  API replicas, assert skip-locked bounded cleanup, stable public auth latency
  and no duplicate row-processing errors.

## Validation

Release validation passed on 2026-05-29:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-cleanup-scheduler.test.ts apps/api/src/modules/auth/password-recovery-cleanup-runtime.test.ts apps/api/src/modules/auth/password-recovery-cleanup.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts -t "password recovery cleanup|metrics|production config"`
- `npx tsc -b --noEmit`
- `npm run check:self-hosted-infra`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run test:api`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:self-hosted-auth-api:run`
- `npm test`
- `git diff --check`
- `npm run build`

Marker: password recovery cleanup runtime.
