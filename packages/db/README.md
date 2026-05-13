# YORSO DB Package

Status: self-hosted PostgreSQL migration runtime baseline
Batch: #26

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
