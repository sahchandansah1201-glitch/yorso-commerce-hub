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

Backend Phase 2E Registration Verification Code Policy is implemented locally;
full release validation has passed and commit is pending.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Per-request OTP | Убрать fixed backend OTP `123456` из API-enabled registration. | Реализовано: backend выпускает свежий 6-значный code для email/phone request; tests inject deterministic codes. | Полный release validation и commit. |
| Expiry/attempts | Enforce TTL and wrong-code ceiling. | Реализовано: `email_code_expires_at`, `phone_code_expires_at`, attempt counters, `registration_code_expired`, `registration_rate_limited`. | При необходимости добавить отдельный UI/copy batch для expired/resend state. |
| Delivery handoff | Дать worker/sender code без browser leak. | Реализовано: Postgres outbox хранит `verification_code_sealed`; worker decrypts after lease; file spool gets backend-only `verificationCode`. | Owned SMTP/SMS/WhatsApp adapter остаётся отдельным будущим workstream. |
| Browser hygiene | Не отдавать OTP/full contact в public responses. | Реализовано: responses возвращают только masked delivery metadata; tests assert generated code is absent. | Guard for future sender adapters. |
| Production config | Production должен fail closed без owned sealing secret. | Реализовано: `YORSO_REGISTRATION_VERIFICATION_CODE_SECRET` required and non-default in production. | Secret rotation/runbook отдельно. |
| Validation | Проверить new OTP policy and preserved delivery runtime. | Full release validation passed: targeted auth/server tests, frontend registration tests, TypeScript, contracts, DB migrations, self-hosted guards, lint, API build, diff check and production build. | Commit. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A, 2B and 2C are committed locally and validation green.
- Backend Phase 2D is committed locally and validation green.
- Backend Phase 2E is implemented locally; full validation passed; commit pending.

## Phase 2E Files

- `docs/backend/phase-2e-registration-verification-code-policy.md`
- `apps/api/src/modules/auth/verification-code.ts`
- `apps/api/src/modules/auth/verification-code.test.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/modules/auth/delivery-worker.ts`
- `apps/api/src/modules/auth/delivery-worker.test.ts`
- `apps/api/src/modules/auth/delivery-sender.ts`
- `apps/api/src/modules/auth/delivery-sender.test.ts`
- `apps/api/src/config.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `packages/db/migrations/0028_registration_verification_code_policy.sql`
- `packages/db/migration-manifest.json`
- `src/pages/register/RegisterVerify.tsx`
- `src/lib/api-contracts.ts`
- `.env.example`
- `.env.production.example`
- `infra/docker-compose.yml`
- `scripts/check-self-hosted-infra.mjs`
- `scripts/check-self-hosted-production-runtime.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `scripts/check-self-hosted-api.mjs`

## Phase 2D Files

- `docs/backend/phase-2d-registration-delivery-runtime.md`
- `apps/api/src/modules/auth/delivery-sender.ts`
- `apps/api/src/modules/auth/delivery-sender.test.ts`
- `apps/api/src/modules/auth/delivery-scheduler.ts`
- `apps/api/src/modules/auth/delivery-scheduler.test.ts`
- `apps/api/src/modules/auth/delivery-runtime.ts`
- `apps/api/src/modules/auth/delivery-runtime.test.ts`
- `apps/api/src/metrics.ts`
- `apps/api/src/metrics.test.ts`
- `apps/api/src/config.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `.env.example`
- `.env.production.example`
- `infra/docker-compose.yml`
- `scripts/check-self-hosted-infra.mjs`
- `scripts/check-self-hosted-production-runtime.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/phase-2c-registration-verification-worker-lease.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-production-deploy.md`

## Phase 2C Files

- `docs/backend/phase-2c-registration-verification-worker-lease.md`
- `apps/api/src/modules/auth/delivery-worker.ts`
- `apps/api/src/modules/auth/delivery-worker.test.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/phase-2b-registration-verification-delivery-outbox.md`
- `docs/backend/production-scale-baseline.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/verification-code.test.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/server.test.ts`
- `npx vitest run src/lib/api-contracts.registration.test.ts src/lib/registration-funnel.e2e.test.tsx src/lib/registration-funnel-degraded.e2e.test.tsx src/i18n/locale-register-substeps-ru.test.tsx`
- `npx tsc -b --noEmit`
- `npm run contracts:build`
- `npm run test:db-migrations`
- `npm run check:self-hosted-infra`
- `npm run check:self-hosted-production-runtime`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-api`
- `npm run lint`
- `npm run api:build`
- `git diff --check`
- `npm run build`

Earlier Phase 2D validation:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts`
- `npx tsc -b --noEmit`
- `npm run contracts:build`
- `npm run test:db-migrations`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/delivery-worker.test.ts apps/api/src/modules/auth/delivery-sender.test.ts apps/api/src/modules/auth/delivery-scheduler.test.ts apps/api/src/modules/auth/delivery-runtime.test.ts apps/api/src/metrics.test.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
- `npm run lint`
- `npm run check:self-hosted-infra`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run api:build`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 2F: self-hosted password recovery/reset source of truth.

Concrete next function:

- replace legacy/prototype reset-password behavior with owned API endpoints;
- store recovery token hashes and expiry in PostgreSQL;
- deliver recovery handoff through self-hosted delivery runtime or a scoped
  owned channel adapter;
- keep no hosted provider/Supabase production dependency;
- preserve no raw recovery token/full contact in browser responses.

Alternative:

Self-hosted consolidation pass for remaining legacy Supabase/prototype surfaces.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
