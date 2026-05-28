# Backend Phase 1A: Account Session Authority Gate

Дата: 2026-05-28

## Решение

Phase 1A закрывает первый конкретный gap из discovery/audit Phase 1:
`/account/*` больше не должен показывать редактируемые account-разделы из
`localStorage`/mock state, когда self-hosted API включён через
`VITE_YORSO_API_URL`.

В API-enabled режиме authority chain теперь такая:

1. проверить текущую browser session через `GET /v1/auth/session`;
2. при `auth_session_required` или `auth_session_invalid` очистить локальную
   buyer session и отправить пользователя на `/signin`;
3. при валидной сессии загрузить account snapshot из self-hosted API:
   `/v1/account/me`, `/company`, `/branches`, `/products`, `/meta-regions`,
   `/notifications`;
4. показать редактируемые account-разделы только после успешной backend
   загрузки;
5. при недоступном backend показать explicit unavailable state и не рендерить
   редактируемые account cards;
6. при сохранении в API-enabled режиме сначала сохранить в backend, и только
   после успешного ответа обновить UI state.

Локальный `localStorage` fallback сохраняется только для API-disabled режима
Lovable/local preview.

## План / факт

| Зона | План | Факт / проверено | Будет реализовано | Статус точности |
|---|---|---|---|---|
| Session authority | `/account/*` в API-enabled режиме должен проверять `/v1/auth/session` до рендера приватных редактируемых секций. | `src/pages/account/Account.tsx` вызывает `readCurrentAuthSession()` перед рендером `AccountShell`. Пока статус `loading`, показывается `account-session-loading`. | Phase 1B: section-scoped account mutations вместо broad full-profile PATCH. | Проверено targeted tests: `Account.test.tsx`. |
| Invalid session | Missing/invalid session должна очищать browser buyer session и вести на `/signin`. | `auth_session_required` / `auth_session_invalid` вызывают `buyerSession.signOut()` и `<Navigate to="/signin" replace />`. | Sign-in return-to-account redirect policy остаётся отдельным scope. | Проверено targeted tests: missing session redirects to `signin-target`. |
| Backend account source | Валидная сессия должна грузить profile из backend как authority. | `createAccountApiClient({ userId: session.userId, sessionId: session.id })` используется для hydrate; account headers `x-yorso-user-id` и `x-yorso-session-id` проверены в тесте. | Phase 1B: более узкие endpoint writes и optimistic conflict handling. | Проверено targeted tests: backend `Remote Seafood` заменяет local `Atlantic Bridge`. |
| Backend unavailable | Если backend profile load failed, нельзя показывать editable local fallback. | `account-backend-unavailable` state закрывает editable sections; `account-content` не рендерится. | Phase 1B/1C: retry telemetry and structured error mapping. | Проверено targeted tests: account/me 503 leaves editable sections closed. |
| Save authority | В API-enabled режиме save не должен сначала писать `localStorage`. | `update()` для API mode вызывает `syncAccountProfileToApi()` и обновляет UI только после backend ответа; local mode сохраняет прежнее `saveAccountProfile`. | Phase 1B: section-level writes and transaction boundary. | Проверено targeted tests: personal save sends PATCH `/v1/account/me` with session/user headers and does not write changed value to localStorage. |
| UI copy | Account shell должен честно показывать источник данных. | `AccountShell` принимает `sourceMode`; API mode показывает `account_backend_sourceNote`, local mode сохраняет prototype note. | Ничего по Phase 1A. | Проверено targeted tests and i18n keys. |

## 10,000 concurrent-user baseline

Expected read/write profile:

- API-disabled local preview: без новых backend reads/writes.
- API-enabled account route:
  - one `GET /v1/auth/session` per account route mount/retry;
  - one bounded parallel account snapshot read across six account endpoints;
  - save action currently performs the existing broad six-endpoint account
    PATCH sync through `syncAccountProfileToApi`.
- No polling, subscriptions, background jobs or periodic refreshes added.
- No public catalog/supplier/read conversion surfaces changed.

Cache, queue and backpressure strategy:

- Auth/session validation remains governed by existing self-hosted auth session
  cache policy (`AUTH_SESSION_CACHE_DRIVER`, fail-closed mode) documented in
  the backend baseline.
- Frontend adds no queue. Retry is user-initiated through a single button.
- Backend load shedding remains the existing self-hosted API responsibility;
  frontend degrades by closing editable account sections instead of falling back
  to stale local data.
- Existing Vite route code splitting and Batch #113 route chunk error boundary
  are unchanged.

Database indexing and pagination strategy:

- No new tables, migrations or indexes.
- Account snapshot endpoints already read bounded current-user account records
  and workspace collections by authenticated account context.
- No new pagination surfaces are introduced in Phase 1A.
- Phase 1B should address write granularity and transactional section updates.

Failure mode and graceful degradation:

- Missing/invalid session: local buyer session is cleared and the user is sent
  to `/signin`.
- Auth/network/backend profile failure: account editable UI stays closed and
  `Account data is temporarily unavailable` is shown.
- Save failure in API mode: `EditableCard` keeps edit mode and shows inline
  save error via existing async `onSave` error handling.
- Local preview without `VITE_YORSO_API_URL`: current local account prototype
  behavior is preserved.

Observability and load-test plan:

- Targeted unit/regression tests cover local fallback, backend session gate,
  backend account hydration, unavailable state and remote-first save.
- Existing API auth/account route tests continue to cover backend fail-closed
  behavior.
- Future load test for Phase 1 should simulate account route open + section save
  under 10,000 concurrent users with Redis session cache enabled and verify
  bounded database reads/writes, p95 route latency and error rate.

## Validation

- `npx vitest run src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx src/lib/account-api.test.ts src/lib/auth-runtime.test.ts`
  - 4 files passed;
  - 51 tests passed.
- `npx tsc -b --noEmit` passed.
- `npm run lint` passed.
- `npm run check:production-scale-baseline` passed.
- `git diff --check` passed.
- `npm run build` passed.
  - Account route chunk: `Account-CSSVMLIT.js` 109.62 kB / 25.11 kB gzip.

Known non-blocking warnings preserved:

- React Router v7 future flag warnings in existing test harness.
- Existing `act(...)` warnings in legacy account editable tests.
- Supabase generated types out-of-sync in non-strict mode.
- Browserslist data stale.
