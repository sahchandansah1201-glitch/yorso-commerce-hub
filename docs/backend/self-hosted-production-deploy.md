# Self-Hosted Production Deploy

Status: production deployment direction
Batch: #72
Date: 2026-05-18

## Purpose

This document defines the minimum deployable YORSO runtime for an owned server.
It is not a Supabase, Firebase, Appwrite, Clerk, Auth0 or hosted BaaS/SaaS
deployment plan.

The production product must be deployable from this repository with owned
configuration, owned PostgreSQL data, owned file storage and owned operational
controls.

## Runtime Topology

Minimum production topology:

- reverse proxy with TLS termination;
- static frontend build;
- `apps/api` Node service;
- PostgreSQL as the transactional system of record;
- PgBouncer between API workers and PostgreSQL;
- Redis for cache, locks, sessions, rate limits and short-lived workflow state;
- mounted server volume for the current API file-storage implementation;
- MinIO or owned S3-compatible storage as the object-storage boundary;
- queue workers for notifications, imports, reports and future agent jobs;
- backup, restore, logs, metrics and alerting controlled by YORSO operators.

The current `infra/docker-compose.yml` is the local/server baseline for this
topology. It is not a managed BaaS deployment.

## Required Environment

Use `.env.production.example` as the production environment template.

Required groups:

- public URLs: `YORSO_PUBLIC_APP_URL`, `YORSO_API_URL`,
  `VITE_YORSO_API_URL`;
- API mode: `ACCOUNT_REPOSITORY=postgres`;
- PostgreSQL and migration URLs: `DATABASE_URL`, `MIGRATION_DATABASE_URL`;
- pooling: `PGBOUNCER_DATABASE_URL`;
- cache and short-lived workflow state: `REDIS_URL`;
- storage: `STORAGE_DRIVER`, `STORAGE_LOCAL_ROOT`, `S3_ENDPOINT`, `S3_BUCKET`;
- runtime secrets: `YORSO_SESSION_SECRET`, `YORSO_JWT_SECRET`.

Production env must not contain:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_PUBLISHABLE_KEY`;
- Supabase project refs or service-role keys;
- Firebase, Appwrite, Clerk or Auth0 application-backend settings.

## Deploy Sequence

Minimum server sequence:

```bash
cp .env.production.example .env.production
# edit all change-me values before starting services

docker compose --env-file .env.production -f infra/docker-compose.yml build
docker compose --env-file .env.production -f infra/docker-compose.yml up -d postgres pgbouncer redis minio api

