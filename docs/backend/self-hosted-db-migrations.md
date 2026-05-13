# Self-Hosted DB Migrations

Status: active planner
Batch: #21
Date: 2026-05-13

YORSO production database migrations live in `packages/db`. This path is the
self-hosted PostgreSQL source of truth for deployment on an owned server.

## What Exists Now

- `packages/db/migrations/0000_migration_registry.sql` creates
  `_yorso_migrations`.
- `packages/db/migrations/0001_account_company_baseline.sql` creates user,
  company and company media tables for the account API.
- `packages/db/migration-manifest.json` declares migration order, ownership and
  dependencies.
- `packages/db/src/migrator.ts` validates the manifest and builds a deterministic
  migration plan.
- `packages/db/src/cli.ts` exposes local commands.

## Commands

```bash
npm run db:migrations:plan
npm run db:migrations:check
npm run test:db-migrations
```

`db:migrations:plan` prints the ordered migration list with SHA-256 checksums.
`db:migrations:check` exits non-zero if the manifest, dependencies or SQL files
are unsafe. `test:db-migrations` validates the planner itself.

## Current Boundary

The planner does not apply SQL to PostgreSQL yet. This is deliberate. The next
step is to add an apply command that:

1. connects through PgBouncer or a direct migration role;
2. creates `_yorso_migrations` if needed;
3. compares applied checksums with local checksums;
4. runs pending SQL inside transactions where safe;
5. records execution timing and applied-by metadata;
6. refuses checksum drift for already applied migrations.

Until then, the repository has a deterministic migration contract without a
destructive live database path.

## Production Rule

Do not design production migrations around Supabase-specific tables, RLS or
dashboard state. Use PostgreSQL features that can run on the self-hosted YORSO
stack.
