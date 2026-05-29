# Backend Phase 2C: Registration Verification Worker Lease Processing

Status: implemented locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2C adds the internal worker boundary for processing registration
verification delivery jobs from `yorso_registration_delivery_outbox`.

The worker leases bounded ready rows, passes them to an injectable self-hosted
sender, and then marks each row `sent`, requeues it for retry, or marks it
`failed` when the retry budget is exhausted.

This batch does not auto-start a daemon and does not add an external email/SMS
provider. It creates the safe processing contract that a self-hosted worker
runtime can call.

Out of scope:

- hosted email/SMS provider integration;
- always-on worker process supervisor;
- admin delivery console;
- changing verification code generation;
- changing public registration UI.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Lease queued jobs | Worker must claim a bounded batch without scanning or double-processing the queue. | Added `leaseRegistrationDeliveryJobs({ limit, workerId, leaseMs })`; PostgreSQL uses ordered `for update skip locked` and memory runtime mirrors it. Expired/completed drafts are not leased. | Add runtime scheduler only after delivery provider/config decision. | `apps/api/src/modules/auth/repository.ts`, `apps/api/src/modules/auth/postgres-repository.ts`. |
| Send boundary | Delivery processing must use an injectable self-hosted sender rather than hardcoding a hosted provider. | Added `RegistrationDeliveryWorker` with `RegistrationVerificationDeliverySender` interface. | Implement SMTP/SMS/self-hosted gateway sender in a separate scoped workstream. | `apps/api/src/modules/auth/delivery-worker.ts`. |
| Sent state | Successful sender call must mark the outbox row sent. | Added `markRegistrationDeliverySent`; worker increments `sent` count only after repository confirms `status='sent'`. | Add metrics once worker runtime is attached. | `delivery-worker.test.ts`. |
| Retry/failure state | Failed sender call must not lose the job or loop forever. | Added `markRegistrationDeliveryFailed`; jobs requeue until `max_attempts`, then become `failed`. | Add operator alerting for terminal failures. | `delivery-worker.test.ts`. |
| Contact/code hygiene | Worker payload must not leak verification code or log raw contact. | Worker message carries destination for internal sender only and no `code`/`verificationCode` property; error text is sanitized before persistence. | Keep same hygiene in provider and admin surfaces. | `delivery-worker.test.ts`. |

## Worker Contract

The worker is intentionally not started by `createApiServer`.

Runtime owners can instantiate it with:

```ts
const worker = new RegistrationDeliveryWorker(repository, sender);
await worker.processBatch({
  leaseMs: 60_000,
  limit: 25,
  retryAfterMs: 60_000,
  workerId: "registration-delivery-worker-1",
});
```

The `sender` is self-hosted and injectable:

```ts
interface RegistrationVerificationDeliverySender {
  send(message: RegistrationVerificationDeliveryMessage): Promise<void>;
}
```

The message includes:

- delivery id;
- draft id;
- purpose;
- channel;
- backend-only destination;
- masked destination preview;
- template key.

The message does not include:

- verification code;
- provider credentials;
- browser session;
- access tokens.

## Data Ownership

Phase 2C uses existing Phase 2B fields:

- `status`;
- `attempt_count`;
- `max_attempts`;
- `available_at`;
- `locked_at`;
- `locked_by`;
- `last_error`;
- `updated_at`.

No new migration is required for this batch.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Each worker batch leases up to `limit` ready rows.
- Each leased row receives one sender call and one terminal/retry write.
- Worker reads are bounded; browser routes are unaffected.

Cache, queue and backpressure strategy:

- `limit` bounds batch size.
- `leaseMs` prevents duplicate active processing and allows later stale-lease
  recovery.
- `retryAfterMs`, `attempt_count` and `max_attempts` prevent hot retry loops.
- Sender remains injectable so production can choose self-hosted SMTP/SMS
  infrastructure without changing registration API routes.

Database indexing and pagination strategy:

- Lease query uses `idx_yorso_registration_delivery_outbox_ready`.
- PostgreSQL path uses `for update skip locked`.
- Worker must run multiple bounded batches instead of unbounded queue scans.

Failure mode and graceful degradation:

- Sender failure requeues the job until retry budget is exhausted.
- Exhausted job becomes `failed`; it is not retried forever.
- Error text is sanitized before persistence.
- If no worker is running, registration still records durable `queued`
  delivery intent and the queue remains inspectable.

Observability and load-test plan:

- Track leased/sent/requeued/failed counts per worker batch.
- Track queued job age and terminal failure count when a runtime scheduler is
  added.
- Load-test lease contention with multiple workers and 10,000 concurrent-user
  registration pressure.
- Verify no logs or persisted errors contain verification codes or raw contact
  values.

## Validation

Passed locally:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-production-runtime`;
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
