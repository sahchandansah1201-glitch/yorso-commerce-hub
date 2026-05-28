# Backend Phase 1 Account Source Of Truth Discovery Audit

Date: 2026-05-28
Repository: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`
Audited baseline: `dc5ab55` (`[codex] Remediate backend Phase 0 test contracts`)

## Scope

This is a discovery and audit checkpoint for Backend Phase 1: Account Source Of
Truth. It does not change runtime behavior. The goal is to map the current
auth/account implementation, identify where browser state still acts as the
effective source of truth, and define the first implementation batch that can
move `/account/*` from local-first prototype state to the self-hosted YORSO API.

This audit preserves the public UX/UI safeguards from Batches #110-#141, Batch
#112 route code splitting, Batch #113 route chunk error recovery, access
gating, supplier identity redaction and exact-price locks.

## Task Frame

| Field | Decision |
|---|---|
| Objective | Make the self-hosted backend the authoritative source for account identity, account profile and account workspace sections when `VITE_YORSO_API_URL` is configured. |
| Primary stakeholder | Signed-in B2B buyers, suppliers, procurement teams and YORSO operators who rely on account data for access, trust and supplier workflow decisions. |
| Evidence inspected | Frontend auth/session/account files, account API adapter, self-hosted auth/account API modules, shared contracts, DB migrations, Phase 0 contract docs and project-memory state. |
| Constraints | Do not break local/Lovable prototype review; do not change public buyer-first surfaces; do not weaken protected API session authority. |
| Anti-goals | Do not start a public UX batch; do not introduce a new auth provider; do not treat localStorage/sessionStorage as production authority. |
| Risk boundary | Account identity, protected account writes, uploaded company media/documents, supplier-access side effects and any future production account runtime. |
| Done condition for discovery | Current source-of-truth map, gaps, production-scale baseline and Phase 1A implementation scope are documented. |

## Sources Inspected

- `src/lib/buyer-session.ts`
- `src/contexts/BuyerSessionContext.tsx`
- `src/lib/auth-runtime.ts`
- `src/lib/account-store.ts`
- `src/lib/account-api.ts`
- `src/data/mockAccount.ts`
- `src/pages/SignIn.tsx`
- `src/pages/account/Account.tsx`
- `src/components/account/AccountShell.tsx`
- `apps/api/src/modules/auth/*`
- `apps/api/src/modules/account/*`
- `apps/api/src/server.ts`
- `apps/api/src/config.ts`
- `packages/contracts/src/auth.ts`
- `packages/contracts/src/account-session.ts`
- `packages/contracts/src/account-company.ts`
- `packages/db/migrations/0001_account_company_baseline.sql`
- `packages/db/migrations/0002_account_workspace_sections.sql`
- `packages/db/migrations/0003_account_files_and_documents.sql`
- `packages/db/migrations/0011_auth_sessions.sql`
- `packages/db/migrations/0012_auth_security_events.sql`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/phase-0-closure-audit.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/self-hosted-api-skeleton.md`
- `docs/backend/production-scale-baseline.md`

## Current Architecture

The backend side is substantially ahead of the frontend account workspace:

- self-hosted auth exists at `POST /v1/auth/sign-in`,
  `GET /v1/auth/session` and `POST /v1/auth/sign-out`;
- self-hosted account endpoints exist for `/v1/account/me`,
  `/v1/account/company`, `/v1/account/branches`, `/v1/account/products`,
  `/v1/account/meta-regions`, `/v1/account/notifications`, company media,
  company documents and file reads;
- protected account routes call `resolveAuthenticatedAccountSession`, require
  `x-yorso-session-id`, validate it through `AuthService`, and reject
  user/session mismatches;
- contracts are typed through `packages/contracts`;
- PostgreSQL migrations define account/company/workspace/auth tables and the
  important owner/session indexes;
- production config already requires Redis-backed auth rate limiting, Redis
  session cache, fail-closed auth/session cache modes, PostgreSQL audit, request
  metrics and observability drivers.

The frontend account workspace is still local-first:

- `/signin` can call the self-hosted API, but stores the returned backend
  session envelope in browser `sessionStorage` through `buyerSession`;
- `/account/:section` initializes from `getAccountProfile()`, which reads
  `localStorage["yorso_account_profile_v1"]` or falls back to `mockAccount`;
- the account route hydrates from the API after the local profile is already
  rendered, and writes the hydrated result back to localStorage;
- every account edit writes localStorage immediately, then attempts remote sync
  if the API is configured;
- failed API hydration/sync is recorded in
  `localStorage["yorso_account_api_sync_v1"]`, but the visible account
  workspace can keep using local state.

## Source Of Truth Map

| Area | Current effective source | Backend authority exists? | Phase 1 status |
|---|---|---:|---|
| Email/password sign-in | Self-hosted API when `VITE_YORSO_API_URL` exists; otherwise Supabase prototype or local contract fallback | Yes | Partially ready |
| Browser signed-in state | `sessionStorage["yorso_buyer_session"]` | Backend session exists, but frontend gate trusts local envelope first | Needs Phase 1A |
| `/account/personal` profile | `localStorage["yorso_account_profile_v1"]` first, API hydration second | Yes: `/v1/account/me` | Not source-of-truth yet |
| `/account/company` profile | localStorage/mock first, API hydration/sync second | Yes: `/v1/account/company` | Not source-of-truth yet |
| Branches/products/meta-regions/notifications | localStorage/mock first, API hydration/sync second | Yes: `/v1/account/*` collections | Not source-of-truth yet |
| Company media/documents | API-backed when configured; direct URL/blob/data fallbacks still allowed for prototype data | Yes | Partially ready |
| Supplier access and catalog unlocks | Self-hosted API protected by session authority when configured | Yes | Preserve as-is |
| Public catalog/suppliers | Public anonymous API shape or mock/public data; protected values redacted | Yes for API paths | Preserve as-is |

## Strengths Confirmed

1. Backend session authority is real. Account API routes require
   `x-yorso-session-id`, validate it with the auth service and reject
   mismatched browser-provided `x-yorso-user-id` values.

2. The account contract is broad enough for Phase 1. User profile, company
   profile, media, documents, branches, products, meta-regions and
   notifications have shared schemas and API routes.

3. The DB baseline is not only placeholder SQL. Account/company/session tables
   have primary keys, owner/company indexes, session active indexes, file
   ownership indexes and security-event indexes.

4. Production config already encodes the intended failure posture: PostgreSQL
   repository, Redis rate limiter, Redis session cache, fail-closed production
   session cache, PostgreSQL audit and Prometheus/request observability.

5. Phase 0 gates are green after remediation, so Phase 1 can start from a
   stable test/build baseline instead of carrying known failing tests.

## Gaps And Risks

### P1-01: `/account/*` is still local-first

`src/pages/account/Account.tsx` initializes from `getAccountProfile()`, renders
that local profile, then calls `hydrateAccountProfileFromApi(localProfile)`.
Updates call `saveAccountProfile(next)` before attempting
`syncAccountProfileToApi(next)`.

Impact: users can see and edit account data that is not the backend source of
truth. A failed backend sync can be masked by a successful local save.

Phase 1 requirement: when the self-hosted API is configured, `/account/*` must
load from the backend before rendering editable private data. Local fallback
can remain only for API-disabled prototype mode or an explicitly read-only
degraded state.

### P1-02: Local buyer session is the frontend gate

`AccountShell` gates private account UI through `useBuyerSession()`, which reads
`sessionStorage["yorso_buyer_session"]`. `readCurrentAuthSession()` exists, but
the account route does not currently require a successful backend session read
before rendering the workspace.

Impact: stale or fabricated browser state can open the local account shell even
though protected API calls will later fail.

Phase 1 requirement: API-enabled account routes should validate the current
self-hosted session first, fail closed on invalid/missing session, clear local
session state and route to sign-in.

### P1-03: Default account user id remains in the frontend adapter

`createAccountApiClient()` resolves the account user id from browser session,
then `VITE_YORSO_ACCOUNT_USER_ID`, then
`DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID`. The backend rejects protected account
requests without a valid session id, but the adapter still attempts calls with a
deterministic demo user and then silently lets the UI continue from local state.

Impact: the fallback is useful for local smoke/demo wiring, but it is not a
production source-of-truth boundary and can hide missing authentication in the
browser.

Phase 1 requirement: in API-enabled non-test runtime, account API calls should
require a real authenticated browser session with user id and session id.
Deterministic demo identity must be constrained to explicit dev/test mode.

### P1-04: Remote sync is too broad for an authoritative workspace

`syncAccountProfileToApi()` sends six parallel PATCH requests for user, company,
branches, products, meta-regions and notifications after each account update.
On the backend, collection replacement in the PostgreSQL repository deletes and
reinserts rows without an explicit transaction wrapper.

Impact: a small edit can create unnecessary backend write load; partial failure
can leave section data inconsistent; concurrent edits from multiple tabs or
devices have no conflict signal.

Phase 1 requirement: writes should become section-scoped and transaction-safe.
Collection replacement needs atomicity, conflict strategy and clear failure
states before the workspace is considered production-ready.

### P1-05: Sync failure is not a first-class UX state

`hydrateAccountProfileFromApi()` and `syncAccountProfileToApi()` record
`synced/failed/disabled` in localStorage, but `/account/*` does not expose a
strong authoritative loading/error/degraded state.

Impact: the user can believe account changes are saved while the backend source
of truth rejected or never received them.

Phase 1 requirement: API-enabled account pages need explicit loading,
auth-invalid, backend-unavailable and save-failed states. Local state should not
be presented as successfully saved backend state.

### P1-06: Current session storage model is acceptable for Phase 1 bridge, not
final production auth hardening

The self-hosted API issues opaque session ids and validates them server-side.
The browser stores the session id in sessionStorage and sends it as
`x-yorso-session-id`. This matches the current backend contract, but is still a
browser-readable token.

Impact: this is a bounded bridge from prototype auth to self-hosted auth, not a
complete production auth model.

Phase 1 requirement: do not expand the sessionStorage pattern beyond the
existing bridge. A later auth-hardening phase should decide whether to move to
httpOnly cookies, CSRF protection and stricter session lifecycle controls.

## Phase 1 Exit Criteria

Phase 1 should not be considered complete until these are true:

1. API-enabled `/account/*` validates `/v1/auth/session` before rendering
   editable account data.

2. API-enabled `/account/*` loads user/company/workspace data from the
   self-hosted API as the authoritative source.

3. LocalStorage account profile is no longer the write source of truth when
   the API URL is configured. It can remain as prototype seed, test fixture or
   explicitly degraded read-only cache.

4. Account API client does not fall back to the deterministic demo user id in
   production-like self-hosted mode.

5. Account saves are section-scoped or otherwise atomic, with visible failure
   states and no silent local-success/backend-failure mismatch.

6. Backend workspace collection writes are transaction-safe or replaced by
   item-level writes where full replacement is not needed.

7. Unit, API and e2e tests cover:
   - missing session redirects/fails closed;
   - invalid session clears local session and blocks account render;
   - successful self-hosted session hydrates account data from API;
   - remote save failure does not show a successful saved state;
   - API-disabled local prototype mode remains available for Lovable/offline
     review.

## Recommended Phase 1A Scope

Start with **Backend Phase 1A: Account Session Authority Gate**.

Keep it intentionally narrow:

- add an account bootstrapping layer that, in API-enabled mode, calls
  `readCurrentAuthSession()` before rendering account sections;
- if the session is missing or invalid, clear local buyer session and redirect
  to `/signin`;
- if the session is valid, create the account API client from that session
  rather than from a default user id;
- render a real account loading state while validating/hydrating;
- render a backend-unavailable state when account data cannot be read, instead
  of silently continuing as locally saved authoritative data;
- keep localStorage/mock mode only when the API URL is not configured;
- add tests around the gate and account-source behavior.

Do not combine Phase 1A with registration account creation, media pipeline
changes, auth cookie redesign, account layout redesign or supplier access
changes. Those are separate scopes.

## Production Baseline For 10,000 Concurrent Users

### Expected read/write profile

Current account entry can trigger one auth/session read plus six account
section reads (`me`, `company`, `branches`, `products`, `meta-regions`,
`notifications`). At 10,000 concurrent users this is acceptable only as a
bounded authenticated workspace path, not as a public hot path. Phase 1 should
either keep those reads lazy by section or introduce a bounded aggregate account
workspace endpoint with predictable payload limits.

Current saves can trigger six parallel PATCH calls per edit. That should be
reduced to section-scoped writes before production signoff.

### Cache, queue and backpressure

Auth/session hot-path caching already has a Redis design with fail-closed
production config. Account profile data should remain PostgreSQL-authoritative
for Phase 1; do not introduce a stale write-through browser cache as authority.
For media/documents, keep upload size limits and storage backpressure. Queueing
is not required for normal profile edits, but document processing/review can
become queued in a later phase if scanning or moderation is added.

### Database indexing and pagination

Existing indexes cover owner user, company, active sessions, file ownership,
document status/visibility and notification user/channel access. Workspace
sections are currently modeled as per-company/per-user collections. If products
or branches grow beyond small account-management lists, Phase 1B should add
server pagination rather than reading/replacing full arrays.

### Failure mode and graceful degradation

Protected account routes must fail closed on missing/invalid sessions. Public
catalog/supplier browsing must stay available and redacted. API-enabled account
workspace should show explicit backend unavailable/auth invalid/save failed
states; it should not silently convert localStorage into source of truth.

### Observability and load-test plan

Keep existing auth telemetry, request metrics and audit events. Add account
workspace metrics before Phase 1 production signoff:

- account session validation success/failure;
- account hydration success/failure by section;
- account save success/failure by section;
- backend unavailable/degraded account renders;
- p95/p99 account hydrate latency;
- p95/p99 account save latency;
- collection replacement row counts and conflicts.

Load tests should cover:

- sign-in burst and steady session validation;
- warm-cache and cache-miss account reads;
- `/account/personal` and `/account/company` save bursts;
- product/branch collection saves with realistic row counts;
- Redis unavailable fail-closed behavior;
- PostgreSQL/PgBouncer saturation behavior;
- public catalog reads during authenticated account pressure.

## Discovery Decision

Backend Phase 1 is ready to start, but it should start with the account session
authority and source-of-truth gate before any broader account workspace
features.

Recommended next implementation batch:

**Phase 1A: Account Session Authority Gate**

Expected outcome: API-enabled `/account/*` is backend-authoritative for session
validation and initial account hydration, while API-disabled prototype mode
continues to work for Lovable/offline review.
