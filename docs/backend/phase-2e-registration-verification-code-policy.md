# Backend Phase 2E: Registration Verification Code Policy

Status: implemented locally, full release validation passed.

Date: 2026-05-29

## Scope

Phase 2E replaces the fixed prototype registration verification code with
per-request generated OTP codes owned by the self-hosted API.

The backend now:

- issues a fresh numeric code for each email verification start and phone
  verification request;
- stores only hashed code secrets on registration drafts;
- stores sealed backend-only code material on the delivery outbox for the
  Phase 2D worker/sender handoff;
- enforces code expiry and failed-attempt limits before marking email or phone
  verified;
- keeps browser-visible registration responses limited to masked delivery
  metadata.

Out of scope:

- hosted email/SMS/WhatsApp provider integration;
- admin delivery console;
- changing the public registration page layout;
- moving the scheduler to a separate process.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Per-request OTP | Убрать фиксированный backend-код `123456` из self-hosted registration flow. | `RegistrationVerificationCodeIssuer` выпускает новый 6-значный numeric code на каждый email/phone request; tests inject deterministic codes only for validation. | Оставить `123456` только в API-disabled local mock preview. | `apps/api/src/modules/auth/verification-code.ts`, `apps/api/src/server.test.ts`. |
| Draft secret storage | Не хранить plain OTP в registration draft. | Draft сохраняет `emailCodeSecret` / `phoneCodeSecret` как salted SHA-256 secret; verification compares through existing safe password-secret path. | При отдельном security pass заменить SHA-256 helper на KDF/pepper policy, если понадобится. | `verification-code.test.ts`, `AuthService.verifyRegistrationEmail`, `verifyRegistrationPhone`. |
| Expiry policy | Код должен истекать независимо от 24h draft TTL. | Migration `0028` добавляет `email_code_expires_at` / `phone_code_expires_at`; service returns `registration_code_expired` after TTL. | Если продукту понадобится resend UX copy, добавить отдельный UI text batch. | `apps/api/src/server.test.ts`. |
| Attempt policy | Wrong-code attempts должны блокироваться до успешного ввода. | Migration `0028` добавляет attempt counters; service increments on wrong code and returns `registration_rate_limited` after max attempts. | Consider IP/device-level OTP attempt policy after basic account creation is fully self-hosted. | `apps/api/src/server.test.ts`. |
| Worker handoff | Delivery worker должен получить code без public/browser leak. | Outbox stores `verification_code_sealed`; Postgres repository decrypts only when leasing worker jobs; file-spool payload includes `verificationCode` for owned operator/channel handoff. | Add a real owned channel adapter later without changing public API responses. | `postgres-repository.ts`, `delivery-worker.test.ts`, `delivery-sender.test.ts`. |
| Browser hygiene | Registration responses must not include raw OTP or full contact. | Start/phone-send responses still return only session id, expiry, masked preview and delivery metadata; tests assert the generated code is absent. | Keep the same rule for any future sender/provider adapter. | `apps/api/src/server.test.ts`, `src/lib/api-contracts.ts`. |
| Error hygiene | Sender failures must not persist OTP/contact values. | Delivery worker sanitizes email, phone and 4-8 digit verification codes before storing retry errors. | Keep sanitizer in place when adding non-file adapters. | `apps/api/src/modules/auth/delivery-worker.test.ts`. |
| Production secret | Sealed delivery material must use an operator-owned secret. | `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET` is required by config and cannot use the local default in production. | Rotate per environment through the deployment secret manager. | `config.ts`, `.env.production.example`, `docker-compose.yml`, guard scripts. |
| Dev UX | Self-hosted dev mode must not auto-submit prototype `123456`. | Register verify dev-skip remains available only in API-disabled local mock mode. | If needed, add a local operator-only test helper endpoint, not a browser-visible code leak. | `src/pages/register/RegisterVerify.tsx`. |

## Runtime Contract

Public registration responses:

- may include `sessionId`;
- may include `expiresInSeconds`;
- may include delivery id, purpose, channel, status and masked destination
  preview;
- must not include generated OTP;
- must not include full email or full phone number.

Backend delivery job handoff:

- includes backend-only destination;
- includes masked destination preview;
- includes template key;
- includes `verificationCode` for the owned file-spool/operator channel;
- is not exposed through browser routes or public API responses.

## Data Model

Migration `0028_registration_verification_code_policy.sql` adds:

- `yorso_registration_drafts.email_code_expires_at`;
- `yorso_registration_drafts.email_code_attempt_count`;
- `yorso_registration_drafts.phone_code_expires_at`;
- `yorso_registration_drafts.phone_code_attempt_count`;
- `yorso_registration_delivery_outbox.verification_code_sealed`.

New indexes:

- `idx_yorso_registration_drafts_email_code_expiry`;
- `idx_yorso_registration_drafts_phone_code_expiry`.

The delivery lease query only selects rows with non-null
`verification_code_sealed`; old queued rows without sealed material are not
picked by the Phase 2E worker path.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Registration start: one user lookup, one draft insert, one outbox insert.
- Email verify: one draft read and either one attempt-counter update or one
  verification timestamp update.
- Phone request: one draft read, one draft update and one outbox insert.
- Phone verify: one draft read and either one attempt-counter update or one
  verification timestamp update.
- Worker lease: bounded outbox lease batches with decrypt-at-lease time only.

Cache, queue and backpressure strategy:

- OTP generation is local CPU work, no remote service call.
- Delivery remains bounded by Phase 2D scheduler interval, batch size, lease
  timeout and retry delay.
- Rate limiting for sign-in remains separate; OTP attempt counters are durable
  per registration draft.
- Production requires Redis/session cache/rate limit config from earlier phases
  and a non-default code sealing secret.

Database indexing and pagination strategy:

- Draft lookup remains primary-key based by registration session id.
- Expiry indexes support future cleanup/ops scans without touching active
  verified drafts.
- Outbox worker uses the existing ready index and `for update skip locked`
  bounded lease path; no full-table pagination is introduced.

Failure mode and graceful degradation:

- Invalid code returns `registration_invalid_code` until max attempts.
- Expired code returns `registration_code_expired`.
- Max wrong attempts returns `registration_rate_limited`; correct codes remain
  blocked after the attempt ceiling.
- If the code sealing secret is missing or default in production, API startup
  fails through config validation/production guard.
- If a delivery job lacks sealed code material, the worker does not lease it.
- Sender failure errors are sanitized before persistence and redact email,
  phone and verification-code shaped values.

Observability and load-test plan:

- Current metrics continue to track delivery worker outcomes without contact
  labels.
- Security/audit logs must not include OTP, full email or full phone.
- Load-test 10,000 concurrent-user registration starts plus phone requests and
  verify p95 latency, outbox queue age, attempt-counter write pressure and
  spool write latency.

## Validation

Passed locally:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/verification-code.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/server.test.ts`
- `npx tsc -b --noEmit`;
- `npm run contracts:build`;
- `npm run test:db-migrations`;
- `npm run check:self-hosted-infra`;
- `npm run check:self-hosted-production-runtime`;
- `npm run check:production-scale-baseline`;
- `npm run check:self-hosted-api`;
- `npx vitest run src/lib/api-contracts.registration.test.ts src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/i18n/locale-register-substeps-ru.test.tsx`;
- `npm run lint`;
- `npm run api:build`;
- `git diff --check`;
- `npm run build`.

Known warnings to preserve unless a scoped remediation is approved:

- Supabase generated types out of sync in non-strict preview/build mode;
- Browserslist data stale.

Marker: Backend Phase 2E.
Marker: registration verification code policy.
Marker: sealed verification code handoff.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
