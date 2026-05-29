# Backend Phase 4A — Supplier Directory/Profile Source Of Truth Audit

Status: implemented.

Phase 4A closes the supplier directory/profile source-of-truth gap left after
the provider-free Phase 3 work. `/suppliers` and `/suppliers/:supplierId` keep
their API-disabled local preview, but configured deployments no longer replace
failed self-hosted supplier API reads with prototype supplier rows or local
fallback profiles.

Configured supplier directory/profile reads now fail closed to a visible live
API error state.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Проверить реальные data paths `/suppliers` и `/suppliers/:supplierId`. | Подтверждено: страницы используют `useSupplierDirectoryList` / `useSupplierDirectoryDetail`, а adapters вызывают `/v1/suppliers` и `/v1/suppliers/:id` при `VITE_YORSO_API_URL`. | Следующий supplier-scoped шаг должен идти глубже в backend profile data completeness, а не возвращать prototype fallback. |
| Убрать configured-mode подстановку `mockSuppliers` при ошибке API. | `use-supplier-directory.ts` теперь инициализирует API-enabled state как `source: "api"` и на ошибке оставляет только прежние API-данные или пустой результат; local fallback доступен только при пустом `VITE_YORSO_API_URL`. | Удаление API-disabled preview возможно отдельным demo-mode решением, когда Lovable/local preview больше не нужен. |
| Сохранить видимое объяснение ошибки для buyer UI. | `/suppliers` показывает error banner и source chip `Live directory error`; `/suppliers/:supplierId` показывает отдельный retry state вместо not-found или mock profile. | Можно добавить telemetry для supplier-directory API failures отдельным observability batch. |
| Сохранить access gating и supplier identity redaction. | Locked API responses остаются authority; при API failure frontend не получает локальный masked supplier profile, а companyName/website/WhatsApp не появляются. | Backend supplier profile completeness and owner/admin editing остаются следующими phases. |
| Добавить regression guards. | Обновлены `use-supplier-directory.test.tsx`, `Suppliers.test.tsx`, `SupplierProfile.access.test.tsx`, `check:self-hosted-api` и `check:production-scale-baseline`. | CI должен держать этот контракт вместе с Phase 3 provider-free guards. |

## Runtime Contract

Configured deployment:

- `VITE_YORSO_API_URL` set.
- Supplier list read: `GET /v1/suppliers`.
- Supplier detail read: `GET /v1/suppliers/:supplierId`.
- Loading state may preserve previous successful API data during refresh.
- First-load API failure returns `source: "api"`, `status: "error"` and no
  prototype supplier rows/profile.
- Refresh failure after a successful API read may keep the last successful API
  payload visible with an error banner.
- No configured supplier directory/profile path calls Supabase or hosted BaaS.

API-disabled preview:

- `VITE_YORSO_API_URL` empty.
- Supplier directory/profile can use `mockSuppliers` for local static preview.
- This mode is explicitly non-production and does not claim live supplier truth.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new write path is introduced.
- Hot reads stay on `/v1/suppliers` with query, filter, sort, limit and offset,
  and `/v1/suppliers/:supplierId` for profile details.
- Removing configured-mode prototype fallback prevents split-brain buyer
  sessions where failed API traffic silently becomes local fixture traffic.

Cache, queue and backpressure strategy:

- No frontend polling or worker is added.
- Existing backend supplier-directory pagination, PostgreSQL indexes and access
  grants remain the production scaling boundary.
- During refresh, stale UI can only come from a previous successful API response,
  not from `mockSuppliers`.

Database indexing and pagination strategy:

- No new migration is added.
- Existing supplier directory indexes from `0005_supplier_directory_search_scaling`
  and `0009_supplier_directory_pagination_sort` remain required.
- List pagination remains server-backed through `limit` and `offset`.

Failure mode and graceful degradation:

- First-load configured API failure: show localized live API error and retry;
  no local supplier rows/profile are shown.
- Detail configured API failure: show retry state, not a not-found result and
  not a local fallback profile.
- API-disabled preview remains local and explicit.

Observability and load-test plan:

- Keep `test:supplier-directory-frontend`,
  `check:self-hosted-api` and `check:production-scale-baseline` in release
  validation.
- Load tests should exercise paginated `/v1/suppliers`, private search after
  access grants, and detail reads under failure/retry conditions.
- Add API failure telemetry in a later observability phase if buyer support
  needs aggregate failure tracking.

## Remaining Supplier Directory/Profile Debt After Phase 4A

| Debt | Status после Phase 4A | Следующий scoped шаг |
|---|---|---|
| API-disabled `mockSuppliers` preview | Оставлен только для local/Lovable preview без `VITE_YORSO_API_URL`. | Separate demo-mode retirement decision. |
| Configured-mode prototype fallback | Removed for supplier directory/profile reads. | Нет действий; держать через guards. |
| Supplier profile content completeness | API-shaped read path есть, но часть rich dossier sections still derive from frontend supplier content helpers. | Phase 4B: profile detail completeness and backend-owned dossier fields. |
| Supplier owner/admin editing | Не реализовано в Phase 4A. | Later supplier operations/admin phase. |

## Validation

Completed validation:

- `npx vitest run src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npm run test:supplier-directory-frontend`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `git diff --check`

Marker: Backend Phase 4A.
Marker: Supplier Directory/Profile Source Of Truth Audit.
Marker: configured supplier API fail-closed.
Marker: no configured supplier prototype fallback.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
