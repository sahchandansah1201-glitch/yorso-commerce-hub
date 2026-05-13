# Self-Hosted DB Migrations

Status: active planner and runtime boundary
Batch: #27
Date: 2026-05-13

YORSO production database migrations live in `packages/db`. This path is the
self-hosted PostgreSQL source of truth for deployment on an owned server.

## What Exists Now

- `packages/db/migrations/0000_migration_registry.sql` creates
  `_yorso_migrations`.
- `packages/db/migrations/0001_account_company_baseline.sql` creates user,
  company and company media tables for the account API.
- `packages/db/migrations/0002_account_workspace_sections.sql` creates
  branches, product matrix rows, meta-regions and notification preferences.
- `packages/db/migrations/0003_account_files_and_documents.sql` creates file
  asset metadata and company document records for the self-hosted storage layer.
- `packages/db/migration-manifest.json` declares migration order, ownership and
  dependencies.
- `packages/db/src/migrator.ts` validates the manifest and builds a deterministic
  migration plan.
- `packages/db/src/runtime.ts` defines the PostgreSQL runtime boundary for
  status, dry-run apply, drift detection and transactional live apply.
- `packages/db/src/postgres-client.ts` wires the runtime to PostgreSQL through
  `pg`.
- `packages/db/src/cli.ts` exposes local commands.

## Commands

```bash
npm run db:migrations:plan
npm run db:migrations:check
npm run db:migrations:status
npm run db:migrations:status:live
npm run db:migrations:apply:dry-run
npm run db:migrations:apply:live:dry-run
npm run db:migrations:apply:live
npm run db:migrations:smoke:live
npm run test:db-migrations
```

`db:migrations:plan` prints the ordered migration list with SHA-256 checksums.
`db:migrations:check` exits non-zero if the manifest, dependencies or SQL files
are unsafe. `db:migrations:status` and `db:migrations:apply:dry-run` are static,
safe CLI previews until the real PostgreSQL adapter is connected.
`test:db-migrations` validates the planner and runtime layer.

## Current Boundary

The runtime can apply SQL through an injected PostgreSQL client, but the CLI does
not expose live apply yet. This is deliberate. The next step is to add an apply
command that:

1. connects through PgBouncer or a direct migration role;
2. creates `_yorso_migrations` if needed;
3. requires explicit operator confirmation for live mutation;
4. compares applied checksums with local checksums;
5. runs pending SQL inside transactions where safe;
6. records execution timing and applied-by metadata;
7. refuses checksum drift for already applied migrations.

Until then, the repository has a deterministic migration contract without a
destructive live database path.

## Live Command Contract

Live commands require `MIGRATION_DATABASE_URL`. The CLI does not silently reuse
`DATABASE_URL`, because application runtime credentials and migration credentials
should be able to diverge on a real server.

```bash
MIGRATION_DATABASE_URL=postgres://yorso_app:...@localhost:5432/yorso npm run db:migrations:status:live
MIGRATION_DATABASE_URL=postgres://yorso_app:...@localhost:5432/yorso npm run db:migrations:apply:live:dry-run
MIGRATION_DATABASE_URL=postgres://yorso_app:...@localhost:5432/yorso npm run db:migrations:smoke:live
MIGRATION_DATABASE_URL=postgres://yorso_app:...@localhost:5432/yorso MIGRATION_APPLIED_BY=deploy-operator npm run db:migrations:apply:live
```

Safety rules:

- live status reads `_yorso_migrations` and reports `pending`, `applied` or
  `drift`;
- live dry-run connects but does not apply SQL;
- live apply requires `--confirm`;
- applied migration checksum drift fails before execution;
- each pending migration runs inside its own transaction.

## Production Rule

Do not design production migrations around Supabase-specific tables, RLS or
dashboard state. Use PostgreSQL features that can run on the self-hosted YORSO
stack.
