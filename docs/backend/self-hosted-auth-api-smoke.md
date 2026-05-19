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
- `auth_rate_limit_guard=ok`
- `auth_sign_out=ok`
- `auth_sign_out_revokes_session=ok`
- `auth_sign_out_blocks_account=ok`
- `auth_sign_out_blocks_access=ok`
- `auth_sign_out_blocks_offer_unlock=ok`
- `auth_sign_out_preserves_public_catalog=ok`
- `self_hosted_auth_api_smoke=ok`

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
