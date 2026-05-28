# Backend Phase 1B: Account Section-Scoped Mutations

Дата: 2026-05-28

Статус: implemented locally, validation passed.

## Что реализовано

Phase 1B убирает широкий full-profile remote save из обычных API-mode правок
`/account/*`. После Phase 1A страница уже ждала backend-сессию и backend
snapshot перед рендером. Phase 1B делает следующий шаг: каждая секция аккаунта
сохраняет только свой backend surface.

| План | Факт | Статус |
|---|---|---|
| Personal save должен писать только `PATCH /v1/account/me`. | `PersonalSection` передает section key `personal`; `syncAccountProfileSectionToApi` вызывает только `client.updateUserProfile`. | Done |
| Company save должен писать только `PATCH /v1/account/company`. | `CompanySection` передает `company`; media upload остается отдельным существующим endpoint flow. | Done |
| Branch add/edit/delete должен писать только row-level branch endpoint. | `BranchesSection` передает `branches`; diff вызывает `POST`, `PATCH` или `DELETE /v1/account/branches/:id`. | Done |
| Product add/edit/delete должен писать только row-level product endpoint. | `ProductsSection` передает `products`; diff вызывает `POST`, `PATCH` или `DELETE /v1/account/products/:id`. | Done |
| Meta-region add/edit/delete должен писать только row-level meta-region endpoint. | `MetaRegionsSection` передает `meta-regions`; diff вызывает `POST`, `PATCH` или `DELETE /v1/account/meta-regions/:id`. | Done |
| Notification edit должен писать только row-level notification endpoint. | `NotificationsSection` передает `notifications`; diff вызывает `PATCH /v1/account/notifications/:id`. | Done |
| API-mode UI не должен закрывать коллекционную форму до backend success. | Branches, products, meta-regions and notifications now `await onChange`; on failure the form stays open and shows a localized inline alert. | Done |
| API-disabled local preview должен остаться рабочим. | Local preview keeps localStorage/mock fallback and old disabled broad sync path remains harmless because no API base URL is configured. | Done |

## Реальные файлы

- `src/lib/account-api.ts`
  - добавлен `AccountProfileSectionSyncTarget`;
  - добавлен `syncAccountProfileSectionToApi`;
  - добавлены `updateUserProfile` и `updateCompanyProfile`;
  - row-level workspace collections use existing client methods:
    `createBranch`, `updateBranch`, `deleteBranch`, `createProduct`,
    `updateProduct`, `deleteProduct`, `createMetaRegion`, `updateMetaRegion`,
    `deleteMetaRegion`, `createNotification`, `updateNotification`,
    `deleteNotification`.
- `src/pages/account/Account.tsx`
  - route-level `updateSection(sectionKey)` passes section ownership into save;
  - API mode calls `syncAccountProfileSectionToApi(next, previous, section)`;
  - collection forms wait for backend success before closing.
- `src/lib/account-api.test.ts`
  - verifies personal/company section saves use only their endpoint;
  - verifies branch row diff uses row-level create/update/delete and not broad
    collection PATCH;
  - verifies product/meta-region/notification edits use row-level endpoints.
- `src/pages/account/Account.editable.test.tsx`
  - verifies API-mode personal edit writes only `/v1/account/me`;
  - verifies API-mode branch add writes only `POST /v1/account/branches/:id`.

## Что намеренно не менялось

- Backend routes were not changed. Existing row-level account routes in
  `apps/api/src/modules/account/routes.ts` are reused.
- Public UX safeguards Batches #110-#141 are untouched.
- Batch #112 route code splitting and Batch #113 route chunk error boundary are
  untouched.
- Access gating, supplier identity redaction and exact-price locks are
  untouched.
- Account media upload and documents flows keep their existing dedicated
  backend paths.

## Transaction and failure boundary

The production-facing boundary after Phase 1B is:

- one ordinary UI edit maps to one backend section or row mutation;
- API-mode UI state updates only after backend success;
- collection forms stay open on backend failure and show
  `account_remoteSaveFailed`;
- localStorage is not treated as success authority in API mode.

Remaining explicit limitation:

- `syncWorkspaceCollection` can technically diff multiple row changes if a
  future bulk editor sends them at once. The current UI edits one row at a time,
  but a future bulk workspace editor should use a server-side transactional
  batch endpoint instead of several row requests. This is the recommended Phase
  1C scope if bulk editing becomes part of the account workspace.

## 10,000 concurrent-user baseline

Expected read/write profile:

- API-enabled account mount remains Phase 1A behavior:
  one `GET /v1/auth/session` plus bounded account snapshot reads.
- API-enabled section save now sends one narrow write for the edited section:
  - personal: one `PATCH /v1/account/me`;
  - company: one `PATCH /v1/account/company`;
  - branch/product/meta-region/notification row action: one row-level
    `POST`, `PATCH` or `DELETE`.
- Compared with Phase 1A, a normal section edit no longer issues six broad
  account PATCH requests.

Cache, queue and backpressure strategy:

- No queue, polling or background sync is added.
- Session cache behavior remains the existing self-hosted auth/session Redis
  strategy.
- Under backend pressure, the account UI fails closed for API-mode saves:
  no local success state is shown until backend success.

Database indexing and pagination strategy:

- No migration or new index is required.
- Existing row-level account endpoints already address one authenticated
  account row at a time through protected routes.
- No new list pagination surface is introduced.

Failure mode and graceful degradation:

- API-mode mutation failure keeps the edit form open and shows an inline
  localized error.
- API-disabled local preview remains functional through localStorage/mock data.
- Backend unavailable route state from Phase 1A remains the authority gate for
  initial load failures.

Observability and load-test plan:

- Regression tests verify endpoint granularity in the account API adapter and
  API-mode `/account` UI.
- Production load test for Phase 1 should include representative section edits
  at 10,000 concurrent users and compare request volume against Phase 1A broad
  six-endpoint save behavior.
- Track p95 mutation latency, write error rate, session-cache miss/error rate,
  database row lock waits and account save retry rate.

## Validation

- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/auth-runtime.test.ts`
  - 4 files passed;
  - 56 tests passed.
- `npx tsc -b --noEmit`
- `npm run lint`
- `npm run check:production-scale-baseline`
- `git diff --check`
- `npm run build`
  - Account route chunk: `Account-4Y7df4zk.js` 111.70 kB / 25.36 kB gzip.

Known non-blocking warnings preserved:

- Supabase generated types are out of sync in non-strict build mode.
- Browserslist data is stale.
- Existing React Router v7 future flag warnings and legacy account editable
  `act(...)` warnings remain in the focused Vitest run.