npm run db:migrations:status:live
npm run db:migrations:apply:live:dry-run
npm run db:migrations:apply:live
npm run smoke:self-hosted-account-postgres
npm run smoke:self-hosted-workspace-postgres
npm run smoke:self-hosted-health-readiness
npm run smoke:self-hosted-graceful-shutdown
npm run smoke:self-hosted-request-guardrails
npm run smoke:self-hosted-request-observability
npm run smoke:self-hosted-error-observability
npm run smoke:self-hosted-metrics
```

The production frontend should be built with `VITE_YORSO_API_URL` pointing at
the owned YORSO API. It should not require any Supabase environment variable.

## Current Implementation Boundary

The self-hosted backend already owns:

- account/company profile contracts;
- company branches, products, meta-regions and notifications;
- file and document API routes;
- supplier directory API routes;
- offer catalog API routes;
- supplier access request, grant and notification routes;
- self-hosted auth/session foundation routes;
- PostgreSQL migrations and static migration planner;
- runtime smokes for account, offer detail and access paths.

The frontend auth bridge is also self-hosted-first: set `VITE_YORSO_API_URL`
to the owned API origin and `/signin` will use `/v1/auth/sign-in`, persist the
returned backend session id/user id and send those values to account, supplier
and offer API adapters. Do not configure Supabase, Firebase, Appwrite, Clerk,
Auth0 or hosted BaaS/SaaS auth variables for production.

Known production gaps:

- production auth hardening is still incomplete: Batch #73 adds session
  issuance, Batch #78 adds Redis sign-in backpressure and Batch #79 adds the
  Redis session cache boundary, Batch #80 adds fail-closed cache-outage
  validation, Batch #81 adds no-PII JSONL auth observability and Batch #82 adds
  health/readiness checks. Batch #83 adds graceful shutdown drain for rolling
  deploys, Batch #84 adds request timeout, body idle timeout, header-size
  and JSON body-size guardrails, and Batch #85 adds no-PII request
  observability for those guardrails. Password hashing policy, MFA, session
  rotation and audit dashboards remain future work;
- queue workers are documented as part of the target topology but not fully
  implemented;
- the file API currently uses a mounted server volume while MinIO remains the
  owned object-storage boundary for the next storage-driver step;
- load testing has a documented 10,000 concurrent-user baseline, but the target
  has not yet been proven by external load-test evidence.

These gaps do not change the production direction: the solution remains
self-hosted and must not move to a hosted BaaS/SaaS backend.

## Validation

Run before treating a deploy change as production-safe:

```bash
npm run check:self-hosted-production-runtime
npm run check:self-hosted-infra
npm run check:self-hosted-api
npm run check:self-hosted-db
npm run check:production-scale-baseline
npm run smoke:self-hosted-health-readiness
npm run smoke:self-hosted-graceful-shutdown
npm run smoke:self-hosted-request-guardrails
npm run smoke:self-hosted-request-observability
npm run smoke:self-hosted-error-observability
npm run smoke:self-hosted-metrics
npm run smoke:self-hosted-audit-trail
npm run smoke:self-hosted-audit-persistence
npm run smoke:self-hosted-admin-audit
npm run smoke:self-hosted-auth-api
npm run smoke:e2e:self-hosted-auth-frontend
npm run smoke:e2e:frontend-no-supabase-env
npm run ci:core
```

`check:self-hosted-production-runtime` specifically protects Batch #72. It
fails if production runtime docs, compose or `.env.production.example` drift
back toward Supabase or similar hosted application backends.

Batch #86 adds `smoke:self-hosted-error-observability` to the deploy
validation path. It verifies that buyer-visible API errors expose request,
correlation and error ids, while the server writes sanitized `api_error_event`
JSONL records without payload values or credentials.

Batch #87 adds `smoke:self-hosted-metrics` to the deploy validation path. It
verifies that `YORSO_METRICS_DRIVER=prometheus` exposes `/metrics` with
Prometheus-compatible request, error, auth, guardrail and readiness metrics
without leaking buyer emails, passwords, supplier ids, offer ids, query values
or session ids.

Batch #88 adds `smoke:self-hosted-audit-trail` to the deploy validation path.
It verifies that the console audit sink writes sanitized `api_audit_event`
records for auth, account, access, notification and storage actions without
leaking emails, passwords, raw ids, file names or business profile values.

Batch #89 adds `smoke:self-hosted-audit-persistence` to the deploy validation
path. Production config must use `YORSO_AUDIT_DRIVER=postgres` and
`YORSO_AUDIT_MAX_IN_FLIGHT`; the smoke verifies PostgreSQL insert shape,
hash-only audit parameters and bounded backpressure behavior.

Batch #90 adds `smoke:self-hosted-admin-audit` to the deploy validation path.
The smoke verifies that admin audit reads require a valid backend session plus
the `admin` role, that ordinary buyer sessions receive `admin_role_required`,
and that JSONL export is bounded and served from the self-hosted API.

Batch #91 adds admin audit hardening to deploy validation. Production env must
set `YORSO_ADMIN_AUDIT_EXPORT_MAX_WINDOW_DAYS=31` and
`YORSO_ADMIN_AUDIT_RETENTION_DAYS=365` or stricter retention. The admin audit
smoke verifies route/status filters, export-window rejection and Prometheus
metrics before a deployment is considered ready.

Batch #92 adds the admin audit retention runbook path. Operators should first
run a dry-run:

```bash
YORSO_API_URL=https://api.example.com \
YORSO_ADMIN_EMAIL=admin@example.com \
YORSO_ADMIN_PASSWORD=... \
npm run admin:audit:retention -- --retention-days=365 --batch-size=1000 --max-batches=1
```

Deletion requires an explicit apply flag:

```bash
YORSO_API_URL=https://api.example.com \
YORSO_ADMIN_EMAIL=admin@example.com \
YORSO_ADMIN_PASSWORD=... \
npm run admin:audit:retention -- --apply --retention-days=365 --batch-size=1000 --max-batches=10
```

The API deletes through `yorso_purge_api_audit_events_batch`, so production
retention jobs stay bounded and can be repeated by cron or an external
orchestrator without depending on Supabase or another hosted backend.

## Admin Runtime Status

Batch #93 adds an operator status read path:

```bash
YORSO_API_URL=https://api.example.com \
YORSO_ADMIN_EMAIL=admin@example.com \
YORSO_ADMIN_PASSWORD=... \
node -e '
const base = process.env.YORSO_API_URL;
const email = process.env.YORSO_ADMIN_EMAIL;
const password = process.env.YORSO_ADMIN_PASSWORD;
const session = await fetch(`${base}/v1/auth/sign-in`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
}).then((response) => response.json());
const status = await fetch(`${base}/v1/admin/runtime/status`, {
  headers: {
    "x-yorso-user-id": session.session.userId,
    "x-yorso-session-id": session.session.id,
  },
}).then((response) => response.json());
console.log(JSON.stringify(status, null, 2));
'
```

The status payload is safe to use in runbooks because it reports only driver
names, guardrail limits, lifecycle state and production policy. It must not
contain `DATABASE_URL`, `REDIS_URL`, S3 endpoints, buckets, filesystem paths,
emails, raw user ids, raw session ids or secrets. Validate locally with:

```bash
npm run smoke:self-hosted-admin-runtime-status
```

## Admin Runtime UI

Batch #94 adds the browser status console:

```bash
VITE_YORSO_API_URL=https://api.example.com npm run build
```

Then open `/admin/runtime` in the frontend. The page is for self-hosted admin
sessions only. It displays safe runtime facts from `/v1/admin/runtime/status`:
production baseline, runtime drivers, auth backpressure, request guardrails,
audit limits, lifecycle drain state and the policy that hosted BaaS is not a
production backend. It must not display emails, raw user ids, raw session ids,
connection strings, storage endpoints or secrets.

Validate the UI contract with:

```bash
npm run test:admin-runtime-frontend
npm run smoke:e2e:admin-runtime-status
```

## Admin Runtime Diagnostics

Batch #95 adds the diagnostics endpoint and browser panel:

```bash
const diagnostics = await fetch(`${base}/v1/admin/runtime/diagnostics`, {
  headers: {
    "x-yorso-user-id": session.session.userId,
    "x-yorso-session-id": session.session.id,
  },
}).then((response) => response.json());
console.log(JSON.stringify(diagnostics, null, 2));
```

The diagnostics payload is safe for operator runbooks. It reports derived
checks and capacity-plan text only. It must not include `DATABASE_URL`,
`REDIS_URL`, object-storage endpoints, buckets, filesystem paths, emails, raw
user ids, raw session ids or secrets.

The `/admin/runtime` page renders diagnostics as an explicit checklist and
capacity plan. It does not poll by default. Operators use the refresh button
when validating a deployment or investigating a runtime change.
