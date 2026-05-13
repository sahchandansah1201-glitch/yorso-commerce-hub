# Self-Hosted Backend Validation

Status: active guard
Batch: #17
Date: 2026-05-13

This repository is moving toward one deployable YORSO product:

- frontend;
- self-hosted YORSO API;
- PostgreSQL;
- PgBouncer;
- Redis;
- object storage;
- workers and operational tooling.

Supabase remains a temporary prototype and schema-validation tool. It must not
be treated as the future production backend.

## Required Commands

Run these commands before merging backend-direction changes:

```bash
npm run check:backend-policy
npm run check:supabase-boundary
npm run check:self-hosted-infra
npm run test:backend-contract
npm run ci:core
```

## What Each Check Protects

| Command | Purpose |
|---|---|
| `check:backend-policy` | Fails if backend docs describe Supabase as the production target. |
| `check:supabase-boundary` | Fails if new pages/components import the Supabase client directly. |
| `check:self-hosted-infra` | Fails if the local self-hosted runtime skeleton loses PostgreSQL, PgBouncer, Redis, MinIO or required env keys. |
| `test:backend-contract` | Validates backend-facing DTOs and repository policy tests. |
| `ci:core` | Runs policy, infra, type, lint, build and contract checks together. |

## Static Docker Compose Validation

`check:self-hosted-infra` is intentionally static. It does not start Docker and
does not require Docker Desktop to be running.

It verifies:

- `infra/docker-compose.yml` declares PostgreSQL, PgBouncer, Redis and MinIO;
- PostgreSQL has a healthcheck;
- PgBouncer depends on healthy PostgreSQL and uses transaction pooling;
- Redis persists data locally;
- MinIO exposes API and console ports;
- `.env.example` contains all required self-hosted runtime variables;
- `.env.example` keeps Supabase frontend variables empty;
- `.env.example` does not contain service-role text, JWT-looking tokens or
  Supabase database URLs.

## Production Direction

The self-hosted stack should become the production path. Supabase scripts,
migrations and smoke tests may remain while they protect the prototype, but new
production-facing work should target YORSO-owned API contracts and PostgreSQL
deployment.

If a future change needs Supabase for a temporary prototype flow, document the
reason and keep it behind an adapter. Do not let page/component code import the
Supabase client as a production data gateway.
