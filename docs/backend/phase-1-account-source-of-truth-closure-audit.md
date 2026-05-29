# Backend Phase 1J: Account Source Of Truth Closure Audit

Status: committed locally, validation passed.

Date: 2026-05-29

## Scope

Phase 1J closes Backend Phase 1: Account Source Of Truth as an audited
checkpoint. It does not add a new runtime feature. It verifies the Phase 1 exit
criteria against repository code, tests and implementation documents after
Phases 1A-1I.

The product direction is self-hosted and self-contained: production account
runtime must use the YORSO API, PostgreSQL and self-hosted object storage, not
Supabase or another hosted backend provider.

Important boundary: this closure covers the account workspace source-of-truth
flow. Product-wide legacy Supabase adapters, scripts and prototype references
still exist in the repository and remain a separate removal/consolidation
workstream. They are not expanded by Phase 1.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Session authority | API-enabled `/account/*` must validate self-hosted session before rendering editable private data. | Phase 1A added `readCurrentAuthSession()` account bootstrap and fail-closed redirect/unavailable states. | Later auth-hardening can move session bridge to httpOnly cookies/CSRF if chosen. | `src/pages/account/Account.tsx`, `src/pages/account/Account.test.tsx`. |
| Backend account source | API-enabled `/account/*` must load user, company and workspace data from self-hosted API. | Phase 1A moved API-enabled account render to backend hydration; Phase 1I now hydrates through one `GET /v1/account/workspace` snapshot. | Keep account snapshot payload bounded; add pagination if workspace collections grow. | `src/lib/account-api.ts`, `apps/api/src/modules/account/routes.ts`, `apps/api/src/server.test.ts`. |
| LocalStorage boundary | LocalStorage must not be the write source of truth when API URL is configured. | API-enabled saves wait for self-hosted API success before updating UI/local cache. API-disabled Lovable/local preview keeps localStorage behavior. | Remove or mark stale prototype cache if product decides to drop offline/Lovable preview mode. | `src/pages/account/Account.tsx`, `src/pages/account/Account.editable.test.tsx`. |
| Demo user fallback | Account API client must not silently use deterministic demo id in self-hosted mode. | Phase 1F makes enabled `createAccountApiClient` fail before fetch with `account_api_session_required` when no explicit/session/configured user exists. | Keep demo id only for disabled/local fixture mode. | `src/lib/account-api.ts`, `src/lib/account-api.test.ts`. |
| Save atomicity/conflicts | Account saves must be section-scoped or atomic, with visible failure states. | Phase 1B made normal UI edits section-scoped/row-level; Phase 1C/D added account version conflict/precondition behavior; UI shows remote failure/conflict. | Later per-item backend writes can replace full collection replacement internals if collections grow. | `src/lib/account-api.ts`, `src/pages/account/Account.editable.test.tsx`, `apps/api/src/server.test.ts`. |
| Backend collection safety | Backend workspace collection writes must be transaction-safe or item-level. | Phase 1H turned bulk PostgreSQL collection replacement into one atomic CTE per collection. Normal UI writes use row-level section sync. | Add server pagination if branch/product lists exceed bounded management size. | `apps/api/src/modules/account/postgres-repository.ts`, repository tests. |
| Media/document version boundary | Account-owned storage must participate in account snapshot consistency. | Phase 1E/F/G added strict/stale version handling, session-bound document client and object/metadata compensation. | Outbox remains deferred until async scanning/review/retry worker exists. | Storage/API tests and Phase 1G doc. |
| Aggregate read scalability | Account entry must not fan out into six browser/backend section reads. | Phase 1I added `GET /v1/account/workspace`; PostgreSQL snapshot is one scoped SQL query. | Track snapshot latency/response size under load. | Account API tests, API server test, repository test. |
| Self-contained production boundary | Phase 1 account production path must not depend on Supabase. | Account Phase 1 runtime uses self-hosted auth/session/account API, PostgreSQL repository and self-hosted file service. Existing Supabase references are legacy/prototype debt outside this closure. | Start a separate self-hosted consolidation/removal plan for remaining legacy Supabase flows. | `docs/backend/self-hosted-production-policy.md`, package guards, this audit. |

## Phase 1 Exit Criteria Status

