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
  issuance, but password hashing policy, brute-force protection, MFA, Redis
  session replication and audit dashboards remain future work;
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
npm run smoke:self-hosted-auth-api
npm run smoke:e2e:self-hosted-auth-frontend
npm run smoke:e2e:frontend-no-supabase-env
npm run ci:core
```

`check:self-hosted-production-runtime` specifically protects Batch #72. It
fails if production runtime docs, compose or `.env.production.example` drift
back toward Supabase or similar hosted application backends.
