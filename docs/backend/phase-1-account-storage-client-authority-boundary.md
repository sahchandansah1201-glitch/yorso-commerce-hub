# Backend Phase 1F: Account Storage Client Authority Boundary

Status: implemented locally, validation passed.

Date: 2026-05-28

## Scope

Phase 1F closes a narrow account source-of-truth gap left after Phase 1E.

Phase 1A made API-enabled `/account/*` validate the self-hosted session before
rendering editable account data. Phase 1C/1D/1E made account writes use
`accountVersion` and strict precondition handling.

Phase 1F keeps company documents and stored-file helpers inside the same
session-bound account client as the rest of `/account/company`. It also prevents
the enabled account API adapter from silently using the deterministic demo user
id when no session user, buyer session user or configured account user id is
available.

This is not a public UX batch, not a storage schema migration and not an auth
cookie redesign.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| No demo user in enabled account API mode | Self-hosted account API calls must not fall back to `DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID` when the client has `baseUrl` but no session user. | `createAccountApiClient` resolves user id lazily from explicit `userId`, `buyerSession.userId` or `VITE_YORSO_ACCOUNT_USER_ID`; enabled clients without any of them fail before fetch with `account_api_session_required`. | Keep the default demo id only for disabled/local prototype mode and explicit tests. | `account-api.test.ts` asserts no fetch happens without a session user. |
| Company documents use account route authority | `/account/company` document list/create must use the same session-bound client as company profile/media. | `CompanyDocumentsCard` accepts `accountApiClient`; `Account.tsx` passes the validated account client from the bootstrapped session. | Future account child components should receive the same client instead of creating an enabled client implicitly. | `Account.editable.test.tsx` asserts `/v1/account/documents` uses `x-yorso-user-id=user-api-1` and `x-yorso-session-id=session-api-1`. |
| Stored file URL authority | Stored-file URL helpers must include the same account user/session boundary. | `fileUrl` and `fileUrlForObjectKey` resolve the account user lazily and include `accountSessionId` when present. | If signed file URLs replace query auth later, keep this fail-closed user resolution. | `account-api.test.ts` updates file URL expectations with `accountSessionId`. |
| Safeguards | Phase 1A-1E and public safeguards #110-#141 must stay intact. | No public route, supplier redaction, exact-price lock, Batch #112 code-splitting or Batch #113 route boundary code changed. | Run standard validation before checkpoint commit. | Targeted account adapter/UI tests passed. |

## Implementation Notes

- `DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID` remains exported for local/test
  fixtures, but the enabled account API adapter no longer uses it as the
  implicit production request identity.
- Disabled local prototype mode still works when no API URL is configured.
- `CompanyDocumentsCard` keeps its local fallback client for standalone/local
  renders, but `/account/company` now passes the already validated
  `accountApiClient`.
- The account storage version behavior from Phase 1E is unchanged.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No new public traffic is added.
- Account document list/create request volume is unchanged.
- The change removes a possible wrong-identity fallback before network I/O; it
  does not add extra reads or writes.

Cache, queue and backpressure strategy:

- No queue, polling, subscription or retry loop is introduced.
- Existing auth/session cache remains the authority boundary.
- Existing upload body-size limits remain the storage backpressure boundary.

Database indexing and pagination strategy:

- No schema, migration, index or pagination change is introduced.
- Existing account, file and document indexes from Phase 1E remain sufficient.

Failure mode and graceful degradation:

- Enabled account API clients without a session/configured user now fail closed
  with `account_api_session_required` before issuing a request.
- API-disabled local prototype mode remains available for Lovable/offline review.
- Public catalog/supplier routes remain available and redacted.

Observability and load-test plan:

- Track frontend `account_api_session_required` sync failures separately from
  backend `auth_session_required` and `account_version_required`.
- Load-test coverage should keep the account route open + document list/create
  scenario from Phase 1E, with a negative case for missing frontend session user.

## Validation

Validated locally on 2026-05-28:

- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.test.tsx src/pages/account/Account.editable.test.tsx`
  - 3 files passed;
  - 52 tests passed.
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale;
- React Router v7 future flag warnings in account test harness;
- existing `act(...)` warnings in account editable tests.
