# YORSO DB Package

Status: self-hosted PostgreSQL baseline
Batch: #21

`packages/db` contains SQL owned by the future self-hosted YORSO backend.
Supabase migrations may still exist as prototype references, but this package is
the production-direction database source for YORSO-owned server deployment.

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

## Migration Planner

The package now includes a TypeScript migration planner. It does not apply SQL
to a live database yet. It validates the manifest, calculates SHA-256 checksums
and prints the deterministic apply order.

```bash
npm run db:migrations:plan
npm run db:migrations:check
```

This gives us a stable contract before adding the live PostgreSQL apply command.
It also keeps the repository aligned with the goal: deploy YORSO as a complete
self-hosted product on an owned server.

## Validation

```bash
npm run check:self-hosted-db
npm run db:migrations:check
npm run test:db-contract
npm run test:db-migrations
```

These checks are static and do not require Docker. Runtime migration execution
will be added after the planner and registry stay stable in CI.
