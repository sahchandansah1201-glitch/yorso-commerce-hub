# Backend Phase 1C: Account Conflict Version Handling

Status: implemented locally, validation passed.

Date: 2026-05-28

## Scope

Phase 1C closes the stale-save gap left after Phase 1A and Phase 1B.

After Phase 1A, `/account/*` waits for a validated self-hosted session and
hydrates account data from the backend before rendering editable sections.
After Phase 1B, normal edits write only the edited section or row. Phase 1C
adds a shared account snapshot version so a browser tab cannot silently save an
older account snapshot over newer backend data.

This is not a broad data-model redesign. It does not add public UX changes,
supplier access changes, price-lock changes, new queues or new account
sections.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Account snapshot version | Backend должен отдавать opaque version для account snapshot. | `/v1/account/me`, `/company`, collection GET/PATCH и row-level account endpoints возвращают `accountVersion`. Memory repository ведёт monotonic version; PostgreSQL repository считает max `updated_at` по user/company/media/workspace tables. | При появлении bulk account endpoint использовать тот же version contract. | `apps/api/src/server.test.ts`, `apps/api/src/modules/account/__tests__/repository.test.ts`. |
| Stale mutation rejection | Account mutation с устаревшим version должен получить 409, а не перезаписать свежие данные. | Backend читает `x-yorso-account-version`; если header присутствует и не совпадает с текущим snapshot version, возвращает `409 account_snapshot_conflict`. Missing header пока accepted для обратной совместимости старых клиентов. | Отдельно решить, когда включать strict precondition-required mode для всех production clients. | `rejects stale account mutations when the account version precondition is stale`. |
| Frontend version propagation | `/account/*` должен сохранять version после load и отправлять его на последующие saves. | `createAccountApiClient` запоминает `accountVersion`, отправляет `x-yorso-account-version` на writes и обновляет version после каждого успешного response. Full save и row-level collection sync выполняются последовательно, чтобы не создавать self-conflict внутри одного section save. | Для будущих bulk forms лучше добавить transactional backend batch endpoint вместо нескольких browser row calls. | `src/lib/account-api.test.ts`. |
| Visible conflict recovery | Пользователь должен видеть, что данные изменились, и иметь безопасный reload path. | `/account/*` ловит `AccountApiConflictError`, оставляет форму в edit mode, показывает inline save error и общий banner `account-save-conflict` с кнопкой reload account data. | Позже можно добавить diff/merge UI, но сейчас выбран безопасный reload-first путь. | `src/pages/account/Account.editable.test.tsx`. |
| Safeguards | Нельзя ломать Phase 1A/1B и public safeguards #110-#141. | Access gating, supplier identity redaction, exact-price locks, Batch #112 code splitting, Batch #113 route chunk boundary and Batches #110-#141 не затрагивались. | Lovable sync можно делать после объединения Phase 1A-1C в один backend Phase 1 package. | Targeted account/API tests plus full validation gates. |

## Implementation Notes

- Header name: `x-yorso-account-version`.
- Backend conflict code: `account_snapshot_conflict`.
- Backend compatibility: stale rejection is enforced only when the client sends
  the version header. The current YORSO account frontend sends it after backend
  load. Older clients without this header remain accepted until a later strict
  contract decision.
- PostgreSQL version source:
  - `yorso_users.updated_at`;
  - `yorso_companies.updated_at`;
  - `yorso_company_media.updated_at`;
  - `yorso_company_branches.updated_at`;
  - `yorso_company_products.updated_at`;
  - `yorso_company_meta_regions.updated_at`;
  - `yorso_notification_preferences.updated_at`.
- Collection replacements touch the parent company or user row so deletes and
  empty replacements still advance the account snapshot version.

## User-Facing Behavior

When another session saves newer account data:

1. the current save fails with `409 account_snapshot_conflict`;
2. the edited card stays open;
3. the inline card error says the account data changed and asks for reload;
4. a top account banner explains that another session saved newer data;
5. the reload action reruns the backend session/profile load.

This deliberately avoids optimistic overwrite or silent local fallback in
API-enabled mode.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Account route mount remains Phase 1A behavior: one session validation plus
  bounded account snapshot reads.
- Each account GET now includes one repository version read.
- Each account write now includes one version read before mutation and one
  version read after successful mutation.
- Normal UI edits remain Phase 1B scoped writes: personal/company one PATCH,
  collection edits one row-level POST/PATCH/DELETE for the changed row.
- No polling, subscriptions or background sync are added.

Cache, queue and backpressure strategy:

- No queue is introduced.
- The existing self-hosted auth/session cache remains the authentication cache
  boundary.
- Account version is calculated from database `updated_at` values and is not
  cached in the frontend beyond the current account API client instance.
- On conflict, the browser stops the write path and requires reload instead of
  retrying automatically.

Database indexing and pagination strategy:

- No pagination surface is added.
- Existing account tables are already scoped by user/company ownership.
- Production PostgreSQL should keep indexes on owner/user/company foreign keys
  used by the version query:
  `yorso_companies.owner_user_id`, collection `company_id`, and notification
  `user_id`.
- The version query is a bounded aggregate over one account owner and its
  company-scoped rows, not a global scan.

Failure mode and graceful degradation:

- Missing/mismatched version header from current frontend produces visible
  conflict recovery only when the header was sent and stale.
- Backend unavailable remains Phase 1A fail-closed behavior for editable
  account sections.
- API-disabled local preview keeps localStorage/mock fallback and does not
  participate in backend versioning.
- Legacy clients without the header remain compatible for now; this is a
  conscious transition boundary, not the final strict contract.

Observability and load-test plan:

- Track `409 account_snapshot_conflict` rate by route and user/session.
- Include version-query latency in account endpoint p95/p99 monitoring.
- Load-test at 10,000 concurrent users with:
  - account route open;
  - personal edit;
  - company edit;
  - row-level branch/product/meta-region/notification edit;
  - deliberate stale tab conflict.
- Watch p95 mutation latency, conflict rate, DB CPU, row lock waits,
  session-cache misses and frontend reload-banner rate.

## Validation

Validated locally on 2026-05-28:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/server.test.ts`
  - 2 files passed;
  - 77 tests passed;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`
  - 2 files passed;
  - 37 tests passed;
- `npx tsc -b --noEmit`.

- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.

Known non-blocking warnings preserved:

- React Router v7 future flag warnings in legacy frontend tests;
- existing `act(...)` warnings in account editable tests;
- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale.
