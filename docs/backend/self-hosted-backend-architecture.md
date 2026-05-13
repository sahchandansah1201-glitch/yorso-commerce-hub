# YORSO Self-Hosted Backend Architecture

Status: production direction
Batch: #16
Date: 2026-05-13

## Decision

YORSO production backend must be self-hosted and deployable as one coherent
software system. Supabase is not the future production backend. Existing
Supabase migrations, smoke scripts and generated types may remain only as:

- schema experiments;
- access-control prototypes;
- temporary smoke-test infrastructure;
- migration references while the self-hosted backend is created.

Frontend work should continue, but all new production-facing data contracts must
be designed for the self-hosted YORSO API first.

## Production Target

```text
users
  -> CDN / reverse proxy
  -> web frontend
  -> YORSO API
  -> PgBouncer
  -> PostgreSQL primary
  -> Redis
  -> object storage
  -> queue workers
  -> search service
```

Required components:

| Component | Role |
|---|---|
| Web frontend | Public pages, marketplace UI, account workspace |
| YORSO API | Auth, business logic, access checks, DTO shaping |
| PostgreSQL | Transactional source of truth |
| PgBouncer | Connection pooling for high concurrency |
| Redis | Cache, sessions, rate limits, short-lived workflow state |
| Object storage | Logos, covers, product photos, documents, certificates |
| Queue workers | Email, notifications, approvals, imports, reports |
| Search service | Catalog, supplier and product discovery at scale |
| Reverse proxy | TLS, routing, compression, request limits |
| Observability | Logs, metrics, traces, audit alerts |

## Capacity Assumption

PostgreSQL can support YORSO scale if users connect to the API, not directly to
the database.

Target assumptions:

- 900,000+ registered users can be stored in PostgreSQL.
- 10,000 concurrent web users can be served through horizontally scaled API
  instances.
- 10,000 direct PostgreSQL connections are not an acceptable architecture.
- PgBouncer should reduce application concurrency to a controlled number of real
  database connections.
- Hot reads, sessions and rate limits should use Redis.
- Heavy work must move to queues.
- Search and analytics should not overload the transactional database.

## Repository Direction

The repository should evolve toward this structure:

```text
apps/
  web/        # current frontend, migrated from root when ready
  api/        # self-hosted backend service
packages/
  contracts/  # DTOs, validation schemas, generated clients
  db/         # PostgreSQL migrations, seed data, SQL tests
  core/       # business rules that do not depend on HTTP/UI
infra/
  docker-compose.yml
  postgres/
  pgbouncer/
  redis/
  object-storage/
  reverse-proxy/
docs/
  backend/
```

Do not move the current frontend immediately. First add contracts and adapters,
then move code only when the structure is stable.

## API Boundary Rule

Frontend pages and components must not depend on backend implementation details.
They must call typed adapters:

```text
src/lib/account-api.ts
src/lib/supplier-api.ts
src/lib/offer-api.ts
src/lib/access-api.ts
src/lib/rfq-api.ts
src/lib/notification-api.ts
src/lib/content-api.ts
```

Adapters may temporarily call mocks or Supabase prototype code, but their public
contract must match the future YORSO API.

Enforced guard:

```bash
npm run check:supabase-boundary
```

The guard fails if new page/component code imports the Supabase client directly.
Current direct imports in `SignIn.tsx` and `ResetPassword.tsx` are temporary
legacy exceptions until the self-hosted auth/session adapter exists.

## Validation Commands

The self-hosted direction is enforced by repository checks:

```bash
npm run check:backend-policy
npm run check:supabase-boundary
npm run check:self-hosted-infra
npm run check:self-hosted-api
npm run api:build
npm run test:api
npm run test:backend-contract
npm run ci:core
```

`check:self-hosted-infra` is a static guard. It validates the local Docker
Compose baseline, required environment keys and the Supabase prototype boundary
without starting Docker. Details are documented in
`docs/backend/self-hosted-validation.md`.

`apps/api` is the first self-hosted backend process. It currently exposes
health endpoints and the account/company contract boundary. It must remain
deployable through `apps/api/Dockerfile` and the `api` service in
`infra/docker-compose.yml`.

## Access Control Rule

If a user does not have access to data, the API must not return the real value.
This applies to:

- supplier company name when locked;
- supplier contacts;
- legal details;
- exact price;
- restricted documents;
- exact catalog breadth if the product decision requires gating;
- access events that belong to another actor.

Frontend blur can remain as a UX hint, but it is not a security boundary.

## Backend Modules

Build in this order:

1. Identity and sessions.
2. Company profile.
3. Company media and object storage.
4. Branches and loading points.
5. Product matrix.
6. Supplier directory and profile.
7. Offer catalog and offer detail.
8. Supplier and price access requests.
9. RFQ and catalog request flow.
10. Notifications.
11. Audit log and admin review.
12. Search and market intelligence ingestion.

## Phase 0 Tasks

Before building feature modules:

1. Keep the current frontend working.
2. Freeze the API DTOs needed by existing pages.
3. Add contract tests for DTOs and access states.
4. Add `.env.example` for self-hosted services.
5. Add local Docker Compose skeleton.
6. Add PostgreSQL migration baseline under a self-hosted path.
7. Mark Supabase migrations as prototype/reference in docs.
8. Prevent new production code from importing Supabase directly from pages.
9. Remove the temporary SignIn/ResetPassword Supabase exceptions after the
   self-hosted auth/session adapter is implemented.

## Supabase Transition Rules

Allowed:

- keep existing Supabase smoke tests while they protect current prototype flows;
- use Supabase SQL as reference when designing PostgreSQL migrations;
- keep generated Supabase types for existing compatibility until adapters are
  replaced;
- run Supabase smoke checks when validating the temporary prototype.

Not allowed:

- designing new production modules around Supabase-only features;
- adding new page-level Supabase client imports;
- treating Supabase RLS as the final production authorization layer;
- storing production architecture decisions only in Supabase dashboard state;
- requiring Supabase to deploy YORSO on an owned server.

## First Implementation Increment

The next code increment should not rewrite the app. It should add the backend
boundary:

- `docs/backend/self-hosted-backend-architecture.md`;
- a guard script that checks docs do not describe Supabase as the production
  backend;
- an API-contract placeholder for account/company DTOs;
- tests for the guard and contract shape;
- a Docker Compose skeleton only after the contract guard is green.
