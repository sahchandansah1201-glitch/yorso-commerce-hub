# Backend Phase 2J: Auth Surface Closure And Supabase Prototype Removal

Status: release validation passed
Date: 2026-05-29

## Scope

Phase 2J closes Phases 2A-2I as one self-hosted auth, registration and
password-recovery surface. The implementation removes the remaining Supabase
prototype auth fallback from code. It does not remove catalog, supplier-access
or Supabase reference tooling outside the auth surface; those are listed below
as separate debt.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Auth runtime | Убрать Supabase auth fallback из `/signin` и `/reset-password`. | Реализовано: `auth-runtime.ts` больше не содержит `legacy-auth-supabase-adapter`, `supabase_prototype`, `VITE_SUPABASE` branching или direct Supabase import. | Не возвращать hosted auth provider в runtime. |
| Adapter file | Удалить код, который реально вызывал Supabase Auth. | Реализовано: `src/lib/legacy-auth-supabase-adapter.ts` удалён. | Guard tests fail if file returns. |
| Session source | Убрать Supabase как источник browser session. | Реализовано: `BuyerSessionSource` и analytics source ограничены `self_hosted` / `local_contract`. | Audit старых stored sessions не нужен: source optional и runtime no longer emits Supabase. |
| Recovery UX | Описать self-hosted reset mechanism вместо Supabase recovery event. | Реализовано: `/reset-password` comment points to `?token=` / `#token=` and `/v1/auth/password-reset/complete`. | UI copy не менялась. |
| Guards | Проверки должны запрещать возврат auth Supabase fallback. | Реализовано: `auth-runtime.boundary.test.ts`, `check:self-hosted-api`, `check:production-scale-baseline` запрещают removed fallback markers. | Следующий debt убрать отдельными Phase 3 batches. |

## Closed Self-Hosted Auth Surface

The production auth surface is now:

- registration draft and account creation: `/v1/auth/register/*`;
- email sign-in: `/v1/auth/sign-in`;
- session read/sign-out: `/v1/auth/session`, `/v1/auth/sign-out`;
- password reset request/complete: `/v1/auth/password-reset/request`,
  `/v1/auth/password-reset/complete`;
- registration delivery: self-hosted worker + file-spool handoff;
- password recovery delivery: self-hosted worker + file-spool handoff;
- password recovery cleanup: self-hosted scheduler;
- public browser facade: `src/lib/auth-runtime.ts`.

Production path uses the self-hosted API, PostgreSQL, Redis-backed rate limits,
owned workers and local file-spool handoff. It does not call Supabase Auth,
Supabase Edge Functions or a hosted BaaS auth provider.

## Removed From Code In Phase 2J

| Removed item | Previous role | Replacement |
|---|---|---|
| `src/lib/legacy-auth-supabase-adapter.ts` | Prototype Supabase email sign-in, password reset email, recovery observer and password update. | `src/lib/auth-runtime.ts` self-hosted `/v1/auth/*` calls or local contract preview. |
| `supabase_prototype` auth/session source | Browser session and analytics source emitted by the auth fallback. | `self_hosted` for API mode; `local_contract` for API-disabled preview. |
| `VITE_SUPABASE_*` branching in auth runtime | Triggered dynamic Supabase auth adapter loading. | Ignored by auth runtime; only `VITE_YORSO_API_URL` selects self-hosted API mode. |

## Remaining Supabase / Prototype Debt Outside Phase 2J

| Area | Confirmed files | Why not removed in Phase 2J | Recommended next removal |
|---|---|---|---|
| Catalog prototype fallback | `src/lib/legacy-catalog-supabase-adapter.ts`, `src/integrations/supabase/client.ts`, `src/lib/catalog-api.ts` | Catalog was not part of the auth/registration/password-recovery closure. | Completed in Phase 3A: catalog Supabase fallback removal. |
| Supplier access prototype fallback | `src/lib/supplier-access-api.ts` | Access workflow touches buyer/supplier trust and grants outside Phase 2 auth closure. | Completed in Phase 3B: supplier access Supabase fallback removal. |
| Supabase reference tooling | `supabase/`, `scripts/check-supabase-access-types.mjs`, `scripts/supabase-access-*.mjs`, Supabase RLS tests | These are schema/reference and legacy smoke tools, not auth runtime. Removing them affects CI policy and historical migration references. | Phase 3C: Supabase reference tooling retirement. |
| `.env.example` prototype keys | Empty `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Current guards use empty keys to prove production can boot without Supabase. | Remove after catalog/access fallback retirement. |
| `@supabase/supabase-js` dependency | Used by remaining reference tooling/tests. | Cannot remove until remaining reference imports are retired or quarantined. | Remove in final Supabase retirement batch. |

## 10,000 Concurrent-User Review

### Read/Write Profile

- No Supabase auth request remains in frontend auth runtime.
- Configured deployments use `/v1/auth/*` endpoints and existing backend
  session/rate-limit/delivery/cleanup paths.
- API-disabled preview uses local contract only and does not perform hosted
  network auth calls.

### Cache/Queue/Backpressure Strategy

- Existing Redis-backed auth rate limits, delivery workers and cleanup scheduler
  remain the production backpressure mechanisms.
- Removing the Supabase fallback reduces runtime branching and removes a hosted
  auth dependency from the browser hot path.

### Database Indexing And Pagination Strategy

- Phase 2A-2I PostgreSQL tables and indexes remain unchanged.
- No new tables or queries are introduced by the removal.

### Failure Mode And Graceful Degradation

- If `VITE_YORSO_API_URL` is configured and auth API fails, auth runtime returns
  self-hosted errors and does not silently fall back to local or hosted auth.
- If `VITE_YORSO_API_URL` is absent, sign-in uses local contract preview and
  password recovery remains unavailable without a self-hosted token.
- Empty or non-empty `VITE_SUPABASE_*` values no longer change auth behavior.

### Observability And Load-Test Plan

- Existing auth/session/password-reset metrics and smoke markers remain active.
- Regression plan: run `test:auth-runtime`, self-hosted API smoke and production
  guard scripts; load-test `/v1/auth/sign-in`, `/v1/auth/password-reset/request`
  and `/v1/auth/password-reset/complete` through the self-hosted API only.

## Validation

Release validation passed on 2026-05-29:

- `npx vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts src/lib/buyer-session.test.ts`
- `npm run test:auth-runtime`
- `npm run check:supabase-boundary`
- `npm run check:self-hosted-api`
- `npm run check:self-hosted-production-runtime`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:self-hosted-auth-api:run`
- `git diff --check`
- `npm run build`

Marker: Backend Phase 2J.
Marker: auth surface closure.
Marker: Supabase prototype auth fallback removed.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
