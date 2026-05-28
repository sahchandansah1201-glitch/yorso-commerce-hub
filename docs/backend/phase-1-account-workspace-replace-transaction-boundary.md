# Backend Phase 1H: Account Workspace Replace Transaction Boundary

Status: implemented locally, full validation passed.

Date: 2026-05-28

## Scope

Phase 1H closes the remaining backend collection-write risk from the Phase 1
source-of-truth audit.

Phase 1B moved normal `/account/*` UI edits to section-scoped and row-level
writes, but the backend still exposes bulk replace endpoints for account
workspace collections:

- `PATCH /v1/account/branches`;
- `PATCH /v1/account/products`;
- `PATCH /v1/account/meta-regions`;
- `PATCH /v1/account/notifications`.

Before Phase 1H, PostgreSQL replacement for those collections deleted existing
rows, inserted the new rows one by one and touched the parent account row as
separate statements. Phase 1H keeps the routes and payloads unchanged, but
turns each replacement into one atomic SQL statement.

This is not a public UX batch and not a new account feature.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Branch replace boundary | Branch collection replacement must not leave an account with rows deleted and only partially reinserted. | `replaceBranches` now runs one CTE statement with `input`, `deleted`, `touched` and `insert ... returning`. | Add server pagination if branch counts grow beyond bounded account-management lists. | Repository test asserts transactional CTE shape. |
| Product replace boundary | Product collection replacement must be atomic and return the replacement rows without a second read. | `replaceProducts` now uses the same one-statement CTE pattern and typed enum casts. | Keep normal UI on row-level product writes. | Repository test covers replace result and CTE shape. |
| Meta-region replace boundary | Meta-region replacement must not split delete, insert and parent touch across separate calls. | `replaceMetaRegions` now writes via one CTE statement and casts enum-array `used_for`. | Future bulk editor should keep the same boundary. | Repository test covers replace result and CTE shape. |
| Notification replace boundary | Notification replacement must atomically update rows and user account version source. | `replaceNotifications` now deletes, touches user and inserts replacement rows in one CTE statement. | Keep normal UI on row-level notification writes. | Repository test covers replace result and CTE shape. |
| Safeguards | Phase 1A-1G and public safeguards #110-#141 must stay intact. | No public route, supplier redaction, exact-price lock, Batch #112 code-splitting or Batch #113 route boundary code changed. | Run release gates before checkpoint commit. | Targeted repository/API tests and typecheck passed. |

## Implementation Notes

- No route path, request payload or response contract changed.
- PostgreSQL replacements now use `jsonb_to_recordset($2::jsonb)` for bounded
  account workspace payloads.
- Each collection replacement has one data-modifying CTE statement:
  - `input`;
  - `deleted`;
  - `touched`;
  - `insert ... returning`.
- Empty replacement arrays still delete old rows and touch the parent account
  row through the same statement.
- Row-level create/update/delete methods still call the replacement helpers, so
  they inherit the same atomic delete/reinsert boundary.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No public traffic is added.
- Normal account UI edits remain Phase 1B row-level/section-scoped writes.
- Legacy/bulk collection replacement now reduces N+2 SQL statements per
  collection to one bounded SQL statement after the existing company lookup.
- Response rows are returned from the write statement, so no extra read is
  needed after replacement.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache and account-version precondition remain the
  account authority boundary.
- Backpressure remains request-size/schema validation and bounded account list
  payloads. If branches/products grow beyond account-management size, add
  pagination instead of accepting unbounded replacement arrays.

Database indexing and pagination strategy:

- No migration, new index or pagination surface is introduced.
- Existing indexes remain the bounded access paths:
  - `idx_yorso_company_branches_company_id`;
  - `idx_yorso_company_products_company_id`;
  - `idx_yorso_company_meta_regions_company_id`;
  - `idx_yorso_notification_preferences_user_id`.
- The statement remains scoped by one company id or one user id.

Failure mode and graceful degradation:

- If any inserted row violates schema/table constraints, PostgreSQL rejects the
  whole statement; old rows are not left deleted independently from the failed
  insert.
- Account version strict/stale behavior from Phase 1C/1D is unchanged.
- API-disabled local prototype mode remains unchanged.

Observability and load-test plan:

- Track collection replacement latency and failure rate by route.
- Track payload row counts for bulk replace endpoints.
- Load-test 10,000 concurrent users with:
  - row-level branch/product/notification edits;
  - bounded bulk branch/product/meta-region/notification replacement;
  - deliberate invalid-row replacement to verify fail-closed behavior;
  - stale-header collection writes from Phase 1C/1D.

## Validation

Validated locally on 2026-05-28:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts`
  - 1 file passed;
  - 17 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
  - 3 files passed;
  - 86 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale.
