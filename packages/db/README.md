# YORSO DB Package

Status: self-hosted PostgreSQL migration runtime baseline
Batch: #37

`packages/db` contains SQL owned by the future self-hosted YORSO backend.
Supabase migrations may still exist as prototype references, but this package is
the production-direction database source for YORSO-owned server deployment.
It remains the self-hosted PostgreSQL baseline while the runtime layer matures.

## Current Scope

Migration `0000_migration_registry.sql` defines:

- `_yorso_migrations`, the self-hosted schema registry used by the future
  migration runner.

Migration `0001_account_company_baseline.sql` defines:

- `yorso_users`;
- `yorso_companies`;
- `yorso_company_media`;
- account/company enum types;
- indexes needed by account workspace and supplier profile work.

Migration `0002_account_workspace_sections.sql` defines:

- `yorso_company_branches`;
- `yorso_company_products`;
- `yorso_company_meta_regions`;
- `yorso_notification_preferences`;
- enum types for branch, product, meta-region and notification DTOs;
- indexes needed by the account workspace collection endpoints.

Migration `0003_account_files_and_documents.sql` defines:

- `yorso_file_assets`;
- `yorso_company_documents`;
- enum types for file purpose, document type, visibility and status;
- checksum and size metadata for self-hosted file storage;
- indexes needed by media/document lookups.

Migration `0004_supplier_directory.sql` defines:

- `yorso_suppliers_directory`;
- supplier type, response, document readiness, verification and publication
  enum types;
- public supplier preview fields used by directory/profile cards;
- private supplier identity and contact fields that the API must access-shape;
- JSONB product focus, delivery market, catalog preview and certification
  fields;
- generated search columns and baseline indexes for supplier discovery.

Migration `0005_supplier_directory_search_scaling.sql` defines:

- `pg_trgm` support for supplier directory search;
- trigram GIN indexes for locked public search and qualified private search;
- trigram GIN indexes for product focus and certifications search;
- a verification-level index for certified supplier filtering.

Migration `0006_offer_catalog.sql` defines:

- `yorso_offers_catalog`;
- offer format, stock status and publication enum types;
- public product and commercial fields for catalog discovery;
- exact price and supplier identity fields that the API must shape by access level;
- JSONB gallery, specs, commercial terms, delivery basis, articles and volume breaks;
- generated public/private search columns;
- trigram GIN indexes for locked search, qualified search and certification filters;
- bounded indexes for category, species, origin, supplier country, format and supplier link.

Migration `0007_supplier_access_flow.sql` defines:

- `yorso_supplier_access_requests`;
- `yorso_access_grants`;
- `yorso_access_events`;
- `yorso_access_notifications`;
- enum types for request status, access grant scope, event type and notification status;
- unique buyer/supplier request constraint for one-click idempotency;
- supplier identity and offer price grants created after approval;
- audit events for request, pending, approval, rejection, revocation and notification creation;
- buyer notification feed records for price access approval;
- request, grant, event and notification indexes for high-concurrency access checks.

Migration `0011_auth_sessions.sql` defines:

- `yorso_auth_credentials`;
- `yorso_auth_sessions`;
- active credential and active session indexes for the Batch #73 self-hosted
  auth/session foundation;
- PostgreSQL-owned session records used by `/v1/auth/session` and
  `/v1/auth/sign-out`.

This keeps supplier and offer discovery backend-owned and index-backed as the
frontend moves from local mocks to the self-hosted API. The current sizing
assumption is stable operation for at least 10,000 concurrent web users, so
search/filter paths and supplier-access request/grant checks must remain
paginated and index-backed.

## Migration Planner

The package includes a TypeScript migration planner. It validates the manifest,
calculates SHA-256 checksums and prints the deterministic apply order.

```bash
npm run db:migrations:plan
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:status:live
npm run db:migrations:apply:dry-run
npm run db:migrations:apply:live:dry-run
npm run db:migrations:apply:live
npm run db:migrations:smoke:live
npm run smoke:self-hosted-account-postgres
npm run smoke:self-hosted-workspace-postgres
```

This keeps the repository aligned with the goal: deploy YORSO as a complete
self-hosted product on an owned server.

## Runtime Layer

`packages/db/src/runtime.ts` defines the PostgreSQL client contract for the next
step:

- reads `_yorso_migrations`;
- reports `pending`, `applied` and `drift` states;
- refuses checksum drift before execution;
- supports non-mutating dry-run apply planning;
- executes live migrations transactionally only when a real client is supplied
  and `dryRun: false` is explicitly requested.

Static CLI commands stay safe and do not connect to a database.
`db:migrations:apply:dry-run` is the default non-mutating preview. Live commands
are available only through the explicit PostgreSQL adapter and
`MIGRATION_DATABASE_URL`.

## Live PostgreSQL Adapter

Batch #23 adds the `pg`-based adapter in `src/postgres-client.ts`.

Live commands require an explicit migration database target:

```bash
MIGRATION_DATABASE_URL=postgres://... npm run db:migrations:status:live
MIGRATION_DATABASE_URL=postgres://... npm run db:migrations:apply:live:dry-run
MIGRATION_DATABASE_URL=postgres://... npm run db:migrations:smoke:live
MIGRATION_DATABASE_URL=postgres://... MIGRATION_APPLIED_BY=deploy-operator npm run db:migrations:apply:live
```

`db:migrations:apply:live` includes `--confirm` in the script. Direct CLI usage
without `--confirm` exits before connecting. `DATABASE_URL` is intentionally not
accepted as an implicit migration target.

## Validation

```bash
npm run check:self-hosted-db
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:apply:dry-run
npm run test:db-contract
npm run test:db-migrations
```

These checks are static and do not require Docker. Live commands require a
running PostgreSQL database and are intentionally excluded from default CI.

`smoke:self-hosted-account-postgres` is the account API live PostgreSQL smoke.
It uses `MIGRATION_DATABASE_URL`, applies pending migrations, starts the API
with `ACCOUNT_REPOSITORY=postgres` and verifies account/profile/product/file
flows over HTTP. If `MIGRATION_DATABASE_URL` is not set, it exits as skipped.

`smoke:self-hosted-workspace-postgres` is the broader account workspace live
PostgreSQL smoke. It verifies branches, products, meta-regions and notification
preferences through the API, confirms PostgreSQL row counts, checks another-user
isolation, validates notification errors and checks supplier directory
locked/unlocked access shaping against `yorso_suppliers_directory`. If
`MIGRATION_DATABASE_URL` is not set, it exits as skipped.
