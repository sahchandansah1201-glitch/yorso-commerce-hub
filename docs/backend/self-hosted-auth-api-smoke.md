# Self-Hosted Auth API Smoke

Status: active runtime smoke
Batch: #73
Date: 2026-05-18

## Purpose

`smoke:self-hosted-auth-api` verifies that the YORSO-owned API can issue,
read and revoke a session without relying on hosted auth providers.

This is a foundation smoke, not final production auth hardening. Password
hashing policy, brute-force protection, MFA, Redis session replication and
auth audit dashboards remain separate work before production signoff.

## Command

```bash
npm run smoke:self-hosted-auth-api
```

The command builds `apps/api`, starts the compiled server in memory mode on a
free local port, runs HTTP checks and shuts the process down.

## Frontend Bridge Smoke

Batch #74 adds the browser-level companion check:

```bash
npm run smoke:e2e:self-hosted-auth-frontend
```

It builds the frontend with `VITE_YORSO_API_URL` pointing at an intercepted
self-hosted API, signs in through `/signin`, verifies the returned backend
session is stored in `yorso_buyer_session`, and checks that downstream API
requests carry `x-yorso-user-id` and `x-yorso-session-id`.

## Expected Markers

The smoke must print:

- `auth_sign_in=ok`
- `auth_session=ok`
- `auth_invalid_credentials_guard=ok`
- `auth_validation_guard=ok`
- `auth_rate_limit_retry_after=ok`
- `auth_rate_limit_guard=ok`
- `auth_sign_out=ok`
- `auth_sign_out_revokes_session=ok`
- `auth_session_cache_invalidation=ok`
- `auth_sign_out_blocks_account=ok`
- `auth_sign_out_blocks_access=ok`
- `auth_sign_out_blocks_offer_unlock=ok`
- `auth_sign_out_preserves_public_catalog=ok`
- `self_hosted_auth_api_smoke=ok`

Batch #80 adds the companion fail-closed smoke:

- `auth_session_cache_fail_closed_sign_in=ok`
- `auth_session_cache_fail_closed_session=ok`
- `auth_session_cache_fail_closed_account=ok`
- `auth_session_cache_fail_closed_catalog=ok`
- `auth_session_cache_fail_closed_public_catalog=ok`
- `self_hosted_session_cache_fail_closed_smoke=ok`

## Production Scale Notes

At the 10,000 concurrent-user target this smoke only proves endpoint wiring and
owned-session shape. Production readiness still requires:

- indexed session lookup and expiry cleanup;
- Redis or equivalent session/cache strategy;
- rate limits for sign-in attempts;
- lockout/backpressure policy;
- structured auth audit events;
- load tests for sign-in bursts and steady session reads.

Batch #76 extends the smoke from session issuance/revocation into route
authority. The same signed-out session id must fail closed on protected account
and supplier-access routes, and it must not unlock catalog data when sent with
`accessLevel=qualified_unlocked`. Anonymous catalog reads still degrade
gracefully to public redacted data when no session headers are present.

Batch #77 adds self-hosted auth security events and a first sign-in
backpressure guard. Repeated failed sign-in attempts for the same email are
counted from `yorso_auth_security_events`; the sixth failed attempt inside the
15-minute window returns `429 auth_rate_limited`. The smoke marker
`auth_rate_limit_guard=ok` proves the guard works over the compiled API.

Batch #78 moves the production backpressure path to Redis while preserving the
audit-log fallback for local tests. Production runtime must use
`AUTH_RATE_LIMIT_DRIVER=redis` and `AUTH_RATE_LIMIT_FAIL_MODE=closed`; local
development may use `AUTH_RATE_LIMIT_DRIVER=audit_log`. The 429 response also
sets `Retry-After: 900`, so clients and edge proxies can back off without
guessing the lockout window.

Batch #79 adds session-cache validation. The smoke starts the compiled API with
`AUTH_SESSION_CACHE_DRIVER=memory` and
`AUTH_SESSION_CACHE_FAIL_MODE=closed`, so sign-in warms the session cache and
sign-out must invalidate it before the same session id can be used again. The
marker `auth_session_cache_invalidation=ok` proves the route authority does not
keep accepting a cached session after revocation. Production uses the same
cache contract with `AUTH_SESSION_CACHE_DRIVER=redis`.

Batch #80 adds the negative runtime check for production cache failure mode.
`smoke:self-hosted-session-cache-fail-closed` starts the compiled API with
`AUTH_SESSION_CACHE_DRIVER=redis`, `AUTH_SESSION_CACHE_FAIL_MODE=closed` and a
known-unavailable Redis endpoint. The expected behavior is deliberately strict:
sign-in and direct session reads return `auth_session_cache_unavailable`,
protected account routes and authenticated catalog unlock attempts fail closed,
and anonymous catalog reads still return public redacted data. This protects
the 10,000 concurrent-user runtime from silently bypassing the session cache
when production Redis is down.
