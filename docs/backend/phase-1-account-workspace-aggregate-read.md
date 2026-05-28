# Backend Phase 1I: Account Workspace Aggregate Read

Status: implemented locally, full release validation passed.

Date: 2026-05-29

## Scope

Phase 1I reduces `/account/*` authoritative hydration fanout in self-hosted
mode.

Before this change, the API-enabled account frontend loaded the account
workspace through six parallel self-hosted requests:

- `GET /v1/account/me`;
- `GET /v1/account/company`;
- `GET /v1/account/branches`;
- `GET /v1/account/products`;
- `GET /v1/account/meta-regions`;
- `GET /v1/account/notifications`.

Phase 1I adds one authenticated self-hosted snapshot endpoint:

- `GET /v1/account/workspace`.

The new endpoint returns user, company, workspace collections and
`accountVersion` in one response. The frontend account API now hydrates
`/account/*` from that endpoint instead of six route calls.

This is not a public UX batch and not a Supabase/runtime-provider change.
Supabase remains outside the production account source of truth.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Self-hosted aggregate endpoint | Account workspace must have one authenticated backend read path for API-enabled hydration. | Added `GET /v1/account/workspace`; it validates the same account session boundary and returns `user`, `company`, `branches`, `products`, `metaRegions`, `notifications`, `accountVersion`, `requestId`. | Keep existing section endpoints for section reads/writes and backward compatibility. | API server test covers the new endpoint. |
| PostgreSQL bounded read | The backend must not simply move the six-read fanout from browser to database. | `PostgresAccountRepository.getWorkspaceSnapshot` returns the workspace via one scoped SQL query with JSON aggregation and account-version calculation. | Add server pagination if products/branches stop being bounded account-management lists. | Repository test asserts one query and mapped snapshot. |
| Frontend hydration | API-enabled `/account/*` must hydrate from the self-hosted snapshot endpoint. | `createAccountApiClient().load()` now calls only `/v1/account/workspace` and remembers `accountVersion` from that response. | Continue using row-level/section-scoped mutation paths from Phase 1B. | Account API and account page tests updated. |
| Contracts | Shared account contract should describe the snapshot shape. | Added `accountWorkspaceSnapshotSchema` and `AccountWorkspaceSnapshot` in `packages/contracts/src/account-company.ts`. | Keep response shape stable if `/account/workspace` becomes the public account bootstrap contract. | `npm run contracts:build` passed. |
| Safeguards | Phase 1A-1H and public safeguards #110-#141 must stay intact. | No public route, supplier redaction, exact-price lock, Batch #112 code-splitting or Batch #113 route boundary code changed. | Run full release gates before checkpoint commit. | Targeted account/API tests and typecheck passed. |

## Implementation Notes

- The route is read-only and accepts only `GET`.
- The route uses the existing `resolveAuthenticatedAccountSession` authority.
- The response is still user-owned; browser-supplied user id must match the
  validated session owner.
- Existing section endpoints stay available:
  - existing UI mutations still use Phase 1B section/row-level writes;
  - existing account version preconditions from Phase 1C/1D remain unchanged;
  - media/document version boundaries from Phase 1E/1G remain unchanged.
- PostgreSQL snapshot query is scoped by one user id and one owned company.
- Memory repository keeps equivalent behavior for local/test runtime.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No public traffic is added.
- API-enabled account entry now performs one account workspace request instead
  of six parallel account section requests.
- PostgreSQL production read path uses one scoped query that aggregates bounded
  account workspace collections.
- Normal writes remain Phase 1B section-scoped/row-level operations.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache remains the account authority boundary.
- Existing request-size/schema validation remains the payload boundary.
- Backpressure improvement: account entry reduces request concurrency and
  backend route dispatch overhead.

Database indexing and pagination strategy:

- No schema migration or new index is introduced.
- Snapshot query remains bounded by:
  - `yorso_users.id`;
  - `yorso_companies.owner_user_id`;
  - `idx_yorso_company_branches_company_id`;
  - `idx_yorso_company_products_company_id`;
  - `idx_yorso_company_meta_regions_company_id`;
  - `idx_yorso_notification_preferences_user_id`.
- Branch/product/meta-region/notification arrays remain capped by shared
  contracts. If these lists grow beyond account-management scale, the next
  backend step must add server pagination instead of returning unbounded arrays.

Failure mode and graceful degradation:

- Missing or invalid account session still returns account session errors.
- Missing user/company snapshot returns a closed 404 account resource error.
- Frontend account route continues to show the existing backend-unavailable
  state when account hydration fails.
- API-disabled Lovable/local prototype mode remains unchanged.

Observability and load-test plan:

- Track `/v1/account/workspace` p95/p99 latency, status codes and response size.
- Compare request count and latency against the previous six-section hydration.
- Load-test 10,000 concurrent users with:
  - account entry hydration;
  - simultaneous account entry plus row-level branch/product edits;
  - invalid session/fail-closed cases;
  - large-but-contract-bounded branch/product collections.

## Validation

Validated locally on 2026-05-29:

- `npm run contracts:build`.
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`
  - 3 files passed;
  - 52 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`
  - 2 files passed;
  - 83 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-CK-9-38I.js` 112.88 kB / 25.69 kB gzip.
- Entry chunk `index-C3QB-ZWM.js` 358.21 kB / 114.93 kB gzip.
- `i18n-translations-Co3DNZMT.js` 343.80 kB / 107.82 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale.