| Exit criterion | Status | Evidence |
|---|---|---|
| `/account/*` validates `/v1/auth/session` before editable render | Closed | Phase 1A tests and `Account.tsx` account bootstrap. |
| `/account/*` loads user/company/workspace from self-hosted API | Closed | Phase 1A backend hydration plus Phase 1I aggregate workspace snapshot. |
| LocalStorage no longer write source of truth when API URL is configured | Closed | API-mode `update()` waits for backend response; localStorage mode only remains API-disabled preview. |
| No deterministic demo fallback in production-like self-hosted account client | Closed | Phase 1F client failure before fetch without session/configured user. |
| Account saves section-scoped/atomic with visible failures | Closed | Phase 1B section sync; Phase 1C conflict UI; Phase 1D strict precondition; Phase 1E storage version boundary. |
| Backend workspace collection writes transaction-safe or item-level | Closed | Phase 1H atomic CTE replacement; normal UI row-level writes. |
| Tests cover missing/invalid session, backend hydration, failed save, local prototype mode | Closed | `Account.test.tsx`, `Account.editable.test.tsx`, `account-api.test.ts`, API server/repository tests. |

## Implementation Map

| Phase | Implemented capability | Key files |
|---|---|---|
| 1A | Account session authority gate | `src/pages/account/Account.tsx`, `src/lib/auth-runtime.ts`, `src/pages/account/Account.test.tsx` |
| 1B | Section-scoped account mutations | `src/lib/account-api.ts`, `src/pages/account/Account.tsx`, `src/pages/account/Account.editable.test.tsx` |
| 1C | Account snapshot conflict/version handling | `apps/api/src/modules/account/*`, `src/lib/account-api.ts` |
| 1D | Strict account version precondition policy | `apps/api/src/config.ts`, `apps/api/src/modules/account/version-precondition.ts`, `apps/api/src/server.test.ts` |
| 1E | Media/document version boundary | `apps/api/src/modules/storage/routes.ts`, `src/lib/account-api.ts` |
| 1F | Account storage client authority | `src/components/account/CompanyDocumentsCard.tsx`, `src/pages/account/Account.tsx` |
| 1G | Storage transaction/compensation boundary | `apps/api/src/modules/storage/*`, `apps/api/src/modules/account/postgres-repository.ts` |
| 1H | Workspace collection replace transaction boundary | `apps/api/src/modules/account/postgres-repository.ts` |
| 1I | Workspace aggregate read | `apps/api/src/modules/account/routes.ts`, `apps/api/src/modules/account/postgres-repository.ts`, `src/lib/account-api.ts` |

## Remaining Product Debt Outside Phase 1

| Debt | Current status | Next concrete workstream |
|---|---|---|
| Legacy Supabase adapters and scripts | Still present as prototype/reference surfaces and guarded by self-hosted production policy. | Self-hosted consolidation: remove or quarantine legacy Supabase fallback paths route-by-route. |
| Registration creates only frontend/prototype state | Registration funnel is not yet a self-hosted account creation flow. | Backend Phase 2A: registration-to-account creation and email/phone verification source of truth. |
| Password recovery can still use prototype fallback | Self-hosted auth sign-in/session exists; recovery hardening remains separate. | Backend auth hardening: recovery tokens, reset lifecycle and audit trail. |
| Browser-readable session bridge | Acceptable Phase 1 bridge; not final auth-hardening architecture. | Later auth-hardening decision: httpOnly cookies, CSRF, stricter session lifecycle. |
| Account workspace collection pagination | Lists are contract-bounded today. | Add pagination if real branch/product volumes exceed account-management scale. |

## 10,000 Concurrent-User Review

Expected read/write profile:

- Account entry now uses one self-hosted workspace snapshot request plus the
  session validation path.
- Normal account edits are section-scoped or row-level.
- Storage uploads remain bounded by upload size limits and account version
  preconditions.

Cache, queue and backpressure strategy:

- Auth/session cache remains the authority hot path.
- Account reads remain PostgreSQL-authoritative; no browser write-through cache
  is treated as production authority.
- No queue is introduced in Phase 1. Storage outbox is deferred until a real
  async worker/retry/review surface exists.

Database indexing and pagination strategy:

- Existing owner/company/session/file indexes remain the Phase 1 paths.
- Aggregate account snapshot is scoped to one authenticated user/company.
- Workspace arrays remain contract-capped. Pagination is the required next
  step if real product/branch counts exceed those bounds.

Failure mode and graceful degradation:

- Missing/invalid sessions fail closed.
- Backend hydration failure shows account backend unavailable, not a silent
  local success.
- Stale saves return conflict and keep a reloadable UI state.
- Public catalog/supplier browsing remains available and redacted.

Observability and load-test plan:

- Track account session validation success/failure.
- Track `/v1/account/workspace` p95/p99 latency and response size.
- Track account save success/failure by section and conflict/precondition
  counts.
- Load-test sign-in/session validation, account snapshot reads, section saves,
  storage uploads and public catalog reads under authenticated account pressure.

## Validation

Validated locally on 2026-05-29:

- `npm run check:self-hosted-production-runtime`;
- `npm run check:production-scale-baseline`;
- `npm run lint`;
- `git diff --check`.

No production code changed in Phase 1J.
