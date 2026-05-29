# Backend Phase 2B: Registration Verification Delivery Outbox

Status: implemented locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2B adds a self-hosted delivery outbox boundary for registration
verification messages. API-enabled registration no longer reports verification
delivery as a browser-only/mock event: the backend records durable delivery
intent for email, SMS and WhatsApp verification in owned PostgreSQL storage.

This batch does not add a hosted email/SMS provider. It creates the source of
truth and worker boundary that a self-hosted delivery process can consume.

Out of scope:

- external hosted email/SMS provider integration;
- SMTP/SMS worker implementation;
- admin/operator delivery console;
- changing public registration UI copy or layout;
- changing verification code generation policy.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Durable delivery intent | Backend must persist verification delivery jobs instead of treating `emailSent` / `sent` as only a frontend state. | Added `yorso_registration_delivery_outbox` with purpose, channel, status, masked destination preview, destination hash, retry and leasing fields. | Add a self-hosted worker only when delivery infrastructure is selected. | `packages/db/migrations/0027_registration_verification_delivery_outbox.sql`. |
| Email verification outbox | Starting registration should queue an email verification delivery job. | `/v1/auth/register/start` creates the draft and email delivery outbox row in one PostgreSQL CTE; memory runtime mirrors the same contract. | Later worker can join draft by id to resolve actual destination. | `apps/api/src/modules/auth/postgres-repository.ts`, `apps/api/src/modules/auth/repository.ts`. |
| Phone verification outbox | Requesting SMS/WhatsApp verification should queue a channel-specific delivery job. | `/v1/auth/register/phone/send` updates phone verification state and creates a delivery outbox row in one PostgreSQL CTE. | Add lease/worker endpoints or internal worker module in Phase 2C if delivery is selected. | API server registration test. |
| Safe API response | Frontend may know delivery status but must not receive code or full contact. | Start and phone-send responses include `delivery` metadata: id, purpose, channel, status, masked destination preview. They do not return verification code or full email/phone. | Keep raw contact and codes out of logs, UI and public responses. | `apps/api/src/server.test.ts`, `src/lib/api-contracts.registration.test.ts`. |
| Self-contained boundary | Phase 2B must not add Supabase or hosted BaaS coupling. | Migration, service and API remain self-hosted; outbox stores delivery metadata only. | Separate legacy Supabase consolidation remains available as another workstream. | `npm run check:self-hosted-production-runtime`. |

## Runtime Contract

Self-hosted registration responses now include delivery metadata:

```json
{
  "delivery": {
    "id": "uuid",
    "purpose": "email_verification",
    "channel": "email",
    "status": "queued",
    "destinationPreview": "b***@yorso.test"
  }
}
```

For phone verification:

```json
{
  "delivery": {
    "id": "uuid",
    "purpose": "phone_verification",
    "channel": "sms",
    "status": "queued",
    "destinationPreview": "***00"
  }
}
```

The response does not expose:

- verification code;
- full email;
- full phone;
- provider credentials;
- worker lease metadata.

## Data Ownership

Backend-owned after Phase 2B:

- delivery job id;
- registration draft reference;
- purpose: email or phone verification;
- channel: email, SMS or WhatsApp;
- delivery status;
- destination hash;
- masked destination preview;
- template key;
- retry counters and leasing fields.

Not stored in the outbox:

- raw verification code;
- raw email or phone destination;
- provider tokens or credentials.

The future worker can join `yorso_registration_drafts` by `draft_id` to resolve
the actual destination inside backend-only runtime.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Registration start writes one draft row and one outbox row.
- Phone verification request updates one draft row and writes one outbox row.
- Delivery worker reads will use the ready queue index and bounded lease windows.
- No polling or browser subscription is introduced.

Cache, queue and backpressure strategy:

- `phone_code_requests` remains capped on the registration draft.
- Outbox jobs are inserted in the same PostgreSQL statement as the triggering
  registration mutation.
- `status`, `attempt_count`, `max_attempts`, `available_at`, `locked_at` and
  `locked_by` provide the future worker lease/retry contract.
- No external hosted BaaS, Supabase function or provider queue is introduced.

Database indexing and pagination strategy:

- `idx_yorso_registration_delivery_outbox_ready` supports bounded worker scans
  for queued jobs.
- `idx_yorso_registration_delivery_outbox_draft_recent` supports support/debug
  lookup by registration draft without scanning the whole queue.
- `idx_yorso_registration_delivery_outbox_status_recent` supports operational
  status diagnostics.
- Worker reads must page/lease by index, never scan the full outbox.

Failure mode and graceful degradation:

- If delivery outbox persistence fails, the registration step fails instead of
  claiming delivery happened.
- Invalid verification code still fails without creating an account.
- API-disabled preview keeps its mock behavior and is not production source of
  truth.
- No raw destination or code is returned to the browser for debugging.

Observability and load-test plan:

- Track outbox insert success/failure by purpose and channel.
- Track queued job age, attempt counts, worker lease latency and terminal
  failures when a worker is added.
- Load-test registration start and phone-send under 10,000 concurrent-user
  pressure with duplicate-email and rate-limited phone mixes.
- Audit logs must not include verification codes, full destinations or provider
  credentials.

## Validation

Passed locally:

- `npm run contracts:build`;
- `npx vitest run src/lib/api-contracts.registration.test.ts`;
- `npm run test:db-migrations`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
- `npx tsc -b --noEmit`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-production-runtime`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Known non-blocking warnings preserved:

- Supabase generated types are out of sync in non-strict preview/build mode;
- Browserslist data is stale.
