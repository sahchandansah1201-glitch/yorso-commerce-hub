# Self-Hosted API Skeleton

Status: first runnable backend process
Batch: #18
Date: 2026-05-13

`apps/api` is the first concrete backend service for the self-hosted YORSO
direction. It is intentionally small, but it is a real Node process that can be
compiled, started and wired into Docker Compose.

## Current Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health/live` | Confirms the API process is alive. |
| `GET /health/ready` | Confirms self-hosted dependencies are configured. |
| `GET /v1/account/company/schema` | Exposes the account/company DTO boundary used by frontend work. |
| `GET /v1/account/me` | Returns the current user profile through the account service. |
| `GET /v1/account/company` | Returns the current company profile through the account service. |
| `PATCH /v1/account/company` | Validates and updates company profile fields through the contract schema. |

## Account Module Boundary

`apps/api/src/modules/account` is split into:

- `routes.ts`: HTTP method/path handling and JSON body parsing;
- `service.ts`: validation and business-facing account operations;
- `repository.ts`: storage interface plus temporary in-memory implementation.

The in-memory repository is not the production storage layer. It exists to make
the HTTP and contract boundary executable before PostgreSQL persistence is
added. The next backend increment should replace or complement it with a
PostgreSQL repository while keeping the route and service contracts stable.

## Local Build

```bash
npm run api:build
npm run api:start
```

The API reads configuration from environment variables. Local defaults are
available for development, but production must provide real secrets and service
URLs.

## Docker Compose

The local compose baseline includes:

- `api`;
- `postgres`;
- `pgbouncer`;
- `redis`;
- `minio`.

The API service connects to PostgreSQL through PgBouncer, not directly to a
large pool of PostgreSQL connections.

## Supabase Boundary

The API skeleton does not import the Supabase client. In production mode it
rejects non-empty Supabase frontend env values. Supabase may remain only as a
prototype/schema-validation tool while the self-hosted backend matures.

## Validation

```bash
npm run check:self-hosted-api
npm run api:build
npm run test:api
npm run ci:core
```
