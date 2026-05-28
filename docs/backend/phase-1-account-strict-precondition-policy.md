# Backend Phase 1D: Account Strict Precondition Policy

Status: implemented locally, validation passed.

Date: 2026-05-28

## Scope

Phase 1D closes the production transition gap left after Phase 1C.

Phase 1C made stale account writes rejectable when the frontend sends
`x-yorso-account-version`. Phase 1D adds an explicit production policy switch:
self-hosted production API must run with account version preconditions required
for normal `/v1/account/*` mutations.

This is not a new account UI, not a public UX batch and not a media/document
pipeline redesign. It preserves Phase 1A session authority, Phase 1B
section-scoped mutations and Phase 1C conflict recovery.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Production config policy | Production self-hosted API должен явно требовать version precondition для account mutations. | Добавлен `ACCOUNT_VERSION_PRECONDITION_MODE=optional|required`; local/dev/test default остаётся `optional`; production self-hosted guard требует `required`. | Перед production deploy добавить env `ACCOUNT_VERSION_PRECONDITION_MODE=required`. | `apps/api/src/server.test.ts`: production config guard. |
| Strict mutation gate | В strict mode запись в `/v1/account/*` без `x-yorso-account-version` не должна проходить. | `handleAccountRoute` принимает `versionPreconditionMode`; missing header в `required` mode возвращает `428 account_version_required`. | Storage/media/document routes остаются отдельным follow-up scope, потому что их contract и version boundary отличаются. | `requires account version headers for account mutations in strict precondition mode`. |
| Backward compatibility | Dev/test и legacy clients не должны ломаться без отдельного production switch. | Default mode `optional` сохраняет Phase 1C поведение: stale header даёт `409`, missing header accepted вне strict mode. | После migration всех clients можно рассмотреть removal optional mode. | Existing API server tests keep passing in default test config. |
| Frontend contract | Current `/account/*` frontend должен уже соответствовать strict backend mode. | Phase 1C frontend уже сохраняет `accountVersion` после load и отправляет `x-yorso-account-version` на writes; Phase 1D не требует UI rewrite. | При добавлении новых account write clients обязательно использовать тот же header. | Existing account API/frontend tests from Phase 1C remain part of release validation. |
| Safeguards | Нельзя ломать Phase 1A-1C и public safeguards #110-#141. | Access gating, supplier identity redaction, exact-price locks, Batch #112 code splitting, Batch #113 route chunk boundary and Batches #110-#141 не изменялись. | Lovable sync можно делать пакетно после backend Phase 1D, если пользователь решит синхронизировать backend package. | Targeted API test passed; full validation gates are run before commit. |

## Implementation Notes

- Env flag: `ACCOUNT_VERSION_PRECONDITION_MODE`.
- Accepted values:
  - `optional`: default for development, test and local preview;
  - `required`: required for production self-hosted runtime.
- Missing strict precondition response:
  - HTTP status: `428`;
  - error code: `account_version_required`;
  - message: `Account version precondition is required for account mutations.`
- Stale precondition behavior remains Phase 1C:
  - HTTP status: `409`;
  - error code: `account_snapshot_conflict`.
- Current strict scope is the normal account route handler:
  - `/v1/account/me`;
  - `/v1/account/company`;
  - `/v1/account/branches`;
  - `/v1/account/products`;
  - `/v1/account/meta-regions`;
  - `/v1/account/notifications`;
  - row-level branch/product/meta-region/notification endpoints.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new public traffic is introduced.
- Strict mode adds no extra database read beyond Phase 1C when the header is
  present: the same account version lookup is used before mutation.
- Missing-header writes fail before mutation and do not create database writes.
- Normal account UI writes remain Phase 1B scoped writes.

Cache, queue and backpressure strategy:

- No queue is introduced.
- No frontend polling or retry loop is introduced.
- The existing auth/session cache remains the session authority boundary.
- Strict-mode missing-header requests are rejected with a bounded error path.

Database indexing and pagination strategy:

- No new list or pagination surface is introduced.
- Existing Phase 1C account version lookup remains bounded by account owner and
  company scope.
- Required production indexes stay the Phase 1C ownership indexes:
  `yorso_companies.owner_user_id`, collection `company_id`, and
  `yorso_notification_preferences.user_id`.

Failure mode and graceful degradation:

- In production strict mode, stale or legacy clients that write without
  `x-yorso-account-version` receive `428 account_version_required`.
- Current YORSO account frontend already sends the header after backend load.
- Dev/test/local preview stays optional to keep local compatibility and
  focused tests simple.
- Backend unavailable behavior remains Phase 1A fail-closed behavior.

Observability and load-test plan:

- Track `428 account_version_required` count/rate by route and client.
- Track `409 account_snapshot_conflict` separately from `428` so stale-tab
  conflicts are not mixed with non-compliant clients.
- Load-test 10,000 concurrent users with:
  - account route open;
  - personal/company edits with valid precondition;
  - row-level collection edits with valid precondition;
  - missing-header mutation attempts;
  - stale-header mutation attempts.
- Watch p95/p99 account mutation latency, version-lookup latency, DB CPU,
  session-cache misses and strict rejection rate.

## Validation

Validated locally on 2026-05-28:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`
  - 2 files passed;
  - 79 tests passed;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`
  - 2 files passed;
  - 37 tests passed;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Focused strict-mode server check:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts`
  - 1 file passed;
  - 62 tests passed.

Production build metric:

- Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale;
- existing React Router / `act(...)` warnings in legacy frontend tests.
