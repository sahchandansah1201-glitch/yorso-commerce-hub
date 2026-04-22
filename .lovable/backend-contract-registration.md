# YORSO Backend Contract — Registration & Auth (v1)

Frontend integration contract for all 9 registration / auth operations.
Implementation lives in `src/lib/api-contracts.ts` (mock today, real fetch
later — UI does not change). UI consumes the contract via `authApi.*` and
the `useApiCall()` hook (`src/lib/use-api-call.ts`).

All responses use the shared `ApiResult<T>` envelope:

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string; field?: string };
```

Use `isApiError(result)` to narrow.

---

## Session lifecycle

1. `startRegistration` returns `sessionId` → stored in `RegistrationContext.sessionId` (sessionStorage).
2. Every subsequent step sends that `sessionId`.
3. Unknown / expired `sessionId` → `VERIFICATION_FAILED` → UI redirects user back to `/register/email`.
4. `completeRegistration` issues `userId` + `token` (placeholder for real auth).

---

## The 9 operations

| # | Op | Endpoint | Page | Trigger |
|---|---|---|---|---|
| 1 | `startRegistration` | `POST /api/auth/register/start` | `/register/email` | Continue |
| 2 | `verifyEmail` | `POST /api/auth/register/verify-email` | `/register/verify` | OTP filled |
| 3 | `submitDetails` | `POST /api/auth/register/details` | `/register/details` | Continue |
| 4 | `requestPhoneVerification` | `POST /api/auth/register/phone/send` | `/register/details` | Send code / WhatsApp |
| 5 | `verifyPhone` | `POST /api/auth/register/phone/verify` | `/register/details` | Verify |
| 6 | `submitOnboarding` | `POST /api/auth/register/onboarding` | `/register/onboarding` | Continue |
| 7 | `submitMarkets` | `POST /api/auth/register/markets` | `/register/countries` | Complete setup |
| 8 | `completeRegistration` | `POST /api/auth/register/complete` | `/register/ready` | mount |
| 9a | `signIn` | `POST /api/auth/signin` | `/signin` | Sign in |
| 9b | `requestPasswordReset` | `POST /api/auth/password/reset` | `/signin` (forgot) | Send link |

---

## Error catalogue

| Code | Surface | UI behavior |
|---|---|---|
| `INVALID_EMAIL` | start, reset | inline error on email field |
| `EMAIL_ALREADY_EXISTS` | start | inline + toast → suggest sign in |
| `WEAK_PASSWORD` | details | inline error on password |
| `INVALID_PHONE` | phone/send | inline error on phone |
| `INVALID_VAT` | details | inline error on vatTin |
| `MISSING_REQUIRED_FIELD` | details, signin | inline + toast |
| `INVALID_CODE` | verify-email, phone/verify | inline + toast, do not reset code |
| `RATE_LIMITED` | phone/send | toast, disable resend ~30s |
| `VERIFICATION_FAILED` | any post-start step | toast + redirect to `/register/email` |
| `INVALID_CREDENTIALS` | signin | inline on password |
| `ACCOUNT_LOCKED` | signin | toast (suggest contact) |
| `ACCOUNT_NOT_FOUND` | signin | toast |
| `SERVER_ERROR` / `NETWORK_ERROR` / `SERVICE_UNAVAILABLE` | any | toast, allow retry |

Every error path also fires the analytics event `api_error { endpoint, code, field? }` automatically when the call goes through `useApiCall`, or manually via `analytics.track('api_error', …)` for legacy call sites.

---

## Mock triggers (deterministic, for QA)

| Input | Trigger |
|---|---|
| `email = taken@yorso.test` | `EMAIL_ALREADY_EXISTS` on `startRegistration` |
| `email = blocked@yorso.test` | `SERVER_ERROR` on `startRegistration` |
| email-OTP `code = 123456` | success |
| email-OTP any other code | `INVALID_CODE` |
| phone-OTP `code = 0000` | `INVALID_CODE` |
| phone-OTP ≥4 digits, ≠ 0000 | success |
| 6th phone code request in same session | `RATE_LIMITED` |
| Unknown / cleared `sessionId` | `VERIFICATION_FAILED` |
| `signIn email = locked@yorso.test` | `ACCOUNT_LOCKED` |
| `signIn email = missing@yorso.test` | `ACCOUNT_NOT_FOUND` |
| `signIn password ≠ Password1` | `INVALID_CREDENTIALS` |

### Env flags

| Flag | Effect |
|---|---|
| `VITE_MOCK_FLAKY=1` | 5% random `SERVER_ERROR` on every call (UI error testing) |
| `VITE_MOCK_LATENCY_MS=ms` | Override per-op latency (default 400–900ms) |

---

## Frontend state machine (per step)

```
idle → loading → (success → next route) | (error → stay, render inline + toast)
```

`useApiCall(fn, endpoint)` returns `{ loading, error, run, reset }` and emits `api_error` on every non-ok result. Pages can opt in to the hook or call `authApi.*` directly + `analytics.track('api_error', …)`.

---

## Replacing mocks with real backend

For each operation:

1. Replace the body of `authApi.<op>` in `src/lib/api-contracts.ts` with a `fetch` call.
2. Map server responses to `ApiSuccess<T>` / `ApiError` — keep the same `code` strings.
3. UI requires no changes.
4. Remove the in-memory `MockSession` registry.

Add a real backend gradually — e.g. ship `signIn` first, leave registration on mocks — both can coexist.
