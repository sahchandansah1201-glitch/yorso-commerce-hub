# Backend Phase 3C: Provider Reference Tooling Retirement

Status: implemented.

Phase 3C closes the remaining active Supabase/provider debt after Phase 2J,
Phase 3A and Phase 3B. The production product surface is now provider-free:
runtime code, env examples, npm scripts, CI guards, frontend smoke tests and
tracked tooling no longer depend on Supabase or another hosted BaaS.

Historical documents may still mention the old prototype work. Those references
are archival context, not product runtime or delivery tooling.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Убрать tracked Supabase project/reference files. | Удалены `supabase/`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, Supabase CLI/access/type scripts and RLS/reference tests. | Исторические docs можно почистить отдельным documentation archive pass, без изменения runtime. |
| Убрать package dependency. | `@supabase/supabase-js` удалён из `package.json` и `package-lock.json`. | Не добавлять hosted BaaS SDK без нового architecture decision. |
| Убрать env debt. | `.env` и `.env.example` больше не содержат `VITE_SUPABASE_*` или Supabase comments. Self-hosted smoke scripts больше не инжектят Supabase env stubs. | Не хранить provider secrets в repo/env examples. |
| Заменить boundary guard. | `check:supabase-boundary` заменён на `check:provider-boundary`; новый guard сканирует production source roots и запрещает hosted-provider imports/env/runtime markers. | Держать guard в `ci:core`. |
| Заменить browser smoke. | `frontend-no-supabase-env` переименован в `frontend-provider-free-env`; smoke проверяет public/auth/catalog routes без hosted BaaS env и SDK. | Держать smoke в `ci:full` и deploy validation. |
| Обновить admin/runtime contract. | `supabaseProductionBackend` и `prototypeSupabaseConfigured` заменены provider-neutral полями; runtime policy говорит `hostedBaasProductionBackend: false`. | Не возвращать provider-specific policy fields. |
| Обновить DB/tooling contract. | Migration manifest и DB migrator больше не несут `supabaseRole`; PostgreSQL baseline остаётся self-hosted source of truth. | Live migration work continues through `packages/db`, not hosted-provider CLI. |

## Removed Active Surface

- `supabase/`
- `src/integrations/supabase/`
- `scripts/check-supabase-access-types.mjs`
- `scripts/check-supabase-production-boundary.mjs`
- `scripts/regenerate-supabase-types.mjs`
- `scripts/supabase-access-preflight.mjs`
- `scripts/supabase-access-write-smoke.mjs`
- `scripts/smoke-frontend-no-supabase-env.mjs`
- `e2e/frontend-no-supabase-env.spec.ts`
- Supabase/RLS reference tests under `src/test/`
- `@supabase/supabase-js`

## Current Provider-Free Contract

Production source roots scanned by `check:provider-boundary`:

- `apps/api/src`
- `packages/contracts/src`
- `packages/db/src`
- `src/components`
- `src/hooks`
- `src/lib`
- `src/pages`

The guard fails on:

- hosted-provider SDK imports;
- Supabase integration client imports;
- `VITE_SUPABASE` env keys;
- old prototype runtime branches;
- legacy provider adapter markers;
- old admin runtime policy fields;
- reintroduced `src/integrations/supabase` or `supabase` directories.

API-disabled preview paths remain local fixture/local contract paths only. They
must not use hosted auth, hosted database APIs, RLS tables or provider edge
functions.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new public read or write path is introduced.
- Removing hosted-provider fallback/tooling eliminates a secondary external
  backend path under frontend, auth, catalog and access traffic.
- Runtime reads/writes continue through the self-hosted API, PostgreSQL, Redis
  and owned file storage surfaces already documented in Phase 1/2/3A/3B.

Cache, queue and backpressure strategy:

- No new queue is introduced.
- Existing Redis/session/rate-limit/worker backpressure remains the backend
  scaling boundary.
- Provider-free smoke has no background polling or external provider calls.

Database indexing and pagination strategy:

- No new database tables or migrations are added in Phase 3C.
- Existing self-hosted migrations and pagination indexes remain unchanged.
- The DB migrator now validates only the self-hosted migration manifest.

Failure mode and graceful degradation:

- Production source cannot silently fall back to hosted BaaS clients because the
  dependency, integration directory and scripts are removed.
- Browser smoke proves public/auth/catalog routes boot without provider env.
- API-disabled preview stays local and explicitly non-production.

Observability and load-test plan:

- Continue using `check:provider-boundary`,
  `smoke:e2e:frontend-provider-free-env`, API smokes and production-scale
  baseline checks in CI.
- Load testing remains focused on owned API/PostgreSQL/Redis/object-storage
  boundaries, not hosted provider dashboards.

## Validation

Completed validation for Phase 3C:

- `npx vitest run src/test/self-hosted-backend-policy.test.ts src/test/self-hosted-infra.test.ts src/test/self-hosted-contracts.test.ts src/test/provider-free-tooling-retirement.test.ts`
- `npm run check:provider-boundary`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-db`
- `npm run check:backend-policy`
- `npm run check:self-hosted-infra`
- `npm run db:migrations:check`
- `npm run test:backend-contract`
- `npm run test:access-contract`
- `npm run test:admin-runtime-frontend`
- `npm run test:admin-operations-frontend`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm run db:build`
- `npm run contracts:build`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm run smoke:e2e:frontend-provider-free-env`
- `git diff --check`

Known warning preserved:

- Browserslist data is stale.
