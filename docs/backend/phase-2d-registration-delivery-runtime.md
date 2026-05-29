# Backend Phase 2D: Registration Delivery Runtime

Status: committed locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2D turns the Phase 2C worker contract into an owned runtime path.

This batch chooses the first self-hosted sender decision: `file_spool`. The API
process can run a background scheduler that leases registration delivery jobs,
writes delivery handoff files to an owned local directory, and records worker
metrics without blocking public registration routes.

This is not a hosted email, SMS or WhatsApp provider integration. The file
spool is the owned delivery handoff boundary for an operator-controlled or
later self-hosted channel adapter.

Out of scope:

- hosted email/SMS/WhatsApp provider integration;
- changing registration OTP generation/verification policy;
- exposing verification codes in public API responses;
- admin delivery console;
- public registration UI changes.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Sender decision | Pick the first self-hosted delivery adapter boundary without adding SaaS/provider coupling. | Added `FileSpoolRegistrationVerificationSender`; it writes durable JSON handoff files with `0600` permissions under `YORSO_REGISTRATION_DELIVERY_SPOOL_DIR`. | Add a dedicated SMTP/SMS/WhatsApp adapter only if it remains self-hosted or operator-owned. | `apps/api/src/modules/auth/delivery-sender.ts`, `delivery-sender.test.ts`. |
| Runtime scheduler | Worker must run outside request handlers and avoid overlapping batches. | Added `RegistrationDeliveryScheduler` with `start`, `stop`, `runOnce`, no-overlap guard and bounded worker options. | Add separate process mode only if API-process scheduler becomes operationally too coupled. | `delivery-scheduler.ts`, `delivery-scheduler.test.ts`. |
| Server wiring | Runtime should be opt-in locally and required for production self-hosted config. | `createApiServer` creates the scheduler when `YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true`, starts it on server `listening`, and stops it on `close`. | Add admin/runtime visibility for scheduler snapshot if needed. | `server.ts`, `delivery-runtime.test.ts`. |
| Production guard | Production must fail closed if registration delivery runtime is disabled or not self-hosted. | `assertSelfHostedProductionRuntime` requires worker enabled, `file_spool` sender and absolute spool dir in production. | Add sender-specific readiness once non-file adapters exist. | `config.ts`, `server.test.ts`. |
| Metrics | Runtime must expose batch outcomes without contact leakage. | Metrics now track worker runs and job counts by result/worker id; no destination, email or phone labels. | Add queued-age gauges after repository queue stats exist. | `metrics.ts`, `metrics.test.ts`. |
| Infra/env | Deployment must mount an owned spool volume and document env knobs. | `.env.example`, `.env.production.example`, `infra/docker-compose.yml` and guard scripts include delivery runtime settings. | Size and retention policy for spool files remains an operator runbook item. | `check:self-hosted-infra`, `check:self-hosted-production-runtime`. |

## Runtime Config

Local default:

- `YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=false`
- `YORSO_REGISTRATION_DELIVERY_SENDER=disabled`
- `YORSO_REGISTRATION_DELIVERY_SPOOL_DIR=.data/registration-delivery`

Production self-hosted requirement:

- `YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED=true`
- `YORSO_REGISTRATION_DELIVERY_SENDER=file_spool`
- `YORSO_REGISTRATION_DELIVERY_SPOOL_DIR=/var/lib/yorso/registration-delivery`

Scheduler controls:

- `YORSO_REGISTRATION_DELIVERY_WORKER_INTERVAL_MS`
- `YORSO_REGISTRATION_DELIVERY_WORKER_BATCH_SIZE`
- `YORSO_REGISTRATION_DELIVERY_WORKER_LEASE_MS`
- `YORSO_REGISTRATION_DELIVERY_WORKER_RETRY_AFTER_MS`
- `YORSO_REGISTRATION_DELIVERY_WORKER_ID`

## File Spool Contract

Each successful send writes one JSON file:

- schema version;
- delivery id;
- draft id;
- purpose;
- channel;
- backend-only destination;
- masked destination preview;
- template key;
- operator-readable subject/text;
- creation timestamp.

The file is not browser-visible and is not written to console logs. The current
Phase 2D sender does not add provider credentials or hosted BaaS dependencies.

## OTP Policy Boundary

Phase 2D intentionally does not change registration code generation. The
current registration verification policy remains owned by `AuthService`.

This means Phase 2D solves worker scheduling and self-hosted delivery handoff,
not final email/SMS channel delivery semantics. A later scoped phase should
replace the existing fixed-code prototype policy with per-request generated
codes before treating registration delivery as externally production-ready.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Public registration requests write outbox rows as before.
- Scheduler wakes every configured interval and processes at most batch-size
  jobs.
- Each job still has one lease write and one terminal/retry write.
- File-spool sender performs one local filesystem write per sent job.

Cache, queue and backpressure strategy:

- Batch size, interval, lease timeout and retry delay bound worker pressure.
- Scheduler skips overlapping runs rather than stacking concurrent batches.
- Production uses PostgreSQL as queue authority and a mounted local spool
  volume as delivery handoff storage.
- No browser polling, Supabase function, SaaS provider queue or unbounded scan
  is introduced.

Database indexing and pagination strategy:

- Phase 2C ready index and `for update skip locked` lease path remain the queue
  read strategy.
- Runtime uses repeated bounded batches instead of pagination over the full
  outbox.

Failure mode and graceful degradation:

- If the file spool is unavailable, sender throws; Phase 2C retry/failure
  semantics requeue the job or mark it failed after retry exhaustion.
- Scheduler catches batch failures and emits failure metrics without crashing
  the API process.
- Server shutdown stops the scheduler through the HTTP server close lifecycle.

Observability and load-test plan:

- Prometheus metrics track scheduler run outcome and job counts by result.
- Metrics do not label email, phone, draft id or delivery destination.
- Load-test registration pressure with worker enabled and file-spool volume
  mounted, then verify queue age, terminal failures and spool write latency.

## Validation

Passed locally:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run check:self-hosted-infra`;
- `npm run check:self-hosted-production-runtime`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-api`.

- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:self-hosted-api`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Known non-blocking warnings preserved:

- Supabase generated types out of sync in non-strict preview/build mode;
- Browserslist data stale.

Production build metrics:

- CSS `index-DbM2SN9t.css` 126.84 kB / 21.02 kB gzip.
- Entry `index-BqYFae4R.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.
