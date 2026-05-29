# YORSO Self-Hosted Production Policy

Status: mandatory production policy
Batch: #71
Date: 2026-05-18

## Production Rule

YORSO production must run as one self-hosted product on owned server
infrastructure.

Production runtime must not depend on Supabase, Firebase, Appwrite, Clerk,
Auth0, hosted BaaS platforms, hosted database APIs, hosted auth providers,
hosted storage gateways, or similar third-party application backends.

This rule applies to:

- user authentication and sessions;
- account and company data;
- supplier directory and supplier profile data;
- offer catalog and offer detail data;
- supplier access requests, grants and notifications;
- files, logos, covers, product media, certificates and documents;
- background jobs, notification workers and audit logs;
- operational deployment, migrations and recovery.

## Allowed Runtime Stack

The production stack should be deployable from this repository and controlled by
YORSO operators:

- YORSO frontend build;
- YORSO `apps/api` service;
- PostgreSQL as the transactional database;
- PgBouncer or equivalent PostgreSQL connection pooling;
- Redis for cache, locks, sessions, rate limits and short-lived workflow state;
- MinIO or an owned S3-compatible object storage service;
- queue workers for email, notifications, imports, reports and future agent
  jobs;
- bounded maintenance workers for auth cleanup, including expired/used password
  recovery tokens and terminal delivery rows;
- reverse proxy, TLS termination, monitoring and backups under operator
  control.

Any external commodity service must be replaceable by a self-hosted equivalent
without changing product code or data ownership. It must not become the system
of record.

## Legacy Supabase Status

Supabase files in this repository are not production architecture.

They may remain only as:

- historical prototype reference;
- schema comparison material;
- migration/access-control learning material;
- temporary compatibility tooling while a feature is being moved to the
  self-hosted API.

They must not be used as:

- the production database;
- the production auth provider;
- the production storage layer;
- the production access-control boundary;
- the production deployment prerequisite;
- a required environment for self-hosted server startup.

Production-ready code must route through YORSO-owned contracts and adapters,
not through Supabase clients.

## Frontend Boundary

Frontend pages and components must not import Supabase clients directly.

Production-facing frontend modules must call typed YORSO adapters, for example:

- account API adapter;
- supplier directory API adapter;
- offer catalog API adapter;
- supplier access API adapter;
- auth runtime facade.

Legacy Supabase adapters may exist only behind those facades, and only as
prototype fallback while the self-hosted equivalent is incomplete.

## Backend Boundary

`apps/api` must not import Supabase clients, Supabase auth helpers or
Supabase-specific runtime SDKs.

Production authorization must be enforced by:

- API session resolution;
- PostgreSQL queries and transactions;
- explicit access-grant checks;
- server-side response shaping;
- audit logs.

Frontend blur, hidden UI, Supabase RLS and dashboard policies are not production
security boundaries for YORSO.

## Deployment Boundary

A production deployment is acceptable only when it can be started from owned
configuration:

- no required `VITE_SUPABASE_*` values;
- no Supabase project ref;
- no Supabase service role;
- no hosted BaaS URL as required runtime input;
- no production data stored only in third-party dashboards.

The repository may keep prototype smoke scripts, but they must be clearly
separate from self-hosted production checks.

Batch #72 adds `.env.production.example`,
`docs/backend/self-hosted-production-deploy.md` and
`check:self-hosted-production-runtime` so the server deploy path is guarded as
an owned runtime with no Supabase or similar hosted BaaS/SaaS environment
dependency.

## Validation

This policy is guarded by:

```bash
npm run check:backend-policy
npm run check:supabase-boundary
npm run check:self-hosted-api
npm run check:self-hosted-db
npm run check:self-hosted-production-runtime
npm run check:production-scale-baseline
npm run smoke:e2e:frontend-no-supabase-env
npm run ci:core
```

Batch #71 adds this policy to make the production direction explicit: YORSO is
not a Supabase application. It is a self-hosted marketplace operating system
with temporary legacy Supabase references only where previous prototype work has
not yet been fully retired.
