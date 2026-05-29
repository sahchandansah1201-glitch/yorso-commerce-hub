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

Backend Phase 2D Registration Delivery Runtime is committed locally and release
validation has passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Scheduler runtime | Обрабатывать delivery outbox вне публичных registration requests. | Реализовано: `RegistrationDeliveryScheduler` запускает bounded batches, пропускает overlap и останавливается через server close lifecycle. | При необходимости вынести в отдельный process/command. |
| Sender boundary | Выбрать self-hosted delivery handoff без стороннего провайдера. | Реализовано: `FileSpoolRegistrationVerificationSender` пишет `0600` JSON handoff-файлы в mounted spool dir. | Phase 2E должен решить OTP/channel semantics перед реальной внешней доставкой. |
| Production config | Production должен fail closed без delivery runtime. | Реализовано: required worker enabled, sender `file_spool`, absolute spool dir. | Добавить sender-specific readiness при появлении других adapters. |
| Metrics | Наблюдать delivery worker без утечки контактов. | Реализовано: worker run/job counters без email/phone/destination labels. | Добавить queue-age gauges после repository queue stats. |
| Data hygiene | Не отдавать verification code/raw contact в browser/public surfaces. | Сохранено: browser responses остаются masked metadata only; Phase 2D sender не логирует код и не добавляет public API. | Phase 2E должен сохранить этот контракт при OTP payload decision. |
| Validation | Проверить runtime, infra guards, API guards, migrations, lint and build. | Passed: focused API tests, TypeScript, self-hosted infra/runtime/API checks, production-scale, DB migrations, lint, api build, diff check, production build. | Start Phase 2E. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A, 2B and 2C are committed locally and validation green.
- Backend Phase 2D is committed locally and validation green.

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

Backend Phase 2E: registration OTP generation and channel delivery semantics.

Concrete next function:

- replace fixed prototype verification code behavior with per-request generated
  OTP, expiry and attempt policy;
- decide safe file-spool payload or owned channel adapter semantics;
- keep no hosted provider/Supabase production dependency;
- preserve no raw verification code/full contact in browser responses.

Alternative:

Self-hosted consolidation pass for remaining legacy Supabase/prototype surfaces.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
