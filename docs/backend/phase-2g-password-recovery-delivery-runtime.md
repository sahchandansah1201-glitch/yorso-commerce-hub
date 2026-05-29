# Backend Phase 2G: Password Recovery Delivery Runtime

Status: implemented locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2G turns the Phase 2F password recovery outbox into an owned delivery
runtime. The API process can run a bounded background scheduler that leases
queued password recovery deliveries, decrypts sealed reset-token material only
after lease, writes a local file-spool handoff, and records metrics without
blocking public reset request routes.

This is not a hosted email provider integration. `file_spool` is the
self-hosted operator handoff boundary for a later owned channel adapter.

Out of scope:

- hosted email provider integration;
- changing password policy or KDF strategy;
- changing reset-password UI copy;
- exposing reset tokens in browser-visible API responses;
- admin delivery console;
- cleanup job for expired password recovery tokens.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Worker leasing | Password recovery deliveries must be processed through bounded queue leases. | Added `leasePasswordRecoveryDeliveryJobs`; PostgreSQL uses ordered `for update skip locked`, excludes expired/used recoveries, and decrypts sealed token material only for leased jobs. | Queue-age stats can be added later. | `repository.ts`, `postgres-repository.ts`, `password-recovery-delivery-worker.test.ts`. |
| Sender decision | First delivery adapter must be self-hosted and provider-neutral. | Added `FileSpoolPasswordRecoverySender`; it writes one `0600` JSON handoff file with reset URL/token under `YORSO_PASSWORD_RECOVERY_DELIVERY_SPOOL_DIR`. | Add SMTP only if it remains self-hosted/operator-owned. | `password-recovery-delivery-sender.ts`, sender test. |
| Runtime scheduler | Worker must run outside request handlers and avoid overlapping batches. | Added `PasswordRecoveryDeliveryScheduler` with `start`, `stop`, `runOnce`, no-overlap guard and bounded worker options. | Separate process mode only if needed operationally. | `password-recovery-delivery-scheduler.ts`, runtime test. |
| Server wiring | Runtime should be opt-in locally and required in production. | `createApiServer` creates password recovery delivery runtime when enabled and starts/stops it with the HTTP server lifecycle. | Admin/runtime visibility can be added later. | `server.ts`, runtime test. |
| Production guard | Production must fail closed without owned recovery delivery runtime. | `assertSelfHostedProductionRuntime` requires worker enabled, `file_spool` sender and absolute spool dir. | Add sender-specific readiness when non-file adapters exist. | `config.ts`, `server.test.ts`. |
| Metrics | Runtime must expose batch outcomes without leaking contacts or tokens. | Metrics track run outcomes and job counts by worker id/result only. | Add queue age gauges after repository stats exist. | `metrics.ts`, runtime test. |
| Infra/env | Deployment must mount an owned recovery delivery spool volume. | `.env.example`, `.env.production.example`, `infra/docker-compose.yml` and guards include password recovery delivery runtime settings. | Retention policy for spool files remains operator runbook work. | `check:self-hosted-infra`, `check:self-hosted-production-runtime`. |

## Runtime Config

Local default:

- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_ENABLED=false`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_SENDER=disabled`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_SPOOL_DIR=.data/password-recovery-delivery`

Production self-hosted requirement:

- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_ENABLED=true`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_SENDER=file_spool`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_SPOOL_DIR=/var/lib/yorso/password-recovery-delivery`

Scheduler controls:

- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_INTERVAL_MS`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_BATCH_SIZE`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_LEASE_MS`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_RETRY_AFTER_MS`
- `YORSO_PASSWORD_RECOVERY_DELIVERY_WORKER_ID`

## File Spool Contract

Each successful send writes one JSON file:

- schema version;
- delivery id;
- recovery id;
- backend-only destination;
- masked destination preview;
- template key;
- reset URL;
- recovery token for the owned operator/channel handoff;
- operator-readable subject/text;
- creation timestamp.

The file is not browser-visible and is not written to console logs. It does not
include provider credentials or hosted BaaS metadata.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Public reset requests keep the Phase 2F write profile: known accounts create
  one token row, one outbox row and one security event.
- Scheduler wakes every configured interval and processes at most batch-size
  jobs.
- Each job has one lease write and one terminal/retry write.
- File-spool sender performs one local filesystem write per sent job.

Cache, queue and backpressure strategy:

- Batch size, interval, lease timeout and retry delay bound worker pressure.
- Scheduler skips overlapping runs rather than stacking concurrent batches.
- PostgreSQL remains the queue authority; mounted local spool storage is the
  owned delivery handoff.
- No browser polling, hosted email provider, Supabase function or unbounded
  scan is introduced.

Database indexing and pagination strategy:

- `idx_yorso_auth_password_recovery_outbox_ready` backs ready-queue scans.
- PostgreSQL leasing uses bounded ordered candidates with `for update skip
  locked`.
- Expired or already-used recovery tokens are excluded before delivery.
- Runtime uses repeated bounded batches instead of paginating over the full
  outbox.

Failure mode and graceful degradation:

- If the file spool is unavailable, sender throws; worker requeues until retry
  exhaustion, then marks the row failed.
- Sender errors are sanitized before persistence and remove email, phone and
  reset-token shaped values.
- Scheduler catches batch-level failures and emits failure metrics without
  crashing the API process.
- Server shutdown stops the scheduler through the HTTP server close lifecycle.

Observability and load-test plan:

- Prometheus metrics track scheduler run outcome and job counts by result.
- Metrics do not label email, destination, recovery id or reset token.
- Load-test password reset bursts with known/unknown accounts, worker enabled
  and file-spool volume mounted; verify queue age, terminal failures, spool
  write latency and reset completion p95.

## Validation

Passed locally:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/password-recovery-delivery-worker.test.ts apps/api/src/modules/auth/password-recovery-delivery-sender.test.ts apps/api/src/modules/auth/password-recovery-delivery-runtime.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run test:db-migrations`;
- `npm run check:self-hosted-db`;
- `npm run check:self-hosted-infra`;
- `npm run check:self-hosted-production-runtime`;
- `npm run check:self-hosted-api`;
- `npm run check:production-scale-baseline`;
- `npm run test:api`;
- `npm run lint`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Known non-blocking warnings preserved:

- Supabase generated types out of sync in non-strict preview/build mode;
- Browserslist data stale.

Marker: Backend Phase 2G.
Marker: password recovery delivery runtime.
Marker: file_spool sender.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
