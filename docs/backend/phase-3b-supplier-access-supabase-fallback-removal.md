# Backend Phase 3B — Supplier Access Supabase Fallback Removal

Status: implemented.

Phase 3B removes the remaining runtime Supabase fallback from the supplier-access
frontend facade. Supplier access now has one production source of truth: the
self-hosted YORSO access API. API-disabled preview builds keep the existing
localStorage mock only for local/static demos.

No supplier-access path falls back to Supabase.

## Plan / Fact

| Пункт плана | Сделано | Будет реализовано дальше |
| --- | --- | --- |
| Убрать runtime-зависимость `supplier-access-api.ts` от legacy Supabase adapter. | Удалены dynamic import, legacy read/request branches и файл `src/lib/legacy-supplier-access-supabase-adapter.ts`. | Phase 3C разберет оставшиеся Supabase reference tooling/tests/env/dependency, которые не являются runtime fallback. |
| Сохранить self-hosted `/v1/access/*` как production source of truth. | `createSupplierAccessApiClient()` продолжает читать/создавать заявки через `/v1/access/suppliers/:supplierId/request`, читать уведомления через `/v1/access/notifications` и подтверждать их через `PATCH /v1/access/notifications`. | Runtime API hardening остается в backend access/admin tracks, без возврата BaaS fallback. |
| Оставить API-disabled preview рабочим без Supabase auth/RLS. | При пустом `VITE_YORSO_API_URL` заявка создается и читается только из локального preview-хранилища `supplier-access-requests`. | Preview mock будет удален или ограничен отдельным demo-mode решением, когда продукт полностью уйдет от local prototype surfaces. |
| Fail-closed для configured deployments. | Если self-hosted read падает, stale local approval очищается и UI не получает локальную разблокировку. Если self-hosted request падает, локальная mock-заявка не создается. | Добавить UI error copy можно отдельным UX batch, если понадобится видимое объяснение покупателю при отказе API. |
| Обновить regression guards. | `supplier-access-api.boundary.test.ts`, `supplier-access-api.test.ts`, `check:self-hosted-api` и `check:production-scale-baseline` теперь запрещают возвращение legacy adapter. | Phase 3C должен убрать или переформулировать оставшиеся Supabase reference checks после отдельного решения. |

## Runtime Contract

Configured deployment:

- `VITE_YORSO_API_URL` set.
- Request status read: `GET /v1/access/suppliers/:supplierId/request`.
- Request creation: `POST /v1/access/suppliers/:supplierId/request`.
- Notification feed: `GET /v1/access/notifications`.
- Notification acknowledgement: `PATCH /v1/access/notifications`.
- Any failed read clears stale local supplier-access approval and returns `null`.
- Any failed request rejects and does not create a local mock request.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Supplier-access state uses only `src/lib/supplier-access-requests.ts`.
- No Supabase auth user, RLS table or edge function is consulted.

Removed:

- `src/lib/legacy-supplier-access-supabase-adapter.ts`.
- Dynamic import of `@/lib/legacy-supplier-access-supabase-adapter`.
- Runtime references to `readLegacySupplierAccessRequest`,
  `requestLegacySupplierAccess`, `isLegacySupplierAccessSupabaseConfigured` and
  Supabase RPC/table calls for supplier access.

## 10,000 Concurrent-User Review

Expected read/write profile:

- Hot read path is unchanged: offer/detail/catalog UI reads supplier-access
  status through the self-hosted access API when configured.
- Write path is one `POST` per buyer supplier-access request.
- Notification reads are bounded polling/UI-triggered reads through
  `/v1/access/notifications`.
- Acknowledge writes are batched by notification id list through one `PATCH`.

Cache, queue and backpressure strategy:

- The frontend no longer creates hidden Supabase reads as a secondary backend
  pressure source.
- Configured API failures fail closed instead of creating local write pressure or
  conflicting grants.
- Backend access tables, notification indexes and admin grant flows remain the
  scaling boundary from the existing Phase 0/1/2 backend work.

Database indexing and pagination strategy:

- No new tables or migrations in Phase 3B.
- Existing supplier-access request/grant/notification indexes remain the source
  of truth for `10,000` concurrent-user access reads and writes.

Failure mode and graceful degradation:

- Configured API read failure: clear stale local approval and keep the buyer in
  locked/unknown state.
- Configured API request failure: reject and do not create a local preview
  request.
- API-disabled preview: local mock remains explicitly local and does not claim
  production trust.

Observability and load-test plan:

- Continue to validate through `smoke:e2e:api-backed-access-flows:run`,
  supplier-access frontend tests and API smoke tests.
- Phase 3B adds guards that fail if the removed adapter file returns or if
  `supplier-access-api.ts` regains legacy Supabase markers.

## Remaining Supabase / Prototype Debt After Phase 3B

| Debt | Status после Phase 3B | Следующий scoped шаг |
| --- | --- | --- |
| Catalog Supabase fallback | Removed in Phase 3A. | Нет действий. |
| Supplier-access Supabase fallback | Removed in Phase 3B. | Нет runtime-действий; следить через guards. |
| Supabase reference tooling/tests | Still present as non-runtime boundary/reference checks. | Phase 3C: classify, retire or rename tooling so product direction is self-hosted-only. |
| Empty prototype env keys | Still present where examples/tests require historical boundary checks. | Phase 3C. |
| `@supabase/supabase-js` dependency and `src/integrations/supabase/client.ts` | Still present for reference tooling/tests, not supplier-access runtime. | Phase 3C decision: remove, quarantine or keep as explicit migration-reference artifact. |

## Validation

Completed validation:

- `npx vitest run src/lib/supplier-access-api.boundary.test.ts src/lib/supplier-access-api.test.ts`
- `npm run test:supplier-access-frontend`
- `npm run test:access-contract`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run check:supabase-boundary`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:e2e:api-backed-access-flows`
- `npm run build`
- `npm run smoke:e2e:frontend-no-supabase-env`
- `git diff --check`
