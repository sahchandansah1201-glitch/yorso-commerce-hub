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

Backend Phase 2F Password Recovery Source Of Truth is implemented locally;
release validation has passed and commit is pending.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Reset request API | Owned reset-request endpoint without account enumeration. | Реализовано: `POST /v1/auth/password-reset/request` returns generic success for known and unknown emails. | Commit. |
| Token persistence | Durable reset source of truth without plain token lookup. | Реализовано: migration `0029_auth_password_recovery` creates token/outbox tables; repository stores `token_lookup_hash`, `token_secret`, expiry and used state. | Cleanup job later. |
| Token hygiene | No raw reset token/email in public response. | Реализовано: server tests assert no token and no raw email in request response JSON. | Preserve for delivery adapters. |
| Reset complete | Complete reset through owned backend. | Реализовано: `POST /v1/auth/password-reset/complete` verifies token hash/secret/expiry/used state, updates credentials and records security events. | KDF/password policy separately. |
| Session safety | Invalidate old sessions after reset. | Реализовано: repository revokes/deletes sessions by user; service deletes matching cache entries. | Redis outage smoke later if needed. |
| Frontend runtime | `/reset-password` uses self-hosted API when configured. | Реализовано: `auth-runtime` reads `?token=` / `#token=`, calls owned request/complete endpoints, keeps Supabase only as prototype fallback when self-hosted API is disabled. | UX copy for expired token can be separate. |
| Production readiness | 10k review and guard docs updated. | Реализовано: Phase 2F doc, production baseline, frontend/backend contract and self-hosted DB/API guards updated. | Commit. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2E are committed locally and validation green.
- Backend Phase 2F is implemented locally; release validation passed; commit pending.

## Phase 2F Files

- `docs/backend/phase-2f-password-recovery-source-of-truth.md`
- `packages/contracts/src/auth.ts`
- `apps/api/src/modules/auth/password-recovery.ts`
- `apps/api/src/modules/auth/service.ts`
- `apps/api/src/modules/auth/repository.ts`
- `apps/api/src/modules/auth/postgres-repository.ts`
- `apps/api/src/modules/auth/routes.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `src/lib/auth-runtime.ts`
- `src/lib/auth-runtime.test.ts`
- `src/lib/auth-runtime.boundary.test.ts`
- `packages/db/migrations/0029_auth_password_recovery.sql`
- `packages/db/migration-manifest.json`
- `packages/db/src/migrator.test.ts`
- `packages/db/src/cli.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `scripts/check-self-hosted-db.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`

## Validation

Passed locally on 2026-05-29:

- `npm run contracts:build`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts`
- `npx vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts packages/db/src/migrator.test.ts packages/db/src/cli.test.ts src/test/self-hosted-db-contract.test.ts`
- `npm run check:self-hosted-db`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm run test:db-migrations`
- `npm run check:self-hosted-production-runtime`
- `npm run lint`
- `npm run api:build`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 2G: password recovery delivery worker/sender runtime.

Concrete next function:

- lease `yorso_auth_password_recovery_outbox` jobs in bounded worker batches;
- decrypt `recovery_token_sealed` only after lease;
- write owned file-spool recovery handoff with reset token/URL outside browser
  responses and public logs;
- mark jobs sent/failed with sanitized retry/backoff state;
- preserve self-contained production direction with no hosted BaaS/Supabase
  production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
