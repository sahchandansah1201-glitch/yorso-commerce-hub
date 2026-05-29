# Backend Phase 2A: Registration-To-Account Source Of Truth

Status: implemented locally, release validation passed.

Date: 2026-05-29

## Scope

Phase 2A moves the public registration funnel from frontend-only prototype
state to a self-hosted backend source of truth when `VITE_YORSO_API_URL` is
configured.

The change does not remove the API-disabled Lovable/local preview path. It
keeps the existing mock registration contract only when the self-hosted API is
not configured.

Out of scope:

- external email/SMS delivery provider integration;
- full password recovery hardening;
- product-wide removal of every legacy Supabase/prototype reference;
- public visual redesign of the registration funnel.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Backend registration draft | Registration steps must be stored server-side, not only in browser `sessionStorage`. | Added `yorso_registration_drafts` and `/v1/auth/register/*` endpoints for start, email verify, details, phone send/verify, onboarding, markets and complete. | Delivery outbox is handled by Phase 2B. | `packages/db/migrations/0026_registration_account_source.sql`, `apps/api/src/modules/auth/routes.ts`. |
| Account creation source | Registration completion must create the account workspace in owned storage. | Completion creates user, auth credential, company, company media row, roles, notification defaults, optional target-market meta-region and auth session. | Expand workspace initialization only with real buyer/supplier onboarding requirements. | `apps/api/src/modules/auth/postgres-repository.ts`, memory server test. |
| Frontend API boundary | `/register/*` must call self-hosted backend when API URL exists. | `authApi` routes registration calls to `/v1/auth/register/*` under `VITE_YORSO_API_URL`; mock remains only API-disabled preview. | Remove preview fallback only if Lovable/local demo mode is retired. | `src/lib/api-contracts.ts`, `api-contracts.registration.test.ts`. |
| Signed-in result | Completed buyer registration must produce a usable self-hosted session. | `RegisterReady` stores the backend session in buyer session storage with `source: "self_hosted"` and `userId`; self-hosted completion failures are fail-closed. | Later auth hardening can move the browser bridge to httpOnly cookies. | `src/pages/register/RegisterReady.tsx`. |
| Phase 1 safeguards | Account authority, access gating, redaction and public UX safeguards must remain intact. | No public catalog/supplier/offer access logic changed; account workspace reads still use Phase 1I aggregate snapshot. | Keep Batch #110-#141 safeguards in future batches. | Targeted registration/auth/API tests. |

## Runtime Contract

Self-hosted mode:

- `POST /v1/auth/register/start`
- `POST /v1/auth/register/verify-email`
- `POST /v1/auth/register/details`
- `POST /v1/auth/register/phone/send`
- `POST /v1/auth/register/phone/verify`
- `POST /v1/auth/register/onboarding`
- `POST /v1/auth/register/markets`
- `POST /v1/auth/register/complete`

Preview mode:

- existing mock `authApi` registration functions remain available only when
  `VITE_YORSO_API_URL` is not configured.

## Data Ownership

Backend-owned after Phase 2A:

- registration draft session;
- email verification state;
- phone verification state;
- name, company, country, VAT/TIN and password secret;
- onboarding categories, certifications, target countries and volume;
- final user profile, company profile, roles, notification defaults and auth
  session.

Browser-owned after Phase 2A:

- temporary form state for UX continuity;
- analytics attribution context;
- API-disabled preview mock state.

Browser storage is not the production source of truth for created accounts.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Registration is write-heavy compared with account entry but bounded by the
  funnel sequence.
- Start creates one draft row.
- Intermediate steps update one draft row by primary key.
- Complete performs one atomic account creation statement in PostgreSQL.

Cache, queue and backpressure strategy:

- No polling, subscription or external hosted BaaS dependency is introduced.
- Verification code request count is stored on the draft and capped.
- Request body/schema validation remains the first backpressure boundary.
- Delivery outbox is handled by Phase 2B; worker/provider delivery remains a
  separate self-hosted infrastructure decision.

Database indexing and pagination strategy:

- `yorso_registration_drafts.id` is the primary write path.
- `idx_yorso_registration_drafts_email_recent` supports duplicate/account
  support checks.
- `idx_yorso_registration_drafts_active_expiry` supports cleanup of expired
  drafts.
- Account completion relies on existing user/company/session indexes plus the
  new draft indexes.

Failure mode and graceful degradation:

- Existing account email returns conflict.
- Expired or missing registration draft returns a registration session error.
- Invalid verification code fails the step and does not create an account.
- Self-hosted completion failure does not silently create a local buyer
  session.
- API-disabled preview keeps the previous mock behavior.

Observability and load-test plan:

- Track start/verify/details/complete status code distribution and p95/p99
  latency.
- Track registration completion failure reasons without logging codes,
  passwords, full phone numbers or credentials.
- Load-test draft creation, verification updates and completion under 10,000
  concurrent-user pressure with duplicate email and expired draft mixes.

## Validation

Passed locally:

- `npm run contracts:build`;
- `npx vitest run src/lib/api-contracts.registration.test.ts`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts --testNamePattern "registration funnel|auth sessions"`;
- `npx vitest run src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/lib/auth-runtime.test.ts`;
- `npx tsc -b --noEmit`;
- `npm run test:db-migrations`;
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
